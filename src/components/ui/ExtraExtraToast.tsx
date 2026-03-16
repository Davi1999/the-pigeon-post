 "use client";

import { toast, type Toast } from "react-hot-toast";

type ExtraExtraToastProps = {
  toastInstance: Toast;
  message: string;
  link?: string | null;
  onClose?: () => void;
};

export function ExtraExtraToast({
  toastInstance,
  message,
  link,
  onClose,
}: ExtraExtraToastProps) {
  return (
    <div className="extra-extra-toast" role="status" aria-live="polite">
      <button
        type="button"
        className="extra-extra-toast-close"
        aria-label="Dismiss notification"
        onClick={() => {
          toast.dismiss(toastInstance.id);
          onClose?.();
        }}
      >
        <span
          aria-hidden
          className="material-symbols-outlined extra-extra-toast-close-icon"
        >
          close
        </span>
      </button>
      <div className="extra-extra-toast-header">Extra Extra!</div>
      <div className="extra-extra-toast-body">{message}</div>
      {link ? (
        <a
          href={link}
          className="extra-extra-toast-link"
          target="_blank"
          rel="noreferrer"
        >
          click here
        </a>
      ) : null}
    </div>
  );
}

