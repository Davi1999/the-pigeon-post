import Link from "next/link";

type BaseProps = {
  label: string;
  size?: "default" | "small";
  ariaLabel?: string;
};

type LinkProps = BaseProps & {
  href: string;
  onClick?: never;
  type?: never;
};

type ButtonProps = BaseProps & {
  href?: never;
  onClick?: () => void;
  type?: "button" | "submit";
};

export type LetterButtonProps = LinkProps | ButtonProps;

function getInnerContent(label: string, size: "default" | "small" = "default") {
  const textSizeClass = size === "small" ? "text-[9px]" : "text-xs";

  return (
    <span className="flex flex-col items-center gap-1 px-4 py-2 uppercase tracking-wider font-semibold text-black border-black/30 hover:bg-black/5">
      <img
        src="/letter.svg"
        alt=""
        className={size === "small" ? "h-7 w-auto" : "h-9 w-auto"}
        aria-hidden
      />
      <span className={textSizeClass}>{label}</span>
    </span>
  );
}

export function LetterButton(props: LetterButtonProps) {
  const { label, size = "default", ariaLabel } = props;
  const containerClasses =
    "inline-flex overflow-hidden border border-black/40 bg-[#f5ecd8] shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5ecd8]";

  if ("href" in props) {
    const { href } = props as LinkProps;

    return (
      <Link
        href={href}
        className={containerClasses}
        aria-label={ariaLabel ?? label}
      >
        {getInnerContent(label, size)}
      </Link>
    );
  }

  return (
    <button
      type={props.type ?? "button"}
      onClick={props.onClick}
      className={containerClasses}
      aria-label={ariaLabel ?? label}
    >
      {getInnerContent(label, size)}
    </button>
  );
}

