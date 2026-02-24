export const dynamic = "force-dynamic";

import React from "react";
import QuillEditor from "@/components/quill-editor/quill-editor";
import { getFile } from "@/lib/mongoose/queries";
import { redirect } from "next/navigation";

const File = async ({ params }: { params: { fileId: string } }) => {
  const { data, error } = await getFile(params.fileId);
  if (error || !data.length) redirect("/dashboard");

  return (
    <div className="relative ">
      <QuillEditor
        dirType="file"
        fileId={params.fileId}
        dirDetails={data[0] || {}}
      />
    </div>
  );
};

export default File;
