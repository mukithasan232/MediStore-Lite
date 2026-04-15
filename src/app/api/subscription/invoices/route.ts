import { NextRequest, NextResponse } from 'next/server';
import { getSubscriptionInvoices } from '@/actions/subscription';
import { supabase } from '@/lib/supabase';

/**
 * Get subscription invoices
 * GET /api/subscription/invoices
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

    const limit = request.nextUrl.searchParams.get('limit') || '12';
    const result = await getSubscriptionInvoices(user.id, parseInt(limit));

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      invoices: result.invoices,
    });
  } catch (error: any) {
    console.error('Get invoices error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}
