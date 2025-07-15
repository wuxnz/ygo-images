import { api } from "@/trpc/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { TournamentTable } from "@/components/tournament-table";

export default async function TournamentsPage() {
  const tournaments = await api.tournament.getAll();

  // Filter to show only active (not completed) tournaments
  const activeTournaments = tournaments.filter((t) => !t.completed);

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">Active Tournaments</h1>
        <Button asChild>
          <Link
            href="/dashboard/tournaments/create"
            className="text-foreground!"
          >
            Create Tournament
          </Link>
        </Button>
      </div>

      <TournamentTable tournaments={activeTournaments} />
    </div>
  );
}
