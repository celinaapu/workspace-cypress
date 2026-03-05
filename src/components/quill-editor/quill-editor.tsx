"use client";
import { useAppState } from "@/lib/providers/state-provider";
import { File as WorkspaceFile, Folder, Workspace } from "@/lib/mongoose/types";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "quill/dist/quill.snow.css";
import { Button } from "../ui/button";
import {
  getFolderDetails,
  getWorkspaceDetails,
  updateFile,
  updateFolder,
  updateWorkspace,
} from "@/lib/mongoose/queries";
import { uploadBanner } from "@/lib/server-actions/file-upload-actions";
import { usePathname, useRouter } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import EmojiPicker from "../global/emoji-picker";
import BannerUpload from "../banner-upload/banner-upload";
import { Camera, ImageIcon, Loader2, Pencil, RotateCcw, Trash2, X } from "lucide-react";
import { useSocket } from "@/lib/providers/socket-provider";
import { useToast } from "../ui/use-toast";

interface QuillEditorProps {
  dirDetails: WorkspaceFile | Folder | Workspace;
  fileId: string;
  dirType: "workspace" | "folder" | "file";
}

var TOOLBAR_OPTIONS = [
  ["bold", "italic", "underline", "strike"],
  ["blockquote", "code-block"],
  [{ header: 1 }, { header: 2 }],
  [{ list: "ordered" }, { list: "bullet" }],
  [{ script: "sub" }, { script: "super" }],
  [{ direction: "rtl" }],
  [{ size: ["small", false, "large", "huge"] }],
  [{ header: [1, 2, 3, 4, 5, 6, false] }],
  [{ color: [] }, { background: [] }],
  [{ font: [] }],
  [{ align: [] }],
  ["clean"],
];

const QuillEditor: React.FC<QuillEditorProps> = ({
  dirDetails,
  dirType,
  fileId,
}) => {
  const { state, workspaceId, folderId, dispatch } = useAppState();
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const router = useRouter();
  const { socket } = useSocket();
  const pathname = usePathname();
  const { toast } = useToast();
  const [quill, setQuill] = useState<any>(null);
  const [collaborators, setCollaborators] = useState<
    { id: string; email: string; avatarUrl: string }[]
  >([]);
  const [deletingBanner, setDeletingBanner] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [localCursors, setLocalCursors] = useState<any>([]);

  // Both banner and logo URL are kept in local state so UI updates instantly,
  // but they are also persisted to the DB so they survive refresh.
  const [localBannerUrl, setLocalBannerUrl] = useState<string>(dirDetails.bannerUrl || "");
  const [localLogoUrl, setLocalLogoUrl] = useState<string>((dirDetails as any).logoUrl || "");
  const iconImageInputRef = useRef<HTMLInputElement>(null);

  const details = useMemo(() => {
    let selectedDir;
    if (dirType === "file") {
      selectedDir = state.workspaces
        .find((workspace) => workspace.id === workspaceId)
        ?.folders.find((folder) => folder.id === folderId)
        ?.files.find((file) => file.id === fileId);
    }
    if (dirType === "folder") {
      selectedDir = state.workspaces
        .find((workspace) => workspace.id === workspaceId)
        ?.folders.find((folder) => folder.id === fileId);
    }
    if (dirType === "workspace") {
      selectedDir = state.workspaces.find((workspace) => workspace.id === fileId);
    }
    if (selectedDir) return selectedDir;
    return {
      title: dirDetails.title,
      iconId: dirDetails.iconId,
      createdAt: dirDetails.createdAt,
      data: dirDetails.data,
      inTrash: dirDetails.inTrash,
      bannerUrl: dirDetails.bannerUrl,
    } as Workspace | Folder | WorkspaceFile;
  }, [state, workspaceId, folderId, dirType, fileId, dirDetails.title, dirDetails.iconId, dirDetails.createdAt, dirDetails.data, dirDetails.inTrash, dirDetails.bannerUrl]);

  // Sync local state when global state changes
  const detailsBannerUrl = details.bannerUrl;
  useEffect(() => {
    if (detailsBannerUrl !== undefined) setLocalBannerUrl(detailsBannerUrl || "");
  }, [detailsBannerUrl]);

  const detailsLogoUrl = (details as any).logoUrl;
  useEffect(() => {
    if (detailsLogoUrl !== undefined) setLocalLogoUrl(detailsLogoUrl || "");
  }, [detailsLogoUrl]);

  const breadCrumbs = useMemo(() => {
    if (!pathname || !state.workspaces || !workspaceId) return;
    const segments = pathname.split("/").filter((val) => val !== "dashboard" && val);
    const workspaceDetails = state.workspaces.find((workspace) => workspace.id === workspaceId);
    const workspaceBreadCrumb = workspaceDetails ? `${workspaceDetails.iconId} ${workspaceDetails.title}` : "";
    if (segments.length === 1) return workspaceBreadCrumb;
    const folderSegment = segments[1];
    const folderDetails = workspaceDetails?.folders.find((folder) => folder.id === folderSegment);
    const folderBreadCrumb = folderDetails ? `/ ${folderDetails.iconId} ${folderDetails.title}` : "";
    if (segments.length === 2) return `${workspaceBreadCrumb} ${folderBreadCrumb}`;
    const fileSegment = segments[2];
    const fileDetails = folderDetails?.files.find((file) => file.id === fileSegment);
    const fileBreadCrumb = fileDetails ? `/ ${fileDetails.iconId} ${fileDetails.title}` : "";
    return `${workspaceBreadCrumb} ${folderBreadCrumb} ${fileBreadCrumb}`;
  }, [state, pathname, workspaceId]);

  const wrapperRef = useCallback((wrapper: HTMLDivElement | null) => {
    if (typeof window === "undefined") return;
    if (wrapper === null) return;
    (async () => {
      wrapper.innerHTML = "";
      const editor = document.createElement("div");
      wrapper.append(editor);
      const Quill = (await import("quill")).default;
      const QuillCursors = (await import("quill-cursors")).default;
      Quill.register("modules/cursors", QuillCursors);
      const q = new Quill(editor, {
        theme: "snow",
        modules: { toolbar: TOOLBAR_OPTIONS, cursors: { transformOnTextChange: true } },
      });
      setQuill(q);
    })();
  }, []);

  const restoreFileHandler = async () => {
    if (dirType === "file") {
      if (!folderId || !workspaceId) return;
      dispatch({ type: "UPDATE_FILE", payload: { file: { inTrash: "" }, fileId, folderId: folderId as string, workspaceId: workspaceId as string } });
      await updateFile({ inTrash: "" }, fileId);
    }
    if (dirType === "folder") {
      if (!workspaceId) return;
      dispatch({ type: "UPDATE_FOLDER", payload: { folder: { inTrash: "" }, folderId: fileId, workspaceId: workspaceId as string } });
      await updateFolder({ inTrash: "" }, fileId);
    }
  };

  const deleteFileHandler = async () => {
    if (dirType === "file") {
      if (!workspaceId || !folderId) return;
      dispatch({ type: "DELETE_FILE", payload: { fileId, folderId: folderId as string, workspaceId: workspaceId as string } });
      router.replace(`/dashboard/${workspaceId}`);
    }
    if (dirType === "folder") {
      if (!workspaceId) return;
      dispatch({ type: "DELETE_FOLDER", payload: { folderId: fileId, workspaceId: workspaceId as string } });
      router.replace(`/dashboard/${workspaceId}`);
    }
  };

  const iconOnChange = async (icon: string) => {
    if (!fileId) return;
    if (dirType === "workspace") {
      dispatch({ type: "UPDATE_WORKSPACE", payload: { workspace: { iconId: icon }, workspaceId: fileId } });
      await updateWorkspace({ iconId: icon }, fileId);
    }
    if (dirType === "folder") {
      if (!workspaceId) return;
      dispatch({ type: "UPDATE_FOLDER", payload: { folder: { iconId: icon }, workspaceId: workspaceId as string, folderId: fileId } });
      await updateFolder({ iconId: icon }, fileId);
    }
    if (dirType === "file") {
      if (!workspaceId || !folderId) return;
      dispatch({ type: "UPDATE_FILE", payload: { file: { iconId: icon }, workspaceId: workspaceId as string, folderId: folderId as string, fileId } });
      await updateFile({ iconId: icon }, fileId);
    }
  };

  // Upload logo image and persist URL to DB — survives refresh
  const handleLogoUpload = async (file: globalThis.File) => {
    setUploadingLogo(true);
    // Show preview instantly while uploading
    const previewUrl = URL.createObjectURL(file);
    setLocalLogoUrl(previewUrl);
    try {
      const formData = new FormData();
      formData.append("banner", file); // reuse banner upload endpoint
      formData.append("id", `logo-${fileId}`);
      const result = await uploadBanner(formData);
      if (!result.success) throw new Error(result.error || "Upload failed");
      const persistedUrl = result.url ?? "";
      if (!persistedUrl) throw new Error("No URL returned");
      // Update local state with the real persisted URL
      setLocalLogoUrl(persistedUrl);
      // Save to DB so it survives refresh
      if (dirType === "workspace") {
        dispatch({ type: "UPDATE_WORKSPACE", payload: { workspace: { logoUrl: persistedUrl } as any, workspaceId: fileId } });
        await updateWorkspace({ logoUrl: persistedUrl } as any, fileId);
      } else if (dirType === "folder") {
        if (!workspaceId) return;
        dispatch({ type: "UPDATE_FOLDER", payload: { folder: { logoUrl: persistedUrl } as any, folderId: fileId, workspaceId: workspaceId as string } });
        await updateFolder({ logoUrl: persistedUrl } as any, fileId);
      } else if (dirType === "file") {
        if (!workspaceId || !folderId) return;
        dispatch({ type: "UPDATE_FILE", payload: { file: { logoUrl: persistedUrl } as any, fileId, folderId: folderId as string, workspaceId: workspaceId as string } });
        await updateFile({ logoUrl: persistedUrl } as any, fileId);
      }
      toast({ title: "Logo updated!" });
    } catch (e) {
      setLocalLogoUrl(""); // revert preview on failure
      toast({ variant: "destructive", title: "Logo upload failed" });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    setLocalLogoUrl("");
    if (dirType === "workspace") {
      dispatch({ type: "UPDATE_WORKSPACE", payload: { workspace: { logoUrl: "" } as any, workspaceId: fileId } });
      await updateWorkspace({ logoUrl: "" } as any, fileId);
    } else if (dirType === "folder") {
      if (!workspaceId) return;
      dispatch({ type: "UPDATE_FOLDER", payload: { folder: { logoUrl: "" } as any, folderId: fileId, workspaceId: workspaceId as string } });
      await updateFolder({ logoUrl: "" } as any, fileId);
    } else if (dirType === "file") {
      if (!workspaceId || !folderId) return;
      dispatch({ type: "UPDATE_FILE", payload: { file: { logoUrl: "" } as any, fileId, folderId: folderId as string, workspaceId: workspaceId as string } });
      await updateFile({ logoUrl: "" } as any, fileId);
    }
  };

  const deleteBanner = async () => {
    if (!fileId) return;
    setDeletingBanner(true);
    setLocalBannerUrl("");
    try {
      if (dirType === "file") {
        if (!folderId || !workspaceId) return;
        dispatch({ type: "UPDATE_FILE", payload: { file: { bannerUrl: "" }, fileId, folderId: folderId as string, workspaceId: workspaceId as string } });
        await updateFile({ bannerUrl: "" }, fileId);
      }
      if (dirType === "folder") {
        if (!workspaceId) return;
        dispatch({ type: "UPDATE_FOLDER", payload: { folder: { bannerUrl: "" }, folderId: fileId, workspaceId: workspaceId as string } });
        await updateFolder({ bannerUrl: "" }, fileId);
      }
      if (dirType === "workspace") {
        dispatch({ type: "UPDATE_WORKSPACE", payload: { workspace: { bannerUrl: "" }, workspaceId: fileId } });
        await updateWorkspace({ bannerUrl: "" }, fileId);
      }
    } catch (e) {
      setLocalBannerUrl(details.bannerUrl || "");
    } finally {
      setDeletingBanner(false);
    }
  };

  useEffect(() => {
    if (!fileId) return;
    const fetchInformation = async () => {
      if (dirType === "file") {
        const selectedDir = dirDetails;
        if (!workspaceId || quill === null) return;
        if (!selectedDir.data) return;
        quill.setContents(JSON.parse(selectedDir.data || ""));
        const fileDir = selectedDir as WorkspaceFile;
        dispatch({ type: "UPDATE_FILE", payload: { file: { data: selectedDir.data }, fileId, folderId: fileDir.folderId, workspaceId } });
      }
      if (dirType === "folder") {
        const { data: selectedDir, error } = await getFolderDetails(fileId);
        if (error || !selectedDir) return router.replace("/dashboard");
        if (!selectedDir || selectedDir.length === 0) { router.replace(`/dashboard/${workspaceId}`); return; }
        if (quill === null) return;
        if (!selectedDir[0].data) return;
        quill.setContents(JSON.parse(selectedDir[0].data || ""));
        dispatch({ type: "UPDATE_FOLDER", payload: { folderId: fileId, folder: { data: selectedDir[0].data }, workspaceId: selectedDir[0].workspaceId } });
      }
      if (dirType === "workspace") {
        const { data: selectedDir, error } = await getWorkspaceDetails(fileId);
        if (error || !selectedDir) return router.replace("/dashboard");
        if (!selectedDir[0] || quill === null) return;
        if (!selectedDir[0].data) return;
        quill.setContents(JSON.parse(selectedDir[0].data || ""));
        dispatch({ type: "UPDATE_WORKSPACE", payload: { workspace: { data: selectedDir[0].data }, workspaceId: fileId } });
      }
    };
    fetchInformation();
  }, [fileId, workspaceId, quill, dirType, dirDetails, dispatch, router]);

  useEffect(() => {
    if (quill === null || socket === null || !fileId || !localCursors.length) return;
    const socketHandler = (range: any, roomId: string, cursorId: string) => {
      if (roomId === fileId) {
        const cursorToMove = localCursors.find((c: any) => c.cursors()?.[0].id === cursorId);
        if (cursorToMove) cursorToMove.moveCursor(cursorId, range);
      }
    };
    socket.on("receive-cursor-move", socketHandler);
    return () => { socket.off("receive-cursor-move", socketHandler); };
  }, [quill, socket, fileId, localCursors]);

  useEffect(() => {
    if (socket === null || quill === null || !fileId) return;
    socket.emit("create-room", fileId);
  }, [socket, quill, fileId]);

  useEffect(() => {
    if (quill === null || socket === null || !fileId) return;
    const user = { id: "temp-user-id", email: "temp@example.com" };
    const selectionChangeHandler = (cursorId: string) => (range: any, oldRange: any, source: any) => {
      if (source === "user" && cursorId) socket.emit("send-cursor-move", range, fileId, cursorId);
    };
    const quillHandler = (delta: any, oldDelta: any, source: any) => {
      if (source !== "user") return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaving(true);
      saveTimerRef.current = setTimeout(async () => { setSaving(false); }, 850);
      socket.emit("send-changes", delta, fileId);
    };
    quill.on("text-change", quillHandler);
    quill.on("selection-change", selectionChangeHandler(user.id));
    return () => {
      quill.off("text-change", quillHandler);
      quill.off("selection-change", selectionChangeHandler);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [quill, socket, fileId, details, folderId, workspaceId, dispatch]);

  useEffect(() => {
    if (quill === null || socket === null) return;
    const socketHandler = (deltas: any, id: string) => { if (id === fileId) quill.updateContents(deltas); };
    socket.on("receive-changes", socketHandler);
    return () => { socket.off("receive-changes", socketHandler); };
  }, [quill, socket, fileId]);

  return (
    <div className="relative w-full min-h-screen flex flex-col bg-background">

      {/* ── Slim top bar: breadcrumbs + collaborators ── */}
      <div className="sticky top-0 z-40 flex items-center justify-between px-5 py-2.5 border-b border-white/[0.04] bg-background/90 backdrop-blur-md">
        <span className="text-xs text-neutral-500 truncate max-w-[70%] tracking-wide">{breadCrumbs}</span>
        {collaborators?.length > 0 && (
          <div className="flex items-center">
            {collaborators.map((collaborator) => (
              <TooltipProvider key={collaborator.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="-ml-2 h-6 w-6 border-2 border-background ring-1 ring-white/10">
                      <AvatarImage src={collaborator.avatarUrl || ""} className="rounded-full" />
                      <AvatarFallback className="text-[9px] bg-neutral-800">
                        {collaborator.email.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">{collaborator.email}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}
      </div>

      {/* ── Trash notice ── */}
      {details.inTrash && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 px-4 py-2.5 bg-red-950/70 border-b border-red-500/20 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Trash2 className="h-3.5 w-3.5 text-red-400 shrink-0" />
            <span className="text-xs text-red-200">This {dirType} is in the trash.</span>
            <span className="text-xs text-red-400/60 hidden sm:inline">— {details.inTrash}</span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={restoreFileHandler} className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-white/10 hover:bg-white/20 text-white border border-white/10 transition-all">
              <RotateCcw className="h-3 w-3" /> Restore
            </button>
            <button onClick={deleteFileHandler} className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/20 transition-all">
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          </div>
        </div>
      )}

      {/* ── Banner ── */}
      <div className="relative w-full group px-5 pt-4">
        {localBannerUrl ? (
          <div className="relative w-full h-[220px] rounded-2xl overflow-hidden shadow-2xl shadow-black/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={localBannerUrl} alt="Banner"
              style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
            />
            <div className="absolute inset-0 pointer-events-none rounded-2xl"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.05) 55%, transparent 100%)" }} />
            <div className="absolute inset-0 pointer-events-none rounded-2xl"
              style={{ background: "linear-gradient(to right, rgba(0,0,0,0.2) 0%, transparent 18%, transparent 82%, rgba(0,0,0,0.2) 100%)" }} />
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200">
              <BannerUpload id={fileId} dirType={dirType}>
                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-black/65 backdrop-blur-sm text-neutral-200 hover:text-white border border-white/15 hover:border-white/30 transition-all">
                  <Pencil className="h-3 w-3" /> Change banner
                </button>
              </BannerUpload>
              <button disabled={deletingBanner} onClick={deleteBanner}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-black/65 backdrop-blur-sm text-neutral-400 hover:text-red-400 border border-white/10 hover:border-red-500/30 transition-all disabled:opacity-50">
                {deletingBanner ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                Remove
              </button>
            </div>
          </div>
        ) : (
          <div className="relative w-full h-[120px] rounded-2xl overflow-hidden flex flex-col items-center justify-center gap-2 border border-white/[0.05]"
            style={{ background: "linear-gradient(135deg, #0c0c0e 0%, #101014 100%)" }}>
            <div className="absolute inset-0 opacity-[0.025]"
              style={{ backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)", backgroundSize: "28px 28px" }} />
            <div className="flex flex-col items-center gap-1 opacity-20 select-none">
              <ImageIcon className="h-5 w-5 text-neutral-400" />
              <span className="text-[10px] text-neutral-500">No banner</span>
            </div>
            <BannerUpload id={fileId} dirType={dirType}>
              <button className="relative z-10 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.05] hover:bg-white/[0.09] text-neutral-400 hover:text-neutral-200 border border-white/[0.07]">
                <ImageIcon className="h-3 w-3" /> Add banner
              </button>
            </BannerUpload>
          </div>
        )}
      </div>

      {/* ── Content area ── */}
      <div className="flex justify-center flex-col items-center flex-1">
        <div className="w-full max-w-[800px] px-8 lg:px-10">

          {/* Hidden file input for logo */}
          <input
            ref={iconImageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) await handleLogoUpload(f);
              // reset so same file can be re-selected
              e.target.value = "";
            }}
          />

          {/* ── ONE ROW: logo/emoji + title + saved ── */}
          <div className={`flex items-center gap-4 ${localBannerUrl ? "-mt-7" : "mt-8"} mb-5`}>

            {/* Logo / Emoji icon */}
            <div className="relative shrink-0 group/icon">
              {localLogoUrl ? (
                <div className="w-[52px] h-[52px] rounded-xl overflow-hidden border-2 border-background shadow-xl shadow-black/50 ring-1 ring-white/10">
                  {uploadingLogo ? (
                    <div className="w-full h-full flex items-center justify-center bg-neutral-900">
                      <Loader2 className="h-4 w-4 animate-spin text-neutral-400" />
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={localLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                  )}
                </div>
              ) : (
                <EmojiPicker getValue={iconOnChange}>
                  <div className="text-[44px] w-[52px] h-[52px] cursor-pointer flex items-center justify-center hover:bg-white/[0.05] rounded-xl select-none transition-colors leading-none">
                    {details.iconId}
                  </div>
                </EmojiPicker>
              )}

              {/* Camera overlay — click to upload logo */}
              <div
                onClick={() => iconImageInputRef.current?.click()}
                className="absolute inset-0 rounded-xl bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-0.5 opacity-0 group-hover/icon:opacity-100 transition-opacity duration-150 cursor-pointer z-10"
              >
                <Camera className="h-3.5 w-3.5 text-white" />
                <span className="text-[8px] text-white/80 font-medium tracking-wide">LOGO</span>
              </div>

              {/* Remove logo — only shows when logo is set */}
              {localLogoUrl && !uploadingLogo && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveLogo(); }}
                  className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-neutral-800 border border-white/10 flex items-center justify-center hover:bg-red-900 transition-colors z-20"
                >
                  <X className="h-2.5 w-2.5 text-white" />
                </button>
              )}
            </div>

            {/* Title + type label */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-foreground tracking-tight leading-tight truncate">
                {details.title}
              </h1>
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-neutral-600">
                {dirType}
              </span>
            </div>

            {/* Save status */}
            <div className={`shrink-0 flex items-center gap-1.5 text-xs font-medium transition-all duration-300 ${saving ? "text-amber-400" : "text-emerald-500/70"}`}>
              {saving
                ? <><Loader2 className="h-3 w-3 animate-spin" /> Saving…</>
                : <><span className="h-1.5 w-1.5 rounded-full bg-emerald-500/70 inline-block" /> Saved</>
              }
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/[0.05] mb-6" />
        </div>

        {/* Quill editor */}
        <div id="container" className="max-w-[800px] w-full px-2" ref={wrapperRef} />
      </div>
    </div>
  );
};

export default QuillEditor;