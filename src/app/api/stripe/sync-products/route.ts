import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { upsertProductRecord, upsertPriceRecord } from "@/lib/stripe/adminTasks";

export async function POST() {
  try {
    console.log("Starting Stripe products sync...");
    
    // Fetch all active products from Stripe
    const products = await stripe.products.list({
      active: true,
      limit: 100,
    });

    console.log(`Found ${products.data.length} products in Stripe`);

    // Upsert each product to MongoDB
    for (const product of products.data) {
      await upsertProductRecord(product);
      
      // Fetch and upsert prices for this product
      const prices = await stripe.prices.list({
        product: product.id,
        active: true,
        limit: 100,
      });

      for (const price of prices.data) {
        await upsertPriceRecord(price);
      }
    }

    console.log("✅ Successfully synced Stripe products to MongoDB");

    return NextResponse.json({
      success: true,
      message: `Successfully synced ${products.data.length} products and their prices`,
      products: products.data.length,
    });
  } catch (error) {
    console.error("❌ Error syncing products:", error);
    return NextResponse.json(
      { 
        success: false, 
        error: "Failed to sync products",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST to sync Stripe products to MongoDB",
    usage: "POST /api/stripe/sync-products"
  });
}
