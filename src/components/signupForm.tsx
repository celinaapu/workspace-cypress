'use client';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { zodResolver } from '@hookform/resolvers/zod';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import Logo from '../../public/cypresslogo.svg';
import Loader from '@/components/global/Loader';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { MailCheck } from 'lucide-react';
import { actionSignUpUser } from '@/lib/server-actions/auth-actions';
import { signIn } from 'next-auth/react';

const SignUpFormSchema = z
  .object({
    email: z.string().min(1, 'Email is required').email({ message: 'Invalid Email' }),
    password: z
      .string()
      .min(1, 'Password is required')
      .min(6, 'Password must be minimum 6 characters'),
    confirmPassword: z
      .string()
      .min(1, 'Confirm Password is required')
      .min(6, 'Password must be minimum 6 characters'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ['confirmPassword'],
  });

type SignUpFormValues = z.infer<typeof SignUpFormSchema>;

export default function SignupForm() {
  const router = useRouter();
  const [submitError, setSubmitError] = useState('');
  const [confirmation, setConfirmation] = useState(false);

  const form = useForm<SignUpFormValues>({
    mode: 'onChange',
    resolver: zodResolver(SignUpFormSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' },
  });

  const isLoading = form.formState.isSubmitting;

const syncAutofill = () => {
  const emailEl = document.querySelector<HTMLInputElement>('input[name="email"]');
  const passwordEl = document.querySelector<HTMLInputElement>('input[name="password"]');
  const confirmEl = document.querySelector<HTMLInputElement>('input[name="confirmPassword"]');

  if (emailEl?.value) form.setValue('email', emailEl.value, { shouldValidate: true });
  if (passwordEl?.value) form.setValue('password', passwordEl.value, { shouldValidate: true });
  if (confirmEl?.value) form.setValue('confirmPassword', confirmEl.value, { shouldValidate: true });
};

const onSubmit = async (values: SignUpFormValues) => {
  const emailEl = document.querySelector<HTMLInputElement>('input[name="email"]');
  const passwordEl = document.querySelector<HTMLInputElement>('input[name="password"]');

  const email = values.email || emailEl?.value || '';
  const password = values.password || passwordEl?.value || '';

  console.log('Submitting:', { email, hasPassword: !!password });

  const result = await actionSignUpUser({ email, password });

if (result?.error) {
  setSubmitError(result.error.message);
  return;
}

  // Auto-login after successful signup
  try {
    const signInResult = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (signInResult?.error) {
      setSubmitError("Account created but login failed. Please try logging in manually.");
      setTimeout(() => router.push('/login'), 2000);
      return;
    }

    setConfirmation(true);
    setTimeout(() => router.replace('/dashboard'), 2000);
  } catch (error) {
    console.error("Auto-login error:", error);
    setSubmitError("Account created but login failed. Please try logging in manually.");
    setTimeout(() => router.push('/login'), 2000);
  }
};

  if (confirmation) {
    return (
      <Alert className="w-full sm:w-[400px]">
        <MailCheck className="h-4 w-4" />
        <AlertTitle>Success!</AlertTitle>
        <AlertDescription>
          Account created successfully. Redirecting to dashboard...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        onFocus={syncAutofill}
        onChange={() => { if (submitError) setSubmitError(''); }}
        className="w-full sm:justify-center sm:w-[400px] space-y-6 flex flex-col"
      >
        <Link href="/" className="w-full flex justify-left items-center">
          <Image src={Logo} alt="cypress Logo" width={50} height={50} />
          <span className="font-semibold dark:text-white text-4xl ml-2">
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

        <FormField
          disabled={isLoading}
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <PasswordInput placeholder="Confirm Password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full p-6" disabled={isLoading}>
          {!isLoading ? 'Create Account' : <Loader />}
        </Button>

        {submitError && (
          <div className="text-red-500 text-sm bg-red-500/10 p-3 rounded-md border border-red-500/50">
            {submitError}
          </div>
        )}

        <span className="self-center">
          Already have an account?{' '}
          <Link href="/login" className="text-primary hover:underline">
            Login
          </Link>
        </span>
      </form>
    </Form>
  );
}