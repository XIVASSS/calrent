"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "../ui/Button";
import { Avatar } from "../ui/Avatar";
import { Input } from "../ui/Input";
import { cn } from "../../lib/utils";
import { useDiscoveryHomeOptional } from "../discovery/DiscoveryHomeContext";

type HeaderProps = {
  user?: { id: string; full_name?: string | null; avatar_url?: string | null } | null;
};

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const [accountOpen, setAccountOpen] = useState(false);
  const discovery = useDiscoveryHomeOptional();

  return (
    <header className="sticky top-0 z-40 border-b border-ink-100 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 w-full max-w-[1400px] items-center justify-between px-4 lg:px-8">
        <Link href="/" className="flex items-center">
          <span className="text-2xl font-semibold tracking-tight text-ink-900">
            cal<span className="text-brand">rent</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {(
            [
              { label: "Stay", href: "/" },
              { label: "Flatmate", href: "/?mode=flatmate" },
            ] as const
          ).map((item) => {
            const isActive = pathname === item.href.split("?")[0];
            return (
              <Link
                key={item.label}
                href={item.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium text-ink-600 transition-colors hover:text-ink-900",
                  isActive && "text-ink-900"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              variant="outline"
              size="md"
              className="!h-11 gap-3 !rounded-full !pl-2 !pr-2"
              onClick={() => setAccountOpen((v) => !v)}
            >
              <Menu className="h-4 w-4" />
              <Avatar size={28} name={user?.full_name ?? "Guest"} src={user?.avatar_url ?? undefined} />
            </Button>
            {accountOpen && (
              <div className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-floating">
                {user ? (
                  <>
                    <div className="border-b border-ink-100 p-3 text-sm">
                      <p className="font-semibold text-ink-900">{user.full_name ?? "Member"}</p>
                      <p className="text-xs text-ink-500">Account</p>
                    </div>
                    <Link href="/account" className="block px-4 py-3 text-sm hover:bg-ink-50">
                      Profile & Trips
                    </Link>
                    <Link href="/account/listings" className="block px-4 py-3 text-sm hover:bg-ink-50">
                      My listings
                    </Link>
                    <Link href="/account/inbox" className="block px-4 py-3 text-sm hover:bg-ink-50">
                      Inbox & contact requests
                    </Link>
                    <Link href="/account/shortlist" className="block px-4 py-3 text-sm hover:bg-ink-50">
                      Saved homes
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountOpen(false);
                        discovery?.requestQuickAdd("flat");
                      }}
                      className="block w-full px-4 py-3 text-left text-sm hover:bg-ink-50"
                    >
                      List your flat…
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountOpen(false);
                        discovery?.requestQuickAdd("seeker");
                      }}
                      className="block w-full px-4 py-3 text-left text-sm hover:bg-ink-50"
                    >
                      I&apos;m looking — drop a pin…
                    </button>
                    <Link
                      href="/auth/sign-out"
                      className="block border-t border-ink-100 px-4 py-3 text-sm text-ink-600 hover:bg-ink-50"
                    >
                      Sign out
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/auth/sign-in" className="block px-4 py-3 text-sm font-semibold hover:bg-ink-50">
                      Sign in (one-tap email link)
                    </Link>
                    <Link href="/auth/sign-up" className="block px-4 py-3 text-sm hover:bg-ink-50">
                      Sign up
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountOpen(false);
                        discovery?.requestQuickAdd("flat");
                      }}
                      className="block w-full border-t border-ink-100 px-4 py-3 text-left text-sm hover:bg-ink-50"
                    >
                      List your flat…
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAccountOpen(false);
                        discovery?.requestQuickAdd("seeker");
                      }}
                      className="block w-full px-4 py-3 text-left text-sm hover:bg-ink-50"
                    >
                      I&apos;m looking — drop a pin…
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto -mt-3 flex w-full max-w-3xl justify-center px-4 pb-3 lg:pb-4">
        <DiscoverySearchBar pathname={pathname} />
      </div>
    </header>
  );
}

function DiscoverySearchBar({ pathname }: { pathname: string | null }) {
  const discovery = useDiscoveryHomeOptional();
  const active = pathname === "/" && Boolean(discovery?.homeDiscoveryActive);
  const [draft, setDraft] = useState(discovery?.filters.query ?? "");

  useEffect(() => {
    if (discovery?.filters.query !== undefined) {
      setDraft(discovery.filters.query);
    }
  }, [discovery?.filters.query]);

  if (!discovery || !active) {
    return (
      <Link
        href="/"
        className="group flex w-full items-center gap-3 rounded-full border border-ink-200 bg-white px-3 py-2.5 shadow-sm transition-shadow hover:shadow-card"
      >
        <Search className="h-4 w-4 shrink-0 text-ink-600" />
        <div className="flex-1 truncate text-left text-sm text-ink-600">
          <span className="font-medium text-ink-900">Search Kolkata rentals</span>
          <span className="mx-2 text-ink-300">·</span>
          <span>locality, metro, landmark</span>
        </div>
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-white">
          <SlidersHorizontal className="h-4 w-4" />
        </span>
      </Link>
    );
  }

  const { filters, setFilters, listingCount, setFiltersPanelOpen } = discovery;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setFilters({ ...filters, query: draft });
      }}
      className="flex w-full items-center gap-2 rounded-full border-2 border-brand/30 bg-white px-3 py-2 shadow-sm transition-[box-shadow,border-color] focus-within:border-brand focus-within:shadow-card"
    >
      <Search className="h-4 w-4 shrink-0 text-ink-600" />
      <Input
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="Sector V, Salt Lake, Park Street, metro…"
        className="h-9 min-w-0 flex-1 border-0 bg-transparent px-0 text-sm shadow-none focus:ring-0"
        aria-label="Search homes by locality or landmark"
      />
      <span className="hidden shrink-0 text-xs text-ink-500 sm:inline whitespace-nowrap">
        {listingCount} homes
      </span>
      <button
        type="button"
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand text-white shadow-sm hover:opacity-95"
        aria-label="Open rent, BHK and other filters"
        onClick={() => setFiltersPanelOpen(true)}
      >
        <SlidersHorizontal className="h-4 w-4" />
      </button>
    </form>
  );
}
