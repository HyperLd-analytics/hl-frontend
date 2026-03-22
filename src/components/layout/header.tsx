"use client";

import { Bell, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { clearAccessTokenCookie } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

interface UserInfo {
  id: string;
  email: string | null;
  username: string | null;
  avatar_url: string | null;
  is_staff: boolean;
  is_active: boolean;
}

export function Header() {
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await apiFetch<UserInfo>({ path: "/auth/me" });
        setUser(data);
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      }
    };
    fetchUser();
  }, []);

  const onLogout = () => {
    clearAccessTokenCookie();
    router.push("/login");
  };

  const getUserInitial = () => {
    if (user?.username) return user.username[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return "U";
  };

  return (
    <header className="flex h-14 items-center justify-end border-b border-border bg-card px-4 md:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" aria-label="通知">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="sm" aria-label="退出登录" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <Avatar>
            <AvatarFallback>{getUserInitial()}</AvatarFallback>
          </Avatar>
          {user?.email && (
            <span className="text-sm text-muted-foreground hidden md:inline">
              {user.email}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
