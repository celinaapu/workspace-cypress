"use client";

import { useEffect } from "react";
import { useAppState } from "../providers/state-provider";
import { File } from "../types";
import { useRouter } from "next/navigation";
import { useSocket } from "../providers/socket-provider";

const useSocketRealtime = () => {
  const { socket, isConnected } = useSocket();
  const { dispatch, state } = useAppState();
  const router = useRouter();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for new files added by other users
    socket.on("receive-insert-file", (newFile: File) => {
      const { folderId, workspaceId, _id: fileId } = newFile;

      // Check if file already exists in local state to avoid duplicates
      const exists = state.workspaces
        .find((ws) => ws._id === workspaceId)
        ?.folders.find((f) => f._id === folderId)
        ?.files.find((file) => file._id === fileId);

      if (!exists) {
        dispatch({
          type: "ADD_FILE",
          payload: { file: newFile, folderId, workspaceId },
        });
      }
    });

    // Listen for file deletions
    socket.on(
      "receive-delete-file",
      (payload: { fileId: string; folderId: string; workspaceId: string }) => {
        const { fileId, folderId, workspaceId } = payload;

        // If user is currently looking at the deleted file, boot them out
        // Note: check your URL logic here
        router.replace(`/dashboard/${workspaceId}`);

        dispatch({
          type: "DELETE_FILE",
          payload: { fileId, folderId, workspaceId },
        });
      },
    );

    // Listen for file updates (title, icon, etc.)
    socket.on(
      "receive-update-file",
      (
        updatedFile: Partial<File> & {
          _id: string;
          folderId: string;
          workspaceId: string;
        },
      ) => {
        dispatch({
          type: "UPDATE_FILE",
          payload: {
            workspaceId: updatedFile.workspaceId,
            folderId: updatedFile.folderId,
            fileId: updatedFile._id,
            file: updatedFile,
          },
        });
      },
    );

    return () => {
      socket.off("receive-insert-file");
      socket.off("receive-delete-file");
      socket.off("receive-update-file");
    };
  }, [socket, isConnected, state, dispatch, router]);

  return null;
};

export default useSocketRealtime;
