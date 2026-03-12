// src/components/ui/Button.tsx

const base =
  "inline-flex items-center justify-center border text-xs font-semibold uppercase tracking-wide transition-colors";

const variants = {
  primary:
    "border-foreground bg-foreground/10 text-foreground hover:bg-transparent",
  secondary:
    "border-foreground/40 bg-transparent text-foreground hover:bg-foreground/5",
} as const;

const sizes = {
  sm: "px-3 py-1.5",
  md: "px-3 py-2",
} as const;

export type ButtonVariant = keyof typeof variants;
export type ButtonSize = keyof typeof sizes;

export function buttonVariants(options?: {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
  className?: string;
}) {
  const {
    variant = "primary",
    size = "md",
    block = false,
    className = "",
  } = options ?? {};
  return [
    base,
    variants[variant],
    sizes[size],
    block ? "block w-full" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  block = false,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      type="button"
      className={buttonVariants({ variant, size, block, className })}
      {...props}
    />
  );
}
