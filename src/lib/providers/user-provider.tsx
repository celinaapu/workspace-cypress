"use client";

import { useSession } from "next-auth/react";
import { Subscription } from "@/lib/mongoose/types";
import { createContext, useContext, useEffect, useState } from "react";
import { getUserSubscriptionStatus } from "@/lib/mongoose/queries";
import { useToast } from "@/components/ui/use-toast";

type UserContextType = {
  user: any | null;
  subscription: Subscription | null;
};

const UserContext = createContext<UserContextType>({
  user: null,
  subscription: null,
});

export const useUser = () => {
  return useContext(UserContext);
};

export const UserProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { data: session } = useSession();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getSubscription = async () => {
      if (session?.user?.id) {
        const { data, error } = await getUserSubscriptionStatus(session.user.id);
        if (data) setSubscription(data as any);
        if (error) {
          toast({
            title: "Unexpected Error",
            description: "Could not fetch subscription status.",
            variant: "destructive",
          });
        }
      }
    };
    getSubscription();
  }, [session, toast]);

  return (
    <UserContext.Provider value={{ user: session?.user || null, subscription }}>
      {children}
    </UserContext.Provider>
  );
};
