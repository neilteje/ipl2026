import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { UserProvider } from "@/lib/user-context";
import { UserNameGate } from "@/components/UserNameGate";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "IPL Parlay 2026 | Friends League",
  description:
    "Build IPL 2026 cricket parlays with friends — match lines, season leaderboard, and match chat. Mar 28 – May 31, 2026.",
};

export const viewport: Viewport = {
  themeColor: "#111318",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`dark ${sans.variable}`}>
      <body className={`min-h-screen font-sans antialiased ${sans.className}`}>
        <UserProvider>
          <div className="min-h-screen app-backdrop">
            <div className="relative z-10">
              <UserNameGate>{children}</UserNameGate>
            </div>
          </div>
          <Toaster />
        </UserProvider>
      </body>
    </html>
  );
}
