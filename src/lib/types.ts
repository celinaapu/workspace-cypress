import { z } from 'zod';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type PricingPlanInterval = "day" | "week" | "month" | "year";
export type PricingType = "one_time" | "recurring";
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "canceled"
  | "incomplete"
  | "incomplete_expired"
  | "past_due"
  | "unpaid";

export interface User {
  _id: string; // MongoDB uses _id
  id: string; // Often mapped for frontend consistency
  email: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  billing_address?: Json;
  payment_method?: Json;
  updated_at?: string;
}

export interface Workspace {
  _id: string;
  id: string; // Mapped for frontend consistency
  createdAt: string;
  workspaceOwner: string;
  title: string;
  iconId: string;
  data?: string | null;
  inTrash?: string | null;
  logo?: string | null;
  bannerUrl?: string | null;
}

export interface Folder {
  _id: string;
  id: string; // Mapped for frontend consistency
  workspaceId: string;
  createdAt: string;
  title: string;
  iconId: string;
  data?: string | null;
  inTrash?: string | null;
  bannerUrl?: string | null;
}

export interface File {
  _id: string;
  id: string; // Mapped for frontend consistency
  workspaceId: string;
  folderId: string;
  createdAt: string;
  title: string;
  iconId: string;
  data?: string | null;
  inTrash?: string | null;
  bannerUrl?: string | null;
}

export interface Product {
  _id: string;
  active?: boolean;
  name?: string;
  description?: string;
  image?: string;
  metadata?: Json;
}

export interface Price {
  _id: string;
  productId?: string;
  active?: boolean;
  description?: string;
  unitAmount?: number;
  currency?: string;
  type?: PricingType;
  interval?: PricingPlanInterval;
  intervalCount?: number;
  trialPeriodDays?: number | null;
  metadata?: Json;
  products?: Product;
}

export interface Subscription {
  _id: string;
  userId: string;
  status?: SubscriptionStatus;
  metadata?: Json;
  priceId?: string;
  quantity?: number;
  cancelAtPeriodEnd?: boolean;
  created: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  endedAt?: string;
  cancelAt?: string;
  canceledAt?: string;
  trialStart?: string;
  trialEnd?: string;
  prices?: Price;
}

export interface Collaborator {
  _id: string;
  workspaceId: string;
  userId: string;
  createdAt: string;
}

// Helper Types for components
export type ProductWithPrice = Product & {
  prices?: Price[];
};

// Auth Form Schema
export const FormSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z.string().min(1, 'Password is required').min(6, 'Password must be at least 6 characters'),
});

// Workspace Creation Form Schema
export const CreateWorkspaceFormSchema = z.object({
  logo: z.any().optional(),
  workspaceName: z.string().min(1, 'Workspace name is required'),
});

// Banner Upload Form Schema
export const UploadBannerFormSchema = z.object({
  banner: z.any().optional(),
});
