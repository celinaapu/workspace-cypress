"use client";
import React, { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { uploadWorkspaceLogo } from "@/lib/server-actions/file-upload-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import EmojiPicker from "../global/emoji-picker";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Subscription, Workspace } from "@/lib/mongoose/types";
import { Button } from "../ui/button";
import Loader from "../global/Loader";
import { createWorkspace } from "@/lib/mongoose/queries";
import { useToast } from "../ui/use-toast";
import { useRouter } from "next/navigation";
import { useAppState } from "@/lib/providers/state-provider";
import { CreateWorkspaceFormSchema } from "@/lib/types";
import { z } from "zod";
import { useSubscriptionModal } from "@/lib/providers/subscription-modal-provider";
import { Crown } from "lucide-react";

interface DashboardSetupProps {
  user: { id: string; email: string | null; name?: string | null; image?: string | null; };
  subscription: Subscription | null;
}

const DashboardSetup: React.FC<DashboardSetupProps> = ({ subscription, user }) => {
  const { toast } = useToast();
  const router = useRouter();
  const { dispatch } = useAppState();
  const { setOpen } = useSubscriptionModal();
  const [selectedEmoji, setSelectedEmoji] = useState("💼");

  // Add safety check - if no user, show error
  React.useEffect(() => {
    if (!user || !user.id) {
      console.error("DashboardSetup: No valid user provided", user);
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: "No valid session found. Please log out and log back in.",
      });
    }
  }, [user, toast]);

  const { register, handleSubmit, reset, formState: { isSubmitting: isLoading, errors } } = 
    useForm<z.infer<typeof CreateWorkspaceFormSchema>>({
      mode: "onChange",
      defaultValues: { logo: "", workspaceName: "" },
    });

  const onSubmit: SubmitHandler<z.infer<typeof CreateWorkspaceFormSchema>> = async (value) => {
    console.log("DashboardSetup - User object:", user);
    console.log("DashboardSetup - User ID:", user?.id);
    
    // 1. Session check to prevent "workspaceOwner required" error
    if (!user?.id) {
      console.error("Authentication Error: User ID is missing");
      toast({ 
        variant: "destructive", 
        title: "Authentication Error", 
        description: "Session not found. Please try logging out and back in." 
      });
      return;
    }

    let filePath = null;
    const file = value.logo?.[0];
    
    if (file) {
      const formData = new FormData();
      formData.append("logo", file);
      formData.append("workspaceId", user.id);
      const result = await uploadWorkspaceLogo(formData);
      if (result.success) filePath = result.url;
    }

    try {
      const { data, error } = await createWorkspace({
        workspaceOwner: user.id,
        title: value.workspaceName,
        iconId: selectedEmoji,
        logo: filePath,
        data: null,
        bannerUrl: "",
      });

      if (error || !data) throw new Error(error);

      dispatch({
        type: "ADD_WORKSPACE",
        payload: { ...data, folders: [] },
      });

      toast({ title: "Success!", description: "Workspace created." });
      router.replace(`/dashboard/${data._id}`);
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create workspace." });
    }
  };

  return (
    <Card className="w-[800px] h-screen sm:h-auto">
      <CardHeader>
        <CardTitle>Create A Workspace</CardTitle>
        <CardDescription>Setup your environment to get started.</CardDescription>
      </CardHeader>
      <CardContent>
        {subscription?.status !== "active" && (
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="h-5 w-5 text-yellow-500" />
                <div>
                  <h4 className="font-medium text-sm">Upgrade to Pro</h4>
                  <p className="text-xs text-muted-foreground">Unlock unlimited workspaces, custom logos, and more!</p>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
                Upgrade Now
              </Button>
            </div>
          </div>
        )}
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              <EmojiPicker getValue={setSelectedEmoji}>{selectedEmoji}</EmojiPicker>
              <div className="w-full">
                <Label>Name</Label>
                <Input {...register("workspaceName", { required: "Name is required" })} />
                <small className="text-red-600">{errors.workspaceName?.message?.toString()}</small>
              </div>
            </div>
            <div>
              <Label>Logo</Label>
              <Input type="file" {...register("logo")} disabled={subscription?.status !== "active"} />
              <small className="text-red-600">{errors.logo?.message?.toString()}</small>
              {subscription?.status !== "active" && (
                <small className="text-muted-foreground">
                  Upgrade to Pro to upload custom workspace logos
                </small>
              )}
            </div>
            <Button disabled={isLoading} type="submit" className="self-end">
              {isLoading ? <Loader /> : "Create Workspace"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default DashboardSetup;