 "use client";

import { useEffect, useState } from "react";
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
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (hasFetched) return;
    setHasFetched(true);

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
  }, [hasFetched]);

  return null;
}

