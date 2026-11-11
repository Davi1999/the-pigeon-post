import "server-only";

import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM =
  process.env.EMAIL_FROM?.trim() ||
  "The Pigeon Post <onboarding@resend.dev>";

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

/**
 * Emails the author of a post when somebody else comments on it.
 *
 * Returns the Resend message id when an email was sent, or `null` when Resend
 * is not configured or the request failed. Failures are logged but never
 * thrown, because a notification must not break comment creation.
 */
export async function sendReplyNotificationEmail(
  notification: ReplyNotificationEmail,
): Promise<string | null> {
  if (!resend) {
    return null;
  }

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

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#efe4cf;color:#161616;font-family:Georgia,'Times New Roman',serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#efe4cf;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background-color:#f5ecd8;border:1px solid #161616;">
            <tr>
              <td style="padding:28px 32px 22px;text-align:center;border-bottom:3px double #161616;">
                <div style="font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.3em;text-transform:uppercase;">The Pigeon Post</div>
                <div style="height:10px;"></div>
                <div style="font-size:23px;font-weight:bold;line-height:1.3;">${
                  isReplyToComment
                    ? "A new reply has arrived"
                    : "A new comment has arrived"
                }</div>
              </td>
            </tr>
            <tr>
              <td style="padding:26px 32px 6px;">
                <p style="margin:0 0 14px;font-size:16px;line-height:1.6;">Dear ${escapeHtml(
                  greeting,
                )},</p>
                <p style="margin:0 0 20px;font-size:16px;line-height:1.6;">
                  <strong>${escapeHtml(commenterName)}</strong> ${action} on your story
                  <strong>&ldquo;${escapeHtml(safeTitle)}&rdquo;</strong>.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-left:3px solid #161616;background-color:#efe4cf;">
                  <tr>
                    <td style="padding:14px 18px;font-size:15px;line-height:1.6;font-style:italic;">${formatMultiline(
                      commentContent,
                    )}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:26px 32px 32px;">
                <a href="${escapeHtml(
                  postUrl,
                )}" style="display:inline-block;background-color:#161616;color:#f5ecd8;text-decoration:none;font-family:'Courier New',monospace;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;padding:12px 22px;">Read the story</a>
              </td>
            </tr>
            <tr>
              <td style="padding:18px 32px 28px;border-top:1px solid #161616;font-size:12px;line-height:1.6;color:#4a4437;">
                You are receiving this because you wrote &ldquo;${escapeHtml(
                  safeTitle,
                )}&rdquo; on The Pigeon Post.
                <a href="${escapeHtml(
                  postUrl,
                )}" style="color:#4a4437;">View the discussion</a>.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

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
        "[email] Resend rejected the reply notification:",
        error.name,
        error.message,
      );
      return null;
    }

    return data?.id ?? null;
  } catch (error) {
    console.error("[email] Failed to send the reply notification:", error);
    return null;
  }
}
