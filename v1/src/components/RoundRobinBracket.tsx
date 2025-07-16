"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";

interface Participant {
  id: string;
  name: string;
  image?: string | null;
}

interface Match {
  id: string;
  round: number;
  position: number;
  player1Id?: string;
  player2Id?: string;
  winnerId?: string;
  status: string;
}

interface RoundRobinBracketProps {
  matches: Match[];
  participants: Participant[];
  isCreator: boolean;
  onAdvanceWinner: (matchId: string, winnerId: string) => void;
  onResetMatch: (matchId: string) => void;
  onCompleteTournament: () => void;
}

export function RoundRobinBracket({
  matches,
  participants,
  isCreator,
  onAdvanceWinner,
  onResetMatch,
  onCompleteTournament,
}: RoundRobinBracketProps) {
  // Group matches by round
  const rounds = matches.reduce(
    (acc, match) => {
      if (!acc[match.round]) {
        acc[match.round] = [];
      }
      acc[match.round].push(match);
      return acc;
    },
    {} as Record<number, Match[]>,
  );

  // Calculate standings
  const standings = calculateStandings(matches, participants);

  // Check if all matches are completed
  const allMatchesCompleted = matches.every(
    (match) => match.status === "COMPLETED",
  );

  const getParticipantName = (participantId?: string) => {
    if (!participantId) return "TBD";
    const participant = participants.find((p) => p.id === participantId);
    return participant?.name || "Unknown";
  };

  const getParticipantAvatar = (participantId?: string) => {
    if (!participantId) return null;
    const participant = participants.find((p) => p.id === participantId);
    return participant;
  };

  return (
    <div className="space-y-6">
      {/* Standings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Current Standings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-2 text-left">Rank</th>
                  <th className="py-2 text-left">Player</th>
                  <th className="py-2 text-center">Wins</th>
                  <th className="py-2 text-center">Losses</th>
                  <th className="py-2 text-center">Win %</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((standing, index) => (
                  <tr key={standing.participantId} className="border-b">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        {index === 0 && (
                          <Trophy className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className="font-semibold">{index + 1}</span>
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={
                              getParticipantAvatar(standing.participantId)
                                ?.image || undefined
                            }
                          />
                          <AvatarFallback>
                            {getParticipantName(standing.participantId).charAt(
                              0,
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <span>
                          {getParticipantName(standing.participantId)}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-center">{standing.wins}</td>
                    <td className="py-3 text-center">{standing.losses}</td>
                    <td className="py-3 text-center">
                      {standing.totalMatches > 0
                        ? (
                            (standing.wins / standing.totalMatches) *
                            100
                          ).toFixed(1)
                        : "0.0"}
                      %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Matches by Round */}
      {Object.entries(rounds).map(([roundNumber, roundMatches]) => (
        <Card key={roundNumber}>
          <CardHeader>
            <CardTitle>Round {parseInt(roundNumber) + 1}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {roundMatches.map((match) => (
                <div
                  key={match.id}
                  className={cn(
                    "rounded-lg border p-4",
                    match.status === "COMPLETED" && "bg-green-50",
                    match.status === "IN_PROGRESS" && "bg-yellow-50",
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={
                              getParticipantAvatar(match.player1Id)?.image ||
                              undefined
                            }
                          />
                          <AvatarFallback>
                            {getParticipantName(match.player1Id).charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={cn(
                            "font-medium",
                            match.winnerId === match.player1Id &&
                              "text-green-600",
                          )}
                        >
                          {getParticipantName(match.player1Id)}
                        </span>
                      </div>
                      <span className="text-gray-400">vs</span>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={
                              getParticipantAvatar(match.player2Id)?.image ||
                              undefined
                            }
                          />
                          <AvatarFallback>
                            {getParticipantName(match.player2Id).charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span
                          className={cn(
                            "font-medium",
                            match.winnerId === match.player2Id &&
                              "text-green-600",
                          )}
                        >
                          {getParticipantName(match.player2Id)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          match.status === "COMPLETED" ? "default" : "outline"
                        }
                        className={cn(
                          match.status === "COMPLETED" &&
                            "bg-green-100 text-green-800",
                          match.status === "IN_PROGRESS" &&
                            "bg-yellow-100 text-yellow-800",
                        )}
                      >
                        {match.status === "COMPLETED" ? "Completed" : "Pending"}
                      </Badge>

                      {isCreator && match.status === "PENDING" && (
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              onAdvanceWinner(match.id, match.player1Id!)
                            }
                            disabled={!match.player1Id || !match.player2Id}
                          >
                            {getParticipantName(match.player1Id)} Wins
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              onAdvanceWinner(match.id, match.player2Id!)
                            }
                            disabled={!match.player1Id || !match.player2Id}
                          >
                            {getParticipantName(match.player2Id)} Wins
                          </Button>
                        </div>
                      )}

                      {isCreator && match.status === "COMPLETED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onResetMatch(match.id)}
                        >
                          Reset
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Complete Tournament Button */}
      {isCreator && allMatchesCompleted && (
        <div className="text-center">
          <Button
            onClick={onCompleteTournament}
            className="bg-green-600 hover:bg-green-700"
          >
            Complete Tournament
          </Button>
        </div>
      )}
    </div>
  );
}

function calculateStandings(matches: Match[], participants: Participant[]) {
  const standings = participants.map((participant) => ({
    participantId: participant.id,
    name: participant.name,
    wins: 0,
    losses: 0,
    totalMatches: 0,
  }));

  matches.forEach((match) => {
    if (match.status === "COMPLETED" && match.winnerId) {
      const winnerIndex = standings.findIndex(
        (s) => s.participantId === match.winnerId,
      );
      const loserId =
        match.winnerId === match.player1Id ? match.player2Id : match.player1Id;
      const loserIndex = standings.findIndex(
        (s) => s.participantId === loserId,
      );

      if (winnerIndex !== -1) {
        standings[winnerIndex].wins++;
        standings[winnerIndex].totalMatches++;
      }
      if (loserIndex !== -1) {
        standings[loserIndex].losses++;
        standings[loserIndex].totalMatches++;
      }
    }
  });

  // Sort by wins (descending), then by losses (ascending)
  return standings.sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    return a.losses - b.losses;
  });
}
