import { supabase } from '@/lib/supabase';
import type { Store, Review } from '@/types';
import { storeService } from './storeService';

export interface LocalQuote {
  id: string;
  userId: string;
  description: string;
  location: string;
  budget: number;
  imageUrls: string[];
  status: 'pending' | 'sent' | 'replied' | 'closed';
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string;
  message: string;
  mediaUrls: string[];
  voiceUrl?: string;
  isRead: boolean;
  createdAt: string;
}

export const yelpService = {
  // ==========================================
  // SAVED LISTINGS / FAVORITES
  // ==========================================
  async saveListing(userId: string, storeId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('saved_listings')
        .insert({ user_id: userId, store_id: storeId });
      
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn("Supabase saveListing failed, falling back to localStorage", e);
      const key = `khidmatik_saved_${userId}`;
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      if (!saved.includes(storeId)) {
        saved.push(storeId);
        localStorage.setItem(key, JSON.stringify(saved));
      }
      return true;
    }
  },

  async unsaveListing(userId: string, storeId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('saved_listings')
        .delete()
        .eq('user_id', userId)
        .eq('store_id', storeId);
      
      if (error) throw error;
      return true;
    } catch (e) {
      console.warn("Supabase unsaveListing failed, falling back to localStorage", e);
      const key = `khidmatik_saved_${userId}`;
      let saved = JSON.parse(localStorage.getItem(key) || '[]');
      saved = saved.filter((id: string) => id !== storeId);
      localStorage.setItem(key, JSON.stringify(saved));
      return true;
    }
  },

  async isListingSaved(userId: string, storeId: string): Promise<boolean> {
    if (!userId) return false;
    try {
      const { data, error } = await supabase
        .from('saved_listings')
        .select('id')
        .eq('user_id', userId)
        .eq('store_id', storeId)
        .maybeSingle();
      
      if (error) throw error;
      return !!data;
    } catch (e) {
      const key = `khidmatik_saved_${userId}`;
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      return saved.includes(storeId);
    }
  },

  async getSavedListings(userId: string): Promise<Store[]> {
    if (!userId) return [];
    let savedIds: string[] = [];
    try {
      const { data, error } = await supabase
        .from('saved_listings')
        .select('store_id')
        .eq('user_id', userId);
      
      if (error) throw error;
      savedIds = data.map((d: any) => d.store_id);
    } catch (e) {
      const key = `khidmatik_saved_${userId}`;
      savedIds = JSON.parse(localStorage.getItem(key) || '[]');
    }

    if (savedIds.length === 0) return [];
    
    const allStores = await storeService.getStores();
    return allStores.filter(store => savedIds.includes(store.id));
  },

  // ==========================================
  // REQUEST FOR QUOTES
  // ==========================================
  async createQuoteRequest(userId: string, data: { description: string, location: string, budget: number, imageUrls: string[] }): Promise<LocalQuote> {
    const newQuote = {
      description: data.description,
      location: data.location,
      budget: data.budget,
      image_urls: data.imageUrls,
      user_id: userId,
      status: 'pending'
    };

    try {
      const { data: dbData, error } = await supabase
        .from('local_quotes')
        .insert(newQuote)
        .select()
        .single();
      
      if (error) throw error;
      return {
        id: dbData.id,
        userId: dbData.user_id,
        description: dbData.description,
        location: dbData.location,
        budget: parseFloat(dbData.budget),
        imageUrls: dbData.image_urls,
        status: dbData.status,
        createdAt: dbData.created_at
      };
    } catch (e) {
      console.warn("Supabase createQuoteRequest failed, falling back to localStorage", e);
      const key = `khidmatik_quotes_${userId}`;
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      const localItem: LocalQuote = {
        id: 'q_' + Math.random().toString(36).substring(2, 9),
        userId,
        description: data.description,
        location: data.location,
        budget: data.budget,
        imageUrls: data.imageUrls,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      saved.push(localItem);
      localStorage.setItem(key, JSON.stringify(saved));
      return localItem;
    }
  },

  async getUserQuotes(userId: string): Promise<LocalQuote[]> {
    if (!userId) return [];
    try {
      const { data, error } = await supabase
        .from('local_quotes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data.map((d: any) => ({
        id: d.id,
        userId: d.user_id,
        description: d.description,
        location: d.location,
        budget: parseFloat(d.budget),
        imageUrls: d.image_urls || [],
        status: d.status,
        createdAt: d.created_at
      }));
    } catch (e) {
      const key = `khidmatik_quotes_${userId}`;
      return JSON.parse(localStorage.getItem(key) || '[]');
    }
  },

  // ==========================================
  // CHAT MESSAGES
  // ==========================================
  async getChatMessages(userId: string, otherUserId: string): Promise<ChatMessage[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data.map((d: any) => ({
        id: d.id,
        senderId: d.sender_id,
        receiverId: d.receiver_id,
        message: d.message,
        mediaUrls: d.media_urls || [],
        voiceUrl: d.voice_url,
        isRead: d.is_read,
        createdAt: d.created_at
      }));
    } catch (e) {
      const key = `khidmatik_chat_${[userId, otherUserId].sort().join('_')}`;
      return JSON.parse(localStorage.getItem(key) || '[]');
    }
  },

  async sendChatMessage(senderId: string, receiverId: string, message: string, mediaUrls: string[] = [], voiceUrl?: string): Promise<ChatMessage> {
    const newMsg = {
      sender_id: senderId,
      receiver_id: receiverId,
      message,
      media_urls: mediaUrls,
      voice_url: voiceUrl,
      is_read: false
    };

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert(newMsg)
        .select()
        .single();
      
      if (error) throw error;
      return {
        id: data.id,
        senderId: data.sender_id,
        receiverId: data.receiver_id,
        message: data.message,
        mediaUrls: data.media_urls || [],
        voiceUrl: data.voice_url,
        isRead: data.is_read,
        createdAt: data.created_at
      };
    } catch (e) {
      console.warn("Supabase sendChatMessage failed, falling back to localStorage", e);
      const key = `khidmatik_chat_${[senderId, receiverId].sort().join('_')}`;
      const saved = JSON.parse(localStorage.getItem(key) || '[]');
      const msg: ChatMessage = {
        id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        senderId,
        receiverId,
        message,
        mediaUrls,
        voiceUrl,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      saved.push(msg);
      localStorage.setItem(key, JSON.stringify(saved));
      return msg;
    }
  },

  // ==========================================
  // DETAILED REVIEW SYSTEM
  // ==========================================
  async submitDetailedReview(data: {
    listingId: string;
    authorId: string;
    authorName: string;
    rating: number;
    comment: string;
    detailedRatings: {
      timeliness?: number;
      qualityOfWork?: number;
      cleanliness?: number;
      speed?: number;
      staff?: number;
      price?: number;
    };
    mediaUrls?: string[];
  }): Promise<Review> {
    const reviewData = {
      listing_id: data.listingId,
      author_id: data.authorId,
      author_name: data.authorName,
      rating: data.rating,
      comment: data.comment,
      detailed_ratings: data.detailedRatings,
      media_urls: data.mediaUrls || [],
      helpful_votes: 0,
      replies: [],
      reported: false
    };

    try {
      const { data: dbData, error } = await supabase
        .from('reviews')
        .insert(reviewData)
        .select()
        .single();
      
      if (error) throw error;
      return {
        id: dbData.id,
        author: dbData.author_name,
        rating: dbData.rating,
        comment: dbData.comment,
        date: dbData.created_at,
        detailedRatings: dbData.detailed_ratings,
        mediaUrls: dbData.media_urls,
        helpfulVotes: dbData.helpful_votes,
        replies: dbData.replies,
        reported: dbData.reported
      } as any;
    } catch (e) {
      console.warn("Supabase submitDetailedReview failed, creating local mockup", e);
      const newReview: any = {
        id: 'rev_' + Date.now(),
        author: data.authorName,
        rating: data.rating,
        comment: data.comment,
        date: new Date().toISOString(),
        detailedRatings: data.detailedRatings,
        mediaUrls: data.mediaUrls || [],
        helpfulVotes: 0,
        replies: [],
        reported: false
      };
      // Simulating update in store Service
      const key = `khidmatik_reviews_${data.listingId}`;
      const list = JSON.parse(localStorage.getItem(key) || '[]');
      list.push(newReview);
      localStorage.setItem(key, JSON.stringify(list));
      return newReview;
    }
  }
};
