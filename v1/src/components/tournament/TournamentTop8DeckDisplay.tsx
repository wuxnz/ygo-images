"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Download } from "lucide-react";
import { api } from "@/trpc/react";

interface TournamentTop8DeckDisplayProps {
  tournamentId: string;
  placement: number;
  userName: string;
  userImage?: string | null;
}

export function TournamentTop8DeckDisplay({
  tournamentId,
  placement,
  userName,
  userImage,
}: TournamentTop8DeckDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: deckData, isLoading } =
    api.tournamentResults.getTop8Deck.useQuery({
      tournamentId,
      placement,
    });

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="p-3">
          <div className="mb-1 h-4 w-24 rounded bg-gray-200"></div>
          <div className="h-3 w-32 rounded bg-gray-200"></div>
        </CardContent>
      </Card>
    );
  }

  if (!deckData?.deck) {
    return (
      <Card className="opacity-60">
        <CardContent className="p-3">
          <p className="text-muted-foreground text-xs">No deck submitted</p>
        </CardContent>
      </Card>
    );
  }

  const { deck } = deckData;

  return (
    <div className="space-y-2">
      <Card className="transition-shadow hover:shadow-sm">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-medium">{deck.name}</h4>
              <p className="text-muted-foreground text-xs">
                {formatFileSize(deck.fileSize)} •{" "}
                {new Date(deck.uploadedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="ml-2 flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-7 px-2 text-xs"
              >
                <Eye className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" asChild className="h-7 px-2">
                <a href={deck.fileUrl} download={deck.fileName}>
                  <Download className="h-3 w-3" />
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {isExpanded && (
        <Card className="border-l-primary border-l-4">
          <CardContent className="p-3">
            <div className="space-y-2">
              {deck.description && (
                <p className="text-muted-foreground text-xs">
                  {deck.description}
                </p>
              )}
              <div className="flex gap-2">
                <a
                  href={deck.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary text-xs hover:underline"
                >
                  View in new tab
                </a>
                <span className="text-muted-foreground text-xs">•</span>
                <a
                  href={deck.fileUrl}
                  download={deck.fileName}
                  className="text-primary text-xs hover:underline"
                >
                  Download .ydk
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}
