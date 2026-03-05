import React from "react";
import { cookies } from "next/headers";
import {
  getCollaboratingWorkspaces,
  getFolders,
  getPrivateWorkspaces,
  getUserSubscriptionStatus,
} from "@/lib/mongoose/queries";
import { redirect } from "next/navigation";
import { twMerge } from "tailwind-merge";
import WorkspaceDropdown from "./workspace-dropdown";
import PlanUsage from "./plan-usage";
import NativeNavigation from "./native-navigation";
import { ScrollArea } from "../ui/scroll-area";
import FoldersDropdownList from "./folders-dropdown-list";
import UserCard from "./user-card";

interface SidebarProps {
  params: { workspaceId: string };
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = async ({ params, className }) => {
  const user = { id: params.workspaceId };

  const { data: subscriptionData, error: subscriptionError } =
    await getUserSubscriptionStatus(user.id);

  const { data: workspaceFolderData, error: foldersError } = await getFolders(
    params.workspaceId
  );

  if (subscriptionError || foldersError) redirect("/dashboard");

  const [privateWorkspaces, collaboratingWorkspaces] = await Promise.all([
    getPrivateWorkspaces(user.id),
    getCollaboratingWorkspaces(user.id),
  ]);

  const allWorkspaces = [...privateWorkspaces, ...collaboratingWorkspaces];

  const defaultWorkspace = allWorkspaces.find(
    (workspace) => workspace._id?.toString() === params.workspaceId
  );

  return (
    <aside
      className={twMerge(
        "hidden sm:flex sm:flex-col w-[280px] shrink-0 h-screen",
        className
      )}
    >
      {/* Entire middle section scrolls — workspaces + nav + folders */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col gap-4 p-4">
          {/* Workspace list — always visible, no dropdown */}
          <WorkspaceDropdown
            privateWorkspaces={privateWorkspaces}
            sharedWorkspaces={[]}
            collaboratingWorkspaces={collaboratingWorkspaces}
            defaultValue={defaultWorkspace}
          />

          <PlanUsage
            foldersLength={workspaceFolderData?.length || 0}
            subscription={subscriptionData}
          />

          <NativeNavigation myWorkspaceId={params.workspaceId} />

          {/* Folders */}
          <div className="relative">
            <div
              className="pointer-events-none absolute bottom-0 left-0 right-0 h-8 
              bg-gradient-to-t from-background to-transparent z-10"
            />
            <FoldersDropdownList
              workspaceFolders={workspaceFolderData || []}
              workspaceId={params.workspaceId}
            />
          </div>
        </div>
      </ScrollArea>

      <div className="p-4 pt-2 shrink-0">
        <UserCard subscription={subscriptionData} />
      </div>
    </aside>
  );
};

export default Sidebar;