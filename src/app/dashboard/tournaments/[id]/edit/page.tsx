"use client";

import { useParams, useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { TournamentForm } from "@/components/tournament-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type TournamentFormValues = {
  name: string;
  size: number;
  bracketType: string;
  rules: string;
  prize: string;
  startDate: Date;
  endDate: Date;
};

export default function EditTournamentPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const { data: tournament, isLoading } = api.tournament.getById.useQuery({
    id,
  });
  const updateMutation = api.tournament.update.useMutation({
    onSuccess: () => {
      router.push(`/dashboard/tournaments/${id}`);
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!tournament) {
    return <div>Tournament not found</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Tournament</h1>
        <Button asChild variant="outline">
          <Link href={`/dashboard/tournaments/${id}`}>Cancel</Link>
        </Button>
      </div>

      <TournamentForm
        defaultValues={{
          name: tournament.name,
          size: tournament.maxPlayers,
          teamSize: 1, // Default value since it's not in the tournament model
          bracketType: tournament.format.toUpperCase().replace("-", "_"),
          rules: tournament.description || "",
          prize: "", // Default value since it's not in the tournament model
          startDate: tournament.startDate,
          endDate: tournament.endDate || undefined,
        }}
        onSubmit={async (values) => {
          await updateMutation.mutateAsync({
            id,
            name: values.name,
            maxPlayers: values.size,
            startDate: values.startDate,
            endDate: values.endDate,
            description: values.rules,
          });
        }}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  );
}
