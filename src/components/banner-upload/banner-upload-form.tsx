"use client";
import { useAppState } from "@/lib/providers/state-provider";
import { Workspace, Folder, File } from "@/lib/mongoose/types";
import { UploadBannerFormSchema } from "@/lib/types";
import { uploadBanner } from "@/lib/server-actions/file-upload-actions";
import React from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { z } from "zod";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import Loader from "../global/Loader";
import {
  updateWorkspace,
  updateFolder,
  updateFile,
} from "@/lib/mongoose/queries";
import { useToast } from "../ui/use-toast";

interface BannerUploadFormProps {
  dirType: "workspace" | "file" | "folder";
  id: string; // This is the MongoDB _id
}

const BannerUploadForm: React.FC<BannerUploadFormProps> = ({ dirType, id }) => {
  const { workspaceId, folderId, dispatch } = useAppState();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { isSubmitting: isUploading, errors },
  } = useForm<z.infer<typeof UploadBannerFormSchema>>({
    mode: "onChange",
    defaultValues: {
      banner: "",
    },
  });

  const onSubmitHandler: SubmitHandler<
    z.infer<typeof UploadBannerFormSchema>
  > = async (values) => {
    const file = values.banner?.[0];
    if (!file || !id) return;

    try {
      // Upload banner using local file system
      const formData = new FormData();
      formData.append('banner', file);
      formData.append('id', id);
      
      const uploadResult = await uploadBanner(formData);
      
      if (!uploadResult.success) {
        toast({
          variant: "destructive",
          title: "Upload Failed",
          description: uploadResult.error || "Failed to upload banner",
        });
        return;
      }
      
      const filePath = uploadResult.url;

      if (dirType === "file") {
        if (!workspaceId || !folderId) return;
        if (filePath) {
          // Update local State
          dispatch({
            type: "UPDATE_FILE",
            payload: {
              file: { bannerUrl: filePath },
              fileId: id,
              folderId,
              workspaceId,
            },
          });
          // Update MongoDB
          await updateFile({ bannerUrl: filePath }, id);
        }
      } else if (dirType === "folder") {
        if (!workspaceId) return;
        if (filePath) {
          dispatch({
            type: "UPDATE_FOLDER",
            payload: {
              folderId: id,
              folder: { bannerUrl: filePath },
              workspaceId,
            },
          });
          await updateFolder({ bannerUrl: filePath }, id);
        }
      } else if (dirType === "workspace") {
        if (!id) return;
        if (filePath) {
          dispatch({
            type: "UPDATE_WORKSPACE",
            payload: {
              workspace: { bannerUrl: filePath },
              workspaceId: id,
            },
          });
          await updateWorkspace({ bannerUrl: filePath }, id);
        }
      }
      
      toast({
        title: "Success!",
        description: "Banner uploaded successfully.",
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to upload banner.",
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmitHandler)}
      className="flex flex-col gap-2"
    >
      <Label className="text-sm text-muted-foreground" htmlFor="bannerImage">
        Banner Image
      </Label>
      <Input
        id="bannerImage"
        type="file"
        accept="image/*"
        disabled={isUploading}
        {...register("banner", { required: "Banner Image is required" })}
      />
      <small className="text-red-600">
        {errors.banner?.message?.toString()}
      </small>
      <Button disabled={isUploading} type="submit">
        {!isUploading ? "Upload Banner" : <Loader />}
      </Button>
    </form>
  );
};

export default BannerUploadForm;
