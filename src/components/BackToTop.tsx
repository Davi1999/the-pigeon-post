"use client";

import { useEffect, useState } from "react";

/** Show the button once the reader has scrolled far enough for it to help. */
const SHOW_AFTER_PX = 400;

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > SHOW_AFTER_PX);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="fixed bottom-5 right-4 z-50 border border-foreground bg-background px-3 py-2 text-xs font-semibold uppercase tracking-wide shadow-md transition-colors hover:bg-foreground/10 lg:hidden"
    >
      <span aria-hidden="true" className="mr-1">
        ↑
      </span>
      Back to top
    </button>
  );
}
