"use client";
import React, { useEffect, useRef, useState } from "react";
import { useToast } from "../ui/use-toast";
import { useAppState } from "@/lib/providers/state-provider";
import { useUser } from "@/lib/providers/user-provider";
import { User, Workspace } from "@/lib/mongoose/types";
// import { useSupabaseUser } from "@/lib/providers/supabase-user-provider";
import { useRouter } from "next/navigation";
// import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  Briefcase,
  CreditCard,
  Crown,
  ExternalLink,
  Lock,
  LogOut,
  Plus,
  Share,
  User as UserIcon,
} from "lucide-react";
import { Separator } from "../ui/separator";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import {
  addCollaborators,
  deleteWorkspace,
  // getCollaborators, // Function doesn't exist yet
  // removeCollaborators, // Function doesn't exist yet
  updateWorkspace,
} from "@/lib/mongoose/queries";
import { v4 } from "uuid";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import CollaboratorSearch from "../global/collaborator-search";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Alert, AlertDescription } from "../ui/alert";
import CypressProfileIcon from "../icons/cypressProfileIcon";
import LogoutButton from "../global/logout-button";
import Link from "next/link";
import { useSubscriptionModal } from "@/lib/providers/subscription-modal-provider";
import { postData } from "@/lib/utils";

const SettingsForm = () => {
  const { toast } = useToast();
  const { user, subscription } = useUser();
  const { open, setOpen } = useSubscriptionModal();
  const router = useRouter();
  // const supabase = createClientComponentClient();
  const { state, workspaceId, dispatch } = useAppState();
  const [permissions, setPermissions] = useState("private");
  const [collaborators, setCollaborators] = useState<User[] | []>([]);
  const [openAlertMessage, setOpenAlertMessage] = useState(false);
  const [workspaceDetails, setWorkspaceDetails] = useState<Workspace>();
  const titleTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [uploadingProfilePic, setUploadingProfilePic] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);

  //WIP PAYMENT PORTAL

  const redirectToCustomerPortal = async () => {
    setLoadingPortal(true);
    try {
      const { url, error } = await postData({
        url: "/api/create-portal-link",
      });
      window.location.assign(url);
    } catch (error) {
      console.log(error);
      setLoadingPortal(false);
    }
    setLoadingPortal(false);
  };
  //addcollborators
  const addCollaborator = async (profile: User) => {
    if (!workspaceId) return;
    if (subscription?.status !== "active" && collaborators.length >= 2) {
      setOpen(true);
      return;
    }
    await addCollaborators([profile], workspaceId);
    setCollaborators([...collaborators, profile]);
  };

  //remove collaborators
  const removeCollaborator = async (user: User) => {
    if (!workspaceId) return;
    if (collaborators.length === 1) {
      setPermissions("private");
    }
    // await removeCollaborators([user], workspaceId);
    // Temporarily disabled - function doesn't exist yet
    setCollaborators(
      collaborators.filter((collaborator) => collaborator.id !== user.id),
    );
    router.refresh();
  };

  //on change
  const workspaceNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!workspaceId || !e.target.value) return;
    dispatch({
      type: "UPDATE_WORKSPACE",
      payload: { workspace: { title: e.target.value }, workspaceId },
    });
    if (titleTimerRef.current) clearTimeout(titleTimerRef.current);
    titleTimerRef.current = setTimeout(async () => {
      await updateWorkspace({ title: e.target.value }, workspaceId);
    }, 500);
  };

  const onChangeWorkspaceLogo = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!workspaceId) return;
    const file = e.target.files?.[0];
    if (!file) return;
    const uuid = v4();
    setUploadingLogo(true);
    // const { data, error } = await supabase.storage
    //   .from("workspace-logos")
    //   .upload(`workspaceLogo.${uuid}`, file, {
    //     cacheControl: "3600",
    //     upsert: true,
    //   });

    // Temporarily disabled - needs local file upload implementation
    // if (!error) {
    //   dispatch({
    //     type: "UPDATE_WORKSPACE",
    //     payload: { workspace: { logo: data.path }, workspaceId },
    //   });
    //   await updateWorkspace({ logo: data.path }, workspaceId);
    //   setUploadingLogo(false);
    // }
    setUploadingLogo(false);
  };

  const onClickAlertConfirm = async () => {
    if (!workspaceId) return;
    if (collaborators.length > 0) {
      // await removeCollaborators(collaborators, workspaceId);
      // Temporarily disabled - function doesn't exist yet
    }
    setPermissions("private");
    setOpenAlertMessage(false);
  };

  const onPermissionsChange = (val: string) => {
    if (val === "private") {
      setOpenAlertMessage(true);
    } else setPermissions(val);
  };

  //CHALLENGE fetching avatar details
  //WIP Payment Portal redirect

  useEffect(() => {
    const showingWorkspace = state.workspaces.find(
      (workspace) => workspace.id === workspaceId,
    );
    if (showingWorkspace) setWorkspaceDetails(showingWorkspace);
  }, [workspaceId, state]);

  useEffect(() => {
    if (!workspaceId) return;
    const fetchCollaborators = async () => {
      // const response = await getCollaborators(workspaceId);
      // Temporarily disabled - function doesn't exist yet
      const response: any[] = [];
      if (response.length) {
        setPermissions("shared");
        setCollaborators(response);
      }
    };
    fetchCollaborators();
  }, [workspaceId]);

  return (
    <div className="flex gap-4 flex-col">
      <p className="flex items-center gap-2 mt-6">
        <Briefcase size={20} />
        Workspace
      </p>
      <Separator />
      <div className="flex flex-col gap-2">
        <Label
          htmlFor="workspaceName"
          className="text-sm text-muted-foreground"
        >
          Name
        </Label>
        <Input
          name="workspaceName"
          value={workspaceDetails ? workspaceDetails.title : ""}
          placeholder="Workspace Name"
          onChange={workspaceNameChange}
        />
        <Label
          htmlFor="workspaceLogo"
          className="text-sm text-muted-foreground"
        >
          Workspace Logo
        </Label>
        <Input
          name="workspaceLogo"
          type="file"
          accept="image/*"
          placeholder="Workspace Logo"
          onChange={onChangeWorkspaceLogo}
          disabled={uploadingLogo || subscription?.status !== "active"}
        />
        {subscription?.status !== "active" && (
          <small className="text-muted-foreground">
            To customize your workspace, you need to be on a Pro Plan
          </small>
        )}
      </div>
      <>
        <Label htmlFor="permissions">Permissions</Label>
        <Select onValueChange={onPermissionsChange} value={permissions}>
          <SelectTrigger className="w-full h-26 -mt-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="private">
                <div
                  className="p-2
                  flex
                  gap-4
                  justify-center
                  items-center
                "
                >
                  <Lock />
                  <article className="text-left flex flex-col">
                    <span>Private</span>
                    <p>
                      Your workspace is private to you. You can choose to share
                      it later.
                    </p>
                  </article>
                </div>
              </SelectItem>
              <SelectItem value="shared">
                <div className="p-2 flex gap-4 justify-center items-center">
                  <Share></Share>
                  <article className="text-left flex flex-col">
                    <span>Shared</span>
                    <span>You can invite collaborators.</span>
                  </article>
                </div>
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>

        {permissions === "shared" && (
          <div>
            <CollaboratorSearch
              existingCollaborators={collaborators}
              getCollaborator={(user) => {
                addCollaborator(user);
              }}
            >
              <Button type="button" className="text-sm mt-4">
                <Plus />
                Add Collaborators
              </Button>
            </CollaboratorSearch>
            <div className="mt-4">
              <span className="text-sm text-muted-foreground">
                Collaborators {collaborators.length || ""}
              </span>
              <ScrollArea
                className="
            h-[120px]
            overflow-y-scroll
            w-full
            rounded-md
            border
            border-muted-foreground/20"
              >
                {collaborators.length ? (
                  collaborators.map((c) => (
                    <div
                      className="p-4 flex
                      justify-between
                      items-center
                "
                      key={c.id}
                    >
                      <div className="flex gap-4 items-center">
                        <Avatar>
                          <AvatarImage src="/avatars/7.png" />
                          <AvatarFallback>PJ</AvatarFallback>
                        </Avatar>
                        <div
                          className="text-sm 
                          gap-2
                          text-muted-foreground
                          overflow-hidden
                          overflow-ellipsis
                          sm:w-[300px]
                          w-[140px]
                        "
                        >
                          {c.email}
                        </div>
                      </div>
                      <Button
                        variant="secondary"
                        onClick={() => removeCollaborator(c)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))
                ) : (
                  <div
                    className="absolute
                  right-0 left-0
                  top-0
                  bottom-0
                  flex
                  justify-center
                  items-center
                "
                  >
                    <span className="text-muted-foreground text-sm">
                      You have no collaborators
                    </span>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        )}
        <Alert variant={"destructive"}>
          <AlertDescription>
            Warning! deleting you workspace will permanantly delete all data
            related to this workspace.
          </AlertDescription>
          <Button
            type="submit"
            size={"sm"}
            variant={"destructive"}
            className="mt-4 
            text-sm
            bg-destructive/40 
            border-2 
            border-destructive"
            onClick={async () => {
              if (!workspaceId) return;
              await deleteWorkspace(workspaceId);
              toast({ title: "Successfully deleted your workspae" });
              dispatch({ type: "DELETE_WORKSPACE", payload: workspaceId });
              router.replace("/dashboard");
            }}
          >
            Delete Workspace
          </Button>
        </Alert>
        <p className="flex items-center gap-2 mt-6">
          <UserIcon size={20} /> Profile
        </p>
        <Separator />
        <div className="flex items-center">
          <Avatar>
            <AvatarImage src={""} />
            <AvatarFallback>
              <CypressProfileIcon />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col ml-6">
            <small className="text-muted-foreground cursor-not-allowed">
              {user ? user.email : ""}
            </small>
            <Label
              htmlFor="profilePicture"
              className="text-sm text-muted-foreground"
            >
              Profile Picture
            </Label>
            <Input
              name="profilePicture"
              type="file"
              accept="image/*"
              placeholder="Profile Picture"
              // onChange={onChangeProfilePicture}
              disabled={uploadingProfilePic}
            />
          </div>
        </div>
        <LogoutButton>
          <div className="flex items-center">
            <LogOut />
          </div>
        </LogoutButton>
        <p className="flex items-center gap-2 mt-6">
          <CreditCard size={20} /> Billing & Plan
        </p>
        <Separator />
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
            <div>
              <p className="font-medium">
                Current Plan: {subscription?.status === "active" ? "Pro" : "Free"}
              </p>
              <p className="text-sm text-muted-foreground">
                {subscription?.status === "active" 
                  ? "You have access to all premium features" 
                  : "Upgrade to unlock unlimited workspaces, custom logos, and more!"
                }
              </p>
            </div>
            {subscription?.status === "active" ? (
              <Crown className="h-5 w-5 text-yellow-500" />
            ) : (
              <Button size="sm" onClick={() => setOpen(true)}>
                Upgrade Now
              </Button>
            )}
          </div>
          
          {subscription?.status !== "active" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
              <div className="space-y-2">
                <h4 className="font-medium">Free Plan</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Limited workspaces</li>
                  <li>• Basic features</li>
                  <li>• Community support</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  Pro Plan
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Unlimited workspaces</li>
                  <li>• Custom logos</li>
                  <li>• Priority support</li>
                </ul>
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <Link
              href="/"
              target="_blank"
              className="text-muted-foreground flex flex-row items-center gap-2 text-sm"
            >
              View Plans <ExternalLink size={16} />
            </Link>
            {subscription?.status === "active" && (
              <Button
                type="button"
                size="sm"
                variant={"outline"}
                disabled={loadingPortal}
                className="text-sm"
                onClick={redirectToCustomerPortal}
              >
                Manage Subscription
              </Button>
            )}
          </div>
        </div>
      </>
      <AlertDialog open={openAlertMessage}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDescription>
              Changing a Shared workspace to a Private workspace will remove all
              collaborators permanantly.
            </AlertDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOpenAlertMessage(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={onClickAlertConfirm}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SettingsForm;
