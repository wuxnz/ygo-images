import { Suspense } from "react";
import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { DeckList } from "@/components/deck-list";

export default async function DecksPage() {
  const session = await auth();

  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Decks</h1>
        <p className="text-muted-foreground mt-2">
          Manage and view all your uploaded Yu-Gi-Oh! decks
        </p>
      </div>

      <Suspense fallback={<div>Loading decks...</div>}>
        <DeckList />
      </Suspense>
    </div>
  );
}
