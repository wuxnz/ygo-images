import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { BracketMatch, BracketParticipant } from "@/components/Bracket";
import { api } from "@/trpc/react";

interface SwissTournamentBracketProps {
  tournamentId: string;
  matches: BracketMatch[];
  participants: BracketParticipant[];
  isCreator: boolean;
  onAdvanceWinner: (matchId: string, winnerId: string) => void;
  onResetMatch: (matchId: string) => void;
  onCompleteTournament: () => void;
}

interface SwissStanding {
  participant: BracketParticipant;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  rank: number;
}

export const SwissTournamentBracket: React.FC<SwissTournamentBracketProps> = ({
  tournamentId,
  matches,
  participants,
  isCreator,
  onAdvanceWinner,
  onResetMatch,
  onCompleteTournament,
}) => {
  const [showStandings, setShowStandings] = useState(false);

  // Fetch Swiss standings
  const { data: standingsData, refetch: refetchStandings } =
    api.tournamentSwiss.getSwissStandings.useQuery(
      { tournamentId },
      { enabled: !!tournamentId },
    );

  // Generate new pairings mutation
  const generatePairingsMutation =
    api.tournamentSwiss.generateSwissPairings.useMutation({
      onSuccess: () => {
        refetchStandings();
      },
    });

  const handleGeneratePairings = async () => {
    try {
      await generatePairingsMutation.mutateAsync({ tournamentId });
    } catch (error) {
      console.error("Error generating pairings:", error);
    }
  };

  // Calculate current round
  const currentRound = Math.max(...matches.map((m) => m.round), 0);
  const completedMatches = matches.filter((m) => m.status === "COMPLETED");
  const scheduledMatches = matches.filter((m) => m.status !== "COMPLETED");

  // Group matches by round
  const matchesByRound = matches.reduce(
    (acc, match) => {
      acc[match.round] ??= [];
      acc[match.round]?.push(match);
      return acc;
    },
    {} as Record<number, BracketMatch[]>,
  );

  // Check if all matches in current round are completed
  const isCurrentRoundComplete =
    matchesByRound[currentRound]?.every((m) => m.status === "COMPLETED") ??
    false;

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap gap-4">
        {isCreator && (
          <>
            <Button
              onClick={handleGeneratePairings}
              disabled={
                generatePairingsMutation.isPending || !isCurrentRoundComplete
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {generatePairingsMutation.isPending
                ? "Generating..."
                : "Generate Next Round"}
            </Button>
            <Button
              onClick={() => setShowStandings(!showStandings)}
              variant="outline"
            >
              {showStandings ? "Hide Standings" : "Show Standings"}
            </Button>
          </>
        )}
      </div>

      {/* Swiss Standings */}
      {showStandings && standingsData && (
        <Card>
          <CardHeader>
            <CardTitle>Current Standings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="p-2 text-left">Rank</th>
                    <th className="p-2 text-left">Player</th>
                    <th className="p-2 text-center">Wins</th>
                    <th className="p-2 text-center">Losses</th>
                    <th className="p-2 text-center">Points</th>
                  </tr>
                </thead>
                <tbody>
                  {standingsData.standings.map(
                    (standing: any, index: number) => (
                      <tr key={standing.participant.id} className="border-b">
                        <td className="p-2">
                          <Badge variant={index < 3 ? "default" : "secondary"}>
                            #{index + 1}
                          </Badge>
                        </td>
                        <td className="p-2">{standing.participant.name}</td>
                        <td className="p-2 text-center">{standing.wins}</td>
                        <td className="p-2 text-center">{standing.losses}</td>
                        <td className="p-2 text-center font-bold">
                          {standing.points}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Matches by Round */}
      <div className="space-y-8">
        {Object.entries(matchesByRound)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([round, roundMatches]) => (
            <Card key={round}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Round {round}</span>
                  <Badge variant="outline">
                    {
                      roundMatches.filter((m) => m.status === "COMPLETED")
                        .length
                    }{" "}
                    / {roundMatches.length} Completed
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {roundMatches.map((match) => {
                    const player1 = participants.find(
                      (p) => p.id === match.player1Id,
                    );
                    const player2 = participants.find(
                      (p) => p.id === match.player2Id,
                    );

                    return (
                      <Card
                        key={match.id}
                        className={`cursor-pointer transition-colors ${
                          match.status === "COMPLETED"
                            ? "border-green-500 bg-green-900/20"
                            : "border-gray-600 hover:border-gray-500"
                        }`}
                        onClick={() => {
                          if (isCreator && match.player1Id && match.player2Id) {
                            // Handle match result entry
                            const winner = prompt(
                              `Select winner for ${player1?.name} vs ${player2?.name}:\n1. ${player1?.name}\n2. ${player2?.name}`,
                            );
                            if (winner === "1" && match.player1Id) {
                              onAdvanceWinner(match.id, match.player1Id);
                            } else if (winner === "2" && match.player2Id) {
                              onAdvanceWinner(match.id, match.player2Id);
                            }
                          }
                        }}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <div
                              className={`rounded p-2 ${
                                match.winnerId === match.player1Id
                                  ? "bg-green-600 text-white"
                                  : "bg-gray-700"
                              }`}
                            >
                              <div className="font-medium">
                                {player1?.name || "TBD"}
                                {match.winnerId === match.player1Id && " 🏆"}
                              </div>
                            </div>
                            <div className="text-center text-sm text-gray-400">
                              vs
                            </div>
                            <div
                              className={`rounded p-2 ${
                                match.winnerId === match.player2Id
                                  ? "bg-green-600 text-white"
                                  : "bg-gray-700"
                              }`}
                            >
                              <div className="font-medium">
                                {player2?.name || "TBD"}
                                {match.winnerId === match.player2Id && " 🏆"}
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 text-center text-xs text-gray-500">
                            {match.status === "COMPLETED"
                              ? "Completed"
                              : "Pending"}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Tournament Completion */}
      {isCreator && matches.length > 0 && (
        <div className="flex justify-center">
          <Button
            onClick={onCompleteTournament}
            className="bg-green-600 hover:bg-green-700"
            disabled={!isCurrentRoundComplete}
          >
            Complete Tournament
          </Button>
        </div>
      )}
    </div>
  );
};
