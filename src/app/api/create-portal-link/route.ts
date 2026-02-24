import { stripe } from '@/lib/stripe';
import { createOrRetrieveCustomer } from '@/lib/stripe/adminTasks';
import { getURL } from '@/lib/utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const customer = await createOrRetrieveCustomer({
      email: session.user.email || '',
      uuid: session.user.id || '',
    });

    if (!customer) throw new Error('No Customer');
    const { url } = await stripe.billingPortal.sessions.create({
      customer,
      return_url: `${getURL()}/dashboard`,
    });
    return NextResponse.json({ url });
  } catch (error) {
    console.log('ERROR', error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}
