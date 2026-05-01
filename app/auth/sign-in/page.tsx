import { SignInForm } from "../../../components/auth/SignInForm";
import Link from "next/link";
import { Suspense } from "react";

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-160px)] w-full max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-ink-900">Welcome back</h1>
      <p className="mt-2 text-sm text-ink-500">
        Sign in with your email to manage listings, contact owners, and shortlist homes.
      </p>
      <div className="mt-8">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-ink-100 bg-ink-50 p-4 text-sm text-ink-600">
              Loading sign-in form...
            </div>
          }
        >
          <SignInForm />
        </Suspense>
      </div>
      <p className="mt-6 text-sm text-ink-500">
        New to CalRent?{" "}
        <Link href="/auth/sign-up" className="font-semibold text-ink-900 underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </main>
  );
}
