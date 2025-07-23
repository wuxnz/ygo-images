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
  Trophy,
  Calendar,
  Users,
  Clock,
  Eye,
  Edit3,
  Plus,
  Search,
  AlertCircle,
} from "lucide-react";
import { api } from "@/trpc/react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MyTournamentsPage() {
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch all tournaments and filter client-side
  const { data: tournaments, isLoading } = api.tournament.getAll.useQuery({});

  // Filter tournaments based on user involvement
  const myTournaments = tournaments?.items.filter(
    (tournament) => tournament.creator.id === session?.user?.id,
  );

  const filteredTournaments = myTournaments?.filter((tournament) =>
    tournament.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const createdTournaments =
    filteredTournaments?.filter((t) => t.creator.id === session?.user?.id) ||
    [];

  const getStatusBadge = (tournament: any) => {
    if (tournament.status === "completed") {
      return <Badge variant="outline">Completed</Badge>;
    }
    if (tournament.status === "active") {
      return <Badge variant="default">Active</Badge>;
    }
    return <Badge variant="secondary">Registration</Badge>;
  };

  const TournamentCard = ({ tournament }: { tournament: any }) => {
    const isCreator = tournament.creator.id === session?.user?.id;

    return (
      <Card className="flex flex-col">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-lg">{tournament.name}</CardTitle>
              <CardDescription className="mt-1">
                {tournament.rules || "No description provided"}
              </CardDescription>
            </div>
            {isCreator && (
              <Badge variant="outline" className="ml-2">
                Owner
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1">
          <div className="space-y-3">
            <div className="text-muted-foreground flex items-center text-sm">
              <Calendar className="mr-2 h-4 w-4" />
              {format(new Date(tournament.startDate), "MMM dd, yyyy")}
            </div>

            <div className="text-muted-foreground flex items-center text-sm">
              <Users className="mr-2 h-4 w-4" />
              {tournament.participants.length} / {tournament.size} participants
            </div>

            <div className="text-muted-foreground flex items-center text-sm">
              <Clock className="mr-2 h-4 w-4" />
              {tournament.format}
            </div>

            <div className="pt-2">{getStatusBadge(tournament)}</div>
          </div>
        </CardContent>

        <CardFooter className="flex gap-2">
          <Button asChild className="flex-1">
            <Link href={`/dashboard/tournaments/${tournament.id}`}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </Link>
          </Button>

          {isCreator && (
            <Button variant="outline" size="icon" asChild>
              <Link href={`/dashboard/tournaments/${tournament.id}`}>
                <Edit3 className="h-4 w-4" />
              </Link>
            </Button>
          )}
        </CardFooter>
      </Card>
    );
  };

  const EmptyState = ({ type }: { type: string }) => (
    <Card>
      <CardContent className="pt-6">
        <div className="text-center">
          <Trophy className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-semibold">
            {type === "all" && "No tournaments found"}
            {type === "created" && "No created tournaments"}
            {type === "participating" && "No participating tournaments"}
          </h3>
          <p className="text-muted-foreground mb-4">
            {type === "all" &&
              "You haven't created or joined any tournaments yet."}
            {type === "created" && "You haven't created any tournaments yet."}
            {type === "participating" &&
              "You haven't joined any tournaments yet."}
          </p>
          <Button asChild>
            <Link
              href={type === "created" ? "/tournaments/create" : "/tournaments"}
            >
              {type === "created" ? (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Tournament
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" />
                  Browse Tournaments
                </>
              )}
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
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
                You need to be signed in to view your tournaments.
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

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="mb-2 h-10 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="mb-2 h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="mb-2 h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              My Tournaments
            </h1>
            <p className="text-muted-foreground">
              View tournaments you've created, joined, or participated in
            </p>
          </div>
          <Button asChild>
            <Link href="/tournaments/create">
              <Plus className="mr-2 h-4 w-4" />
              Create Tournament
            </Link>
          </Button>
        </div>

        {/* Search */}
        <div className="mt-6">
          <div className="relative">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              type="text"
              placeholder="Search tournaments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Tournament Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">
            All ({filteredTournaments?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="created">
            Created ({createdTournaments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {filteredTournaments?.length === 0 ? (
            <EmptyState type="all" />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredTournaments?.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="created">
          {createdTournaments.length === 0 ? (
            <EmptyState type="created" />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {createdTournaments.map((tournament) => (
                <TournamentCard key={tournament.id} tournament={tournament} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
