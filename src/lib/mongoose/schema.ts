import mongoose, { Schema, model, models } from "mongoose";

// --- USERS ---
const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true },
    full_name: { type: String },
    avatar_url: { type: String },
    password: { type: String, required: true },
    billing_address: { type: Schema.Types.Mixed },
    payment_method: { type: Schema.Types.Mixed },
    stripeCustomerId: { type: String },
  },
  { timestamps: true },
);

// --- WORKSPACES ---
const WorkspaceSchema = new Schema(
  {
    workspaceOwner: { type: String, required: true },
    title: { type: String, required: true },
    iconId: { type: String, required: true },
    data: { type: String },
    inTrash: { type: String },
    logo: { type: String },
    bannerUrl: { type: String },
  },
  { timestamps: true },
);

// --- FOLDERS ---
const FolderSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    title: { type: String, required: true },
    iconId: { type: String, required: true },
    data: { type: String },
    inTrash: { type: String },
    bannerUrl: { type: String },
  },
  { timestamps: true },
);

// --- FILES ---
const FileSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    folderId: { type: Schema.Types.ObjectId, ref: "Folder", required: true },
    title: { type: String, required: true },
    iconId: { type: String, required: true },
    data: { type: String },
    inTrash: { type: String },
    bannerUrl: { type: String },
  },
  { timestamps: true },
);

// --- STRIPE PRODUCTS ---
const ProductSchema = new Schema(
  {
    active: { type: Boolean, default: false },
    name: { type: String },
    description: { type: String },
    image: { type: String },
    metadata: { type: Schema.Types.Mixed },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Virtual Populate for Prices - Bridges Product to Price collection
ProductSchema.virtual("prices", {
  ref: "Price",
  localField: "_id",
  foreignField: "productId",
});

// --- STRIPE PRICES ---
const PriceSchema = new Schema(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    active: { type: Boolean, default: false },
    description: { type: String },
    unitAmount: { type: Number },
    currency: { type: String },
    type: { type: String, enum: ["one_time", "recurring"] },
    interval: { type: String, enum: ["day", "week", "month", "year"] },
    intervalCount: { type: Number },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

// --- SUBSCRIPTIONS ---
const SubscriptionSchema = new Schema(
  {
    userId: { type: String, required: true, unique: true },
    status: {
      type: String,
      enum: [
        "trialing",
        "active",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "past_due",
        "unpaid",
      ],
    },
    metadata: { type: Schema.Types.Mixed },
    priceId: { type: String },
    quantity: { type: Number },
    cancelAtPeriodEnd: { type: Boolean },
    currentPeriodStart: { type: Date, default: Date.now },
    currentPeriodEnd: { type: Date },
    endedAt: { type: Date },
    cancelAt: { type: Date },
    canceledAt: { type: Date },
    trialStart: { type: Date },
    trialEnd: { type: Date },
  },
  { timestamps: true },
);

// --- COLLABORATORS ---
const CollaboratorSchema = new Schema(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
    },
    userId: { type: String, required: true },
  },
  { timestamps: true },
);

// --- EXPORT MODELS ---
export const User = models.User || model("User", UserSchema);
export const Workspace =
  models.Workspace || model("Workspace", WorkspaceSchema);
export const Folder = models.Folder || model("Folder", FolderSchema);
export const File = models.File || model("File", FileSchema);
export const Product = models.Product || model("Product", ProductSchema);
export const Price = models.Price || model("Price", PriceSchema);
export const Subscription =
  models.Subscription || model("Subscription", SubscriptionSchema);
export const Collaborator =
  models.Collaborator || model("Collaborator", CollaboratorSchema);
