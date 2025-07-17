"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/trpc/react";
import { useState } from "react";
import { Plus, Users, UserPlus, UserMinus, ShieldBan } from "lucide-react";
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

  const utils = api.useUtils();

  // Check if user is already in a team
  const userTeam = tournament.teams.find((team) =>
    team.team.members.some((member) => member.userId === currentUserId),
  );

  const createTeamMutation = api.tournament.createTeam.useMutation({
    onSuccess: (data) => {
      onUpdate();
      setShowCreateTeam(false);
      setNewTeamName("");
      setTeamCode(data.code);
    },
  });

  const joinTeamMutation = api.tournament.joinTeam.useMutation({
    onSuccess: () => {
      onUpdate();
      setShowJoinTeam(false);
      setJoinCode("");
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
        code: joinCode,
        tournamentId: tournament.id,
      });
    }
  };

  const handleKickMember = () => {
    if (kickMember) {
      kickTeamMemberMutation.mutate({
        teamId: kickMember.teamId,
        userId: kickMember.userId,
      });
    }
  };

  const handleBanMember = () => {
    if (banMember) {
      banTeamMemberMutation.mutate({
        teamId: banMember.teamId,
        userId: banMember.userId,
      });
    }
  };

  if (userTeam) {
    return (
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
            {teamCode && (
              <div className="bg-muted rounded-lg p-3">
                <p className="text-sm font-medium">Team Code:</p>
                <p className="text-2xl font-bold tracking-wider">{teamCode}</p>
                <p className="text-muted-foreground text-xs">
                  Share this code with teammates so they can join your team
                </p>
              </div>
            )}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Team Members:</h4>
              {userTeam.team.members.map((member) => (
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
                  {member.role !== "leader" &&
                    isTeamLeader(userTeam.team.members, currentUserId) && (
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
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Team Tournament</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4 text-sm">
            This is a team tournament. Create a team or join an existing one to
            participate.
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

      {/* Existing Teams */}
      {tournament.teams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Existing Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tournament.teams.map(({ team }) => (
                <div key={team.id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{team.name}</h4>
                      {team.code &&
                        isTeamMember(team.members, currentUserId) && (
                          <p className="text-muted-foreground text-sm">
                            Code: <span className="font-mono">{team.code}</span>
                          </p>
                        )}
                    </div>
                    <Badge variant="outline">
                      {team.members.length} / {tournament.teamSize}
                    </Badge>
                  </div>
                  <div className="mt-2 space-y-1">
                    {team.members.map((member) => (
                      <span
                        key={member.id}
                        className="text-muted-foreground text-sm"
                      >
                        {member.user.name || "Anonymous"}
                        {member.role === "leader" && " (Leader)"}
                      </span>
                    ))}
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
              Enter a name for your team. You'll be the team leader.
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
              Enter the team code to join an existing team.
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
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleJoinTeam}
              disabled={!joinCode.trim() || joinTeamMutation.isPending}
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
