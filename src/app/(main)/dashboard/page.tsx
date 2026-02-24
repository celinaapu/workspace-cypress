import React from "react";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getPrivateWorkspaces } from "@/lib/mongoose/queries";
import { getActiveProductsWithPrice } from "@/lib/mongoose/queries";
import { redirect } from "next/navigation";
import DashboardSetup from "@/components/dashboard-setup/dashboard-setup";
import { getUserSubscriptionStatus } from "@/lib/mongoose/queries";
import { SubscriptionModalProvider } from "@/lib/providers/subscription-modal-provider";

const DashboardPage = async () => {
  const session = await getServerSession(authOptions);

  console.log("Session:", session);
  console.log("Session user:", session?.user);
  console.log("User ID:", session?.user?.id);

  if (!session?.user) {
    redirect("/login");
  }

  // Ensure ID is a string for query
  const userId = session?.user?.id || session?.user?.email || 'temp-id';
  if (!userId) {
    console.error("User ID is missing from session");
    redirect("/login");
  }
  
  const workspaces = await getPrivateWorkspaces(userId);
  const workspace = workspaces && workspaces.length > 0 ? workspaces[0] : null;

  const { data: subscription, error: subscriptionError } =
    await getUserSubscriptionStatus(userId);

  if (subscriptionError) {
    console.error("Subscription Error:", subscriptionError);
  }

  // Fetch products for subscription modal
  const { data: products, error: productsError } = await getActiveProductsWithPrice();
  if (productsError) {
    console.error("Products Error:", productsError);
  }

  if (!workspace) {
    // Ensure we have a valid user ID
    const userId = session?.user?.id || '';
    
    if (!userId) {
      console.error("No valid user ID found in session");
      redirect("/login");
    }
    
    console.log("Final userId being passed to DashboardSetup:", userId);
    
    return (
      <SubscriptionModalProvider products={products || []}>
        <div className="bg-background h-screen w-screen flex justify-center items-center">
          <DashboardSetup
            user={{
              ...session.user,
              id: userId,
              email: session.user.email ?? null,
            }}
            subscription={subscription ?? null}
          />
        </div>
      </SubscriptionModalProvider>
    );
  }

  // Use string conversion if _id is a MongoDB ObjectId
  redirect(`/dashboard/${workspace._id.toString()}`);
};

export default DashboardPage;
