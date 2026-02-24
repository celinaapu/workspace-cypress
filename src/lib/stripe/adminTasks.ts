import Stripe from "stripe";
import { Price, Product, Subscription } from "../mongoose/types";
import { User as UserModel, Subscription as SubscriptionModel, Product as ProductModel, Price as PriceModel } from "../mongoose/schema";
import { stripe } from "./index";
import { toDateTime } from "../utils";

export const upsertProductRecord = async (product: Stripe.Product) => {
  const productData: Partial<Product> = {
    _id: product.id,
    active: product.active,
    name: product.name,
    description: product.description ?? undefined,
    image: product.images?.[0] ?? undefined,
    metadata: product.metadata,
  };
  
  try {
    await ProductModel.findOneAndUpdate(
      { _id: product.id },
      productData,
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error("Error inserting/updating product:", error);
    throw new Error(`Could not insert/update the product ${error}`);
  }
  console.log("Product inserted/updated:", product.id);
};

export const upsertPriceRecord = async (price: Stripe.Price) => {
  console.log(price, "PRICE");
  const priceData: Partial<Price> = {
    _id: price.id,
    productId: typeof price.product === "string" ? price.product : undefined,
    active: price.active,
    currency: price.currency,
    description: price.nickname ?? undefined,
    type: price.type,
    unitAmount: price.unit_amount ?? undefined,
    interval: price.recurring?.interval ?? undefined,
    intervalCount: price.recurring?.interval_count ?? undefined,
    trialPeriodDays: price.recurring?.trial_period_days ?? undefined,
    metadata: price.metadata,
  };
  
  try {
    await PriceModel.findOneAndUpdate(
      { _id: price.id },
      priceData,
      { upsert: true, new: true }
    );
  } catch (error) {
    console.error("Error inserting/updating price:", error);
    throw new Error(`Could not insert/update the price ${error}`);
  }
  console.log(`Price inserted/updated: ${price.id}`);
};

export const createOrRetrieveCustomer = async ({
  email,
  uuid,
}: {
  email: string;
  uuid: string;
}) => {
  try {
    // For MongoDB, we'll use the User model directly
    const user = await UserModel.findById(uuid);
    if (user && user.stripeCustomerId) {
      return user.stripeCustomerId;
    }
  } catch (error) {
    console.log("Customer not found, creating new one");
  }

  const customerData: { metadata: { mongoUserId: string }; email?: string } = {
    metadata: {
      mongoUserId: uuid,
    },
  };
  if (email) customerData.email = email;
  
  try {
    const customer = await stripe.customers.create(customerData);
    
    // Update user with stripe customer ID
    await UserModel.findByIdAndUpdate(uuid, {
      stripeCustomerId: customer.id
    });
    
    console.log(`New customer created and inserted for ${uuid}.`);
    return customer.id;
  } catch (stripeError) {
    console.error("Stripe error:", stripeError);
    throw new Error("Could not create Customer or find the customer");
  }
};

export const copyBillingDetailsToCustomer = async (
  uuid: string,
  payment_method: Stripe.PaymentMethod,
) => {
  const customer = payment_method.customer as string;
  const { name, phone, address } = payment_method.billing_details;
  if (!name || !phone || !address) return;
  
  // Transform address to convert null values to undefined for Stripe API
  const transformedAddress = {
    line1: address.line1 ?? undefined,
    line2: address.line2 ?? undefined,
    city: address.city ?? undefined,
    state: address.state ?? undefined,
    postal_code: address.postal_code ?? undefined,
    country: address.country ?? undefined,
  };
  
  try {
    await stripe.customers.update(customer, { name, phone, address: transformedAddress });
    
    // Update user with billing details
    await UserModel.findByIdAndUpdate(uuid, {
      billingAddress: address,
      paymentMethod: payment_method[payment_method.type],
    });
  } catch (error) {
    console.error("Error copying billing details:", error);
    throw new Error("Could not copy customer billing details");
  }
};

export const manageSubscriptionStatusChange = async (
  subscriptionId: string,
  customerId: string,
  createAction = false,
) => {
  try {
    // Find user by stripe customer ID
    const user = await UserModel.findOne({ stripeCustomerId: customerId });
    if (!user) throw new Error("🔴Cannot find the customer");
    
    const uuid = user._id;
    const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ["default_payment_method"],
    });
    console.log("🟢UPDATED to  ", subscription.status);

    const subscriptionData: Partial<Subscription> = {
      _id: subscription.id,
      userId: uuid,
      metadata: subscription.metadata,
      status: subscription.status as any,
      priceId: subscription.items.data[0].price.id,
      quantity: subscription.items.data[0].quantity,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      cancelAt: subscription.cancel_at
        ? toDateTime(subscription.cancel_at).toISOString()
        : undefined,
      canceledAt: subscription.canceled_at
        ? toDateTime(subscription.canceled_at).toISOString()
        : undefined,
      currentPeriodStart: toDateTime(
        subscription.current_period_start,
      ).toISOString(),
      currentPeriodEnd: toDateTime(
        subscription.current_period_end,
      ).toISOString(),
      endedAt: subscription.ended_at
        ? toDateTime(subscription.ended_at).toISOString()
        : undefined,
      trialStart: subscription.trial_start
        ? toDateTime(subscription.trial_start).toISOString()
        : undefined,
      trialEnd: subscription.trial_end
        ? toDateTime(subscription.trial_end).toISOString()
        : undefined,
    };
    
    await SubscriptionModel.findOneAndUpdate(
      { _id: subscription.id },
      subscriptionData,
      { upsert: true, new: true }
    );
    
    console.log(
      `Inserted/updated subscription [${subscription.id}] for user [${uuid}]`,
    );
    
    if (createAction && subscription.default_payment_method && uuid) {
      await copyBillingDetailsToCustomer(
        uuid,
        subscription.default_payment_method as Stripe.PaymentMethod,
      );
    }
  } catch (error) {
    console.error("Error managing subscription:", error);
    throw error;
  }
};
