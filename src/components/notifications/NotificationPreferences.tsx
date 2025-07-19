"use client";

import { useState } from "react";
import { useNotificationPreferences } from "@/hooks/useNotifications";
import { type NotificationType } from "@/types/notifications";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Bell, Mail, Smartphone, Settings } from "lucide-react";

const notificationTypeLabels: Record<NotificationType, string> = {
  TOURNAMENT_CREATED: "Tournament Created",
  TOURNAMENT_JOINED: "Tournament Joined",
  TOURNAMENT_STARTED: "Tournament Started",
  TOURNAMENT_COMPLETED: "Tournament Completed",
  TOURNAMENT_CANCELLED: "Tournament Cancelled",
  ROUND_STARTED: "Round Started",
  MATCH_ASSIGNED: "Match Assigned",
  MATCH_RESULT_SUBMITTED: "Match Result Submitted",
  TEAM_CREATED: "Team Created",
  TEAM_JOINED: "Team Joined",
  TEAM_MEMBER_ADDED: "Team Member Added",
  TEAM_MEMBER_REMOVED: "Team Member Removed",
  TEAM_DELETED: "Team Deleted",
  DECK_CREATED: "Deck Created",
  DECK_UPDATED: "Deck Updated",
  DECK_SHARED: "Deck Shared",
  DECK_LIKED: "Deck Liked",
  USER_FOLLOWED: "User Followed",
  USER_MENTIONED: "User Mentioned",
  SYSTEM_MAINTENANCE: "System Maintenance",
  SYSTEM_UPDATE: "System Update",
};

const notificationTypeDescriptions: Record<NotificationType, string> = {
  TOURNAMENT_CREATED: "When a new tournament is created",
  TOURNAMENT_JOINED: "When you join a tournament",
  TOURNAMENT_STARTED: "When a tournament you're in starts",
  TOURNAMENT_COMPLETED: "When a tournament you're in ends",
  TOURNAMENT_CANCELLED: "When a tournament you're in is cancelled",
  ROUND_STARTED: "When a new round begins",
  MATCH_ASSIGNED: "When you're assigned to a match",
  MATCH_RESULT_SUBMITTED: "When match results are submitted",
  TEAM_CREATED: "When a team is created",
  TEAM_JOINED: "When you join a team",
  TEAM_MEMBER_ADDED: "When a member is added to your team",
  TEAM_MEMBER_REMOVED: "When a member is removed from your team",
  TEAM_DELETED: "When a team is deleted",
  DECK_CREATED: "When you create a new deck",
  DECK_UPDATED: "When you update a deck",
  DECK_SHARED: "When someone shares a deck with you",
  DECK_LIKED: "When someone likes your deck",
  USER_FOLLOWED: "When someone follows you",
  USER_MENTIONED: "When someone mentions you",
  SYSTEM_MAINTENANCE: "System maintenance notifications",
  SYSTEM_UPDATE: "Important system updates",
};

export function NotificationPreferences() {
  const { preferences, isLoading, error, updatePreferences } =
    useNotificationPreferences();
  const [saving, setSaving] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Loading your preferences...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
          <CardDescription>Error loading preferences</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const handleToggle = async (
    key: "email" | "push" | "inApp",
    value: boolean,
  ) => {
    setSaving(true);
    try {
      await updatePreferences({ [key]: value });
    } finally {
      setSaving(false);
    }
  };

  const handleTypeToggle = async (type: NotificationType, enabled: boolean) => {
    if (!preferences) return;

    const currentTypes = JSON.parse(
      preferences.enabledTypes,
    ) as NotificationType[];
    const newTypes = enabled
      ? [...currentTypes, type]
      : currentTypes.filter((t) => t !== type);

    setSaving(true);
    try {
      await updatePreferences({ enabledTypes: newTypes });
    } finally {
      setSaving(false);
    }
  };

  if (!preferences) return null;

  const enabledTypes = JSON.parse(
    preferences.enabledTypes,
  ) as NotificationType[];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Notification Preferences
        </CardTitle>
        <CardDescription>
          Choose how you want to be notified about different events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {saving && (
          <div className="text-muted-foreground animate-pulse text-sm">
            Saving preferences...
          </div>
        )}

        <div className="space-y-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Bell className="h-4 w-4" />
            Notification Channels
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="in-app" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  In-App Notifications
                </Label>
                <p className="text-muted-foreground text-sm">
                  Receive notifications within the application
                </p>
              </div>
              <Switch
                id="in-app"
                checked={preferences.inApp}
                onCheckedChange={(checked) => handleToggle("inApp", checked)}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Notifications
                </Label>
                <p className="text-muted-foreground text-sm">
                  Receive email notifications
                </p>
              </div>
              <Switch
                id="email"
                checked={preferences.email}
                onCheckedChange={(checked) => handleToggle("email", checked)}
                disabled={saving}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="push" className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Push Notifications
                </Label>
                <p className="text-muted-foreground text-sm">
                  Receive browser push notifications
                </p>
              </div>
              <Switch
                id="push"
                checked={preferences.push}
                onCheckedChange={(checked) => handleToggle("push", checked)}
                disabled={saving}
              />
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Notification Types</h3>

          <div className="space-y-3">
            {Object.entries(notificationTypeLabels).map(([type, label]) => (
              <div
                key={type}
                className="flex items-start justify-between space-x-4"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <Label className="font-medium">{label}</Label>
                    <Badge variant="outline" className="text-xs">
                      {type.replace(/_/g, " ").toLowerCase()}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-sm">
                    {notificationTypeDescriptions[type as NotificationType]}
                  </p>
                </div>
                <Switch
                  checked={enabledTypes.includes(type as NotificationType)}
                  onCheckedChange={(checked) =>
                    handleTypeToggle(type as NotificationType, checked)
                  }
                  disabled={saving}
                />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
