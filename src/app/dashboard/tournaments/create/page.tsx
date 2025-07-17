"use client";

import { Button } from "@/components/ui/button";
import { TournamentForm } from "@/components/tournament-form";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";

export default function CreateTournamentPage() {
  const router = useRouter();
  const createMutation = api.tournament.create.useMutation({
    onSuccess: () => {
      router.push("/dashboard/tournaments");
    },
  });

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-foreground! text-2xl font-bold">
          Create Tournament
        </h1>
        <Button variant="outline" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>

      <div className="mt-6">
        <TournamentForm
          onSubmit={async (values) => {
            await createMutation.mutateAsync(values);
          }}
          isSubmitting={createMutation.isPending}
        />
      </div>
    </div>
  );
}
