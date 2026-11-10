/**
 * Desktop newspaper pagination: binary search + off-screen DOM measurement to
 * split post bodies across “pages” of fixed column geometry without clipping.
 *
 * The HTML and metrics here MUST stay aligned with:
 * - `PostArticle.tsx` (structure, font sizes, spacing)
 * - `.newspaper-paged-columns` and `.post-article-body` in `globals.css`
 * - `NEWSPAPER_COLUMN_GAP_PX` ↔ `column-gap` on `.newspaper-paged-columns`
 */

import type { FeedPostSerialized } from "./DashboardFeed";

/** Must match `column-gap` on `.newspaper-paged-columns` (1.5rem ≈ 24px at 16px root). */
export const NEWSPAPER_COLUMN_GAP_PX = 24;

export type PageItem = {
  postId: string;
  title: string;
  bodyText: string;
  featuredImage: string | null;
  authorDisplayName: string;
  createdAt: string;
  isOwnPost: boolean;
  isContinuation: boolean;
};

export type PageContent = {
  items: PageItem[];
};

type LayoutChrome = {
  isDark: boolean;
  /** “Continue conversation” block — only the last layout chunk of a post (see DashboardFeed). */
  showContinueBlock: boolean;
};

function layoutPrefersDark(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDateStr(iso: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "";
  }
}

/** Inline stand-in for `LetterButton` (default): image area + label + padding. */
function continueConversationBlockHtml(): string {
  return [
    '<div style="margin-top:16px;display:flex;justify-content:center;">',
    '<div style="display:inline-flex;flex-direction:column;align-items:center;gap:4px;padding:8px 16px;',
    "text-transform:uppercase;letter-spacing:0.05em;font-size:12px;line-height:1.2;font-weight:600;",
    "border:1px solid rgba(0,0,0,0.4);background:#f5ecd8;color:#000;min-height:72px;justify-content:center;",
    'box-sizing:border-box;">',
    '<div style="width:36px;height:36px;background:rgba(0,0,0,0.08);" aria-hidden></div>',
    "<span>Continue conversation</span>",
    "</div>",
    "</div>",
  ].join("");
}

function buildArticleHtml(item: PageItem, chrome: LayoutChrome): string {
  const title = escapeHtml(item.title || "Untitled story");
  const body = escapeHtml(item.bodyText);
  const who = item.isOwnPost
    ? "By You"
    : `By ${escapeHtml(item.authorDisplayName)}`;
  const date = formatDateStr(item.createdAt);
  const byline = date ? `${who} &mdash; ${date}` : who;

  const borderColor = chrome.isDark ? "#f5ecd8" : "#000000";
  const bodyColor = chrome.isDark ? "#f5ecd8" : "#222222";
  const mutedColor = "rgb(107,114,128)";

  const bodyHtml = body
    ? `<p style="margin:8px 0 0;white-space:pre-wrap;font-size:11px;color:${bodyColor};text-align:justify;line-height:1.625;overflow-wrap:anywhere;">${body}</p>`
    : "";

  // Fixed aspect ratio + max-height keeps the measured height deterministic
  // (independent of the image's intrinsic size or load state) so pagination
  // never shifts. Only the first chunk of an article shows the image.
  const imageHtml =
    !item.isContinuation && item.featuredImage
      ? `<img src="${escapeHtml(item.featuredImage)}" alt="${title}" loading="lazy" decoding="async" style="display:block;width:100%;height:auto;aspect-ratio:16/9;max-height:420px;object-fit:cover;border:1px solid ${borderColor};margin:14px 0 0;box-sizing:border-box;" />`
      : "";

  const tailHtml = chrome.showContinueBlock ? continueConversationBlockHtml() : "";

  if (item.isContinuation) {
    return [
      `<div style="border-bottom:1px solid ${borderColor};padding-bottom:12px;margin-bottom:16px;font-size:12px;line-height:1.625;">`,
      `<div style="break-inside:avoid;font-size:10px;text-transform:uppercase;letter-spacing:0.06em;font-style:italic;text-align:center;padding:4px 0 6px;color:${mutedColor};">`,
      `Continued from \u201c${title}\u201d`,
      "</div>",
      bodyHtml,
      tailHtml,
      "</div>",
    ].join("");
  }

  return [
    `<div style="border-bottom:1px solid ${borderColor};padding-bottom:12px;margin-bottom:16px;font-size:12px;line-height:1.625;">`,
    '<div style="break-inside:avoid;">',
    `<h2 style="font-family:&#39;Notable&#39;,&#39;Special Elite&#39;,system-ui,serif;font-size:16px;font-weight:600;text-transform:uppercase;letter-spacing:0.025em;text-align:center;margin:0;line-height:1.5;overflow-wrap:anywhere;">${title}</h2>`,
    '<div style="margin-top:6px;display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 0;">',
    `<div style="height:1px;width:32px;background:${borderColor};"></div>`,
    `<p style="font-size:10px;text-transform:uppercase;letter-spacing:0.025em;color:${mutedColor};text-align:center;padding:8px;margin:0;">${byline}</p>`,
    `<div style="height:1px;width:32px;background:${borderColor};"></div>`,
    "</div>",
    imageHtml,
    "</div>",
    bodyHtml,
    tailHtml,
    "</div>",
  ].join("");
}

class PageMeasurer {
  el: HTMLDivElement;

  constructor(containerWidth: number, pageHeight: number, columnGap: number) {
    // Measure the actual 3-column geometry, not a single long column.
    // A single-column estimate assumes continuous flow, but real column
    // breaks leave gaps (e.g. a title+image block that will not split).
    // Those gaps push the tail of the page into a hidden 4th column, which
    // is then clipped by the container. A fixed-height multicol box reports
    // that spill as scrollWidth > clientWidth, so the split logic can see it.
    this.el = document.createElement("div");
    Object.assign(this.el.style, {
      position: "absolute",
      top: "-9999px",
      left: "-9999px",
      width: `${containerWidth}px`,
      // Slack absorbs sub-pixel and React-vs-string markup differences
      // without visibly wasting space. If this is too small, the last line or
      // two spill into a hidden 4th column; 24px per column is ~1.3 lines.
      height: `${Math.max(0, pageHeight - 24)}px`,
      columnCount: "3",
      columnGap: `${columnGap}px`,
      columnFill: "auto",
      overflow: "hidden",
      fontFamily: '"Special Elite", system-ui, sans-serif',
      fontSize: "12px",
      lineHeight: "1.625",
    });
    document.body.appendChild(this.el);
  }

  get overflows(): boolean {
    return this.el.scrollWidth > this.el.clientWidth + 1;
  }

  setContent(html: string): void {
    this.el.innerHTML = html;
  }

  getContent(): string {
    return this.el.innerHTML;
  }

  appendHtml(html: string): void {
    this.el.insertAdjacentHTML("beforeend", html);
  }

  clear(): void {
    this.el.innerHTML = "";
  }

  destroy(): void {
    this.el.remove();
  }
}

function splitWords(
  measurer: PageMeasurer,
  htmlBefore: string,
  base: PageItem,
  already: string,
  paragraph: string,
  rest: string,
  isDark: boolean,
): { fitting: string; remainder: string } {
  const words = paragraph.split(/\s+/);
  if (words.length <= 1) {
    return { fitting: paragraph, remainder: rest };
  }

  let lo = 1;
  let hi = words.length;

  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const txt = words.slice(0, mid).join(" ");
    const fullTxt = [already, txt].filter(Boolean).join("\n");
    const leftoverWords = words.slice(mid).join(" ");
    const terminal = leftoverWords === "" && rest === "";
    measurer.setContent(
      htmlBefore +
        buildArticleHtml(
          { ...base, bodyText: fullTxt },
          { isDark, showContinueBlock: terminal },
        ),
    );
    if (!measurer.overflows) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }

  const fitWords = words.slice(0, lo).join(" ");
  const fit = [already, fitWords].filter(Boolean).join("\n");
  const leftover = words.slice(lo).join(" ");
  const remainder = [leftover, rest].filter(Boolean).join("\n");
  return { fitting: fit, remainder };
}

function splitBody(
  measurer: PageMeasurer,
  htmlBefore: string,
  post: FeedPostSerialized,
  body: string,
  isContinuation: boolean,
  isDark: boolean,
): { fitting: string; remainder: string } {
  const base: PageItem = {
    postId: post.id,
    title: post.title,
    bodyText: "",
    featuredImage: post.featuredImage,
    authorDisplayName: post.authorDisplayName,
    createdAt: post.createdAt,
    isOwnPost: post.isOwnPost,
    isContinuation,
  };

  // First, ensure at least the header and byline can fit.
  measurer.setContent(
    htmlBefore +
      buildArticleHtml(base, { isDark, showContinueBlock: false }),
  );
  if (measurer.overflows) {
    return { fitting: "", remainder: body };
  }

  // Try full body first (terminal segment — include continue block in measure).
  measurer.setContent(
    htmlBefore +
      buildArticleHtml(
        { ...base, bodyText: body },
        { isDark, showContinueBlock: true },
      ),
  );
  if (!measurer.overflows) {
    return { fitting: body, remainder: "" };
  }

  const paras = body.split("\n");
  let lo = 0;
  let hi = paras.length;

  // Binary search how many whole paragraphs fit (non-terminal while more paras may follow).
  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const txt = paras.slice(0, mid).join("\n");
    const terminalPara = mid === paras.length;
    measurer.setContent(
      htmlBefore +
        buildArticleHtml(
          { ...base, bodyText: txt },
          { isDark, showContinueBlock: terminalPara },
        ),
    );
    if (!measurer.overflows) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }

  if (lo === 0) {
    // No whole paragraph fits — split inside the first paragraph.
    return splitWords(
      measurer,
      htmlBefore,
      base,
      "",
      paras[0] ?? "",
      paras.slice(1).join("\n"),
      isDark,
    );
  }

  if (lo < paras.length) {
    // Some whole paragraphs fit, but there is more body left.
    // Try to also fit as much as possible of the next paragraph so we
    // don't leave a large empty gap at the bottom of the page.
    const already = paras.slice(0, lo).join("\n");
    const nextPara = paras[lo] ?? "";
    const rest = paras.slice(lo + 1).join("\n");
    const { fitting, remainder } = splitWords(
      measurer,
      htmlBefore,
      base,
      already,
      nextPara,
      rest,
      isDark,
    );
    return { fitting, remainder };
  }

  // All paragraphs fit except maybe trailing whitespace.
  return {
    fitting: paras.slice(0, lo).join("\n"),
    remainder: paras.slice(lo).join("\n"),
  };
}

export function computeNewspaperLayout(
  posts: FeedPostSerialized[],
  containerWidth: number,
  pageHeight: number,
  columnGap: number = NEWSPAPER_COLUMN_GAP_PX,
): PageContent[] {
  if (containerWidth <= 0 || pageHeight <= 0 || posts.length === 0) {
    return [{ items: [] }];
  }

  const isDark = layoutPrefersDark();
  const measurer = new PageMeasurer(containerWidth, pageHeight, columnGap);
  const pages: PageContent[] = [];

  let idx = 0;
  let contBody: string | null = null;
  let contIdx = -1;
  let iterations = 0;

  try {
    while ((idx < posts.length || contBody !== null) && iterations < 500) {
      iterations++;
      measurer.clear();
      const items: PageItem[] = [];
      let html = "";

      if (contBody !== null && contIdx >= 0) {
        const post = posts[contIdx];
        const item: PageItem = {
          postId: post.id,
          title: post.title,
          bodyText: contBody,
          featuredImage: post.featuredImage,
          authorDisplayName: post.authorDisplayName,
          createdAt: post.createdAt,
          isOwnPost: post.isOwnPost,
          isContinuation: true,
        };

        const artHtml = buildArticleHtml(item, {
          isDark,
          showContinueBlock: true,
        });
        measurer.setContent(artHtml);

        if (measurer.overflows) {
          measurer.clear();
          const { fitting, remainder } = splitBody(
            measurer,
            "",
            post,
            contBody,
            true,
            isDark,
          );
          if (fitting) {
            items.push({ ...item, bodyText: fitting });
          } else {
            const firstWord =
              contBody.split(/\s+/)[0] || contBody.slice(0, 50);
            items.push({ ...item, bodyText: firstWord });
            contBody = contBody.slice(firstWord.length).trimStart() || null;
            if (!contBody) contIdx = -1;
            pages.push({ items });
            continue;
          }
          contBody = remainder || null;
          if (!contBody) contIdx = -1;
          pages.push({ items });
          continue;
        }

        items.push(item);
        html = measurer.getContent();
        contBody = null;
        contIdx = -1;
      }

      while (idx < posts.length) {
        const post = posts[idx];
        const item: PageItem = {
          postId: post.id,
          title: post.title,
          bodyText: post.body,
          featuredImage: post.featuredImage,
          authorDisplayName: post.authorDisplayName,
          createdAt: post.createdAt,
          isOwnPost: post.isOwnPost,
          isContinuation: false,
        };

        const prevHtml = html;
        const artHtml = buildArticleHtml(item, {
          isDark,
          showContinueBlock: true,
        });
        measurer.appendHtml(artHtml);
        html = measurer.getContent();

        if (measurer.overflows) {
          measurer.setContent(prevHtml);
          const { fitting, remainder } = splitBody(
            measurer,
            prevHtml,
            post,
            post.body,
            false,
            isDark,
          );

          if (fitting) {
            items.push({ ...item, bodyText: fitting });
            if (remainder) {
              contBody = remainder;
              contIdx = idx;
            }
            idx++;
          } else {
            if (items.length === 0) {
              items.push({ ...item, bodyText: "" });
              contBody = post.body || null;
              contIdx = post.body ? idx : -1;
              idx++;
            }
          }
          break;
        }

        items.push(item);
        idx++;
      }

      if (items.length > 0) {
        pages.push({ items });
      } else {
        break;
      }
    }
  } finally {
    measurer.destroy();
  }

  return pages.length > 0 ? pages : [{ items: [] }];
}
