"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Eye,
  Edit3,
  Trash2,
  Plus,
  Search,
  Calendar,
  FileText,
  AlertCircle,
} from "lucide-react";
import { api } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function DeckManagementPage() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: userDecks, isLoading } = api.deck.getUserDecks.useQuery();

  const filteredDecks = userDecks?.filter(
    (deck) =>
      deck.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      deck.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <h2 className="mb-2 text-xl font-semibold">Please sign in</h2>
              <p className="text-muted-foreground mb-4">
                You need to be signed in to manage your decks.
              </p>
              <Button asChild>
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Decks</h1>
            <p className="text-muted-foreground">
              Manage your tournament decks
            </p>
          </div>
          <Button asChild>
            <Link href="/dashboard/profile/upload/deck">
              <Plus className="mr-2 h-4 w-4" />
              Create New Deck
            </Link>
          </Button>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search decks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="text-muted-foreground flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            <span>{filteredDecks?.length || 0} decks</span>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-9 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Empty State */}
          {filteredDecks?.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-8">
                <div className="text-center">
                  <FileText className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                  <h3 className="mb-2 text-lg font-semibold">
                    {searchTerm ? "No decks found" : "No decks yet"}
                  </h3>
                  <p className="text-muted-foreground mb-4">
                    {searchTerm
                      ? "No decks match your search criteria."
                      : "Create your first deck to get started with tournaments."}
                  </p>
                  <Button asChild>
                    <Link href="/dashboard/profile/upload/deck">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Deck
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            /* Deck List */
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredDecks?.map((deck) => (
                <Card
                  key={deck.id}
                  className="transition-shadow hover:shadow-lg"
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{deck.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {deck.description || "No description provided"}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-muted-foreground space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>
                          Created{" "}
                          {format(new Date(deck.uploadedAt), "MMM d, yyyy")}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span>{deck.fileName}</span>
                      </div>
                      <div>
                        <Badge variant="outline">
                          {(deck.fileSize / 1024).toFixed(1)} KB
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    <Button asChild size="sm" className="flex-1">
                      <Link href={`/decks/${deck.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      <Link href={`/decks/${deck.id}/edit`}>
                        <Edit3 className="mr-2 h-4 w-4" />
                        Edit
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
