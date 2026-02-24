import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function POST() {
  try {
    console.log("Creating test product in Stripe...");
    
    // Create a test product
    const product = await stripe.products.create({
      name: "Pro Plan",
      description: "Access to all pro features",
      active: true,
      metadata: {
        features: "unlimited_workspaces,unlimited_files,priority_support"
      }
    });

    // Create a monthly price for the product
    const monthlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 999, // $9.99
      currency: "usd",
      recurring: {
        interval: "month",
        interval_count: 1,
      },
      active: true,
      nickname: "Pro Plan Monthly",
    });

    // Create a yearly price for the product
    const yearlyPrice = await stripe.prices.create({
      product: product.id,
      unit_amount: 9999, // $99.99
      currency: "usd",
      recurring: {
        interval: "year",
        interval_count: 1,
      },
      active: true,
      nickname: "Pro Plan Yearly",
    });

    console.log("✅ Successfully created test product and prices");

    return NextResponse.json({
      success: true,
      message: "Successfully created test product",
      product: {
        id: product.id,
        name: product.name,
        description: product.description,
      },
      prices: [
        {
          id: monthlyPrice.id,
          nickname: monthlyPrice.nickname,
          unit_amount: monthlyPrice.unit_amount,
          currency: monthlyPrice.currency,
          interval: monthlyPrice.recurring?.interval,
        },
        {
          id: yearlyPrice.id,
          nickname: yearlyPrice.nickname,
          unit_amount: yearlyPrice.unit_amount,
          currency: yearlyPrice.currency,
          interval: yearlyPrice.recurring?.interval,
        },
      ],
    });
  } catch (error) {
    console.error("❌ Error creating test product:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to create test product",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST to create a test product in Stripe",
    usage: "POST /api/stripe/create-test-product"
  });
}
