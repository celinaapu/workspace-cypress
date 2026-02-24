"use client";

import React, { useEffect, useState } from "react";
import { Subscription } from "@/lib/mongoose/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import CypressProfileIcon from "../icons/cypressProfileIcon";
import ModeToggle from "../global/mode-toggle";
import { LogOut, Crown } from "lucide-react";
import LogoutButton from "../global/logout-button";
import { Button } from "../ui/button";
import { useSubscriptionModal } from "@/lib/providers/subscription-modal-provider";
import { useUser } from "@/lib/providers/user-provider";

interface UserCardProps {
  subscription: Subscription | null;
}

const UserCard: React.FC<UserCardProps> = ({ subscription }) => {
  const { setOpen } = useSubscriptionModal();
  const { user } = useUser();

  if (!user) return;

  const avatarPath = user.image || "";

  const profile = {
    ...user,
    avatarUrl: avatarPath,
  };

  return (
    <article
      className="hidden
      sm:flex 
      justify-between 
      items-center 
      px-4 
      py-2 
      dark:bg-Neutrals/neutrals-12
      rounded-3xl
  "
    >
      <aside className="flex justify-center items-center gap-2">
        <Avatar>
          <AvatarImage src={profile.avatarUrl} />
          <AvatarFallback>
            <CypressProfileIcon />
          </AvatarFallback>
        </Avatar>
        <div className="flex flex-col">
          <span className="text-muted-foreground flex items-center gap-2">
            {subscription?.status === "active" ? (
              <>
                <Crown className="h-3 w-3 text-yellow-500" />
                Pro Plan
              </>
            ) : (
              "Free Plan"
            )}
          </span>
          <small
            className="w-[100px] 
          overflow-hidden 
          overflow-ellipsis
          "
          >
            {profile.email}
          </small>
          {subscription?.status !== "active" && (
            <Button
              size="sm"
              variant="outline"
              className="mt-1 h-6 text-xs"
              onClick={() => setOpen(true)}
            >
              <Crown className="h-3 w-3 mr-1" />
              Upgrade
            </Button>
          )}
        </div>
      </aside>
      <div className="flex items-center justify-center">
        <LogoutButton>
          <LogOut />
        </LogoutButton>
        <ModeToggle />
      </div>
    </article>
  );
};

export default UserCard;
