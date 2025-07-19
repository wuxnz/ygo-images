"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Trophy,
  Users,
  History,
  Plus,
  Settings,
  User,
  BookOpen,
  Calendar,
  BarChart3,
  Shield,
  Edit3,
  Eye,
} from "lucide-react";
import { api } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { data: session } = useSession();
  const { data: userDecks, isLoading: decksLoading } =
    api.deck.getUserDecks.useQuery();
  const { data: allTournaments, isLoading: tournamentsLoading } =
    api.tournament.getAll.useQuery({});
  const { data: userParticipations } =
    api.tournament.getUserParticipations.useQuery();

  const userName = session?.user?.name || "User";

  // Filter tournaments for the current user
  const userTournaments = allTournaments?.items.filter((t) =>
    userParticipations?.some((p) => p.tournamentId === t.id),
  );

  const createdTournaments = allTournaments?.items.filter(
    (t) => t.creatorId === session?.user?.id,
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {userName}!
        </h1>
        <p className="text-muted-foreground">
          Manage your decks, tournaments, and account settings
        </p>
      </div>

      {/* Quick Stats */}
      <div className="mb-8 grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Decks</CardTitle>
            <BookOpen className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            {decksLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">{userDecks?.length || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Tournaments
            </CardTitle>
            <Trophy className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            {tournamentsLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">
                {userTournaments?.filter((t: any) => t.status === "active")
                  .length || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Created Tournaments
            </CardTitle>
            <Shield className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            {tournamentsLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">
                {createdTournaments?.length || 0}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tournament History
            </CardTitle>
            <History className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            {tournamentsLoading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <div className="text-2xl font-bold">
                {userTournaments?.filter((t: any) => t.status === "completed")
                  .length || 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Deck Management */}
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Deck Management
            </CardTitle>
            <CardDescription>
              Create and manage your tournament decks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/dashboard/decks">
                <Eye className="mr-2 h-4 w-4" />
                View My Decks
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/decks/create">
                <Plus className="mr-2 h-4 w-4" />
                Create New Deck
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Tournament Participation */}
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              My Tournaments
            </CardTitle>
            <CardDescription>
              View tournaments you're participating in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/tournaments/my-tournaments">
                <Trophy className="mr-2 h-4 w-4" />
                View My Tournaments
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Tournament Creation */}
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Tournament Management
            </CardTitle>
            <CardDescription>
              Create and manage tournaments you organize
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/dashboard/tournaments/my-tournaments">
                <BarChart3 className="mr-2 h-4 w-4" />
                My Tournaments
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Profile & Settings */}
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile & Settings
            </CardTitle>
            <CardDescription>
              Manage your account and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link href="/dashboard/profile">
                <Settings className="mr-2 h-4 w-4" />
                Edit Profile
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full">
              <Link href="/dashboard/settings">
                <Edit3 className="mr-2 h-4 w-4" />
                Account Settings
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Browse Tournaments */}
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Browse Tournaments
            </CardTitle>
            <CardDescription>Find and join new tournaments</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/tournaments">
                <Trophy className="mr-2 h-4 w-4" />
                View All Tournaments
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="transition-shadow hover:shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common tasks at your fingertips</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild variant="secondary" className="w-full">
              <Link href="/dashboard/profile/upload/deck">Create Deck</Link>
            </Button>
            <Button asChild variant="secondary" className="w-full">
              <Link href="/dashboard/tournaments/create">
                Create Tournament
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Section */}
      <div className="mt-8">
        <h2 className="mb-4 text-2xl font-bold">Recent Activity</h2>
        <Card>
          <CardContent className="pt-6">
            <div className="text-muted-foreground text-center">
              <p>Recent activity will appear here</p>
              <p className="mt-2 text-sm">
                Check back soon for updates on your tournaments and decks
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
