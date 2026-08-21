import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// In-memory / mock order state fallback for testing and integration
const mockOtpStore: Record<string, { startOtp: string; completionOtp: string; startAttempts: number; completionAttempts: number; isLocked: boolean }> = {
  'SOS-2026-8941': {
    startOtp: '4892',
    completionOtp: '7315',
    startAttempts: 0,
    completionAttempts: 0,
    isLocked: false
  }
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const body = await request.json();
    const { otp, otpType } = body; // otpType: 'START' | 'COMPLETION'

    if (!otp || typeof otp !== 'string' || !['START', 'COMPLETION'].includes(otpType)) {
      return NextResponse.json(
        { success: false, error: 'INVALID_REQUEST_PARAMETERS', message: 'Valid 4-digit OTP and otpType (START or COMPLETION) are required.' },
        { status: 400 }
      );
    }

    const orderRecord = mockOtpStore[orderId] || {
      startOtp: '4892',
      completionOtp: '7315',
      startAttempts: 0,
      completionAttempts: 0,
      isLocked: false
    };

    if (orderRecord.isLocked) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'ORDER_LOCKED_OUT', 
          message: 'This order has exceeded maximum verification attempts and is locked for Super Admin review.' 
        },
        { status: 423 }
      );
    }

    const maxAttempts = 3;
    const targetOtp = otpType === 'START' ? orderRecord.startOtp : orderRecord.completionOtp;
    const isMatch = otp.trim() === targetOtp.trim();

    if (isMatch) {
      if (otpType === 'START') {
        orderRecord.startAttempts = 0;
      } else {
        orderRecord.completionAttempts = 0;
      }
      mockOtpStore[orderId] = orderRecord;

      return NextResponse.json({
        success: true,
        orderId,
        otpType,
        newStatus: otpType === 'START' ? 'IN_PROGRESS' : 'OTP_COMPLETED',
        message: otpType === 'START' 
          ? 'Start OTP verified successfully. Job timer and execution active.' 
          : 'Completion OTP verified successfully. Financial settlement triggered.'
      });
    } else {
      let attempts = otpType === 'START' ? ++orderRecord.startAttempts : ++orderRecord.completionAttempts;
      const isLockedNow = attempts >= maxAttempts;
      if (isLockedNow) {
        orderRecord.isLocked = true;
      }
      mockOtpStore[orderId] = orderRecord;

      return NextResponse.json(
        {
          success: false,
          error: 'INVALID_OTP',
          message: 'The security code entered is incorrect.',
          attemptsRemaining: Math.max(0, maxAttempts - attempts),
          isLockedOut: isLockedNow
        },
        { status: 401 }
      );
    }
  } catch (error: any) {
    console.error('Error verifying OTP:', error);
    return NextResponse.json(
      { success: false, error: 'SERVER_ERROR', message: error?.message || 'Failed to verify OTP' },
      { status: 500 }
    );
  }
}
