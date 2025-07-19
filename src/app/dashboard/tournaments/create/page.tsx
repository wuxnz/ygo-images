"use client";

import { Button } from "@/components/ui/button";
import { TournamentForm } from "@/components/tournament-form";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/ui/back-button";

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
        <BackButton />
      </div>

      <div className="mt-6">
        <TournamentForm
          onSubmit={async (values) => {
            await createMutation.mutateAsync({
              name: values.name,
              format: values.bracketType.toLowerCase() as
                | "swiss"
                | "round_robin"
                | "single_elimination"
                | "double_elimination",
              maxPlayers: values.size,
              startDate: values.startDate,
              endDate: values.endDate,
              prize: values.prize,
              teamSize: values.teamSize,
              description: values.rules,
            });
          }}
          isSubmitting={createMutation.isPending}
        />
      </div>
    </div>
  );
}
