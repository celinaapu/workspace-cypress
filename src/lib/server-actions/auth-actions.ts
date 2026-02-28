"use server";

import connectDB from "@/lib/mongoose/db";
import { User } from "@/lib/mongoose/schema";
import bcrypt from "bcryptjs";
import { z } from "zod";

const FormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function actionLoginUser({
  email,
  password,
}: z.infer<typeof FormSchema>) {
  try {
    await connectDB();

    const user = await User.findOne({ email });
    if (!user) {
      return { error: { message: "Invalid credentials", code: "401" } };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return { error: { message: "Invalid credentials", code: "401" } };
    }

    return { success: true };
  } catch (error: any) {
    console.error("❌ Login Action Error:", error.message || error);
    return { error: { message: "Internal Server Error", code: "500" } };
  }
}

export async function actionSignUpUser({
  email,
  password,
}: z.infer<typeof FormSchema>) {
  try {
    console.log("🚀 actionSignUpUser triggered:", {
      email,
      password: password ? "***" : "UNDEFINED",
    });

    if (!email || !password) {
      return {
        error: { message: "Email and password are required", code: "400" },
      };
    }

    await connectDB();

    const userExists = await User.findOne({ email });
    if (userExists) {
      return { error: { message: "User already exists", code: "409" } };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await User.create({ email, password: hashedPassword });

    console.log("✅ User created successfully in MongoDB");
    return { success: true };
  } catch (error: any) {
    console.error("💥 Critical Error in actionSignUpUser:", {
      message: error.message,
      stack: error.stack,
    });
    return {
      error: {
        message: error.message || "Internal Server Error",
        code: "500",
      },
    };
  }
}