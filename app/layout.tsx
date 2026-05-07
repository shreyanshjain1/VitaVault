import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "VitaVault | Personal Health Record Platform",
    template: "%s | VitaVault",
  },
  description:
    "VitaVault is a full-stack personal health record and care-coordination platform with records, care workflows, reports, device APIs, AI insight foundations, and admin operations.",
  applicationName: "VitaVault",
  keywords: [
    "VitaVault",
    "personal health record",
    "health tech",
    "Next.js",
    "Prisma",
    "PostgreSQL",
    "care coordination",
    "medical records",
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}<Toaster /></Providers>
      </body>
    </html>
  );
}
