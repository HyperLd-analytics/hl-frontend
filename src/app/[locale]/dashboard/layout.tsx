"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { apiFetch } from "@/lib/api";

interface UserInfo {
  id: string;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
}

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    apiFetch<UserInfo>({ path: "/auth/me" })
      .then(setUser)
      .catch(() => undefined);
  }, []);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        username={user?.username}
        userId={user?.id}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
