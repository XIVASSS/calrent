export function Footer() {
  return (
    <footer className="shrink-0 border-t border-ink-100 bg-white">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 py-8 text-sm text-ink-500 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <p>© {new Date().getFullYear()} CalRent · Built for Kolkata.</p>
        <div className="flex flex-wrap items-center gap-4">
          <a href="/about" className="hover:text-ink-900">About</a>
          <a href="/safety" className="hover:text-ink-900">Trust & Safety</a>
          <a href="/help" className="hover:text-ink-900">Help</a>
          <a href="/host/new" className="font-semibold text-ink-900">List your home</a>
        </div>
      </div>
    </footer>
  );
}
