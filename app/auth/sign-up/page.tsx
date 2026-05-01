import { SignUpForm } from "../../../components/auth/SignUpForm";
import Link from "next/link";

export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-160px)] w-full max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-ink-900">Create your CalRent account</h1>
      <p className="mt-2 text-sm text-ink-500">
        Whether you are a renter or a provider, one account works for both.
      </p>
      <div className="mt-8">
        <SignUpForm />
      </div>
      <p className="mt-6 text-sm text-ink-500">
        Already on CalRent?{" "}
        <Link href="/auth/sign-in" className="font-semibold text-ink-900 underline-offset-4 hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
