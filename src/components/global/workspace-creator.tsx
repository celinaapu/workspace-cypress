"use client";
import { useUser } from "@/lib/providers/user-provider";
import { User, Workspace } from "@/lib/mongoose/types";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from "@/components/ui/select";
import { Lock, Plus, Share } from "lucide-react";
import { Button } from "../ui/button";
import { v4 } from "uuid";
import { addCollaborators, createWorkspace } from "@/lib/mongoose/queries";
import CollaboratorSearch from "./collaborator-search";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useToast } from "../ui/use-toast";

const WorkspaceCreator = () => {
  const { user } = useUser();
  const { toast } = useToast();
  const router = useRouter();
  const [permissions, setPermissions] = useState("private");
  const [title, setTitle] = useState("");
  const [collaborators, setCollaborators] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const createItem = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    
    // Using a v4 UUID for the workspace ID to maintain consistency before DB insertion
    const workspaceId = v4();

    try {
      const newWorkspace: Partial<Workspace> = {
        _id: workspaceId,
        title,
        workspaceOwner: user.id,
        iconId: "💼",
        createdAt: new Date().toISOString(),
        logo: null,
        bannerUrl: "",
        data: null
      };

      const { data, error } = await createWorkspace(newWorkspace);
      if (error) throw new Error(error);

      if (permissions === "shared" && collaborators.length > 0) {
        await addCollaborators(collaborators, workspaceId);
      }

      toast({ title: "Success", description: "Workspace created successfully." });
      setTitle("");
      router.refresh();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Could not create workspace." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex gap-4 flex-col">
      <div>
        <Label className="text-sm text-muted-foreground">Name</Label>
        <Input placeholder="Workspace Name" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      
      <Label className="text-sm text-muted-foreground">Permission</Label>
      <Select onValueChange={setPermissions} defaultValue={permissions}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem value="private"><div className="flex gap-4 items-center"><Lock /> Private</div></SelectItem>
            <SelectItem value="shared"><div className="flex gap-4 items-center"><Share /> Shared</div></SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>

      {permissions === "shared" && (
        <div className="flex flex-col gap-2">
          <CollaboratorSearch existingCollaborators={collaborators} getCollaborator={(u) => setCollaborators([...collaborators, u])}>
            <Button type="button" className="text-sm mt-4"><Plus className="mr-2 h-4 w-4" /> Add Collaborators</Button>
          </CollaboratorSearch>
          <ScrollArea className="h-[120px] rounded-md border p-2">
            {collaborators.map((c) => (
              <div key={c._id} className="flex justify-between items-center p-2">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8"><AvatarImage src={c.avatar_url || undefined} /><AvatarFallback>US</AvatarFallback></Avatar>
                  <span className="text-sm">{c.email}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setCollaborators(collaborators.filter(col => col._id !== c._id))}>Remove</Button>
              </div>
            ))}
          </ScrollArea>
        </div>
      )}
      
      <Button disabled={!title || (permissions === "shared" && collaborators.length === 0) || isLoading} onClick={createItem}>
        {isLoading ? "Creating..." : "Create Workspace"}
      </Button>
    </div>
  );
};

export default WorkspaceCreator;