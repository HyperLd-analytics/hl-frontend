"use client";

import { Bell, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { clearAccessTokenCookie } from "@/lib/auth";

export function Header() {
  const router = useRouter();

  const onLogout = () => {
    clearAccessTokenCookie();
    router.push("/login");
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
        <Avatar>
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
      </div>
    </header>
  );
}
