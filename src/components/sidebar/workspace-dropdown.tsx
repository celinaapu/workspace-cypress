"use client";
import { useAppState } from "@/lib/providers/state-provider";
import { Workspace } from "@/lib/types";
import React, { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";
import SelectedWorkspace from "./selected-workspace";
import CustomDialogTrigger from "../global/custom-dialog-trigger";
import WorkspaceCreator from "../global/workspace-creator";

interface WorkspaceDropdownProps {
  privateWorkspaces: Workspace[] | [];
  sharedWorkspaces: Workspace[] | [];
  collaboratingWorkspaces: Workspace[] | [];
  defaultValue: Workspace | undefined;
}

const toStr = (id: any): string => (id ? id.toString() : "");

const WorkspaceDropdown: React.FC<WorkspaceDropdownProps> = ({
  privateWorkspaces,
  collaboratingWorkspaces,
  sharedWorkspaces,
  defaultValue,
}) => {
  const { dispatch, state } = useAppState();
  const [selectedOption, setSelectedOption] = useState(defaultValue);

  useEffect(() => {
    if (!state.workspaces.length) {
      dispatch({
        type: "SET_WORKSPACES",
        payload: {
          workspaces: [
            ...privateWorkspaces,
            ...sharedWorkspaces,
            ...collaboratingWorkspaces,
          ].map((workspace) => ({
            ...workspace,
            id: toStr(workspace._id ?? workspace.id),
            folders: [],
          })),
        },
      });
    }
  }, [privateWorkspaces, collaboratingWorkspaces, sharedWorkspaces, dispatch, state.workspaces.length]);

  useEffect(() => {
    const defaultId = toStr(defaultValue?._id ?? defaultValue?.id);
    if (!defaultId) return;

    const fromState = state.workspaces.find(
      (w) => toStr(w._id ?? w.id) === defaultId
    );
    if (fromState) { setSelectedOption(fromState); return; }

    const fromProps = [
      ...privateWorkspaces,
      ...sharedWorkspaces,
      ...collaboratingWorkspaces,
    ].find((w) => toStr(w._id ?? w.id) === defaultId);

    if (fromProps) setSelectedOption(fromProps);
  }, [state.workspaces, defaultValue, privateWorkspaces, sharedWorkspaces, collaboratingWorkspaces]);

  const handleSelect = (option: Workspace) => setSelectedOption(option);

  const sorted = (list: Workspace[]) =>
    [...list].sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));

  const Section = ({ label, workspaces }: { label: string; workspaces: Workspace[] }) => (
    <div className="mb-3">
      <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-1 px-1">
        {label}
      </p>
      <hr className="mb-1 border-muted" />
      {workspaces.length ? (
        sorted(workspaces).map((option) => (
          <div
            key={toStr(option._id)}
            className={twMerge(
              "rounded-md transition-colors",
              toStr(option._id) === toStr(selectedOption?._id ?? selectedOption?.id)
                ? "bg-muted/50"
                : "hover:bg-muted/30"
            )}
          >
            <SelectedWorkspace workspace={option} onClick={handleSelect} />
          </div>
        ))
      ) : (
        <p className="text-xs text-muted-foreground px-1 py-1 italic">
          No {label.toLowerCase()} workspaces
        </p>
      )}
    </div>
  );

  return (
    <div className="w-full flex flex-col">
      {/* Active workspace shown at top */}
      {selectedOption && (
        <div className="mb-3 px-1">
          <p className="text-muted-foreground text-xs uppercase tracking-wider mb-1">
            Current Workspace
          </p>
          <div className="rounded-md bg-muted/40 border border-muted">
            <SelectedWorkspace workspace={selectedOption} />
          </div>
        </div>
      )}

      {/* All sections always visible — no dropdown */}
      <Section label="Private" workspaces={privateWorkspaces} />
      <Section label="Shared" workspaces={sharedWorkspaces} />
      <Section label="Collaborating" workspaces={collaboratingWorkspaces} />

      <CustomDialogTrigger
        header="Create A Workspace"
        content={<WorkspaceCreator />}
        description="Workspaces give you the power to collaborate with others. You can change your workspace privacy settings after creating the workspace too."
      >
        <div className="flex transition-all hover:bg-muted rounded-md justify-center items-center gap-2 p-2 w-full mt-1 border border-dashed border-muted cursor-pointer">
          <article className="text-slate-500 rounded-full bg-slate-800 w-4 h-4 flex items-center justify-center text-xs">
            +
          </article>
          <span className="text-sm text-muted-foreground">Create workspace</span>
        </div>
      </CustomDialogTrigger>
    </div>
  );
};

export default WorkspaceDropdown;