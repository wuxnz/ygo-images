"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/trpc/react";
import { useState } from "react";
import {
  Plus,
  Users,
  UserPlus,
  UserMinus,
  ShieldBan,
  CreditCard,
  Eye,
} from "lucide-react";
import Link from "next/link";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TeamTournamentManagerProps {
  tournament: {
    id: string;
    name: string;
    teamSize: number;
    teams: Array<{
      team: {
        id: string;
        name: string;
        code?: string | null;
        members: Array<{
          id: string;
          userId: string;
          role: string;
          user: {
            id: string;
            name: string | null;
            image: string | null;
          };
        }>;
      };
    }>;
    participants: Array<{
      userId: string;
    }>;
  };
  isCreator: boolean;
  currentUserId: string | undefined;
  onUpdate: () => void;
}

export function TeamTournamentManager({
  tournament,
  isCreator,
  currentUserId,
  onUpdate,
}: TeamTournamentManagerProps) {
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showJoinTeam, setShowJoinTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [teamCode, setTeamCode] = useState<string | null>(null);
  const [selectedDeckForCreate, setSelectedDeckForCreate] =
    useState<string>("none");
  const [selectedDeckForJoin, setSelectedDeckForJoin] =
    useState<string>("none");
  const [kickMember, setKickMember] = useState<{
    teamId: string;
    userId: string;
    userName: string;
  } | null>(null);
  const [banMember, setBanMember] = useState<{
    teamId: string;
    userId: string;
    userName: string;
  } | null>(null);
  const [leaveTeam, setLeaveTeam] = useState<{
    teamId: string;
    teamName: string;
  } | null>(null);
  const [deleteTeam, setDeleteTeam] = useState<{
    teamId: string;
    teamName: string;
  } | null>(null);
  const [selectedDecks, setSelectedDecks] = useState<Record<string, string>>(
    {},
  );

  const utils = api.useUtils();

  // Check if user is already in a team
  const userTeam = tournament.teams.find((team) =>
    team.team.members.some((member) => member.userId === currentUserId),
  );

  const createTeamMutation = api.tournament.createTeam.useMutation({
    onSuccess: (data) => {
      // After team creation, update member deck if selected
      if (selectedDeckForCreate !== "none") {
        updateTeamMemberDeckMutation.mutate({
          tournamentId: tournament.id,
          teamId: data.id,
          deckId: selectedDeckForCreate,
        });
      }
      onUpdate();
      setShowCreateTeam(false);
      setNewTeamName("");
      setTeamCode(data.code);
      setSelectedDeckForCreate("none");
    },
  });

  const joinTeamMutation = api.tournament.joinTeam.useMutation({
    onSuccess: () => {
      // After joining team, update member deck if selected
      if (selectedDeckForJoin !== "none" && teamByCodeQuery.data?.id) {
        updateTeamMemberDeckMutation.mutate({
          tournamentId: tournament.id,
          teamId: teamByCodeQuery.data.id,
          deckId: selectedDeckForJoin,
        });
      }
      onUpdate();
      setShowJoinTeam(false);
      setJoinCode("");
      setSelectedDeckForJoin("none");
    },
  });

  const kickTeamMemberMutation = api.tournament.kickTeamMember.useMutation({
    onSuccess: () => {
      onUpdate();
      setKickMember(null);
    },
  });

  const banTeamMemberMutation = api.tournament.banTeamMember.useMutation({
    onSuccess: () => {
      onUpdate();
      setBanMember(null);
    },
  });

  const userDecks = api.deck.getUserDecks.useQuery();
  const teamDecks = api.tournament.getTeamDecks.useQuery(
    {
      tournamentId: tournament.id,
      teamId: userTeam?.team.id || "",
    },
    { enabled: !!userTeam },
  );
  const updateTeamMemberDeckMutation =
    api.tournament.updateTeamMemberDeck.useMutation({
      onSuccess: () => {
        teamDecks.refetch();
      },
    });

  const leaveTeamMutation = api.tournament.leaveTeam.useMutation({
    onSuccess: () => {
      onUpdate();
      setLeaveTeam(null);
    },
  });

  const deleteTeamMutation = api.tournament.deleteTeam.useMutation({
    onSuccess: () => {
      onUpdate();
      setDeleteTeam(null);
    },
  });

  const teamByCodeQuery = api.tournament.getTeamByCode.useQuery(
    {
      code: joinCode,
    },
    { enabled: !!joinCode.trim() },
  );

  const handleCreateTeam = () => {
    if (newTeamName.trim()) {
      createTeamMutation.mutate({
        name: newTeamName,
        tournamentId: tournament.id,
      });
    }
  };

  const handleJoinTeam = () => {
    if (joinCode.trim()) {
      joinTeamMutation.mutate({
        teamCode: joinCode,
        tournamentId: tournament.id,
      });
    }
  };

  const handleKickMember = () => {
    if (kickMember) {
      kickTeamMemberMutation.mutate({
        tournamentId: tournament.id,
        teamId: kickMember.teamId,
        userId: kickMember.userId,
      });
    }
  };

  const handleBanMember = () => {
    if (banMember) {
      banTeamMemberMutation.mutate({
        tournamentId: tournament.id,
        teamId: banMember.teamId,
        userId: banMember.userId,
      });
    }
  };

  const handleDeckSelect = (deckId: string) => {
    if (userTeam) {
      updateTeamMemberDeckMutation.mutate({
        tournamentId: tournament.id,
        teamId: userTeam.team.id,
        deckId: deckId === "none" ? "" : deckId,
      });
    }
  };

  const handleLeaveTeam = () => {
    if (leaveTeam) {
      leaveTeamMutation.mutate({
        teamId: leaveTeam.teamId,
        tournamentId: tournament.id,
      });
    }
  };

  const handleDeleteTeam = () => {
    if (deleteTeam) {
      deleteTeamMutation.mutate({
        teamId: deleteTeam.teamId,
        tournamentId: tournament.id,
      });
    }
  };

  return (
    <div className="space-y-4">
      {/* Your Team Section - Always show if user is in a team */}
      {userTeam && (
        <Card>
          <CardHeader>
            <CardTitle>Your Team</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{userTeam.team.name}</h3>
                <p className="text-muted-foreground text-sm">
                  Team Size: {userTeam.team.members.length} /{" "}
                  {tournament.teamSize}
                </p>
              </div>
              {(userTeam.team.code || teamCode) && (
                <div className="bg-muted rounded-lg p-3">
                  <p className="text-sm font-medium">Team Code:</p>
                  <p className="text-2xl font-bold tracking-wider">
                    {userTeam.team.code || teamCode}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Share this code with teammates so they can join your team
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Team Members:</h4>
                {userTeam.team.members.map((member) => {
                  const memberDeck = teamDecks.data?.find(
                    (d) => d.userId === member.userId,
                  );
                  const isCurrentUser = member.userId === currentUserId;

                  return (
                    <div
                      key={member.id}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            member.role === "leader" ? "default" : "secondary"
                          }
                        >
                          {member.user.name || "Anonymous"}
                        </Badge>
                        {member.role === "leader" && (
                          <span className="text-muted-foreground text-xs">
                            (Leader)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Deck Selection */}
                        {isCurrentUser && (
                          <Select
                            value={memberDeck?.deckId || "none"}
                            onValueChange={handleDeckSelect}
                            disabled={updateTeamMemberDeckMutation.isPending}
                          >
                            <SelectTrigger className="h-8 w-40 text-sm">
                              <SelectValue placeholder="Select deck">
                                {memberDeck?.deck?.name || "Select deck"}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No deck</SelectItem>
                              {userDecks.data?.map((deck) => (
                                <SelectItem key={deck.id} value={deck.id}>
                                  {deck.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {(isCreator || isCurrentUser) && memberDeck?.deck && (
                          <Link
                            href={`/deck/${tournament.id}/${memberDeck.deck.id}`}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs"
                            >
                              <Eye className="mr-1 h-3 w-3" />
                              View
                            </Button>
                          </Link>
                        )}

                        {!isCreator && !isCurrentUser && memberDeck?.deck && (
                          <Badge variant="outline" className="text-xs">
                            <CreditCard className="mr-1 h-3 w-3" />
                            {memberDeck.deck.name}
                          </Badge>
                        )}

                        {/* Management buttons */}
                        {member.role !== "leader" &&
                          isTeamLeader(
                            userTeam.team.members,
                            currentUserId,
                          ) && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setKickMember({
                                    teamId: userTeam.team.id,
                                    userId: member.userId,
                                    userName: member.user.name || "Anonymous",
                                  })
                                }
                                disabled={kickTeamMemberMutation.isPending}
                              >
                                <UserMinus className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setBanMember({
                                    teamId: userTeam.team.id,
                                    userId: member.userId,
                                    userName: member.user.name || "Anonymous",
                                  })
                                }
                                disabled={banTeamMemberMutation.isPending}
                              >
                                <ShieldBan className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Team Management Actions */}
              <div className="border-t pt-4">
                <div className="flex gap-2">
                  {isTeamLeader(userTeam.team.members, currentUserId) ? (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        setDeleteTeam({
                          teamId: userTeam.team.id,
                          teamName: userTeam.team.name,
                        })
                      }
                      disabled={deleteTeamMutation.isPending}
                    >
                      Delete Team
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setLeaveTeam({
                          teamId: userTeam.team.id,
                          teamName: userTeam.team.name,
                        })
                      }
                      disabled={leaveTeamMutation.isPending}
                    >
                      Leave Team
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Join Team Actions - Only show if user is not in a team */}
      {!userTeam && (
        <Card>
          <CardHeader>
            <CardTitle>Team Tournament</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm">
              This is a team tournament. Create a team or join an existing one
              to participate.
            </p>
            <div className="flex gap-4">
              <Button
                onClick={() => setShowCreateTeam(true)}
                disabled={createTeamMutation.isPending}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Team
              </Button>
              <Button
                onClick={() => setShowJoinTeam(true)}
                variant="outline"
                disabled={joinTeamMutation.isPending}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Join Team
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Teams - Always show */}
      {tournament.teams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>All Teams ({tournament.teams.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {tournament.teams.map(({ team }) => (
                <div key={team.id} className="rounded-lg border p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-lg font-semibold">{team.name}</h4>
                    <Badge
                      variant={
                        team.members.length === tournament.teamSize
                          ? "default"
                          : "outline"
                      }
                      className={
                        team.members.length === tournament.teamSize
                          ? "bg-green-500"
                          : ""
                      }
                    >
                      {team.members.length} / {tournament.teamSize}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium">Members:</span>
                      <div className="mt-1 space-y-2">
                        {team.members.map((member) => (
                          <div
                            key={member.id}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">
                                {member.user.name || "Anonymous"}
                              </span>
                              {member.role === "leader" && (
                                <Badge variant="secondary" className="text-xs">
                                  Leader
                                </Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {!isTeamMember(team.members, currentUserId) && (
                      <div className="mt-3 border-t pt-3">
                        <p className="text-muted-foreground text-xs">
                          {team.members.length < tournament.teamSize
                            ? `This team has ${tournament.teamSize - team.members.length} open spot(s)`
                            : "Team is full"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Team Dialog */}
      <AlertDialog open={showCreateTeam} onOpenChange={setShowCreateTeam}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create New Team</AlertDialogTitle>
            <AlertDialogDescription>
              Enter a name for your team and select your deck. You'll be the
              team leader.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="teamName" className="mb-2">
                Team Name
              </Label>
              <Input
                id="teamName"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Enter team name"
              />
            </div>
            <div>
              <Label htmlFor="createDeck" className="mb-2">
                Select Deck (Optional)
              </Label>
              <Select
                value={selectedDeckForCreate}
                onValueChange={setSelectedDeckForCreate}
                disabled={userDecks.isLoading}
              >
                <SelectTrigger id="createDeck">
                  <SelectValue placeholder="Choose a deck..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No deck selected</SelectItem>
                  {userDecks.data?.map((deck) => (
                    <SelectItem key={deck.id} value={deck.id}>
                      {deck.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCreateTeam}
              disabled={!newTeamName.trim() || createTeamMutation.isPending}
            >
              {createTeamMutation.isPending ? "Creating..." : "Create Team"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Join Team Dialog */}
      <AlertDialog open={showJoinTeam} onOpenChange={setShowJoinTeam}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Join Team</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the team code to join an existing team and select your deck.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="joinCode">Team Code</Label>
              <Input
                id="joinCode"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                placeholder="Enter team code"
                className="uppercase"
              />
            </div>

            {/* Team Preview */}
            {joinCode.trim() && teamByCodeQuery.data && (
              <div className="rounded-lg border p-4">
                <h4 className="mb-2 font-semibold">Team Details</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Name:</span>{" "}
                    {teamByCodeQuery.data.name}
                  </div>
                  <div>
                    <span className="font-medium">Members:</span>{" "}
                    {teamByCodeQuery.data.members?.length ?? 0} /{" "}
                    {tournament.teamSize}
                  </div>
                  <div>
                    <span className="font-medium">Team Members:</span>
                    <ul className="mt-1 ml-4 list-disc">
                      {teamByCodeQuery.data.members?.map(
                        (member: {
                          id: string;
                          user: { name: string | null };
                        }) => (
                          <li key={member.id}>{member.user.name}</li>
                        ),
                      )}
                    </ul>
                  </div>
                  {(teamByCodeQuery.data.members?.length ?? 0) >=
                    tournament.teamSize && (
                    <div className="font-medium text-red-600">
                      This team is full
                    </div>
                  )}
                </div>
              </div>
            )}

            {joinCode.trim() && teamByCodeQuery.isError && (
              <div className="text-sm text-red-600">
                Team not found or not registered for this tournament
              </div>
            )}

            <div>
              <Label htmlFor="joinDeck" className="mb-2">
                Select Deck (Optional)
              </Label>
              <Select
                value={selectedDeckForJoin}
                onValueChange={setSelectedDeckForJoin}
                disabled={userDecks.isLoading}
              >
                <SelectTrigger id="joinDeck">
                  <SelectValue placeholder="Choose a deck..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No deck selected</SelectItem>
                  {userDecks.data?.map((deck) => (
                    <SelectItem key={deck.id} value={deck.id}>
                      {deck.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleJoinTeam}
              disabled={
                !joinCode.trim() ||
                joinTeamMutation.isPending ||
                (teamByCodeQuery.data?.members?.length ?? 0) >=
                  tournament.teamSize
              }
            >
              {joinTeamMutation.isPending ? "Joining..." : "Join Team"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Kick Member Dialog */}
      <AlertDialog open={!!kickMember} onOpenChange={() => setKickMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kick Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to kick {kickMember?.userName} from the
              team? They can rejoin with the team code.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleKickMember}
              disabled={kickTeamMemberMutation.isPending}
            >
              {kickTeamMemberMutation.isPending ? "Kicking..." : "Kick Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Ban Member Dialog */}
      <AlertDialog open={!!banMember} onOpenChange={() => setBanMember(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to ban {banMember?.userName} from the team?
              They won't be able to rejoin.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBanMember}
              disabled={banTeamMemberMutation.isPending}
            >
              {banTeamMemberMutation.isPending ? "Banning..." : "Ban Member"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Deck Modal removed - now using dedicated deck page */}

      {/* Leave Team Dialog */}
      <AlertDialog open={!!leaveTeam} onOpenChange={() => setLeaveTeam(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave "{leaveTeam?.teamName}"? You can
              rejoin later with the team code if there are open spots.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveTeam}
              disabled={leaveTeamMutation.isPending}
            >
              {leaveTeamMutation.isPending ? "Leaving..." : "Leave Team"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Team Dialog */}
      <AlertDialog open={!!deleteTeam} onOpenChange={() => setDeleteTeam(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Team</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTeam?.teamName}"? This
              will remove all team members and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTeam}
              disabled={deleteTeamMutation.isPending}
            >
              {deleteTeamMutation.isPending ? "Deleting..." : "Delete Team"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Helper functions
function isTeamMember(
  members: Array<{ userId: string }>,
  currentUserId?: string,
): boolean {
  return members.some((member) => member.userId === currentUserId);
}

function isTeamLeader(
  members: Array<{ userId: string; role: string }>,
  currentUserId?: string,
): boolean {
  const member = members.find((m) => m.userId === currentUserId);
  return member?.role === "leader";
}
