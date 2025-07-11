"use client";

import NextAuthSessionProvider from "./SessionProvider";
import ToastProvider from "./ToastProvider";
import { ToastProvider as ShadcnToastProvider, Toaster } from "./ui/use-toast";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NextAuthSessionProvider>
      <ShadcnToastProvider>
        <ToastProvider />
        {children}
        <Toaster />
      </ShadcnToastProvider>
    </NextAuthSessionProvider>
  );
}
