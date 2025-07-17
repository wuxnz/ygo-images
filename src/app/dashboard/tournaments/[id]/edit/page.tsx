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
        defaultValues={tournament}
        onSubmit={async (values) => {
          await updateMutation.mutateAsync({ id, ...values });
        }}
        isSubmitting={updateMutation.isPending}
      />
    </div>
  );
}
