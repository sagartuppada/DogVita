"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Root → /dashboard (the main CRM view). Auth guard lives on the (app) layout.
export default function RootPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);
  return null;
}
