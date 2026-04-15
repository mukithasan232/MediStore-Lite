import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionStatus, getSubscriptionInvoices } from '@/actions/subscription';
import { supabase } from '@/lib/supabase';

/**
 * Get subscription status and details
 * GET /api/subscription/status
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const result = await getSubscriptionStatus(user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription: result.subscription,
    });
  } catch (error: any) {
    console.error('Subscription status error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscription status' },
      { status: 500 }
    );
  }
}
