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
import { Price, ProductWithPrice, Subscription } from "@/lib/mongoose/types";
import { useToast } from "../ui/use-toast";
import { getStripe } from "@/lib/stripe/stripeClient";
import { Crown, Sparkles, CheckCircle2, Zap, Shield, Infinity } from "lucide-react";

interface SubscriptionModalProps {
  products: ProductWithPrice[];
  subscription: Subscription | null;
}

const PLAN_PERKS = [
  { icon: Infinity, label: "Unlimited workspaces" },
  { icon: Zap, label: "Real-time collaboration" },
  { icon: Shield, label: "Advanced permissions" },
  { icon: Sparkles, label: "AI-powered features" },
];

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  products,
  subscription,
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
        /* ── Already Pro ── */
        <DialogContent className="sm:max-w-md border border-yellow-500/20 bg-neutral-950">
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent rounded-t-lg" />
          <DialogHeader className="items-center pt-4">
            <div className="relative mb-3">
              <div className="absolute inset-0 rounded-full bg-yellow-400/20 blur-xl scale-150" />
              <div className="relative h-14 w-14 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                <Crown className="h-7 w-7 text-yellow-900" />
              </div>
            </div>
            <DialogTitle className="text-xl font-semibold text-white">
              You&apos;re on Pro
            </DialogTitle>
            <DialogDescription className="text-center text-neutral-400 text-sm">
              You already have full access to all Pro features. Manage your billing in Settings.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-2 mt-2 mb-4">
            {PLAN_PERKS.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-2 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2">
                <Icon className="h-3.5 w-3.5 text-yellow-400 shrink-0" />
                <span className="text-xs text-neutral-300">{label}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      ) : (
        /* ── Upgrade ── */
        <DialogContent className="sm:max-w-md border border-violet-500/20 bg-neutral-950 p-0 overflow-hidden">
          {/* Top gradient banner */}
          <div className="relative bg-gradient-to-br from-violet-950 via-indigo-950 to-neutral-950 px-6 pt-8 pb-6">
            <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-violet-400/50 to-transparent" />
            {/* Glow orbs */}
            <div className="absolute top-0 left-1/4 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl" />
            <div className="absolute top-0 right-1/4 h-24 w-24 rounded-full bg-indigo-500/10 blur-2xl" />

            <div className="relative flex flex-col items-center text-center">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-3 shadow-lg shadow-violet-500/25">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <DialogTitle className="text-2xl font-bold text-white mb-1">
                Upgrade to Pro
              </DialogTitle>
              <DialogDescription className="text-neutral-400 text-sm">
                Unlock everything. No limits.
              </DialogDescription>
            </div>
          </div>

          <div className="px-6 py-5">
            {/* Perks grid */}
            <div className="grid grid-cols-2 gap-2 mb-5">
              {PLAN_PERKS.map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 py-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-violet-400 shrink-0" />
                  <span className="text-xs text-neutral-300">{label}</span>
                </div>
              ))}
            </div>

            {/* Pricing */}
            {products.length > 0 ? (
              products.map((product) => (
                <div key={product._id} className="flex flex-col gap-3">
                  {product.prices?.map((price) => (
                    <div
                      key={price._id}
                      className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 flex items-center justify-between"
                    >
                      <div>
                        <div className="text-2xl font-bold text-white">
                          {formatPrice(price)}
                        </div>
                        <div className="text-xs text-neutral-500 capitalize">
                          per {price.interval}
                        </div>
                      </div>
                      <button
                        onClick={() => onClickContinue(price)}
                        disabled={isLoading}
                        className="
                          relative overflow-hidden
                          rounded-xl px-5 py-2.5
                          bg-gradient-to-r from-violet-600 to-indigo-600
                          hover:from-violet-500 hover:to-indigo-500
                          disabled:opacity-60 disabled:cursor-not-allowed
                          text-white text-sm font-semibold
                          shadow-lg shadow-violet-500/25
                          transition-all duration-200
                          flex items-center gap-2
                          group
                        "
                      >
                        {isLoading ? (
                          <Loader />
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5 group-hover:scale-110 transition-transform" />
                            Upgrade
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-500" />
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-neutral-500 text-sm">
                No plans available currently.
              </div>
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default SubscriptionModal;