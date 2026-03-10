"use client";

import { useState } from "react";
import { EditionOptionsAccordion } from "./EditionOptionsAccordion";

type DashboardEmptyStateProps = {
  sidebarContent: React.ReactNode;
  children: React.ReactNode;
};

export function DashboardEmptyState({
  sidebarContent,
  children,
}: DashboardEmptyStateProps) {
  const [accordionOpen, setAccordionOpen] = useState(false);

  return (
    <div className="space-y-6">
      <EditionOptionsAccordion
        open={accordionOpen}
        onToggle={() => setAccordionOpen((o) => !o)}
      >
        {sidebarContent}
      </EditionOptionsAccordion>
      {children}
    </div>
  );
}
