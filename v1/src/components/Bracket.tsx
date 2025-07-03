import React, { useState } from "react";

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
  onResetMatch?: (matchId: string) => void;
  onResetRound?: (round: number) => void;
}

export const Bracket: React.FC<BracketProps> = ({
  matches,
  participants,
  bracketType,
  isCreator,
  onAdvanceWinner,
  onResetMatch,
  onResetRound,
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

  // Winner selection dialog
  const handleMatchClick = (match: any) => {
    console.log("Match clicked:", match); // Debug log
    if (!isCreator) return;

    const p1 = match.participants[0];
    const p2 = match.participants[1];
    if (!p1 || !p2) return;

    // Allow changing winner even if match is completed
    const currentWinner = match.participants.find((p: any) => p.isWinner);
    const currentWinnerText = currentWinner
      ? ` (Current winner: ${currentWinner.name})`
      : "";

    const winnerName = window.prompt(
      `Who won this match?${currentWinnerText}\nEnter "1" for ${p1.name}, "2" for ${p2.name}, or "reset" to clear the winner`,
    );

    if (winnerName === "reset") {
      if (onResetMatch) {
        onResetMatch(match.id);
      }
      return;
    }

    let winnerId: string | undefined;
    if (winnerName === "1") winnerId = p1.id;
    if (winnerName === "2") winnerId = p2.id;
    if (winnerId) {
      onAdvanceWinner(match.id, winnerId);
    }
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
                        if (
                          confirm(
                            `Are you sure you want to reset all matches in Round ${round}?`,
                          )
                        ) {
                          onResetRound(round);
                        }
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
                                if (
                                  confirm(
                                    "Are you sure you want to reset this match?",
                                  )
                                ) {
                                  onResetMatch(match.id);
                                }
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
    </div>
  );
};
