"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";

export default function CompleteSignInPage() {
  const { completeEmailLinkSignIn } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<"working" | "error">("working");

  useEffect(() => {
    completeEmailLinkSignIn()
      .then((success) => {
        if (success) {
          router.push("/");
        } else {
          setStatus("error");
        }
      })
      .catch(() => setStatus("error"));
  }, []);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-5 text-center">
      {status === "working" ? (
        <p className="text-sm text-[#8A93A3]">Signing you in...</p>
      ) : (
        <div>
          <p className="text-sm text-[#EDEFF2] mb-2">Something went wrong completing sign-in.</p>
          <p className="text-xs text-[#8A93A3]">
            Try requesting a new link from the{" "}
            <a href="/sign-in" className="text-[#FFB020]">
              sign-in page
            </a>
            .
          </p>
        </div>
      )}
    </div>
  );
}