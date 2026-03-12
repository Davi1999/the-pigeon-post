"use client";

import Link from "next/link";
import { useIsDesktop } from "./(main)/dashboard/useIsDesktop";

type HeaderShellProps = {
  session: any;
  displayName: string;
  dateLine: string;
};

export function HeaderShell({
  session,
  displayName,
  dateLine,
}: HeaderShellProps) {
  const isDesktop = useIsDesktop();

  return (
    <header className="newspaper-header px-4 py-6">
      <div className="mx-auto max-w-6xl">
        <div className="newspaper-header-row">
          {isDesktop ? (
            <div className="newspaper-header-side">
              <div className="newspaper-welcome-box">
                {session ? (
                  <>
                    <div className="newspaper-welcome-text">Welcome,</div>
                    <div className="newspaper-welcome-text">{displayName}</div>
                  </>
                ) : (
                  <>
                    <div className="newspaper-welcome-text">Welcome,</div>
                    <div className="newspaper-welcome-text">Friend</div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div />
          )}
          <div className="newspaper-header-center">
            <Link
              href="/dashboard"
              className="newspaper-masthead text-4xl sm:text-5xl md:text-6xl hover:opacity-90 transition-opacity"
            >
              The Pigeon Post
            </Link>
          </div>
          {isDesktop ? (
            <div className="newspaper-header-side">
              <div className="newspaper-welcome-box">
                <div className="newspaper-welcome-text">Weather</div>
                <div className="newspaper-welcome-text-small">
                  Clear skies, high likelyhood
                </div>
                <div className="newspaper-welcome-text-small">
                  of connecting with friends.
                </div>
              </div>
            </div>
          ) : (
            <div />
          )}
        </div>
        <div className="newspaper-divider">
          <div className="newspaper-divider-line" />
          <div className="newspaper-divider-line" />
          {isDesktop ? (
            <div className="grid grid-cols-3 items-center">
              <div className="newspaper-divider-text text-left">
                Fostering meaningful connections since 2026
              </div>
              <div className="newspaper-divider-text text-center">
                {dateLine}
              </div>
              <div className="newspaper-divider-text text-right">
                <span className="font-black">FREE</span>
                <span className="normal-case"> - Everywhere, always.</span>
              </div>
            </div>
          ) : (
            <div className="grid items-center">
              <div className="newspaper-divider-text text-center">
                {dateLine}
              </div>
            </div>
          )}
          <div className="newspaper-divider-line" />
          <div className="newspaper-divider-line" />
        </div>
      </div>
    </header>
  );
}

