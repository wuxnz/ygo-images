"use client";

import { useParams } from "next/navigation";
import { api } from "@/trpc/react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Crown } from "lucide-react";
import { TournamentTop8DeckModal } from "@/components/tournament/TournamentTop8DeckModal";

export default function TournamentHistoryDetailPage() {
  const params = useParams();
  const tournamentId = params.id as string;

  const { data: tournamentResults, isLoading } =
    api.tournamentResults.getTournamentResults.useQuery({
      tournamentId,
    });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="mt-2 h-4 w-96" />
        </div>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!tournamentResults) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Tournament Results Not Found</h1>
          <p className="text-muted-foreground mt-2">
            The tournament results you're looking for don't exist.
          </p>
        </div>
      </div>
    );
  }

  const getPlacementIcon = (placement: number) => {
    switch (placement) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-orange-400" />;
      default:
        return <Trophy className="h-5 w-5 text-blue-500" />;
    }
  };

  const getPlacementColor = (placement: number) => {
    switch (placement) {
      case 1:
        return "border-yellow-200";
      case 2:
        return "border-gray-200";
      case 3:
        return "border-orange-200";
      default:
        return "border-blue-200";
    }
  };

  const getPlacementSuffix = (placement: number) => {
    if (placement === 1) return "st";
    if (placement === 2) return "nd";
    if (placement === 3) return "rd";
    return "th";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {tournamentResults.tournament.name}
        </h1>
        <p className="text-muted-foreground">
          Tournament Results •{" "}
          {tournamentResults.tournament.endDate
            ? format(new Date(tournamentResults.tournament.endDate), "PPP")
            : "Date TBD"}
        </p>
      </div>

      <div className="grid gap-6">
        {/* Tournament Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Tournament Summary</CardTitle>
            <CardDescription>
              {tournamentResults.tournament.size || 0} participants
              {tournamentResults.tournament.endDate
                ? ` • Completed on ${format(new Date(tournamentResults.tournament.endDate), "PPP")}`
                : ""}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tournamentResults.winner && (
              <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage
                    src={tournamentResults.winner.user.image || undefined}
                  />
                  <AvatarFallback>
                    {tournamentResults.winner.user.name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-muted-foreground text-sm">Champion</p>
                  <p className="font-semibold">
                    {tournamentResults.winner.user.name}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top 8 Results */}
        <Card>
          <CardHeader>
            <CardTitle>Top 8 Results</CardTitle>
            <CardDescription>Final standings with deck details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tournamentResults.top8.map((placement: any) => (
                <TournamentTop8DeckModal
                  key={placement.id}
                  placement={placement.placement}
                  user={placement.user}
                  deck={placement.deck}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
