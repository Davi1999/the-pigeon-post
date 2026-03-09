// src/app/(auth)/sign-in/page.tsx

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { SignInForm } from "@/components/auth/SignInForm";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectReason?: string }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (session) {
    redirect("/dashboard");
  }

  const { redirectReason } = await searchParams;

  return (
    <div>
      <section className="newspaper-main-headline-section">
        <h1 className="newspaper-main-headline" aria-label="Hurrah for The Pigeon Post!">
          <svg
            viewBox="0 0 100 10"
            preserveAspectRatio="none"
            className="newspaper-main-headline-svg"
            aria-hidden
          >
            <text
              x="0"
              y="8"
              textLength="100"
              lengthAdjust="spacingAndGlyphs"
              className="newspaper-main-headline-svg-text"
            >
              Hurrah for The Pigeon Post!
            </text>
          </svg>
        </h1>
        <div className="newspaper-main-headline-rules">
          <div className="newspaper-divider-line" />
        </div>
      </section>
      <section className="newspaper-columns">
        <article className="newspaper-column">
          <header>
            <h2 className="newspaper-article-headline">
              Say hello to The Pigeon Post!
            </h2>
            <p className="newspaper-article-tagline">
              A modern message service with the charm of old-fashioned letters.
            </p>
          </header>
          <p className="newspaper-article-body">
            The Pigeon Post is a cozy corner of the internet where messages feel
            personal again. Instead of disappearing into noisy feeds and crowded
            inboxes, your words arrive with intention—like letters sliding onto
            a doormat. We help small communities, clubs, and creative teams
            share updates in a slower, more thoughtful way.
          </p>
          <p className="newspaper-article-body">
            Every dispatch is crafted, delivered, and preserved so your stories
            don&apos;t get buried by the algorithm of the day.
          </p>
          <header>
            <h2 className="newspaper-article-headline">
              People are starving for real connection
            </h2>
            <p className="newspaper-article-tagline">
              It's time to build something meaningful.
            </p>
          </header>
          <p className="newspaper-article-body">
            We're all craving meaningful connections, 
            but the world is too noisy. 
            The Pigeon Post is a simple way to connect with friends and family.
          </p>
        </article>

        <article className="newspaper-column">
          <p className="newspaper-article-body">
            Whether you&apos;re organizing a book club, running a local meetup, or
            keeping a distributed team aligned, The Pigeon Post turns scattered
            thoughts into organized, readable editions.
          </p>
          <p className="newspaper-article-body">
            Now is a good time to stop the branirot, and start reconnecting with
            friends and family. Don&apos;t wait another day to start building
            something meaningful. Sign up for The Pigeon Post today, and start
            building your community.
          </p>
          <header>
            <h2 className="newspaper-article-headline">
              New Era of Gentle Messaging
            </h2>
            <p className="newspaper-article-tagline">Less noise, more meaning.</p>
          </header>
          <p className="newspaper-article-body">
            Tired of blinking notifications and endless reply-all threads? The
            Pigeon Post trims away the chaos and leaves only what matters: clear,
            human-sized communication. Schedule announcements, share notes, and
            send updates in an interface that feels familiar yet refreshingly
            calm.
          </p>
          <p className="newspaper-article-body">
            Take a deep breath, slow the scroll, and give your messages room to
            land. With each edition, you&apos;re not just sending updates—you&apos;re
            crafting a small, thoughtful moment in someone&apos;s day.
          </p>
        </article>

        <article className="newspaper-column">
          <p className="newspaper-article-body">
            Compose a message once, choose who should receive it, and let us
            handle the delivery with a layout your readers will actually want to
            open. Each edition groups related updates into sections—events, news,
            reminders—so no one misses the details.
          </p>
          <p className="newspaper-article-body">
            Subscribers can browse past issues like an archive of clippings,
            making it easy to trace decisions, milestones, and memories over
            time.
          </p>
          <p className="newspaper-article-body">
            Now is a good time to stop the branirot, and start reconnecting with
            friends and family. Don&apos;t wait another day to start building
            something meaningful. Sign up for The Pigeon Post today, and start
            building your community.
          </p>
          <header>
            <h2 className="newspaper-article-headline">
              Dispatches Sent with Care
            </h2>
            <p className="newspaper-article-tagline">
              One post, many happy readers.
            </p>
          </header>
          <p className="newspaper-article-body">
            Take a deep breath, slow the scroll, and give your messages room to
            land. With each edition, you&apos;re not just sending updates—you&apos;re
            crafting a small, thoughtful moment in someone&apos;s day.
          </p>
        </article>

        <article className="newspaper-column newspaper-auth-column">
          <header>
            <h2 className="newspaper-article-headline">
              {redirectReason === "signup"
                ? "Sign Up, Start Your Story"
                : "Sign In, Start a New Edition"}
            </h2>
            <p className="newspaper-article-tagline">
              Your next dispatch begins here.
            </p>
          </header>
          <p className="newspaper-article-body">
            When you sign in, you&apos;re opening a newsroom for your community.
            Draft your first edition, invite your readers, and watch your updates
            take on a life of their own.
          </p>
          {redirectReason === "signup" && (
            <p className="newspaper-article-body">
              Sign in with Google to create your account—Google handles the
              account creation automatically.
            </p>
          )}
          <div className="newspaper-auth-box">
            <h3 className="newspaper-auth-heading">
              {redirectReason === "signup" ? "Create your account" : "Sign in"}
            </h3>
            <SignInForm />
            {redirectReason !== "signup" && (
              <p className="newspaper-auth-subtext">
                Don&apos;t have an account?{" "}
                <Link
                  href="/sign-up"
                  className="newspaper-auth-link"
                >
                  Sign up
                </Link>
              </p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
