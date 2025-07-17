"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Deck {
  id: string;
  name: string;
  description?: string | null;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
  mainDeck?: any[];
  extraDeck?: any[];
  sideDeck?: any[];
}

interface User {
  id: string;
  name?: string | null;
  image?: string | null;
}

interface TournamentTop8DeckModalProps {
  placement: number;
  user: User;
  deck: Deck | null;
}

export function TournamentTop8DeckModal({
  placement,
  user,
  deck,
}: TournamentTop8DeckModalProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getPlacementIcon = (placement: number) => {
    switch (placement) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return `🏆 ${placement}`;
    }
  };

  const getPlacementColor = (placement: number) => {
    switch (placement) {
      case 1:
        return "bg-yellow-100 border-yellow-300 text-yellow-800";
      case 2:
        return "bg-gray-100 border-gray-300 text-gray-800";
      case 3:
        return "bg-orange-100 border-orange-300 text-orange-800";
      default:
        return "bg-blue-100 border-blue-300 text-blue-800";
    }
  };

  if (!deck) {
    return (
      <Card className="opacity-60">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image || undefined} />
                <AvatarFallback>{user.name?.charAt(0) || "?"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{user.name}</p>
                <p className="text-muted-foreground text-sm">
                  No deck submitted
                </p>
              </div>
            </div>
            <Badge variant="outline">{getPlacementIcon(placement)}</Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalCards =
    (deck.mainDeck?.length || 0) +
    (deck.extraDeck?.length || 0) +
    (deck.sideDeck?.length || 0);

  return (
    <div className="space-y-2">
      <Card
        className={`cursor-pointer transition-all hover:scale-[1.02] hover:shadow-md ${getPlacementColor(placement)}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.image || undefined} />
                <AvatarFallback>{user.name?.charAt(0) || "?"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold">{user.name}</p>
                <p className="text-sm font-medium">{deck.name}</p>
                <p className="text-xs opacity-75">
                  {totalCards} cards • {formatFileSize(deck.fileSize)}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-lg">
              {getPlacementIcon(placement)}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {isExpanded && (
        <Card className="border-l-primary border-l-4">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Deck Details</span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(deck.fileUrl, "_blank")}
                >
                  <Eye className="mr-1 h-4 w-4" />
                  View
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = deck.fileUrl;
                    link.download = deck.fileName;
                    link.click();
                  }}
                >
                  <Download className="mr-1 h-4 w-4" />
                  Download
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">
                  {deck.mainDeck?.length || 0}
                </p>
                <p className="text-muted-foreground text-sm">Main Deck</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {deck.extraDeck?.length || 0}
                </p>
                <p className="text-muted-foreground text-sm">Extra Deck</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {deck.sideDeck?.length || 0}
                </p>
                <p className="text-muted-foreground text-sm">Side Deck</p>
              </div>
            </div>
            {deck.description && (
              <p className="text-muted-foreground mb-4 text-sm">
                {deck.description}
              </p>
            )}
            <div className="flex gap-2">
              <a
                href={deck.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary text-sm hover:underline"
              >
                View in new tab
              </a>
              <span className="text-muted-foreground text-xs">•</span>
              <a
                href={deck.fileUrl}
                download={deck.fileName}
                className="text-primary text-sm hover:underline"
              >
                Download .ydk
              </a>
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
