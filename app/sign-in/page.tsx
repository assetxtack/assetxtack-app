"use client";

import { useState } from "react";
import { useAuth } from "../context/AuthContext";

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
    </svg>
  );
}

export default function SignInPage() {
  const { signInWithGoogle, sendEmailLink } = useAuth();
  const [email, setEmail] = useState("");
  const [linkSent, setLinkSent] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleGoogle = async () => {
    setError("");
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || "Google sign-in failed. Try again.");
    }
  };

  const handleEmailLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email) return;
    setSubmitting(true);
    try {
      await sendEmailLink(email);
      setLinkSent(true);
    } catch (err: any) {
      setError(err.message || "Couldn't send the link. Check the email and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-5 py-16 bg-[#0B0E14]"> {/* Changed background to brand color */}
      <div className="w-full max-w-md"> {/* Slightly wider for better form structure */}
        <div className="text-center mb-10">
          <h1 className="font-[var(--font-display)] font-bold text-3xl text-[#EDEFF2] mb-3">
            Welcome to AssetXtack
          </h1>
          <p className="text-base text-[#8A93A3]">Sign in or create an account to buy and sell safely.</p>
        </div>

        <div className="bg-[#151922] border border-[#242938] rounded-2xl p-8 shadow-xl"> {/* Optimized container design */}
          <button
            onClick={handleGoogle}
            className="w-full flex items-center justify-center gap-3 rounded-lg py-3.5 text-sm font-semibold bg-white text-[#0B0E14] mb-6 hover:bg-gray-100 transition duration-150"
          >
            <GoogleIcon />
            Continue with Google
          </button>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-[#242938]" />
            <span className="text-xs font-medium text-[#8A93A3]">OR</span>
            <div className="flex-1 h-px bg-[#242938]" />
          </div>

          {linkSent ? (
            <div className="text-center py-6">
              <p className="text-base text-[#EDEFF2] font-semibold mb-2">Check your email</p>
              <p className="text-sm text-[#8A93A3]">
                We sent a sign-in link to <span className="text-[#FFB020] font-medium">{email}</span>. Open it on this
                device to finish signing in.
              </p>
            </div>
          ) : (
            <form onSubmit={handleEmailLink} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-xs font-medium text-[#8A93A3]">Email address</label>
                <input
                  id="email"
                  type="email"
                  required
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-lg px-4 py-3 text-sm bg-[#1B202B] border border-[#242938] text-[#EDEFF2] placeholder:text-[#5C6573] outline-none focus:border-[#FFB020] focus:ring-1 focus:ring-[#FFB020] transition duration-150"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg py-3.5 text-sm font-semibold bg-[#FFB020] text-[#0B0E14] disabled:opacity-60 hover:bg-[#F5A623] transition duration-150"
              >
                {submitting ? "Sending..." : "Continue with email"}
              </button>
            </form>
          )}

          {error && <p className="text-xs text-red-400 mt-4 text-center">{error}</p>}
        </div>

        <p className="text-center text-xs text-[#8A93A3] mt-8">
          No password needed — we'll email you a secure sign-in link.
        </p>
      </div>
    </div>
  );
}
