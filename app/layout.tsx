import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { LinkedInCredit } from "../components/layout/LinkedInCredit";
import { DiscoveryHomeProvider } from "../components/discovery/DiscoveryHomeContext";
import { getCurrentProfile } from "../lib/supabase/profile";

export const metadata: Metadata = {
  title: "CalRent — Rentals & flatmates in Kolkata",
  description:
    "Find verified flats, rooms, and flatmates across Kolkata. Map-first, broker-free, with private contact exchange.",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const profile = await getCurrentProfile();
  return (
    <html lang="en" className="bg-white text-ink-900">
      <body className="min-h-screen bg-white text-ink-900 antialiased">
        <DiscoveryHomeProvider>
          <Header
            user={
              profile
                ? { id: profile.id, full_name: profile.full_name, avatar_url: profile.avatar_url }
                : null
            }
          />
          <div className="min-h-[calc(100vh-160px)]">{children}</div>
          <Footer />
          <LinkedInCredit />
        </DiscoveryHomeProvider>
      </body>
    </html>
  );
}
