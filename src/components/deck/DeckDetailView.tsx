"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CardImage } from "@/components/ui/card-image";
import { parseYdk } from "@/lib/deckParser";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Download, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeckDetailViewProps {
  deck: {
    id: string;
    name: string;
    description?: string | null;
    fileUrl: string;
    fileName: string;
    fileSize: number;
    uploadedAt: Date;
    format?: string;
    powerLevel?: string;
    commander?: string;
    deckList?: string;
  };
  userName: string;
}

interface CardStats {
  totalCards: number;
  mainDeckCount: number;
  extraDeckCount: number;
  sideDeckCount: number;
}

export function DeckDetailView({ deck, userName }: DeckDetailViewProps) {
  const [parsedDeck, setParsedDeck] = useState<ReturnType<
    typeof parseYdk
  > | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cardStats, setCardStats] = useState<CardStats>({
    totalCards: 0,
    mainDeckCount: 0,
    extraDeckCount: 0,
    sideDeckCount: 0,
  });

  useEffect(() => {
    const fetchDeckData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to fetch and parse the YDK file
        const response = await fetch(deck.fileUrl, { cache: "no-store" });
        if (response.ok) {
          const text = await response.text();
          const parsed = parseYdk(text);
          setParsedDeck(parsed);

          // Calculate card statistics
          setCardStats({
            totalCards:
              parsed.main.length + parsed.extra.length + parsed.side.length,
            mainDeckCount: parsed.main.length,
            extraDeckCount: parsed.extra.length,
            sideDeckCount: parsed.side.length,
          });
        } else {
          setError("Could not load deck file");
        }
      } catch (err) {
        console.error("Error loading deck:", err);
        setError("Failed to load deck data");
      } finally {
        setLoading(false);
      }
    };

    fetchDeckData();
  }, [deck.fileUrl]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Deck Header */}
      <div>
        <h2 className="text-2xl font-bold">{deck.name}</h2>
        <p className="text-muted-foreground">Uploaded by {userName}</p>
      </div>

      {/* Deck Info */}
      <Card>
        <CardHeader>
          <CardTitle>Deck Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-semibold">Format:</span>{" "}
              <Badge variant="outline">{deck.format || "Standard"}</Badge>
            </div>
            <div>
              <span className="font-semibold">Power Level:</span>{" "}
              <Badge variant="outline">
                {deck.powerLevel || "Not specified"}
              </Badge>
            </div>
            <div>
              <span className="font-semibold">File Size:</span>{" "}
              <Badge variant="secondary">{formatFileSize(deck.fileSize)}</Badge>
            </div>
            <div>
              <span className="font-semibold">Uploaded:</span>{" "}
              {new Date(deck.uploadedAt).toLocaleDateString()}
            </div>
          </div>

          {deck.description && (
            <div>
              <span className="font-semibold">Description:</span>
              <p className="text-muted-foreground mt-1 text-sm">
                {deck.description}
              </p>
            </div>
          )}

          {deck.commander && (
            <div>
              <span className="font-semibold">Commander:</span>
              <Badge variant="outline" className="ml-2">
                {deck.commander}
              </Badge>
            </div>
          )}

          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={deck.fileUrl} download={deck.fileName}>
                <Download className="mr-2 h-4 w-4" />
                Download .ydk
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={deck.fileUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View Raw File
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Deck Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Deck Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold">{cardStats.totalCards}</div>
              <div className="text-muted-foreground text-sm">Total Cards</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {cardStats.mainDeckCount}
              </div>
              <div className="text-muted-foreground text-sm">Main Deck</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {cardStats.extraDeckCount}
              </div>
              <div className="text-muted-foreground text-sm">Extra Deck</div>
            </div>
            <div>
              <div className="text-2xl font-bold">
                {cardStats.sideDeckCount}
              </div>
              <div className="text-muted-foreground text-sm">Side Deck</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deck Cards */}
      {parsedDeck && (
        <Tabs defaultValue="main" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="main">
              Main Deck ({parsedDeck.main.length})
            </TabsTrigger>
            <TabsTrigger value="extra">
              Extra Deck ({parsedDeck.extra.length})
            </TabsTrigger>
            <TabsTrigger value="side">
              Side Deck ({parsedDeck.side.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="main">
            <Card>
              <CardHeader>
                <CardTitle>Main Deck</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[400px] overflow-y-auto">
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                    {parsedDeck.main.map((cardId) => (
                      <CardImage
                        key={`main-${cardId}`}
                        cardId={cardId.toString()}
                        width={80}
                        height={116}
                        className="transition-transform hover:scale-105"
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="extra">
            <Card>
              <CardHeader>
                <CardTitle>Extra Deck</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[400px] overflow-y-auto">
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                    {parsedDeck.extra.map((cardId) => (
                      <CardImage
                        key={`extra-${cardId}`}
                        cardId={cardId.toString()}
                        width={80}
                        height={116}
                        className="transition-transform hover:scale-105"
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="side">
            <Card>
              <CardHeader>
                <CardTitle>Side Deck</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-[400px] overflow-y-auto">
                  <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
                    {parsedDeck.side.map((cardId) => (
                      <CardImage
                        key={`side-${cardId}`}
                        cardId={cardId.toString()}
                        width={80}
                        height={116}
                        className="transition-transform hover:scale-105"
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Raw Deck List (Fallback) */}
      {!parsedDeck && deck.deckList && (
        <Card>
          <CardHeader>
            <CardTitle>Raw Deck List</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted max-h-[400px] overflow-y-auto rounded-md p-4 text-sm whitespace-pre-wrap">
              {deck.deckList}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
