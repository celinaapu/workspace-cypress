import { stripe } from '@/lib/stripe';
import { createOrRetrieveCustomer } from '@/lib/stripe/adminTasks';
import { getURL } from '@/lib/utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { price, quantity = 1, metadata = {} } = await request.json();
  try {
    const authSession = await getServerSession(authOptions);
    
    if (!authSession?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customer = await createOrRetrieveCustomer({
      email: authSession.user.email || '',
      uuid: authSession.user.id || '',
    });
    const checkoutSession = await stripe.checkout.sessions.create({
      billing_address_collection: 'required',
      customer,
      line_items: [
        {
          price: price.id,
          quantity,
        },
      ],
      mode: 'subscription',
      allow_promotion_codes: true,
      success_url: `${getURL()}/dashboard`,
      cancel_url: `${getURL()}/dashboard`,
    });
    return NextResponse.json({ sessionId: checkoutSession.id });
  } catch (error: any) {
    console.log(error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
