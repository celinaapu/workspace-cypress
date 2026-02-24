"use client";
import { MAX_FOLDERS_FREE_PLAN } from "@/lib/constants";
import { useAppState } from "@/lib/providers/state-provider";
import { Subscription } from "@/lib/mongoose/types";
import React, { useEffect, useState } from "react";
import { Progress } from "../ui/progress";
import CypressDiamondIcon from "../icons/cypressDiamongIcon";
import { Button } from "../ui/button";
import { useSubscriptionModal } from "@/lib/providers/subscription-modal-provider";

interface PlanUsageProps {
  foldersLength: number;
  subscription: Subscription | null;
}

const PlanUsage: React.FC<PlanUsageProps> = ({
  foldersLength,
  subscription,
}) => {
  const { workspaceId, state } = useAppState();
  const { setOpen } = useSubscriptionModal();
  const [usagePercentage, setUsagePercentage] = useState(
    (foldersLength / MAX_FOLDERS_FREE_PLAN) * 100,
  );

  useEffect(() => {
    const stateFoldersLength = state.workspaces.find(
      (workspace) => workspace.id === workspaceId,
    )?.folders.length;
    if (stateFoldersLength === undefined) return;
    setUsagePercentage((stateFoldersLength / MAX_FOLDERS_FREE_PLAN) * 100);
  }, [state, workspaceId]);

  return (
    <article className="mb-4">
      {subscription?.status !== "active" && (
        <div
          className="flex 
          gap-2
          text-muted-foreground
          mb-2
          items-center
        "
        >
          <div className="h-4 w-4">
            <CypressDiamondIcon />
          </div>
          <div
            className="flex 
        justify-between 
        w-full 
        items-center
        "
          >
            <div>Free Plan</div>
            <small>{usagePercentage.toFixed(0)}% / 100%</small>
          </div>
        </div>
      )}
      {subscription?.status !== "active" && (
        <Progress value={usagePercentage} className="h-1" />
      )}
      {subscription?.status !== "active" && usagePercentage >= 80 && (
        <div className="mt-2 space-y-2">
          {usagePercentage >= 100 ? (
            <div className="text-sm text-destructive font-medium">
              You&apos;ve reached your free plan limit! Upgrade to create more folders.
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              You&apos;re approaching your free plan limit. Upgrade for unlimited folders!
            </div>
          )}
          <Button 
            size="sm" 
            className="w-full" 
            onClick={() => setOpen(true)}
          >
            Upgrade to Pro ✨
          </Button>
        </div>
      )}
    </article>
  );
};

export default PlanUsage;
