import { NextRequest, NextResponse } from 'next/server';
import { financialService } from '@/services/financialService';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { postalTransactionCode, senderName, senderAccount, transferDate, receiptUrl, userNotes } = body;

    if (!postalTransactionCode || !postalTransactionCode.trim()) {
      return NextResponse.json(
        { success: false, error: 'Postal Transaction Code is required for confirmation' },
        { status: 400 }
      );
    }

    const result = financialService.confirmTopUpTransfer(id, {
      postalTransactionCode: postalTransactionCode.trim(),
      senderName: senderName || 'User',
      senderAccount,
      transferDate: transferDate || new Date().toISOString().split('T')[0],
      receiptUrl,
      userNotes,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Transfer confirmation submitted for admin review',
      data: result.topUp,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to submit confirmation' },
      { status: 500 }
    );
  }
}
