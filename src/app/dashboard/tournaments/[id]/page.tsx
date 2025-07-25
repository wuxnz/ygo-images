"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { Bracket } from "@/components/Bracket";
import { SwissTournamentBracket } from "@/components/tournament/SwissTournamentBracket";
import { useState } from "react";
import { Form } from "@/components/ui/form";
import { useNotifications } from "@/lib/notifications/NotificationContext";
import type { NotificationType } from "@/types/notifications";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React from "react";
import z from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { TournamentParticipantCard } from "@/components/tournament/TournamentParticipantCard";
import { TeamTournamentManager } from "@/components/tournament/TeamTournamentManager";
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
import BackButton from "@/components/ui/back-button";

export default function TournamentDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";
  const { data: session } = useSession();
  const utils = api.useUtils();
  const { addNotification } = useNotifications();
  const [bracketError, setBracketError] = useState<string | null>(null);

  const { data: tournament, isLoading } = api.tournament.getById.useQuery({
    id,
  });

  const updateParticipantDeck =
    api.tournament.updateParticipantDeck.useMutation({
      onSuccess: () => {
        utils.tournament.getById.invalidate({ id });
      },
    });

  const getDecks = api.deck.getUserDecks.useQuery();

  const joinMutation = api.tournament.join.useMutation({
    onSuccess: () => {
      utils.tournament.getById.invalidate({ id });
      if (tournament) {
        addNotification({
          type: "TOURNAMENT_JOINED" as NotificationType,
          message: `You have joined tournament "${tournament.name}"`,
        });
      }
    },
  });

  const deleteMutation = api.tournament.delete.useMutation({
    onSuccess: () => {
      router.push("/dashboard/tournaments");
    },
    onError: (error) => {
      console.error("Failed to delete tournament", error);
    },
  });

  // Use matches from tournament data instead of separate query
  const matches =
    tournament?.rounds?.flatMap((round) =>
      round.matches.map((match) => ({
        ...match,
        round: round.roundNumber,
      })),
    ) ?? [];
  const matchesLoading = false;
  const refetchMatches = () => {
    utils.tournament.getById.invalidate({ id });
  };

  const startMutation = api.tournamentSwiss.startSwissTournament.useMutation({
    onSuccess: () => {
      utils.tournament.getById.invalidate({ id });
      refetchMatches();
      setBracketError(null);
    },
    onError: (err) =>
      setBracketError(err instanceof Error ? err.message : String(err)),
  });

  // Create separate mutations for different tournament formats
  const advanceWinnerSwissMutation =
    api.tournamentSwiss.generateSwissPairings.useMutation({
      onSuccess: () => {
        refetchMatches();
        setBracketError(null);
      },
      onError: (err) =>
        setBracketError(err instanceof Error ? err.message : String(err)),
    });

  const advanceWinnerEliminationMutation = api.match.update.useMutation({
    onSuccess: () => {
      refetchMatches();
      setBracketError(null);
    },
    onError: (err) =>
      setBracketError(err instanceof Error ? err.message : String(err)),
  });

  const advanceAllWinnersSwissMutation =
    api.tournamentSwiss.generateSwissPairings.useMutation({
      onSuccess: () => {
        refetchMatches();
        setBracketError(null);
      },
      onError: (err) =>
        setBracketError(err instanceof Error ? err.message : String(err)),
    });

  const advanceAllWinnersEliminationMutation =
    api.match.advanceAllWinners.useMutation({
      onSuccess: () => {
        refetchMatches();
        setBracketError(null);
      },
      onError: (err) =>
        setBracketError(err instanceof Error ? err.message : String(err)),
    });

  const reshuffleBracketSwissMutation =
    api.tournamentSwiss.generateSwissPairings.useMutation({
      onSuccess: () => {
        refetchMatches();
        setBracketError(null);
      },
      onError: (err) =>
        setBracketError(err instanceof Error ? err.message : String(err)),
    });

  const reshuffleBracketEliminationMutation =
    api.match.reshuffleBracket.useMutation({
      onSuccess: () => {
        refetchMatches();
        setBracketError(null);
      },
      onError: (err) =>
        setBracketError(err instanceof Error ? err.message : String(err)),
    });

  const resetMatchSwissMutation =
    api.tournamentSwiss.generateSwissPairings.useMutation({
      onSuccess: () => {
        refetchMatches();
        setBracketError(null);
      },
      onError: (err) =>
        setBracketError(err instanceof Error ? err.message : String(err)),
    });

  const resetMatchEliminationMutation = api.match.resetMatch.useMutation({
    onSuccess: () => {
      refetchMatches();
      setBracketError(null);
    },
    onError: (err) =>
      setBracketError(err instanceof Error ? err.message : String(err)),
  });

  const resetRoundSwissMutation =
    api.tournamentSwiss.generateSwissPairings.useMutation({
      onSuccess: () => {
        refetchMatches();
        setBracketError(null);
      },
      onError: (err) =>
        setBracketError(err instanceof Error ? err.message : String(err)),
    });

  const resetRoundEliminationMutation = api.match.resetRound.useMutation({
    onSuccess: () => {
      refetchMatches();
      setBracketError(null);
    },
    onError: (err) =>
      setBracketError(err instanceof Error ? err.message : String(err)),
  });

  const completeTournamentSwissMutation =
    api.tournamentSwiss.completeSwissTournament.useMutation({
      onSuccess: () => {
        router.push("/dashboard/tournaments");
      },
      onError: (err) =>
        setBracketError(err instanceof Error ? err.message : String(err)),
    });

  const handleDelete = () => {
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate({ id });
    setDeleteDialogOpen(false);
  };

  const handleJoin = () => {
    if (session?.user?.id) {
      joinMutation.mutate({ tournamentId: id });
    }
  };

  const deckSchema = z.object({
    deckId: z.string(),
  });

  const form = useForm<z.infer<typeof deckSchema>>({
    resolver: zodResolver(deckSchema),
  });

  const isCreator = tournament?.creatorId === session?.user?.id;
  const [isParticipant, setIsParticipant] = useState(
    tournament?.participants.some(
      (participant) => participant.userId === session?.user?.id,
    ),
  );

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reshuffleDialogOpen, setReshuffleDialogOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);

  React.useEffect(() => {
    setIsParticipant(
      tournament?.participants.some(
        (participant) => participant.userId === session?.user?.id,
      ),
    );
  }, [tournament?.participants]);

  console.log("participants", tournament?.participants);
  console.log("id", session?.user?.id);
  console.log("isCreator", isCreator);
  console.log("notIsParticipant", !isParticipant);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!tournament) {
    return <div>Tournament not found</div>;
  }

  return (
    <div className="container mx-auto flex flex-col gap-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{tournament.name}</h1>
        <BackButton />
      </div>

      <Card className="border">
        <CardHeader>
          <CardTitle className="text-lg">Tournament Details</CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            <strong>Size:</strong> {tournament.maxPlayers} participants
          </p>
          <p>
            <strong>Format:</strong> {tournament.format}
          </p>
          <p>
            <strong>Description:</strong>{" "}
            {tournament.description || "No description provided"}
          </p>
          <p>
            <strong>Start Date:</strong>{" "}
            {tournament.startDate.toLocaleDateString()}
          </p>
          <p>
            <strong>End Date:</strong>{" "}
            {tournament.endDate
              ? tournament.endDate.toLocaleDateString()
              : "Not set"}
          </p>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        {isCreator ? (
          <>
            {/* Start Tournament Button - always show for creator when upcoming */}
            {tournament.status === "upcoming" && (
              <Button
                onClick={() => startMutation.mutate({ id })}
                disabled={
                  startMutation.isPending ||
                  (tournament.participants?.length ?? 0) < 2
                }
                variant="default"
                className="text-foreground!"
              >
                {startMutation.isPending ? "Starting..." : "Start Tournament"}
              </Button>
            )}
            <Button
              onClick={() => router.push(`/dashboard/tournaments/${id}/edit`)}
              className="text-foreground! bg-secondary"
            >
              Edit Tournament
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="text-foreground!"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Tournament"}
            </Button>
          </>
        ) : (
          <>
            {/* Individual tournament join button - only for non-creators */}
            {!isParticipant && (tournament.teamSize ?? 1) <= 1 && (
              <Button
                onClick={handleJoin}
                disabled={joinMutation.isPending}
                className="text-foreground!"
              >
                {joinMutation.isPending ? "Joining..." : "Join Tournament"}
              </Button>
            )}
            {isParticipant && (tournament.teamSize ?? 1) <= 1 && (
              <div className="space-y-4">
                <Button variant="secondary" disabled>
                  Already Joined
                </Button>

                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit((data) =>
                      updateParticipantDeck.mutate({
                        tournamentId: id,
                        deckId: data.deckId,
                      }),
                    )}
                    className="space-y-4"
                  >
                    <Select
                      onValueChange={(value) => form.setValue("deckId", value)}
                      value={
                        tournament.participants.find(
                          (p) => p.userId === session?.user?.id,
                        )?.deckId || undefined
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Select a deck" />
                      </SelectTrigger>
                      <SelectContent>
                        {getDecks.data?.map((deck) => (
                          <SelectItem key={deck.id} value={deck.id}>
                            {deck.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="submit"
                      disabled={updateParticipantDeck.isPending}
                    >
                      Save Deck Choice
                    </Button>
                  </form>
                </Form>
              </div>
            )}
          </>
        )}
      </div>

      {/* Team Tournament Manager - Show for team formats (teamSize > 1) */}
      {(tournament.teamSize ?? 1) > 1 && (
        <TeamTournamentManager
          tournament={tournament as any}
          isCreator={isCreator}
          currentUserId={session?.user?.id}
          onUpdate={() => {
            utils.tournament.getById.invalidate({ id });
          }}
        />
      )}

      {/* Participant List - Show for all tournament types */}
      {tournament.participants && tournament.participants.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-bold">Participants</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {tournament.participants.map((participant) => (
              <TournamentParticipantCard
                key={participant.id}
                participant={participant}
                isCreator={isCreator}
                currentUserId={session?.user?.id}
                onKickSuccess={() => {
                  utils.tournament.getById.invalidate({ id });
                }}
                onBanSuccess={() => {
                  utils.tournament.getById.invalidate({ id });
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Bracket Section */}
      {tournament.status === "active" && (
        <div className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">Bracket</h2>
            {isCreator && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (tournament?.format === "SWISS") {
                      advanceAllWinnersSwissMutation.mutate({
                        tournamentId: id,
                      });
                    } else {
                      advanceAllWinnersEliminationMutation.mutate({
                        tournamentId: id,
                      });
                    }
                  }}
                  disabled={
                    tournament?.format === "SWISS"
                      ? advanceAllWinnersSwissMutation.isPending
                      : advanceAllWinnersEliminationMutation.isPending
                  }
                >
                  {tournament?.format === "SWISS"
                    ? advanceAllWinnersSwissMutation.isPending
                      ? "Advancing..."
                      : "Advance All Winners"
                    : advanceAllWinnersEliminationMutation.isPending
                      ? "Advancing..."
                      : "Advance All Winners"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setReshuffleDialogOpen(true)}
                  disabled={
                    tournament?.format === "SWISS"
                      ? reshuffleBracketSwissMutation.isPending
                      : reshuffleBracketEliminationMutation.isPending
                  }
                >
                  {tournament?.format === "SWISS"
                    ? reshuffleBracketSwissMutation.isPending
                      ? "Reshuffling..."
                      : "Reshuffle Bracket"
                    : reshuffleBracketEliminationMutation.isPending
                      ? "Reshuffling..."
                      : "Reshuffle Bracket"}
                </Button>
                {matches &&
                  matches.length > 0 &&
                  matches.every((m: any) => m.status === "COMPLETED") && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setCompleteDialogOpen(true)}
                      disabled={completeTournamentSwissMutation.isPending}
                    >
                      {completeTournamentSwissMutation.isPending
                        ? "Completing..."
                        : "Complete Tournament"}
                    </Button>
                  )}
              </div>
            )}
          </div>
          <div className="mb-2 text-sm text-gray-500">
            Tournament Status: {tournament.status} | Matches Loading:{" "}
            {matchesLoading ? "Yes" : "No"} | Matches Count:{" "}
            {matches?.length || 0}
          </div>
          {matchesLoading ? (
            <div>Loading bracket...</div>
          ) : matches && matches.length > 0 ? (
            tournament.format === "SWISS" ? (
              <SwissTournamentBracket
                tournamentId={tournament.id}
                matches={matches.map((m: any) => ({
                  id: m.id,
                  round: m.round,
                  position: m.position,
                  player1Id: m.player1Id ?? undefined,
                  player2Id: m.player2Id ?? undefined,
                  winnerId: m.winnerId ?? undefined,
                  status: m.status as string,
                  player1: m.player1
                    ? { id: m.player1.id, name: m.player1.name || "Unknown" }
                    : undefined,
                  player2: m.player2
                    ? { id: m.player2.id, name: m.player2.name || "Unknown" }
                    : undefined,
                }))}
                participants={
                  tournament.participants?.map((p) => ({
                    id: p.user.id,
                    name: p.user.name || "Unknown",
                  })) ?? []
                }
                isCreator={isCreator}
                onAdvanceWinner={(matchId: string, winnerId: string) => {
                  if (tournament?.format === "SWISS") {
                    advanceWinnerSwissMutation.mutate({ tournamentId: id });
                  } else {
                    advanceWinnerEliminationMutation.mutate({
                      id: matchId,
                      winnerId,
                      status: "COMPLETED",
                    });
                  }
                }}
                onResetMatch={(matchId: string) => {
                  if (tournament?.format === "SWISS") {
                    resetMatchSwissMutation.mutate({ tournamentId: id });
                  } else {
                    resetMatchEliminationMutation.mutate({ matchId });
                  }
                }}
                onCompleteTournament={() => {
                  completeTournamentSwissMutation.mutate({ tournamentId: id });
                }}
              />
            ) : (
              <Bracket
                matches={matches.map((m: any) => ({
                  id: m.id,
                  round: m.round,
                  position: m.position,
                  player1Id: m.player1Id ?? undefined,
                  player2Id: m.player2Id ?? undefined,
                  winnerId: m.winnerId ?? undefined,
                  status: m.status as string,
                  player1: m.player1
                    ? { id: m.player1.id, name: m.player1.name || "Unknown" }
                    : undefined,
                  player2: m.player2
                    ? { id: m.player2.id, name: m.player2.name || "Unknown" }
                    : undefined,
                }))}
                participants={
                  tournament.participants?.map((p) => ({
                    id: p.user.id,
                    name: p.user.name || "Unknown",
                  })) ?? []
                }
                bracketType={tournament.format}
                isCreator={isCreator}
                onAdvanceWinner={(matchId: string, winnerId: string) => {
                  if (tournament?.format === "SWISS") {
                    advanceWinnerSwissMutation.mutate({ tournamentId: id });
                  } else {
                    advanceWinnerEliminationMutation.mutate({
                      id: matchId,
                      winnerId,
                      status: "COMPLETED",
                    });
                  }
                }}
                onResetMatch={(matchId: string) => {
                  if (tournament?.format === "SWISS") {
                    resetMatchSwissMutation.mutate({ tournamentId: id });
                  } else {
                    resetMatchEliminationMutation.mutate({ matchId });
                  }
                }}
                onResetRound={(round: number) => {
                  if (tournament?.format === "SWISS") {
                    resetRoundSwissMutation.mutate({ tournamentId: id });
                  } else {
                    resetRoundEliminationMutation.mutate({
                      tournamentId: id,
                      round,
                    });
                  }
                }}
                onCompleteTournament={() => {
                  completeTournamentSwissMutation.mutate({ tournamentId: id });
                }}
              />
            )
          ) : (
            <div>
              No matches found.
              <div className="mt-1 text-sm text-gray-500">
                Debug: Tournament ID: {id}, Status: {tournament.status}
              </div>
            </div>
          )}
          {bracketError && (
            <div className="mt-2 text-red-500">{bracketError}</div>
          )}
        </div>
      )}

      {/* Delete Tournament Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tournament</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tournament? This action
              cannot be undone and will remove all participants and matches.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Tournament
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reshuffle Bracket Dialog */}
      <AlertDialog
        open={reshuffleDialogOpen}
        onOpenChange={setReshuffleDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reshuffle Bracket</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reshuffle the entire bracket? This will
              reset all matches and may change participant positions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (tournament?.format === "SWISS") {
                  reshuffleBracketSwissMutation.mutate({ tournamentId: id });
                } else {
                  reshuffleBracketEliminationMutation.mutate({
                    tournamentId: id,
                  });
                }
                setReshuffleDialogOpen(false);
              }}
            >
              Reshuffle Bracket
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete Tournament Dialog */}
      <AlertDialog
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
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
                completeTournamentSwissMutation.mutate({ tournamentId: id });
                setCompleteDialogOpen(false);
              }}
            >
              Complete Tournament
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
