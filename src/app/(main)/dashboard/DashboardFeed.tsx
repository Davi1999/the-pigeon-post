"use client";

import {
  useEffect,
  useRef,
  useCallback,
  useState,
  useLayoutEffect,
  useMemo,
} from "react";
import { PostArticle } from "./PostArticle";
import {
  computeNewspaperLayout,
  NEWSPAPER_COLUMN_GAP_PX,
  type PageContent,
  type PageItem,
} from "./newspaperLayout";
import { useIsDesktop } from "./useIsDesktop";
import { EditionOptionsAccordion } from "./EditionOptionsAccordion";

export type FeedPostSerialized = {
  id: string;
  title: string;
  body: string;
  authorDisplayName: string;
  createdAt: string;
  isOwnPost: boolean;
};

const PAGE_SIZE = 12;

/**
 * Buckets dimensions for deduping layout work only (not for measurement).
 * 8px absorbs sub-pixel / 1px observer noise while keeping distinct sizes separate.
 */
const LAYOUT_KEY_BUCKET_PX = 8;

function layoutKeyDim(n: number): number {
  return Math.max(0, Math.round(n / LAYOUT_KEY_BUCKET_PX) * LAYOUT_KEY_BUCKET_PX);
}

/**
 * Page nav + `space-y-4` gap: must not be measured live on the aside, or switching
 * between one vs two nav buttons changes sidebar height, retriggers layout, and
 * repaginates — so page 1’s text breaks move after visiting page 2.
 */
const SIDEBAR_NAV_LAYOUT_RESERVE_PX = 168;

type DashboardFeedProps = {
  initialPosts: FeedPostSerialized[];
  initialNextCursor: string | null;
  sidebarContent: React.ReactNode;
};

export function DashboardFeed({
  initialPosts,
  initialNextCursor,
  sidebarContent,
}: DashboardFeedProps) {
  const isDesktop = useIsDesktop();
  const [posts, setPosts] = useState<FeedPostSerialized[]>(initialPosts);
  const [nextCursor, setNextCursor] = useState<string | null>(
    initialNextCursor,
  );
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [pages, setPages] = useState<PageContent[]>([]);
  const [pageHeight, setPageHeight] = useState(0);
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [accordionOpen, setAccordionOpen] = useState(false);

  const feedContainerRef = useRef<HTMLDivElement>(null);
  /** Edition column body only (excludes page nav) so nav layout does not affect pagination. */
  const sidebarContentMeasureRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  /**
   * Dedupes `computeNewspaperLayout`: same 8px-bucketed size + posts fingerprint + font load
   * state skips redundant work (ResizeObserver noise). Window resize clears the ref so drags
   * can rerun even when bucketed dimensions match. Page buttons only change `currentPage`.
   */
  const lastLayoutInputKeyRef = useRef<string | null>(null);

  useEffect(() => {
    document.fonts.ready.then(() => setFontsLoaded(true));
  }, []);

  const recomputeLayout = useCallback(() => {
    if (!isDesktop || !feedContainerRef.current || posts.length === 0) return;

    const container = feedContainerRef.current;
    const feedWidth = container.clientWidth;

    const sidebarBodyHeight =
      sidebarContentMeasureRef.current?.clientHeight ?? 0;
    const rect = container.getBoundingClientRect();

    const footer = document.querySelector("footer");
    const footerTop = footer?.getBoundingClientRect().top;
    const footerBased =
      typeof footerTop === "number" ? Math.max(0, footerTop - rect.top) : 0;

    const viewportBased = Math.max(400, window.innerHeight - rect.top - 24);
    const height = Math.max(
      sidebarBodyHeight + SIDEBAR_NAV_LAYOUT_RESERVE_PX,
      viewportBased,
      footerBased,
    );

    const postsFingerprint = posts
      .map((p) => `${p.id}:${p.body.length}`)
      .join("|");
    const inputKey = [
      layoutKeyDim(feedWidth),
      layoutKeyDim(height),
      postsFingerprint,
      fontsLoaded,
    ].join(":");

    if (inputKey === lastLayoutInputKeyRef.current) {
      return;
    }
    lastLayoutInputKeyRef.current = inputKey;

    // Layout stability: pagination uses clientWidth × derived height for measurement
    // (bucket only gates recomputation). Page height style matches measurement.
    const computed = computeNewspaperLayout(
      posts,
      feedWidth,
      height,
      NEWSPAPER_COLUMN_GAP_PX,
    );
    setPages(computed);
    setPageHeight(height);
    setCurrentPage((prev) =>
      Math.min(prev, Math.max(0, computed.length - 1)),
    );
  }, [isDesktop, posts, fontsLoaded]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loading) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        cursor: nextCursor,
      });
      const res = await fetch(`/api/posts?${params}`);
      if (!res.ok) throw new Error("Failed to fetch posts");
      const data = (await res.json()) as {
        posts: FeedPostSerialized[];
        nextCursor: string | null;
      };
      setPosts((prev) => [...prev, ...data.posts]);
      setNextCursor(data.nextCursor);
    } catch {
      setNextCursor(null);
    } finally {
      setLoading(false);
    }
  }, [nextCursor, loading]);

  // Desktop: compute newspaper layout using sidebar height as page height
  useLayoutEffect(() => {
    recomputeLayout();
  }, [recomputeLayout]);

  // Desktop: recompute on resize
  useEffect(() => {
    if (!isDesktop) return;

    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        lastLayoutInputKeyRef.current = null;
        recomputeLayout();
      }, 150);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(resizeTimer);
    };
  }, [isDesktop, posts, recomputeLayout]);

  // Desktop: recompute when sidebar *content* resizes (not page nav).
  useLayoutEffect(() => {
    if (!isDesktop) return;
    const el = sidebarContentMeasureRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      recomputeLayout();
    });

    observer.observe(el);

    return () => observer.disconnect();
  }, [isDesktop, recomputeLayout]);

  // Mobile: infinite scroll
  useEffect(() => {
    if (isDesktop) return;
    const sentinel = sentinelRef.current;
    if (!sentinel || !nextCursor) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && nextCursor && !loading) {
          loadMore();
        }
      },
      { rootMargin: "200px", threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isDesktop, nextCursor, loading, loadMore]);

  // Desktop: prefetch more data when approaching last page
  useEffect(() => {
    if (!isDesktop || !nextCursor || loading) return;
    if (pages.length > 0 && currentPage >= pages.length - 2) {
      loadMore();
    }
  }, [isDesktop, currentPage, pages.length, nextCursor, loading, loadMore]);

  const totalPages = pages.length;
  const currentPageContent = pages[currentPage];

  const { itemIndexMap, lastIndexByPostId } = useMemo(() => {
    const indexMap = new WeakMap<PageItem, number>();
    const lastIndexMap = new Map<string, number>();

    let globalIndex = 0;
    for (const page of pages) {
      for (const item of page.items) {
        indexMap.set(item, globalIndex);
        lastIndexMap.set(item.postId, globalIndex);
        globalIndex += 1;
      }
    }

    return { itemIndexMap: indexMap, lastIndexByPostId: lastIndexMap };
  }, [pages]);

  if (isDesktop) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_1px_minmax(0,1fr)]">
        <div
          ref={feedContainerRef}
          className="lg:col-span-3 newspaper-paged-columns"
          style={
            pageHeight > 0
              ? { height: pageHeight, overflow: "hidden" }
              : undefined
          }
        >
          {pages.length > 0 && currentPageContent
            ? currentPageContent.items.map((item, idx) => (
                <PostArticle
                  key={`${item.postId}-${idx}`}
                  postId={item.postId}
                  title={item.title}
                  body={item.bodyText}
                  authorDisplayName={item.authorDisplayName}
                  createdAt={new Date(item.createdAt)}
                  isOwnPost={item.isOwnPost}
                  continuedFromTitle={
                    item.isContinuation ? item.title : undefined
                  }
                  showContinueButton={
                    (() => {
                      const globalIndex = itemIndexMap.get(item);
                      if (globalIndex === undefined) return false;
                      const lastIndex = lastIndexByPostId.get(item.postId);
                      return lastIndex === globalIndex;
                    })()
                  }
                />
              ))
            : null}
        </div>

        <div className="hidden bg-black dark:bg-[#f5ecd8] lg:block" aria-hidden />

        <aside className="space-y-4 text-sm">
          <nav
            className="flex flex-col items-center gap-6 pb-3"
            aria-label="Page navigation"
          >
            {(currentPage > 0 || currentPage < totalPages - 1) && (
              <div className="inline-flex overflow-hidden border border-black/40 bg-[#f5ecd8] shadow-sm">
                {currentPage > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage((p) => Math.max(0, p - 1));
                    }}
                    className="flex flex-col items-center gap-1 px-4 py-2 text-xs uppercase tracking-wider font-semibold text-black border-black/30 hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5ecd8]"
                    aria-label="Previous page"
                  >
                    <span>Previous page</span>
                    <img
                      src="/pointing-hand.svg"
                      alt=""
                      className="h-9 w-auto scale-x-[-1]"
                      aria-hidden
                    />
                  </button>
                )}
                {currentPage < totalPages - 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage((p) =>
                        Math.min(totalPages - 1, p + 1),
                      );
                    }}
                    className="flex flex-col items-center gap-1 px-4 py-2 text-xs uppercase tracking-wider font-semibold text-black hover:bg-black/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-[#f5ecd8]"
                    aria-label="Continue reading"
                  >
                    <span>Continue reading</span>
                    <img
                      src="/pointing-hand.svg"
                      alt=""
                      className="h-9 w-auto"
                      aria-hidden
                    />
                  </button>
                )}
              </div>
            )}
          </nav>

          <div ref={sidebarContentMeasureRef}>{sidebarContent}</div>
        </aside>
      </div>
    );
  }

  // Mobile / tablet: single-column infinite scroll
  return (
    <div className="space-y-4">
      <EditionOptionsAccordion
        open={accordionOpen}
        onToggle={() => setAccordionOpen((o) => !o)}
      >
        {sidebarContent}
      </EditionOptionsAccordion>
      {posts.map((post) => (
        <PostArticle
          key={post.id}
          postId={post.id}
          title={post.title}
          body={post.body}
          authorDisplayName={post.authorDisplayName}
          createdAt={new Date(post.createdAt)}
          isOwnPost={post.isOwnPost}
        />
      ))}
      {nextCursor ? (
        <div ref={sentinelRef} className="flex justify-center py-4" aria-hidden>
          {loading ? (
            <span className="text-xs text-gray-500">Loading more…</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
