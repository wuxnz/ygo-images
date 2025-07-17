import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { auth } from "@/server/auth";
import type { User, Deck } from "@prisma/client";
import {
  CalendarDays,
  Trophy,
  Users,
  Upload,
  FileText,
  Plus,
} from "lucide-react";
import { db } from "@/server/db";
import Link from "next/link";

import type { Session } from "next-auth";

// Define extended user type to include additional fields
interface ExtendedUser extends User {
  tournaments?: { id: string }[];
  winnerMatches?: { id: string }[];
  organizedTournaments?: { id: string }[];
}

// Reusable error component
function ErrorMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="container mx-auto py-8">
      <div className="rounded-lg bg-red-50 p-4 text-center text-red-500">
        <p>{title}</p>
        <p className="mt-2 text-sm">{message}</p>
      </div>
    </div>
  );
}

export default async function ProfilePage() {
  let session: Session | null = null;

  try {
    session = await auth();
  } catch (error) {
    return (
      <ErrorMessage
        title="Authentication Error"
        message="Failed to load session. Please try again later."
      />
    );
  }

  if (!session) {
    return (
      <ErrorMessage
        title="Authentication Required"
        message="Please sign in to view your profile"
      />
    );
  }

  const user = session.user;
  if (!user) {
    return (
      <ErrorMessage
        title="User Profile Not Found"
        message="Please check your account or try again later"
      />
    );
  }

  // Handle loading state
  if (!user) return <div>Loading profile...</div>;

  const extendedUser = user as ExtendedUser;

  // Memoize stats calculation
  // Fetch actual stats from database
  const [tournamentsJoined, matchesWon, tournamentsOrganized, userDecks] =
    await Promise.all([
      db.tournamentParticipant.count({
        where: {
          userId: user.id,
        },
      }),
      db.match.count({
        where: {
          winnerId: user.id,
        },
      }),
      db.tournament.count({
        where: {
          organizerId: user.id,
        },
      }),
      db.deck.findMany({
        where: {
          userId: user.id,
        },
        orderBy: {
          uploadedAt: "desc",
        },
        take: 5, // Get latest 5 decks for preview
      }),
    ]);

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ProfileCard
            user={{
              id: extendedUser.id,
              name: extendedUser.name,
              email: extendedUser.email,
              emailVerified: extendedUser.emailVerified,
              image: extendedUser.image,
            }}
          />
          <DecksCard decks={userDecks} />
        </div>
        <div className="space-y-6">
          <StatsCard
            tournaments={tournamentsJoined}
            wins={matchesWon}
            organized={tournamentsOrganized}
            decks={userDecks.length}
          />
        </div>
      </div>
    </div>
  );
}

function ProfileCard({ user }: { user: User }) {
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          {user.image && (
            <img
              src={user.image}
              alt={user.name ?? "User"}
              className="size-20 rounded-full"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatsCard({
  tournaments,
  wins,
  organized,
  decks,
}: {
  tournaments: number;
  wins: number;
  organized: number;
  decks: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Statistics</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <StatItem
          icon={<Users className="size-5" />}
          label="Tournaments Joined"
          value={tournaments}
        />
        <StatItem
          icon={<Trophy className="size-5" />}
          label="Matches Won"
          value={wins}
        />
        <StatItem
          icon={<CalendarDays className="size-5" />}
          label="Tournaments Organized"
          value={organized}
        />
        <StatItem
          icon={<FileText className="size-5" />}
          label="Decks Uploaded"
          value={decks}
        />
      </CardContent>
    </Card>
  );
}

function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium">{label}</span>
      </div>
      <span className="text-lg font-bold">{value}</span>
    </div>
  );
}

function DecksCard({ decks }: { decks: Deck[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2">
          <FileText className="size-5" />
          My Decks
        </CardTitle>
        <Button asChild size="sm">
          <Link href="/dashboard/profile/upload/deck">
            <Plus className="mr-2 size-4" />
            Upload Deck
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {decks.length === 0 ? (
          <div className="py-8 text-center">
            <Upload className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <p className="text-muted-foreground mb-4">
              No decks uploaded yet. Start by uploading your first Yu-Gi-Oh
              deck!
            </p>
            <Button asChild>
              <Link href="/dashboard/profile/upload/deck">
                <Upload className="mr-2 size-4" />
                Upload Your First Deck
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-muted-foreground mb-4 text-sm">
              {decks.length} deck{decks.length !== 1 ? "s" : ""} uploaded
            </div>
            {decks.map((deck) => (
              <Link
                key={deck.id}
                href={`/decks/${deck.id}`}
                className="hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="text-muted-foreground size-4" />
                  <div>
                    <p className="text-sm font-medium">{deck.name}</p>
                    <p className="text-muted-foreground text-xs">
                      Uploaded {new Date(deck.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-muted-foreground text-xs">
                  {(deck.fileSize / (1024 * 1024)).toFixed(2)} MB
                </div>
              </Link>
            ))}
            {decks.length >= 5 && (
              <div className="pt-2">
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link href="/decks">View All Decks</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
