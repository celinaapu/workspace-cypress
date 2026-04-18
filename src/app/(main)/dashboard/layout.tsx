import { SubscriptionModalProvider } from "@/lib/providers/subscription-modal-provider";
import { getActiveProductsWithPrice } from "@/lib/mongoose/queries";
import React from "react";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout = async ({ children }: LayoutProps) => {
  const { data: products, error } = await getActiveProductsWithPrice();

  if (error || !products) {
    console.error("Database Fetch Error:", error);
    throw new Error("Could not load products. Please check server logs.");
  }

  return (
    <main className="flex overflow-hidden h-full"> 
      <SubscriptionModalProvider products={products}>
        {children}
      </SubscriptionModalProvider>
    </main>
  );
};

export default Layout;