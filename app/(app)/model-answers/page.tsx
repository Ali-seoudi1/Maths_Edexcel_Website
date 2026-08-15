import type { Metadata } from "next";
import { Lock } from "lucide-react";

import { PageHeader } from "@/components/shared";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Key Questions",
  description: "Search published Edexcel Mathematics key questions.",
};

export default function ModelAnswersPage() {
  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Key Questions"
        title="Key Questions is locked"
        description="This section is not available to students right now."
      />

      <Card>
        <CardContent className="flex min-h-72 flex-col items-center justify-center gap-4 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Lock className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Locked for now</h2>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              Your teacher has not opened Key Questions yet. It will appear here when available.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
