import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { buttonVariants } from "@/components/ui/Button";

type HomeSidebarProps = {
  email: string;
};

function Divider() {
  return <span className="mx-auto h-px w-8 bg-black dark:bg-[#f5ecd8]" />;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-1 text-center">
      <h2 className="text-base font-semibold uppercase tracking-wide font-notable">
        {children}
      </h2>
      <Divider />
    </div>
  );
}

export function HomeSidebar({ email }: HomeSidebarProps) {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <SectionHeading>Edition Options</SectionHeading>
        <p className="text-center text-[10px] uppercase tracking-wide text-muted">
          Work on your edition.
        </p>
        <p className="post-article-body text-[11px] leading-relaxed">
          This is where you can contribute to the Pigeon Post. Add your
          friends, write your articles, and more. A great place to start is by
          creating a new post. Take the time to write something meaningful, and
          share it with your friends. Once you&apos;ve created a post, you can
          add your friends, read their posts, and start conversations.
        </p>
      </section>

      <nav className="space-y-2" aria-label="Edition actions">
        <Link
          href="/new-post"
          className={buttonVariants({ variant: "primary", block: true })}
        >
          Create new post
        </Link>
        <Link
          href="/add-friends"
          className={buttonVariants({ variant: "secondary", block: true })}
        >
          Add friends
        </Link>
      </nav>

      <section className="space-y-3 border bg-background px-4 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-strong">
          Account
        </h2>
        <p className="truncate text-xs text-muted" title={email}>
          {email}
        </p>
        <div className="pt-1">
          <SignOutButton />
        </div>
      </section>

      <section>
        <Link href="/updates" className="block">
          <img
            src="/extra-extra.svg"
            alt="Read the latest updates"
            className="h-auto w-full extra-extra-img"
          />
          <p className="mt-2 text-center text-sm font-notable uppercase tracking-wide">
            Hot off the press!
          </p>
        </Link>
      </section>
    </div>
  );
}
