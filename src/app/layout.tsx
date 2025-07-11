import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import NextAuthSessionProvider from "../components/SessionProvider";
import ToastProvider from "../components/ToastProvider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Skymirror LMS",
  description: "A modern learning management system with blockchain certificates",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <NextAuthSessionProvider>
          <ToastProvider />
          {children}
        </NextAuthSessionProvider>
      </body>
    </html>
  );
}
