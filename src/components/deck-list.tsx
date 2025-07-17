import Link from "next/link";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export async function DeckList() {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    return null;
  }

  const decks = await db.deck.findMany({
    where: { userId: session.user.id },
    orderBy: { uploadedAt: "desc" },
  });

  if (decks.length === 0) {
    return (
      <p className="text-muted-foreground">
        You don't have any decks yet. Upload one from your profile page.
      </p>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {decks.map((deck) => (
        <Card key={deck.id} className="flex flex-col justify-between">
          <CardHeader>
            <CardTitle className="truncate" title={deck.name}>
              {deck.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-1 flex-col gap-4">
            {deck.description && (
              <p className="text-muted-foreground line-clamp-3 text-sm">
                {deck.description}
              </p>
            )}

            <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
              <span>
                {new Date(deck.uploadedAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <Badge variant="secondary">
                {(deck.fileSize / 1024).toFixed(2)} KB
              </Badge>
            </div>

            <div className="mt-auto flex gap-2">
              <Link href={`/decks/${deck.id}`} className="flex-1">
                <Button variant="secondary" className="w-full">
                  View
                </Button>
              </Link>
              <Link href={`/decks/${deck.id}/edit`} className="flex-1">
                <Button className="w-full">Edit</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
