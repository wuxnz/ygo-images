import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { parseYdk } from "@/lib/deckParser";

interface DeckPageProps {
  params: { id: string };
}

export default async function DeckPage({ params }: DeckPageProps) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    notFound();
  }

  const { id } = await params;

  const deck = await db.deck.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (!deck) {
    notFound();
  }

  // Attempt to fetch and parse the deck file.
  let parsed: ReturnType<typeof parseYdk> | null = null;
  try {
    const res = await fetch(deck.fileUrl, { cache: "no-store" });
    if (res.ok) {
      const text = await res.text();
      parsed = parseYdk(text);
    }
  } catch {
    // ignore errors, keep parsed null
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold">{deck.name}</h1>
          <Link href={`/decks/${deck.id}/edit`}>
            <Button>Edit Deck</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Deck Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {deck.description && (
              <div>
                <h3 className="text-muted-foreground mb-2 text-sm font-semibold">
                  Description
                </h3>
                <p className="text-sm">{deck.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-muted-foreground mb-1 text-sm font-semibold">
                  File Name
                </h3>
                <p className="text-sm">{deck.fileName}</p>
              </div>

              <div>
                <h3 className="text-muted-foreground mb-1 text-sm font-semibold">
                  File Size
                </h3>
                <Badge variant="secondary">
                  {(deck.fileSize / 1024).toFixed(2)} KB
                </Badge>
              </div>

              <div>
                <h3 className="text-muted-foreground mb-1 text-sm font-semibold">
                  Uploaded
                </h3>
                <p className="text-sm">
                  {new Date(deck.uploadedAt).toLocaleDateString()}
                </p>
              </div>

              <div>
                <h3 className="text-muted-foreground mb-1 text-sm font-semibold">
                  File
                </h3>
                <a
                  href={deck.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 underline hover:text-blue-800"
                >
                  Download .ydk file
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        {parsed && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Cards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="mb-2 text-sm font-semibold">
                  Main Deck ({parsed.main.length})
                </h3>
                <ul className="grid grid-cols-2 gap-1 text-xs sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {parsed.main.map((id) => (
                    <li
                      key={`m-${id}-${Math.random()}`}
                      className="bg-muted rounded px-2 py-1 text-center"
                    >
                      {id}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold">
                  Extra Deck ({parsed.extra.length})
                </h3>
                <ul className="grid grid-cols-2 gap-1 text-xs sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {parsed.extra.map((id) => (
                    <li
                      key={`e-${id}-${Math.random()}`}
                      className="bg-muted rounded px-2 py-1 text-center"
                    >
                      {id}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold">
                  Side Deck ({parsed.side.length})
                </h3>
                <ul className="grid grid-cols-2 gap-1 text-xs sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {parsed.side.map((id) => (
                    <li
                      key={`s-${id}-${Math.random()}`}
                      className="bg-muted rounded px-2 py-1 text-center"
                    >
                      {id}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="mt-6">
          <Link href="/dashboard/profile">
            <Button variant="outline">← Back to Profile</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
