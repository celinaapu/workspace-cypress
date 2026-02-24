"use client";

import { useToast } from "@/components/ui/use-toast";
import {
  Dispatch,
  SetStateAction,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { getUserSubscriptionStatus } from "../mongoose/queries";
import SubscriptionModal from "@/components/global/subscription-modal";
import { ProductWithPrice, Subscription } from "@/lib/mongoose/types";
import { useUser } from "./user-provider";

type SubscriptionModalContextType = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

const SubscriptionModalContext = createContext<SubscriptionModalContextType>({
  open: false,
  setOpen: () => {},
});

export const useSubscriptionModal = () => {
  return useContext(SubscriptionModalContext);
};

export const SubscriptionModalProvider = ({
  children,
  products,
}: {
  children: React.ReactNode;
  products: ProductWithPrice[];
}) => {
  const [open, setOpen] = useState(false);
  // State to hold the subscription data
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const { user } = useUser();

  // Fetch the subscription status whenever the user changes
  useEffect(() => {
    const fetchSubscription = async () => {
      if (user?.id) {
        const { data, error } = await getUserSubscriptionStatus(user.id);
        if (data) {
          setSubscription(data);
        }
        if (error) {
          console.error("Error fetching subscription:", error);
        }
      }
    };
    fetchSubscription();
  }, [user]);

  return (
    <SubscriptionModalContext.Provider value={{ open, setOpen }}>
      {children}
      {/* We pass the fetched subscription down to the modal */}
      <SubscriptionModal 
        products={products} 
        subscription={subscription} 
      />
    </SubscriptionModalContext.Provider>
  );
};