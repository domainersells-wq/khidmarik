import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { supabase } from '@/lib/supabase';
import { NotificationItem, NotificationEventType } from '@/types/notifications';

const DATA_DIR = path.join(process.cwd(), '.data');
const NOTIFICATIONS_FILE = path.join(DATA_DIR, 'khidmatik_notifications.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readServerNotifications(): NotificationItem[] {
  ensureDataDir();
  if (!fs.existsSync(NOTIFICATIONS_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(NOTIFICATIONS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function writeServerNotifications(list: NotificationItem[]) {
  ensureDataDir();
  fs.writeFileSync(NOTIFICATIONS_FILE, JSON.stringify(list, null, 2), 'utf-8');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const isReadParam = searchParams.get('isRead');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const all = readServerNotifications();
    let filtered = all;

    if (userId) {
      filtered = filtered.filter(n => 
        n.userId === userId || 
        n.userId === 'all' || 
        (userId.includes('-') && n.userId === 'dino') ||
        (userId === 'dino' && n.userId.includes('23cba611'))
      );
    }

    if (isReadParam !== null && isReadParam !== undefined) {
      const isRead = isReadParam === 'true';
      filtered = filtered.filter(n => n.isRead === isRead);
    }

    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const result = filtered.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: result,
      unreadCount: filtered.filter(n => !n.isRead).length
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to get notifications' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, title, message, data, channel } = body;

    if (!userId || !title || !message) {
      return NextResponse.json(
        { success: false, error: 'userId, title, and message are required' },
        { status: 400 }
      );
    }

    const newNotif: NotificationItem = {
      id: body.id || `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      type: (type || 'admin_announcement') as NotificationEventType,
      title,
      message,
      data: data || {},
      channel: channel || 'all',
      isRead: false,
      createdAt: new Date().toISOString()
    };

    // 1. Persist to server JSON store for guaranteed multi-device synchronization
    const currentList = readServerNotifications();
    currentList.unshift(newNotif);
    // Keep max 500
    if (currentList.length > 500) {
      currentList.length = 500;
    }
    writeServerNotifications(currentList);

    // 2. Try inserting into Supabase notifications table if userId is a valid UUID
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    if (isUuid) {
      try {
        // First try with data column
        const { error: fullErr } = await supabase
          .from('notifications')
          .insert({
            user_id: userId,
            type: newNotif.type,
            title: newNotif.title,
            message: newNotif.message,
            data: newNotif.data,
            channel: newNotif.channel,
            is_read: false
          });

        if (fullErr) {
          // Fallback if data or channel columns don't exist in active schema
          await supabase
            .from('notifications')
            .insert({
              user_id: userId,
              type: newNotif.type,
              title: newNotif.title,
              message: newNotif.message,
              is_read: false
            });
        }
      } catch (dbErr) {
        console.warn('Database notification insert error in route:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: newNotif
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create notification' },
      { status: 500 }
    );
  }
}
