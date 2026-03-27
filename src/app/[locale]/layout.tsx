import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ToastProvider } from "@/components/providers/toast-provider";

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextIntlClientProvider>
      <ToastProvider>{children}</ToastProvider>
    </NextIntlClientProvider>
  );
}

export async function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
