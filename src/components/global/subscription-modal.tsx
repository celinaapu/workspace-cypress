"use client";

import { useSubscriptionModal } from "@/lib/providers/subscription-modal-provider";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { useUser } from "@/lib/providers/user-provider";
import { formatPrice, postData } from "@/lib/utils";
import { Button } from "../ui/button";
import Loader from "./Loader";
import { Price, ProductWithPrice, Subscription } from "@/lib/mongoose/types"; // Added Subscription import
import { useToast } from "../ui/use-toast";
import { getStripe } from "@/lib/stripe/stripeClient";

interface SubscriptionModalProps {
  products: ProductWithPrice[];
  subscription: Subscription | null; // FIXED: Added this to the interface
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ 
  products, 
  subscription // FIXED: Destructured subscription here
}) => {
  const { open, setOpen } = useSubscriptionModal();
  const { toast } = useToast();
  const { user } = useUser(); 
  const [isLoading, setIsLoading] = useState(false);

  const onClickContinue = async (price: Price) => {
    try {
      setIsLoading(true);
      if (!user) {
        toast({ title: "You must be logged in" });
        return;
      }
      
      // Now 'subscription' is defined and usable here
      if (subscription?.status === "active") {
        toast({ title: "Already on a paid plan" });
        return;
      }

      const { sessionId } = await postData({
        url: "/api/create-checkout-session",
        data: { price },
      });

      const stripe = await getStripe();
      stripe?.redirectToCheckout({ sessionId });
    } catch (error) {
      toast({ title: "Oops! Something went wrong.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {subscription?.status === "active" ? (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Managed Subscription</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            You are already on a paid plan! You can manage your billing in the
            settings.
          </DialogDescription>
        </DialogContent>
      ) : (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upgrade to a Pro Plan</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            To access Pro features you need to have a paid plan.
          </DialogDescription>
          {products.length > 0 ? (
            products.map((product) => (
              <div
                className="flex justify-between items-center"
                key={product._id} 
              >
                {product.prices?.map((price) => (
                  <React.Fragment key={price._id}>
                    <b className="text-3xl text-foreground">
                      {formatPrice(price)} / <small>{price.interval}</small>
                    </b>
                    <Button
                      onClick={() => onClickContinue(price)}
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader /> : "Upgrade ✨"}
                    </Button>
                  </React.Fragment>
                ))}
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              No plans available currently.
            </div>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
};

export default SubscriptionModal;