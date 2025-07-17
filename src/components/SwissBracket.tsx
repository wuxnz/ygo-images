import React, { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Types for match and participant
export interface BracketParticipant {
  id: string;
  name: string;
}

export interface BracketMatch {
  id: string;
  round: number;
  position: number;
  player1Id?: string;
  player2Id?: string;
  player1?: BracketParticipant;
  player2?: BracketParticipant;
  winnerId?: string;
  status: string;
}

interface SwissBracketProps {
  matches: BracketMatch[];
  participants: BracketParticipant[];
  isCreator: boolean;
  onSetWinner: (matchId: string, winnerId: string) => void;
  onResetMatch?: (matchId: string) => void;
  onGenerateNextRound?: () => void;
  onCompleteTournament?: () => void;
}

interface SwissStanding {
  participant: BracketParticipant;
  wins: number;
  losses: number;
  draws: number;
  points: number;
  opponents: string[];
}

export const SwissBracket: React.FC<SwissBracketProps> = ({
  matches,
  participants,
  isCreator,
  onSetWinner,
  onResetMatch,
  onGenerateNextRound,
  onCompleteTournament,
}) => {
  const [selectedMatch, setSelectedMatch] = useState<BracketMatch | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [resetMatchDialogOpen, setResetMatchDialogOpen] = useState(false);
  const [selectedMatchForReset, setSelectedMatchForReset] = useState<
    string | null
  >(null);

  // Calculate current standings
  const calculateStandings = (): SwissStanding[] => {
    const standings = new Map<string, SwissStanding>();

    // Initialize standings for all participants
    participants.forEach((participant) => {
      standings.set(participant.id, {
        participant,
        wins: 0,
        losses: 0,
        draws: 0,
        points: 0,
        opponents: [],
      });
    });

    // Process completed matches
    matches.forEach((match) => {
      if (match.status === "COMPLETED" && match.winnerId) {
        const player1Standing = standings.get(match.player1Id || "");
        const player2Standing = standings.get(match.player2Id || "");

        if (player1Standing && player2Standing) {
          // Add to opponents list
          player1Standing.opponents.push(match.player2Id || "");
          player2Standing.opponents.push(match.player1Id || "");

          // Update win/loss records
          if (match.winnerId === match.player1Id) {
            player1Standing.wins += 1;
            player1Standing.points += 3;
            player2Standing.losses += 1;
          } else if (match.winnerId === match.player2Id) {
            player2Standing.wins += 1;
            player2Standing.points += 3;
            player1Standing.losses += 1;
          }
        }
      }
    });

    return Array.from(standings.values()).sort((a, b) => {
      // Sort by points (descending)
      if (b.points !== a.points) return b.points - a.points;
      // Then by wins (descending)
      if (b.wins !== a.wins) return b.wins - a.wins;
      // Then by losses (ascending)
      return a.losses - b.losses;
    });
  };

  const standings = calculateStandings();

  // Group matches by round
  const matchesByRound = matches.reduce(
    (acc, match) => {
      const round = match.round || 0;
      if (!acc[round]) acc[round] = [];
      acc[round].push(match);
      return acc;
    },
    {} as Record<number, BracketMatch[]>,
  );

  const currentRound = Math.max(...matches.map((m) => m.round || 0), 0);
  const isCurrentRoundComplete =
    matchesByRound[currentRound]?.every(
      (match) => match.status === "COMPLETED" || match.status === "BYE",
    ) ?? false;

  const handleMatchClick = (match: BracketMatch) => {
    if (!isCreator || match.status === "COMPLETED") return;
    setSelectedMatch(match);
    setIsDialogOpen(true);
  };

  const handleWinnerSelection = (winnerId: string) => {
    if (selectedMatch && winnerId) {
      onSetWinner(selectedMatch.id, winnerId);
    }
    setIsDialogOpen(false);
    setSelectedMatch(null);
  };

  const handleResetMatch = () => {
    if (selectedMatchForReset && onResetMatch) {
      onResetMatch(selectedMatchForReset);
    }
    setResetMatchDialogOpen(false);
    setSelectedMatchForReset(null);
  };

  // Handle empty matches case
  if (matches.length === 0) {
    return (
      <div className="min-h-[400px] w-full p-4 text-center">
        <div className="text-gray-500">No matches available yet.</div>
      </div>
    );
  }

  return (
    <div className="min-h-[400px] w-full space-y-6">
      {/* Standings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
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
                {standings.map((standing, index) => (
                  <tr key={standing.participant.id} className="border-b">
                    <td className="p-2">
                      <Badge variant={index === 0 ? "default" : "secondary"}>
                        #{index + 1}
                      </Badge>
                    </td>
                    <td className="p-2 font-medium">
                      {standing.participant.name}
                    </td>
                    <td className="p-2 text-center text-green-400">
                      {standing.wins}
                    </td>
                    <td className="p-2 text-center text-red-400">
                      {standing.losses}
                    </td>
                    <td className="p-2 text-center font-bold">
                      {standing.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Matches by Round */}
      {Object.entries(matchesByRound)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([round, roundMatches]) => (
          <Card key={round}>
            <CardHeader>
              <CardTitle>Round {round}</CardTitle>
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
                          : match.status === "BYE"
                            ? "border-blue-500 bg-blue-900/20"
                            : "hover:border-gray-500"
                      }`}
                      onClick={() => handleMatchClick(match)}
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
                              {player1?.name || "BYE"}
                              {match.winnerId === match.player1Id && " 🏆"}
                            </div>
                          </div>

                          <div className="text-center text-sm text-gray-500">
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
                              {player2?.name || "BYE"}
                              {match.winnerId === match.player2Id && " 🏆"}
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 text-center">
                          <Badge
                            variant={
                              match.status === "COMPLETED"
                                ? "default"
                                : match.status === "BYE"
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {match.status}
                          </Badge>
                        </div>

                        {isCreator &&
                          onResetMatch &&
                          match.status === "COMPLETED" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="mt-2 w-full text-red-400"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMatchForReset(match.id);
                                setResetMatchDialogOpen(true);
                              }}
                            >
                              Reset Match
                            </Button>
                          )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}

      {/* Tournament Controls */}
      {isCreator && (
        <div className="flex justify-center gap-4">
          {onGenerateNextRound && isCurrentRoundComplete && (
            <Button
              onClick={onGenerateNextRound}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Generate Next Round
            </Button>
          )}
          {onCompleteTournament && (
            <Button
              onClick={onCompleteTournament}
              className="bg-green-600 hover:bg-green-700"
            >
              Complete Tournament
            </Button>
          )}
        </div>
      )}

      {/* Winner Selection Dialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Select Match Winner</AlertDialogTitle>
            <AlertDialogDescription>
              Choose the winner for this match. You can change this later if
              needed.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {selectedMatch && (
            <div className="space-y-4 py-4">
              <div className="text-center">
                <p className="mb-4 text-sm text-gray-600">
                  Round {selectedMatch.round}, Match {selectedMatch.position}
                </p>
              </div>

              <div className="space-y-3">
                {selectedMatch.player1Id && (
                  <Button
                    className="w-full"
                    onClick={() =>
                      handleWinnerSelection(selectedMatch.player1Id!)
                    }
                    variant="outline"
                  >
                    {participants.find((p) => p.id === selectedMatch.player1Id)
                      ?.name || "Player 1"}
                  </Button>
                )}

                {selectedMatch.player2Id && (
                  <Button
                    className="w-full"
                    onClick={() =>
                      handleWinnerSelection(selectedMatch.player2Id!)
                    }
                    variant="outline"
                  >
                    {participants.find((p) => p.id === selectedMatch.player2Id)
                      ?.name || "Player 2"}
                  </Button>
                )}
              </div>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Match Dialog */}
      <AlertDialog
        open={resetMatchDialogOpen}
        onOpenChange={setResetMatchDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Match</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset this match? This will clear the
              winner and reset the match status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetMatch}>
              Reset Match
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
