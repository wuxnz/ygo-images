"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { format } from "date-fns";
import Link from "next/link";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export default function TournamentHistoryPage() {
  const [selectedTournament, setSelectedTournament] = useState<string | null>(
    null,
  );

  const { data: tournamentsData, isLoading } = api.tournament.getAll.useQuery({
    status: "completed",
    limit: 100,
  });

  // Extract the actual tournaments array from the response
  const completedTournaments = tournamentsData?.items || [];

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="mt-2 h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="mb-2 h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Tournament History
        </h1>
        <p className="text-muted-foreground">
          View completed tournaments and their results
        </p>
      </div>

      {completedTournaments && completedTournaments.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {completedTournaments.map((tournament) => (
            <Card
              key={tournament.id}
              className="overflow-hidden transition-shadow hover:shadow-lg"
            >
              <CardHeader>
                <CardTitle className="line-clamp-1">
                  {tournament.name}
                </CardTitle>
                <CardDescription>
                  {format(
                    new Date(tournament.endDate || tournament.startDate),
                    "PPP",
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Participants
                    </span>
                    <Badge variant="secondary">
                      {tournament.participantCount || 0}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-sm">
                      Format
                    </span>
                    <Badge variant="outline">
                      {tournament.format.replace("_", " ").toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild className="w-full">
                  <Link href={`/tournaments/history/${tournament.id}`}>
                    View Results
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="mx-auto max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="bg-muted mb-4 flex h-24 w-24 items-center justify-center rounded-full">
              <svg
                className="text-muted-foreground h-12 w-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium">No completed tournaments</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              Check back later for completed tournaments.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
