"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { parseYdk } from "@/lib/deckParser";

interface Deck {
  id: string;
  name: string;
  description: string | null;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: Date;
  userId: string;
}

interface DeckEditFormProps {
  deck: Deck;
}

export function DeckEditForm({ deck }: DeckEditFormProps) {
  const router = useRouter();
  const [name, setName] = useState(deck.name);
  const [description, setDescription] = useState(deck.description || "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ReturnType<typeof parseYdk> | null>(
    null,
  );

  // fetch deck file once on mount to show existing preview
  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch(deck.fileUrl);
        if (res.ok) {
          const text = await res.text();
          setPreview(parseYdk(text));
        }
      } catch {
        // ignore
      }
    })();
  }, [deck.fileUrl]);

  const updateDeck = api.deck.updateDeck.useMutation({
    onSuccess: () => {
      toast.success("Deck updated successfully!");
      router.push("/dashboard/profile");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update deck");
    },
  });

  const deleteDeck = api.deck.deleteDeck.useMutation({
    onSuccess: () => {
      toast.success("Deck deleted successfully!");
      router.push("/dashboard/profile");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete deck");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Deck name is required");
      return;
    }

    const formData = new FormData();
    formData.append("id", deck.id);
    formData.append("name", name.trim());
    if (description.trim()) formData.append("description", description.trim());

    if (file) {
      formData.append("file", file);
    }

    if (file) {
      // First replace file then update meta
      fetch(`/api/decks/${deck.id}/replace`, {
        method: "PATCH",
        body: formData,
      })
        .then(async (res) => {
          if (!res.ok) {
            const { error } = await res.json();
            throw new Error(error || "Failed to replace file");
          }
        })
        .then(() => {
          updateDeck.mutate({
            id: deck.id,
            name: name.trim(),
            description: description.trim() || undefined,
          });
        })
        .catch((err) => {
          toast.error(err.message);
        });
    } else {
      updateDeck.mutate({
        id: deck.id,
        name: name.trim(),
        description: description.trim() || undefined,
      });
    }
  };

  const handleDelete = () => {
    if (
      confirm(
        "Are you sure you want to delete this deck? This action cannot be undone.",
      )
    ) {
      deleteDeck.mutate({ id: deck.id });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Deck Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Deck Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter deck name"
              maxLength={50}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter deck description"
              maxLength={500}
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label>File Information</Label>
            <div className="text-muted-foreground rounded-md border p-3 text-sm">
              <p>
                <strong>File Name:</strong> {deck.fileName}
              </p>
              <p>
                <strong>File Size:</strong> {(deck.fileSize / 1024).toFixed(2)}{" "}
                KB
              </p>
              <p>
                <strong>Uploaded:</strong>{" "}
                {new Date(deck.uploadedAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Replace Deck File (.ydk)</Label>
            <Input
              id="file"
              type="file"
              accept=".ydk"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              onInput={async (e) => {
                const f = (e.target as HTMLInputElement).files?.[0] ?? null;
                setFile(f ?? null);
                if (f) {
                  const text = await f.text();
                  setPreview(parseYdk(text));
                }
              }}
            />
          </div>

          {preview && (
            <div className="space-y-4">
              <Label>Cards Preview</Label>
              <div>
                <p className="mb-1 text-xs font-semibold">
                  Main Deck ({preview.main.length})
                </p>
                <div className="flex flex-wrap gap-1 text-[10px]">
                  {preview.main.map((id) => (
                    <span
                      key={`pm-${id}`}
                      className="bg-muted rounded px-1 py-0.5"
                    >
                      {id}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold">
                  Extra Deck ({preview.extra.length})
                </p>
                <div className="flex flex-wrap gap-1 text-[10px]">
                  {preview.extra.map((id) => (
                    <span
                      key={`pe-${id}`}
                      className="bg-muted rounded px-1 py-0.5"
                    >
                      {id}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold">
                  Side Deck ({preview.side.length})
                </p>
                <div className="flex flex-wrap gap-1 text-[10px]">
                  {preview.side.map((id) => (
                    <span
                      key={`ps-${id}`}
                      className="bg-muted rounded px-1 py-0.5"
                    >
                      {id}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="submit"
              disabled={updateDeck.isPending}
              className="flex-1"
            >
              {updateDeck.isPending ? "Updating..." : "Update Deck"}
            </Button>

            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteDeck.isPending}
            >
              {deleteDeck.isPending ? "Deleting..." : "Delete Deck"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
