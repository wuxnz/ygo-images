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

interface BracketProps {
  matches: BracketMatch[];
  participants: BracketParticipant[];
  bracketType: string;
  isCreator: boolean;
  onAdvanceWinner: (matchId: string, winnerId: string) => void;
  onAdvanceAllWinners?: () => void;
  onResetMatch?: (matchId: string) => void;
  onResetRound?: (round: number) => void;
  onCompleteTournament?: () => void;
}

export const Bracket: React.FC<BracketProps> = ({
  matches,
  participants,
  bracketType,
  isCreator,
  onAdvanceWinner,
  onAdvanceAllWinners,
  onResetMatch,
  onResetRound,
  onCompleteTournament,
}) => {
  const [finalWinner, setFinalWinner] = useState<BracketParticipant | null>(
    null,
  );

  // Find the final match (highest round number)
  const finalRound = Math.max(...matches.map((m) => m.round), 0);
  const finalMatches = matches.filter((m) => m.round === finalRound);
  const tournamentFinished = finalMatches.some(
    (m) => m.status === "COMPLETED" && m.winnerId,
  );
  const winnerId = tournamentFinished
    ? finalMatches.find((m) => m.status === "COMPLETED" && m.winnerId)?.winnerId
    : undefined;
  const winner = participants.find((p) => p.id === winnerId) || null;

  // Map matches to the format expected by @g-loot/react-tournament-brackets
  const mappedMatches = matches.map((match) => ({
    id: match.id,
    name: `Match ${match.round}-${match.position}`,
    nextMatchId: null, // This can be calculated for more advanced logic
    tournamentRoundText: `Round ${match.round}`,
    startTime: "",
    state: {
      status: match.status === "COMPLETED" ? "DONE" : "RUNNING",
    },
    participants: [
      match.player1Id
        ? {
            id: match.player1Id,
            name:
              participants.find((p) => p.id === match.player1Id)?.name || "TBD",
            isWinner: match.winnerId === match.player1Id,
            resultText: match.winnerId === match.player1Id ? "W" : "",
          }
        : { id: "bye1", name: "BYE", isWinner: false, resultText: "" },
      match.player2Id
        ? {
            id: match.player2Id,
            name:
              participants.find((p) => p.id === match.player2Id)?.name || "TBD",
            isWinner: match.winnerId === match.player2Id,
            resultText: match.winnerId === match.player2Id ? "W" : "",
          }
        : { id: "bye2", name: "BYE", isWinner: false, resultText: "" },
    ],
  }));

  // Debug logging
  console.log("Bracket Debug:", {
    matchesCount: matches.length,
    participantsCount: participants.length,
    bracketType,
    mappedMatches: mappedMatches.slice(0, 3), // Show first 3 matches
    rawMatches: matches.slice(0, 3), // Show first 3 raw matches
  });

  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [resetRoundDialogOpen, setResetRoundDialogOpen] = useState(false);
  const [resetMatchDialogOpen, setResetMatchDialogOpen] = useState(false);
  const [advanceAllDialogOpen, setAdvanceAllDialogOpen] = useState(false);
  const [completeTournamentDialogOpen, setCompleteTournamentDialogOpen] =
    useState(false);
  const [selectedRoundForReset, setSelectedRoundForReset] = useState<
    number | null
  >(null);
  const [selectedMatchForReset, setSelectedMatchForReset] = useState<
    string | null
  >(null);

  const handleMatchClick = (match: any) => {
    console.log("Match clicked:", match);
    if (!isCreator) return;

    const p1 = match.participants[0];
    const p2 = match.participants[1];
    if (!p1 || !p2) return;

    setSelectedMatch(match);
    setIsDialogOpen(true);
  };

  const handleWinnerSelection = (winnerId: string) => {
    if (selectedMatch && winnerId) {
      onAdvanceWinner(selectedMatch.id, winnerId);
    }
    setIsDialogOpen(false);
    setSelectedMatch(null);
  };

  const handleResetMatch = () => {
    if (selectedMatch && onResetMatch) {
      onResetMatch(selectedMatch.id);
    }
    setIsDialogOpen(false);
    setSelectedMatch(null);
  };

  const handleResetRound = () => {
    if (selectedRoundForReset !== null && onResetRound) {
      onResetRound(selectedRoundForReset);
    }
    setResetRoundDialogOpen(false);
    setSelectedRoundForReset(null);
  };

  const handleResetSingleMatch = () => {
    if (selectedMatchForReset && onResetMatch) {
      onResetMatch(selectedMatchForReset);
    }
    setResetMatchDialogOpen(false);
    setSelectedMatchForReset(null);
  };

  const handleCompleteTournament = () => {
    setCompleteTournamentDialogOpen(true);
  };

  // Handle empty matches case
  if (matches.length === 0) {
    return (
      <div className="bracket min-h-[400px] w-full p-4 text-center">
        <div className="text-gray-500">No matches available yet.</div>
      </div>
    );
  }

  // Show winner if tournament is finished
  return (
    <div className="bracket min-h-[400px] w-full">
      {tournamentFinished && winner ? (
        <div className="mb-4 text-center text-2xl font-bold text-green-400">
          Winner: {winner.name} 🏆
        </div>
      ) : null}

      {isCreator && (
        <div className="mb-4 flex justify-center gap-2">
          {onAdvanceAllWinners && (
            <Button
              onClick={() => setAdvanceAllDialogOpen(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Advance All Winners
            </Button>
          )}
          {tournamentFinished && (
            <Button
              onClick={handleCompleteTournament}
              className="bg-green-600 hover:bg-green-700"
            >
              Complete Tournament
            </Button>
          )}
        </div>
      )}

      {/* Simple Bracket Display - Custom Implementation */}
      <div className="simple-bracket space-y-6">
        {Array.from(new Set(matches.map((m) => m.round)))
          .sort()
          .map((round) => {
            const roundMatches = matches.filter((m) => m.round === round);
            return (
              <div key={round} className="round">
                <div className="mb-3 flex items-center justify-center gap-4">
                  <h3 className="text-lg font-semibold">
                    {round === Math.max(...matches.map((m) => m.round))
                      ? "Final"
                      : `Round ${round}`}
                  </h3>
                  {isCreator && onResetRound && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRoundForReset(round);
                        setResetRoundDialogOpen(true);
                      }}
                      className="text-xs text-red-400 underline hover:text-red-300"
                    >
                      Reset Round
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap justify-center gap-4">
                  {roundMatches.map((match) => {
                    const player1 = participants.find(
                      (p) => p.id === match.player1Id,
                    );
                    const player2 = participants.find(
                      (p) => p.id === match.player2Id,
                    );

                    return (
                      <div
                        key={match.id}
                        className={`match-card min-w-[200px] cursor-pointer rounded-lg border p-4 transition-colors ${
                          match.status === "COMPLETED"
                            ? "border-green-500 bg-green-900/20"
                            : "border-gray-600 bg-gray-800 hover:border-gray-500"
                        }`}
                        onClick={() =>
                          handleMatchClick({
                            id: match.id,
                            name: `Match ${match.round}-${match.position}`,
                            nextMatchId: null,
                            tournamentRoundText: `Round ${match.round}`,
                            startTime: "",
                            state: {
                              status:
                                match.status === "COMPLETED"
                                  ? "DONE"
                                  : "RUNNING",
                            },
                            participants: [
                              {
                                id: match.player1Id || "bye1",
                                name: player1?.name || "BYE",
                                isWinner: match.winnerId === match.player1Id,
                                resultText:
                                  match.winnerId === match.player1Id ? "W" : "",
                              },
                              {
                                id: match.player2Id || "bye2",
                                name: player2?.name || "BYE",
                                isWinner: match.winnerId === match.player2Id,
                                resultText:
                                  match.winnerId === match.player2Id ? "W" : "",
                              },
                            ],
                          })
                        }
                      >
                        <div className="space-y-2">
                          <div
                            className={`player rounded p-2 ${
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
                            className={`player rounded p-2 ${
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
                            ? "Completed (Click to change winner)"
                            : "Click to set winner"}
                        </div>
                        {isCreator &&
                          onResetMatch &&
                          match.status === "COMPLETED" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedMatchForReset(match.id);
                                setResetMatchDialogOpen(true);
                              }}
                              className="mt-1 text-xs text-red-400 underline hover:text-red-300"
                            >
                              Reset Match
                            </button>
                          )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
      </div>
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
                  {selectedMatch.tournamentRoundText}
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() =>
                    handleWinnerSelection(selectedMatch.participants[0].id)
                  }
                  variant={
                    selectedMatch.participants[0].isWinner
                      ? "default"
                      : "outline"
                  }
                >
                  {selectedMatch.participants[0].name}
                  {selectedMatch.participants[0].isWinner && " 🏆"}
                </Button>

                <div className="text-center text-sm text-gray-500">vs</div>

                <Button
                  className="w-full"
                  onClick={() =>
                    handleWinnerSelection(selectedMatch.participants[1].id)
                  }
                  variant={
                    selectedMatch.participants[1].isWinner
                      ? "default"
                      : "outline"
                  }
                >
                  {selectedMatch.participants[1].name}
                  {selectedMatch.participants[1].isWinner && " 🏆"}
                </Button>
              </div>
            </div>
          )}

          <AlertDialogFooter>
            {selectedMatch?.participants.some((p: any) => p.isWinner) && (
              <Button variant="destructive" onClick={handleResetMatch}>
                Reset Match
              </Button>
            )}
            <AlertDialogCancel>Cancel</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Advance All Winners Dialog */}
      <AlertDialog
        open={advanceAllDialogOpen}
        onOpenChange={setAdvanceAllDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Advance All Winners</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to advance all winners to the next round?
              This will complete all matches with declared winners.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onAdvanceAllWinners?.();
                setAdvanceAllDialogOpen(false);
              }}
            >
              Advance All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Round Dialog */}
      <AlertDialog
        open={resetRoundDialogOpen}
        onOpenChange={setResetRoundDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Round</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset all matches in Round{" "}
              {selectedRoundForReset}? This will clear all winners and reset
              match statuses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetRound}>
              Reset Round
            </AlertDialogAction>
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
            <AlertDialogAction onClick={handleResetSingleMatch}>
              Reset Match
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete Tournament Dialog */}
      <AlertDialog
        open={completeTournamentDialogOpen}
        onOpenChange={setCompleteTournamentDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Complete Tournament</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to complete this tournament? This will move
              it to tournament history and calculate final placements.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (onCompleteTournament) {
                  onCompleteTournament();
                }
                setCompleteTournamentDialogOpen(false);
              }}
            >
              Complete Tournament
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
