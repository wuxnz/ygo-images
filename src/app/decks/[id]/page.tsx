import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CardImage } from "@/components/ui/card-image";
import { Badge } from "@/components/ui/badge";
import { parseYdk } from "@/lib/deckParser";
import BackButton from "@/components/ui/back-button";

interface DeckPageProps {
  params: { id: string };
}

export default async function DeckPage({ params }: DeckPageProps) {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    notFound();
  }

  const { id } = await params;

  // Validate MongoDB ObjectID format
  const isValidObjectId = /[0-9a-zA-Z]/.test(id);
  if (!isValidObjectId) {
    console.log("Invalid deck ID:", id);
    notFound();
  }

  const deck = await db.deck.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (!deck) {
    console.log("Deck not found:", id);
    notFound();
  }

  // Attempt to fetch and parse the deck file.
  let parsed: ReturnType<typeof parseYdk> | null = null;
  try {
    // Use a proxy endpoint to avoid CORS issues
    const proxyUrl = deck.fileUrl;
    const res = await fetch(proxyUrl, { cache: "no-store" });
    if (res.ok) {
      const text = await res.text();
      parsed = parseYdk(text);
    } else {
      // Fallback to direct fetch if proxy fails
      const directRes = await fetch(deck.fileUrl, {
        cache: "no-store",
        mode: "cors",
      });
      if (directRes.ok) {
        const text = await directRes.text();
        parsed = parseYdk(text);
      }
    }
  } catch {
    // ignore errors, keep parsed null
  }

  console.log("Deck File URL:", deck.fileUrl);
  console.log("Deck parsed:", parsed);

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
                <div className="flex flex-wrap gap-2">
                  {parsed.main.map((id) => (
                    <CardImage
                      key={`m-${id}-${Math.random()}`}
                      cardId={id.toString()}
                      width={80}
                      height={116}
                      className="transition-transform hover:scale-105"
                    />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold">
                  Extra Deck ({parsed.extra.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {parsed.extra.map((id) => (
                    <CardImage
                      key={`e-${id}-${Math.random()}`}
                      cardId={id.toString()}
                      width={80}
                      height={116}
                      className="transition-transform hover:scale-105"
                    />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-sm font-semibold">
                  Side Deck ({parsed.side.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {parsed.side.map((id) => (
                    <CardImage
                      key={`s-${id}-${Math.random()}`}
                      cardId={id.toString()}
                      width={80}
                      height={116}
                      className="transition-transform hover:scale-105"
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <BackButton />
      </div>
    </div>
  );
}
