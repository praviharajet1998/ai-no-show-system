"use client";

import { useTransition } from "react";

import { recordOutcomeAction } from "@/app/appointments/[id]/actions";
import { Button } from "@/components/ui/button";

export function OutcomeActions({ appointmentId }: { appointmentId: string }) {
  const [isPending, startTransition] = useTransition();

  function record(noShow: boolean) {
    startTransition(async () => {
      await recordOutcomeAction(appointmentId, noShow);
    });
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" disabled={isPending} onClick={() => record(false)}>
        Mark attended
      </Button>
      <Button variant="outline" size="sm" disabled={isPending} onClick={() => record(true)}>
        Mark no-show
      </Button>
    </div>
  );
}
