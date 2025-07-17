"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { api } from "@/trpc/react";

const deckSchema = z.object({
  deckId: z.string().min(1, "Please select a deck"),
});

export function DeckSelectionForm({
  tournamentId,
  userId,
}: {
  tournamentId: string;
  userId: string;
}) {
  const { data: decks } = api.deck.getUserDecks.useQuery();
  const setDeck = api.tournament.setDeck.useMutation();

  const form = useForm<z.infer<typeof deckSchema>>({
    resolver: zodResolver(deckSchema),
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) =>
          setDeck.mutate({ tournamentId, deckId: data.deckId }),
        )}
        className="space-y-4"
      >
        <FormField
          control={form.control}
          name="deckId"
          render={({ field }) => (
            <FormItem>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a deck" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {decks?.map((deck) => (
                    <SelectItem key={deck.id} value={deck.id}>
                      {deck.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={setDeck.isPending}>
          Save Deck Choice
        </Button>
      </form>
    </Form>
  );
}
