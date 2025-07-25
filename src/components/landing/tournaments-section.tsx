"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { api } from "@/trpc/react";
import { format } from "date-fns";
import type { RouterOutputs } from "@/trpc/react";

export function TournamentsSection() {
  const { data: tournaments, isLoading } = api.tournament.getAll.useQuery({});

  if (isLoading) return null;
  if (!tournaments || tournaments.items.length === 0) return null;

  type Tournament = RouterOutputs["tournament"]["getAll"]["items"][number];

  // Sort by startDate descending and take the latest 3
  const latestTournaments = [...tournaments.items]
    .sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    )
    .slice(0, 3);

  const statusVariants = {
    Upcoming: "bg-blue-500",
    Ongoing: "bg-green-500",
    Completed: "bg-gray-500",
  };

  // Helper to get status
  function getStatus(tournament: Tournament) {
    const now = new Date();
    if (new Date(tournament.startDate) > now) return "Upcoming";
    if (tournament.endDate && new Date(tournament.endDate) < now)
      return "Completed";
    return "Ongoing";
  }

  // Helper to format date range
  function formatDateRange(
    start: Date | string | { $date: string } | null,
    end: Date | string | { $date: string } | null,
  ) {
    // Helper to extract date from various formats
    const parseDate = (
      date: Date | string | { $date: string } | null,
    ): Date | null => {
      if (!date) return null;
      if (date instanceof Date) return date;
      if (typeof date === "string") return new Date(date);
      if (typeof date === "object" && "$date" in date)
        return new Date(date.$date);
      return null;
    };

    const startDate = parseDate(start);
    const endDate = parseDate(end);

    if (!startDate) return "N/A";
    if (!endDate || startDate.toDateString() === endDate.toDateString()) {
      return format(startDate, "MMM d, yyyy");
    }
    return `${format(startDate, "MMM d, yyyy")} - ${format(endDate, "MMM d, yyyy")}`;
  }

  return (
    <section>
      <div className="container mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex w-full flex-col items-center">
            <h2 className="text-3xl font-bold md:text-4xl">
              Upcoming Tournaments
            </h2>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Join the competition in these exciting upcoming events
            </p>
          </div>
          <Button asChild className="text-foreground">
            <Link href="/dashboard/tournaments">View All</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {latestTournaments.map((tournament) => (
            <Card
              key={tournament.id}
              className="transition-shadow hover:shadow-lg"
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {tournament.name}
                  <Badge
                    className={
                      statusVariants[
                        getStatus(tournament) as keyof typeof statusVariants
                      ]
                    }
                  >
                    {getStatus(tournament)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Game:
                    </span>
                    <span className="font-medium">{tournament.format}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Date:
                    </span>
                    <span className="font-medium">
                      {formatDateRange(
                        tournament.startDate,
                        tournament.endDate,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Prize:
                    </span>
                    <span className="font-medium">
                      {tournament.prize || "No prize specified"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">
                      Participants:
                    </span>
                    <span className="font-medium">
                      {tournament.participantCount ?? 0}
                    </span>
                  </div>
                  <Button asChild className="text-foreground mt-4 w-full">
                    <Link href={`/dashboard/tournaments/${tournament.id}`}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
