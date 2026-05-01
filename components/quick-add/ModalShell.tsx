"use client";

import { ReactNode, useEffect, useRef } from "react";
import { X } from "lucide-react";

type ModalShellProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  footer: ReactNode;
  children: ReactNode;
};

export function ModalShell({ open, onClose, title, subtitle, footer, children }: ModalShellProps) {
  const bodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    bodyRef.current?.scrollTo({ top: 0 });
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink-900/50 backdrop-blur-sm md:items-center md:p-6"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="flex w-full max-w-xl flex-col bg-white shadow-floating overflow-hidden h-[92vh] rounded-t-3xl md:max-h-[min(860px,calc(100vh-3rem))] md:h-auto md:rounded-3xl"
        role="dialog"
        aria-modal="true"
      >
        <header className="flex items-start justify-between border-b border-ink-100 px-6 py-4">
          <div>
            <h2 className="text-xl font-semibold leading-tight text-ink-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-ink-500">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-500 hover:bg-ink-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div ref={bodyRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-6 py-5">
          {children}
        </div>
        <footer className="flex items-center justify-end gap-3 border-t border-ink-100 bg-white px-6 py-3">
          {footer}
        </footer>
      </div>
    </div>
  );
}
