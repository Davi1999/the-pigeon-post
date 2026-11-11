import "server-only";

import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM =
  process.env.EMAIL_FROM?.trim() ||
  "The Pigeon Post <onboarding@resend.dev>";

// Matches the site's `.newspaper-masthead` stack in globals.css.
const MASTHEAD_FONT =
  "'Manufacturing Consent', 'Special Elite', Georgia, 'Times New Roman', serif";
const BODY_FONT = "Georgia, 'Times New Roman', serif";
const MONO_FONT = "'Courier New', monospace";

/**
 * Resend is optional. When `RESEND_API_KEY` is not set, comment creation keeps
 * working and notification emails are silently skipped.
 */
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

export type ReplyNotificationEmail = {
  to: string;
  recipientName: string | null;
  postId: string;
  postTitle: string;
  commenterName: string;
  commentContent: string;
  /** True when the new comment is a reply to another comment. */
  isReplyToComment: boolean;
};

export type FriendRequestNotificationEmail = {
  to: string;
  recipientName: string | null;
  senderName: string;
  senderEmail: string;
};

type EmailLayoutInput = {
  heading: string;
  contentHtml: string;
  ctaLabel: string;
  ctaUrl: string;
  footerHtml: string;
};

type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

function getAppUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();

  if (vercelUrl) {
    return `https://${vercelUrl}`;
  }

  return "http://localhost:3000";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function truncate(value: string, max: number): string {
  const trimmed = value.trim();

  if (trimmed.length <= max) {
    return trimmed;
  }

  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function formatMultiline(value: string): string {
  return escapeHtml(truncate(value, 600)).replaceAll("\n", "<br />");
}

function renderEmailLayout({
  heading,
  contentHtml,
  ctaLabel,
  ctaUrl,
  footerHtml,
}: EmailLayoutInput): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Manufacturing+Consent&family=Special+Elite&display=swap"
      rel="stylesheet"
    />
  </head>
  <body style="margin:0;padding:0;background-color:#efe4cf;color:#161616;font-family:${BODY_FONT};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#efe4cf;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#f5ecd8;border:1px solid #161616;">
            <tr>
              <td style="padding:28px 32px 22px;text-align:center;border-bottom:3px double #161616;">
                <div style="font-family:${MASTHEAD_FONT};font-size:30px;font-weight:400;line-height:1.2;letter-spacing:0.08em;color:#161616;">The Pigeon Post</div>
                <div style="height:12px;"></div>
                <div style="font-family:${MONO_FONT};font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#4a4437;">${escapeHtml(
                  heading,
                )}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:26px 32px 6px;">${contentHtml}</td>
            </tr>
            <tr>
              <td style="padding:26px 32px 32px;">
                <a href="${escapeHtml(
                  ctaUrl,
                )}" style="display:inline-block;background-color:#161616;color:#f5ecd8;text-decoration:none;font-family:${MONO_FONT};font-size:12px;letter-spacing:0.15em;text-transform:uppercase;padding:12px 22px;">${escapeHtml(
                  ctaLabel,
                )}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px 28px;border-top:1px solid #161616;font-size:12px;line-height:1.6;color:#4a4437;">${footerHtml}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Sends an email through Resend.
 *
 * Returns the Resend message id when an email was sent, or `null` when Resend
 * is not configured or the request failed. Failures are logged but never
 * thrown, because a notification must not break the user-facing action.
 */
async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailInput): Promise<string | null> {
  if (!resend) {
    return null;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to,
      subject,
      html,
      text,
    });

    if (error) {
      console.error(
        "[email] Resend rejected the notification:",
        error.name,
        error.message,
      );
      return null;
    }

    return data?.id ?? null;
  } catch (error) {
    console.error("[email] Failed to send the notification:", error);
    return null;
  }
}

/**
 * Emails the author of a post when somebody else comments on it.
 */
export async function sendReplyNotificationEmail(
  notification: ReplyNotificationEmail,
): Promise<string | null> {
  const {
    to,
    recipientName,
    postId,
    postTitle,
    commenterName,
    commentContent,
    isReplyToComment,
  } = notification;

  const safeTitle = postTitle.trim() || "your story";
  const greeting = recipientName?.trim() || "there";
  const postUrl = `${getAppUrl()}/post/${postId}`;
  const subject = isReplyToComment
    ? `${commenterName} replied on "${truncate(safeTitle, 60)}"`
    : `${commenterName} commented on "${truncate(safeTitle, 60)}"`;
  const action = isReplyToComment ? "replied to a comment" : "left a comment";

  const contentHtml = `
    <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">Dear ${escapeHtml(
      greeting,
    )},</p>
    <p style="margin:0 0 20px;font-size:16px;line-height:1.6;">
      <strong>${escapeHtml(commenterName)}</strong> ${action} on your story
      <strong>&ldquo;${escapeHtml(safeTitle)}&rdquo;</strong>.
    </p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-left:3px solid #161616;background-color:#efe4cf;">
      <tr>
        <td style="padding:14px 18px;font-size:15px;line-height:1.6;font-style:italic;">${formatMultiline(
          commentContent,
        )}</td>
      </tr>
    </table>`;

  const html = renderEmailLayout({
    heading: isReplyToComment
      ? "A new reply has arrived"
      : "A new comment has arrived",
    contentHtml,
    ctaLabel: "Read the story",
    ctaUrl: postUrl,
    footerHtml: `You are receiving this because you wrote &ldquo;${escapeHtml(
      safeTitle,
    )}&rdquo; on The Pigeon Post. <a href="${escapeHtml(
      postUrl,
    )}" style="color:#4a4437;">View the discussion</a>.`,
  });

  const text = [
    isReplyToComment
      ? "A new reply has arrived at The Pigeon Post."
      : "A new comment has arrived at The Pigeon Post.",
    "",
    `${commenterName} ${action} on your story "${safeTitle}".`,
    "",
    truncate(commentContent, 600),
    "",
    `Read the story: ${postUrl}`,
    "",
    `You are receiving this because you wrote "${safeTitle}" on The Pigeon Post.`,
  ].join("\n");

  return sendEmail({ to, subject, html, text });
}

/**
 * Emails the recipient of a new friend request.
 */
export async function sendFriendRequestNotificationEmail(
  notification: FriendRequestNotificationEmail,
): Promise<string | null> {
  const { to, recipientName, senderName, senderEmail } = notification;

  const greeting = recipientName?.trim() || "there";
  const senderLabel = senderName.trim() || senderEmail || "Someone";
  const friendsUrl = `${getAppUrl()}/add-friends`;
  const subject = `${senderLabel} sent you a friend request`;
  const showEmail =
    Boolean(senderEmail) && senderEmail.toLowerCase() !== senderLabel.toLowerCase();

  const contentHtml = `
    <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">Dear ${escapeHtml(
      greeting,
    )},</p>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">
      <strong>${escapeHtml(
        senderLabel,
      )}</strong> would like to connect with you on The Pigeon Post.
    </p>
    ${
      showEmail
        ? `<p style="margin:0;font-family:${MONO_FONT};font-size:13px;line-height:1.6;color:#4a4437;">${escapeHtml(
            senderEmail,
          )}</p>`
        : ""
    }
    <p style="margin:16px 0 0;font-size:16px;line-height:1.6;">
      Open your friends page to accept or decline the request.
    </p>`;

  const html = renderEmailLayout({
    heading: "A friend request has arrived",
    contentHtml,
    ctaLabel: "Review the request",
    ctaUrl: friendsUrl,
    footerHtml: `You are receiving this because <strong>${escapeHtml(
      senderLabel,
    )}</strong> sent you a friend request on The Pigeon Post.`,
  });

  const text = [
    "A new friend request has arrived at The Pigeon Post.",
    "",
    `Dear ${greeting},`,
    "",
    `${senderLabel} would like to connect with you on The Pigeon Post.`,
    ...(showEmail ? ["", senderEmail] : []),
    "",
    "Open your friends page to accept or decline the request:",
    friendsUrl,
    "",
    `You are receiving this because ${senderLabel} sent you a friend request on The Pigeon Post.`,
  ].join("\n");

  return sendEmail({ to, subject, html, text });
}
