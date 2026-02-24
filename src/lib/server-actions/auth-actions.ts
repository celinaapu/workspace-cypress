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

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return { error: { message: "Invalid credentials", code: "401" } };
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return { error: { message: "Invalid credentials", code: "401" } };
    }

    return { success: true };
  } catch (error) {
    return { error: { message: "Internal Server Error", code: "500" } };
  }
}

export async function actionSignUpUser({
  email,
  password,
}: z.infer<typeof FormSchema>) {
  try {
    await connectDB();

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return { error: { message: "User already exists", code: "409" } };
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      email,
      password: hashedPassword,
    });

    return { success: true };
  } catch (error) {
    return { error: { message: "Internal Server Error", code: "500" } };
  }
}
