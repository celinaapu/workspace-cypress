"use client";
import { useUser } from "@/lib/providers/user-provider";
import React, { useEffect, useRef, useState } from "react";
import { User } from "@/lib/mongoose/types";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Search } from "lucide-react";
import { Input } from "../ui/input";
import { ScrollArea } from "../ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Button } from "../ui/button";
import { getUsersFromSearch } from "@/lib/mongoose/queries";

interface CollaboratorSearchProps {
  existingCollaborators: User[] | [];
  getCollaborator: (collaborator: User) => void;
  children: React.ReactNode;
}

const CollaboratorSearch: React.FC<CollaboratorSearchProps> = ({
  children,
  existingCollaborators,
  getCollaborator,
}) => {
  const { user } = useUser();
  const [searchResults, setSearchResults] = useState<User[] | []>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const onChangeHandler = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const value = e.target.value;
    if (!value) return setSearchResults([]);

    timerRef.current = setTimeout(async () => {
      // res is coming from your MongoDB 'find' query
      const res = await getUsersFromSearch(value);
      setSearchResults(res);
    }, 450);
  };

  const addCollaborator = (user: User) => {
    getCollaborator(user);
  };

  return (
    <Sheet>
      <SheetTrigger className="w-full text-left">{children}</SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>Search Collaborator</SheetTitle>
          <SheetDescription>
            <span className="text-sm text-muted-foreground">
              You can also remove collaborators after adding them from the
              settings tab.
            </span>
          </SheetDescription>
        </SheetHeader>
        <div className="flex justify-center items-center gap-2 mt-2">
          <Search />
          <Input
            name="name"
            className="dark:bg-background"
            placeholder="Email"
            onChange={onChangeHandler}
          />
        </div>
        <ScrollArea className="mt-6 overflow-y-auto w-full rounded-md h-[calc(100vh-200px)]">
          {searchResults
            .filter(
              (result) =>
                !existingCollaborators.some(
                  // FIX: Use _id for MongoDB documents
                  (existing) => existing._id === result._id,
                ),
            )
            // FIX: Use user?._id (MongoDB User)
            .filter((result) => result._id !== user?._id)
            .map((user) => (
              <div
                key={user._id} // FIX: Use _id
                className="p-4 flex justify-between items-center"
              >
                <div className="flex gap-4 items-center">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.avatar_url || "/avatars/7.png"} />
                    <AvatarFallback>
                      {user.email?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-sm gap-2 overflow-hidden overflow-ellipsis w-[180px] text-muted-foreground">
                    {user.email}
                  </div>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => addCollaborator(user)}
                >
                  Add
                </Button>
              </div>
            ))}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
};

export default CollaboratorSearch;
