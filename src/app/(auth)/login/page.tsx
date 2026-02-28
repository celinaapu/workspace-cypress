"use client";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormSchema } from "@/lib/types";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import Link from "next/link";
import Image from "next/image";
import Logo from "../../../../public/cypresslogo.svg";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import Loader from "@/components/global/Loader";
import { Separator } from "@/components/ui/separator";
import { signIn } from "next-auth/react";

const LoginPage = () => {
  const router = useRouter();
  const [submitError, setSubmitError] = useState("");

  const form = useForm<z.infer<typeof FormSchema>>({
    mode: "onBlur",
    resolver: zodResolver(FormSchema),
    defaultValues: { email: "", password: "" },
  });

  const isLoading = form.formState.isSubmitting;

  const syncAutofill = () => {
    const emailEl = document.querySelector<HTMLInputElement>('input[name="email"]');
    const passwordEl = document.querySelector<HTMLInputElement>('input[name="password"]');

    if (emailEl?.value) form.setValue("email", emailEl.value, { shouldValidate: true });
    if (passwordEl?.value) form.setValue("password", passwordEl.value, { shouldValidate: true });
  };

  const onSubmit: SubmitHandler<z.infer<typeof FormSchema>> = async (values) => {
    const emailEl = document.querySelector<HTMLInputElement>('input[name="email"]');
    const passwordEl = document.querySelector<HTMLInputElement>('input[name="password"]');

    const email = values.email || emailEl?.value || "";
    const password = values.password || passwordEl?.value || "";

    console.log("Submitting login form:", { email, hasPassword: !!password });

    if (!email || !password) {
      setSubmitError("Email and password are required");
      return;
    }

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });

      console.log("signIn result:", res);

      if (!res || res.error) {
        setSubmitError("Invalid credentials");
        form.reset();
        return;
      }

      console.log("Login successful, redirecting to dashboard");
      router.push("/dashboard");
    } catch (error) {
      console.error("Login error:", error);
      setSubmitError("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <Form {...form}>
      <form
        onFocus={syncAutofill}
        onChange={() => { if (submitError) setSubmitError(""); }}
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full sm:justify-center sm:w-[400px] space-y-6 flex flex-col"
      >
        <Link href="/" className="w-full flex justify-left items-center">
          <Image src={Logo} alt="cypress Logo" width={50} height={50} />
          <span className="font-semibold dark:text-white text-4xl first-letter:ml-2">
            cypress.
          </span>
        </Link>

        <FormDescription className="text-foreground/60">
          An all-In-One Collaboration and Productivity Platform
        </FormDescription>

        <FormField
          disabled={isLoading}
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input type="email" placeholder="Email" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          disabled={isLoading}
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <PasswordInput placeholder="Password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {submitError && (
          <div className="text-red-500 text-sm bg-red-50 p-3 rounded-md border border-red-200">
            {submitError}
          </div>
        )}

        <Button type="submit" className="w-full p-6" size="lg" disabled={isLoading}>
          {!isLoading ? "Login" : <Loader />}
        </Button>

        <Separator className="my-4" />

        <span className="self-center">
          Dont have an account?{" "}
          <Link href="/signup" className="text-primary">
            Sign Up
          </Link>
        </span>
      </form>
    </Form>
  );
};

export default LoginPage;