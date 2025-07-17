"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/trpc/react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Eye, UserX, UserMinus } from "lucide-react";
import { useState } from "react";
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

interface TournamentParticipantCardProps {
  participant: {
    id: string;
    userId: string;
    deckId: string | null;
    tournamentId: string;
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
    deck?: {
      id: string;
      name: string;
      userId: string;
    } | null;
  };
  isCreator: boolean;
  currentUserId: string | undefined;
  onKickSuccess?: () => void;
  onBanSuccess?: () => void;
}

export function TournamentParticipantCard({
  participant,
  isCreator,
  currentUserId,
  onKickSuccess,
  onBanSuccess,
}: TournamentParticipantCardProps) {
  const [showKickDialog, setShowKickDialog] = useState(false);
  const [showBanDialog, setShowBanDialog] = useState(false);

  const utils = api.useUtils();

  const kickMutation = api.tournament.kickParticipant.useMutation({
    onSuccess: () => {
      utils.tournament.getById.invalidate({ id: participant.tournamentId });
      onKickSuccess?.();
    },
  });

  const banMutation = api.tournament.banParticipant.useMutation({
    onSuccess: () => {
      utils.tournament.getById.invalidate({ id: participant.tournamentId });
      onBanSuccess?.();
    },
  });

  const canViewDeck =
    participant.deckId &&
    (participant.userId === currentUserId ||
      participant.deck?.userId === currentUserId ||
      isCreator);

  const isCurrentUser = participant.userId === currentUserId;

  const handleKick = () => {
    kickMutation.mutate({
      tournamentId: participant.tournamentId,
      userId: participant.userId,
    });
    setShowKickDialog(false);
  };

  const handleBan = () => {
    banMutation.mutate({
      tournamentId: participant.tournamentId,
      userId: participant.userId,
    });
    setShowBanDialog(false);
  };

  return (
    <>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={participant.user.image || undefined} />
                <AvatarFallback>
                  {participant.user.name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>

              <div>
                <p className="font-medium">
                  {participant.user.name || "Unknown User"}
                </p>
                {isCurrentUser && (
                  <Badge variant="secondary" className="text-xs">
                    You
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {participant.deckId && canViewDeck && (
                <Button variant="ghost" size="sm" asChild className="h-8 px-2">
                  <Link
                    href={`/deck/${participant.tournamentId}/${participant.deckId}`}
                  >
                    <Eye className="mr-1 h-4 w-4" />
                    View Deck
                  </Link>
                </Button>
              )}

              {participant.deckId ? (
                <Badge variant="default" className="text-xs">
                  Deck Submitted
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs">
                  No Deck
                </Badge>
              )}

              {isCreator && participant.userId !== currentUserId && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive h-8 px-2"
                    onClick={() => setShowKickDialog(true)}
                    disabled={kickMutation.isPending}
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive h-8 px-2"
                    onClick={() => setShowBanDialog(true)}
                    disabled={banMutation.isPending}
                  >
                    <UserX className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          {participant.deck && (
            <div className="text-muted-foreground mt-2 text-sm">
              Deck: {participant.deck.name}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showKickDialog} onOpenChange={setShowKickDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kick Participant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to kick {participant.user.name} from this
              tournament? They will be removed from the tournament and won't be
              able to rejoin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleKick}
              className="bg-destructive text-destructive-foreground"
            >
              Kick
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban Participant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to ban {participant.user.name} from this
              tournament? They will be removed and won't be able to rejoin this
              tournament.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBan}
              className="bg-destructive text-destructive-foreground"
            >
              Ban
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
