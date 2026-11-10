 "use client";

import { useEffect, useRef } from "react";
import { toast } from "react-hot-toast";
import { ExtraExtraToast } from "@/components/ui/ExtraExtraToast";

type ApiNotification = {
  id: string;
  body: string;
  link: string | null;
  createdAt: string;
};

type ApiResponse = {
  notification: ApiNotification | null;
};

export function DashboardNotifications() {
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    async function fetchNotification() {
      try {
        const res = await fetch("/api/notifications/next", {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          return;
        }

        const data = (await res.json()) as ApiResponse;

        if (!data.notification) {
          return;
        }

        const n = data.notification;

        toast.custom(
          (t) => (
            <ExtraExtraToast
              toastInstance={t}
              message={n.body}
              link={n.link}
            />
          ),
          {
            id: `notification-${n.id}`,
            duration: Infinity,
            position: "top-right",
          },
        );
      } catch {
        // Swallow errors; notifications are non-critical UX.
      }
    }

    void fetchNotification();
  }, []);

  return null;
}

