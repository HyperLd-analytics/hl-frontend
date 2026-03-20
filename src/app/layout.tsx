import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";

export const metadata: Metadata = {
  title: "Hyperliquid Lens",
  description: "Hyperliquid 链上数据分析 SaaS 平台"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN" className="dark">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
