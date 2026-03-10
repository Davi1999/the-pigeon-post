"use client";

type EditionOptionsAccordionProps = {
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
};

const buttonClasses =
  "flex flex-col items-center gap-1 px-4 py-2 text-xs uppercase tracking-wider font-semibold text-black border-black/30 hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5ecd8]";

export function EditionOptionsAccordion({
  open,
  onToggle,
  children,
}: EditionOptionsAccordionProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="inline-flex overflow-hidden border border-black/40 bg-[#f5ecd8] shadow-sm">
        <button
          type="button"
          onClick={onToggle}
          className={buttonClasses}
          aria-expanded={open}
          aria-label={open ? "Close edition options" : "Open edition options"}
        >
          <img
            src="/newspaper.svg"
            alt=""
            className="h-9 w-auto"
            aria-hidden
          />
          <span>EDITION OPTIONS</span>
        </button>
      </div>
      {open ? (
        <aside className="w-full space-y-4 border-t border-black pt-4 text-sm">
          {children}
        </aside>
      ) : null}
    </div>
  );
}
