"use server";

import connectDB from "./db";
import {
  Workspace,
  Folder,
  File as FileModel,
  Subscription,
  Collaborator,
  User as UserModel,
  Product,
  Price,
} from "./schema";
import {
  File as FileInterface,
  Folder as FolderInterface,
  Workspace as WorkspaceInterface,
} from "@/lib/mongoose/types";

// Helper to ensure DB is connected
const startQuery = async () => await connectDB();

/**
 * USER QUERIES
 */
export const getUsersFromSearch = async (email: string) => {
  if (!email) return [];
  try {
    await startQuery();
    const foundUsers = await UserModel.find({
      email: { $regex: email, $options: "i" },
    }).limit(10);

    return JSON.parse(JSON.stringify(foundUsers));
  } catch (error) {
    console.error("🔴 Error searching users:", error);
    return [];
  }
};

/**
 * STRIPE / PRODUCT QUERIES
 */
export const getActiveProductsWithPrice = async () => {
  try {
    await startQuery();
    // Use populate to grab the virtual 'prices' field defined in schema.ts
    const res = await Product.find({ active: true })
      .populate({
        path: "prices",
        match: { active: true },
      })
      .sort({ metadata: 1 });

    // TEMPORARY: Add test data if no products exist
    if (!res || res.length === 0) {
      console.log("🟡 No products found, returning test data for demonstration");
      return {
        data: [
          {
            _id: "prod_test_pro",
            active: true,
            name: "Pro Plan",
            description: "Access to all pro features",
            metadata: { features: "unlimited_workspaces,unlimited_files,priority_support" },
            prices: [
              {
                _id: "price_test_monthly",
                productId: "prod_test_pro",
                active: true,
                unitAmount: 999,
                currency: "usd",
                type: "recurring",
                interval: "month",
                intervalCount: 1,
                description: "Pro Plan Monthly"
              },
              {
                _id: "price_test_yearly",
                productId: "prod_test_pro",
                active: true,
                unitAmount: 9999,
                currency: "usd",
                type: "recurring",
                interval: "year",
                intervalCount: 1,
                description: "Pro Plan Yearly"
              }
            ]
          }
        ],
        error: null,
      };
    }

    return {
      data: res ? JSON.parse(JSON.stringify(res)) : [],
      error: null,
    };
  } catch (error) {
    console.error("🔴 Error fetching products:", error);
    return { data: [], error: "Error fetching products" };
  }
};

// @/lib/mongoose/queries.ts

export const findUserByEmail = async (email: string) => {
  try {
    await startQuery();
    const user = await UserModel.findOne({ email });
    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    return null;
  }
};

export const getUserById = async (userId: string) => {
  try {
    await startQuery();
    const user = await UserModel.findById(userId);
    return JSON.parse(JSON.stringify(user));
  } catch (error) {
    return null;
  }
};

/**
 * FILE QUERIES
 */
export const updateFile = async (
  file: Partial<FileInterface>,
  fileId: string,
) => {
  try {
    await startQuery();
    await FileModel.findByIdAndUpdate(fileId, file, { new: true });
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: "Error updating file" };
  }
};

export const getFile = async (fileId: string) => {
  if (!fileId) return { data: [], error: "File ID is required" };
  try {
    await startQuery();
    const response = await FileModel.findById(fileId);
    return {
      data: response ? [JSON.parse(JSON.stringify(response))] : [],
      error: null,
    };
  } catch (error) {
    console.log("🔴 Error fetching file details", error);
    return { data: [], error: "Error" };
  }
};

export const createFile = async (fileData: any) => {
  try {
    await startQuery();
    const newFile = await FileModel.create(fileData);
    const fileObj = newFile.toObject();
    fileObj.id = fileObj._id.toString();
    return { data: JSON.parse(JSON.stringify(fileObj)), error: null };
  } catch (error) {
    return { data: null, error: "Error creating file" };
  }
};

/**
 * FOLDER QUERIES
 */
export const createFolder = async (folderData: any) => {
  try {
    await startQuery();
    const newFolder = await Folder.create(folderData);
    const folderObj = newFolder.toObject();
    folderObj.id = folderObj._id.toString();
    return { data: JSON.parse(JSON.stringify(folderObj)), error: null };
  } catch (error) {
    return { data: null, error: "Error creating folder" };
  }
};

export const updateFolder = async (
  folder: Partial<FolderInterface>,
  folderId: string,
) => {
  try {
    await startQuery();
    await Folder.findByIdAndUpdate(folderId, folder, { new: true });
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: "Error updating folder" };
  }
};

export const getFolderDetails = async (folderId: string) => {
  if (!folderId) return { data: [], error: "Folder ID is required" };
  try {
    await startQuery();
    const response = await Folder.findById(folderId);
    return {
      data: response ? [JSON.parse(JSON.stringify(response))] : [],
      error: null,
    };
  } catch (error) {
    return { data: [], error: "Error" };
  }
};

export const getFolders = async (workspaceId: string) => {
  try {
    await startQuery();
    const results = await Folder.find({ workspaceId }).sort({ createdAt: 1 });
    return { data: JSON.parse(JSON.stringify(results)), error: null };
  } catch (error) {
    return { data: null, error: "Error" };
  }
};

export const createWorkspace = async (workspaceData: any) => {
  try {
    await startQuery();
    
    const newWorkspace = await Workspace.create(workspaceData);
    
    const workspaceObj = newWorkspace.toObject();
    const serializedWorkspace = {
      ...JSON.parse(JSON.stringify(workspaceObj)),
      id: workspaceObj._id.toString(), 
    };

    return { data: serializedWorkspace, error: null };
  } catch (error: any) {
    console.error("🔴 Mongoose Create Workspace Error:", error.message || error);
    return { data: null, error: error.message || "Error creating workspace" };
  }
};

export const updateWorkspace = async (
  workspace: Partial<WorkspaceInterface>,
  workspaceId: string,
) => {
  try {
    await startQuery();
    await Workspace.findByIdAndUpdate(workspaceId, workspace, { new: true });
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: "Error" };
  }
};

export const deleteWorkspace = async (workspaceId: string) => {
  if (!workspaceId) return;
  await startQuery();
  await Folder.deleteMany({ workspaceId });
  await FileModel.deleteMany({ workspaceId });
  await Workspace.findByIdAndDelete(workspaceId);
};

export const getWorkspaceDetails = async (workspaceId: string) => {
  try {
    await startQuery();
    const response = await Workspace.findById(workspaceId);
    return {
      data: response ? [JSON.parse(JSON.stringify(response))] : [],
      error: null,
    };
  } catch (error) {
    return { data: [], error: "Error" };
  }
};

export const getPrivateWorkspaces = async (userId: string) => {
  if (!userId) return [];
  await startQuery();
  const allOwned = await Workspace.find({ workspaceOwner: userId });
  const privateWorkspaces = [];
  for (const ws of allOwned) {
    const hasCollaborators = await Collaborator.exists({ workspaceId: ws._id });
    if (!hasCollaborators) {
      const workspaceObj = ws.toObject();
      workspaceObj.id = workspaceObj._id.toString();
      privateWorkspaces.push(workspaceObj);
    }
  }
  return JSON.parse(JSON.stringify(privateWorkspaces));
};

export const getCollaboratingWorkspaces = async (userId: string) => {
  if (!userId) return [];
  await startQuery();
  const collaborations = await Collaborator.find({ userId }).populate(
    "workspaceId",
  );
  const workspaces = collaborations
    .map((col) => col.workspaceId)
    .filter(Boolean);
  return JSON.parse(JSON.stringify(workspaces));
};

export const addCollaborators = async (users: any[], workspaceId: string) => {
  await startQuery();
  const promises = users.map(async (user) => {
    const exists = await Collaborator.findOne({
      userId: user.id || user._id,
      workspaceId,
    });
    if (!exists) {
      return Collaborator.create({ userId: user.id || user._id, workspaceId });
    }
  });
  await Promise.all(promises);
};

/**
 * SUBSCRIPTION QUERIES
 */
export const getUserSubscriptionStatus = async (userId: string) => {
  try {
    await startQuery();
    const data = await Subscription.findOne({ userId });
    return {
      data: data ? JSON.parse(JSON.stringify(data)) : null,
      error: null,
    };
  } catch (error) {
    return { data: null, error: "Error" };
  }
};
