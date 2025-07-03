import { notFound } from "next/navigation";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { DeckEditForm } from "@/components/deck-edit-form";

interface DeckEditPageProps {
  params: { id: string };
}

export default async function DeckEditPage({ params }: DeckEditPageProps) {
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

  return (
    <div className="container mx-auto py-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold">Edit Deck</h1>
        <DeckEditForm deck={deck} />
      </div>
    </div>
  );
}
