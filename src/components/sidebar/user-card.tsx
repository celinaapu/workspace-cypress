"use client";
import { Subscription } from "@/lib/mongoose/types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import CypressProfileIcon from "../icons/cypressProfileIcon";
import ModeToggle from "../global/mode-toggle";
import { LogOut, Crown, Sparkles } from "lucide-react";
import LogoutButton from "../global/logout-button";
import { useSubscriptionModal } from "@/lib/providers/subscription-modal-provider";
import { useUser } from "@/lib/providers/user-provider";

interface UserCardProps {
  subscription: Subscription | null;
}

const UserCard: React.FC<UserCardProps> = ({ subscription }) => {
  const { setOpen } = useSubscriptionModal();
  const { user } = useUser();

  if (!user) return null;

  const isPro = subscription?.status === "active";
  const avatarUrl = user.image || "";
  const email = user.email || "";
  const initials = email.slice(0, 2).toUpperCase();

  return (
    <article className="hidden sm:block w-full">
      {/* Main card */}
      <div className="
        relative overflow-hidden
        rounded-2xl
        border border-white/[0.06]
        bg-gradient-to-br from-white/[0.04] to-white/[0.01]
        backdrop-blur-sm
        p-3
        group
        transition-all duration-300
        hover:border-white/[0.10]
        hover:from-white/[0.06] hover:to-white/[0.02]
      ">
        {/* Pro shimmer line at top */}
        {isPro && (
          <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-yellow-400/60 to-transparent" />
        )}

        <div className="flex items-center gap-3">
          {/* Avatar with pro ring */}
          <div className="relative shrink-0">
            <div className={`
              absolute inset-0 rounded-full
              ${isPro
                ? "bg-gradient-to-br from-yellow-400/40 via-amber-300/20 to-transparent"
                : "bg-gradient-to-br from-violet-500/20 to-transparent"
              }
              blur-[6px] scale-110
            `} />
            <Avatar className="relative h-9 w-9 ring-1 ring-white/10">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-neutral-800 text-neutral-200 text-xs font-medium">
                {initials || <CypressProfileIcon />}
              </AvatarFallback>
            </Avatar>
            {/* Pro badge on avatar */}
            {isPro && (
              <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-yellow-500 flex items-center justify-center ring-2 ring-background">
                <Crown className="h-2 w-2 text-yellow-900" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              {isPro ? (
                <span className="text-xs font-medium text-yellow-400 flex items-center gap-1">
                  <Crown className="h-2.5 w-2.5" />
                  Pro
                </span>
              ) : (
                <span className="text-xs text-neutral-500 font-medium">Free</span>
              )}
            </div>
            <p className="text-xs text-neutral-400 truncate leading-tight">
              {email}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-0.5 shrink-0">
            <ModeToggle />
            <LogoutButton>
              <div className="
                h-7 w-7 rounded-lg
                flex items-center justify-center
                text-neutral-500
                hover:text-neutral-200
                hover:bg-white/[0.06]
                transition-all duration-200
                cursor-pointer
              ">
                <LogOut className="h-3.5 w-3.5" />
              </div>
            </LogoutButton>
          </div>
        </div>

        {/* Upgrade button — only for free users */}
        {!isPro && (
          <button
            onClick={() => setOpen(true)}
            className="
              mt-2.5 w-full
              relative overflow-hidden
              rounded-lg px-3 py-1.5
              text-xs font-medium
              bg-gradient-to-r from-violet-600/80 to-indigo-600/80
              hover:from-violet-500/90 hover:to-indigo-500/90
              text-white
              border border-violet-500/30
              transition-all duration-200
              flex items-center justify-center gap-1.5
              group/btn
            "
          >
            <Sparkles className="h-3 w-3 text-violet-200 group-hover/btn:scale-110 transition-transform" />
            Upgrade to Pro
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover/btn:translate-x-[100%] transition-transform duration-500" />
          </button>
        )}
      </div>
    </article>
  );
};

export default UserCard;