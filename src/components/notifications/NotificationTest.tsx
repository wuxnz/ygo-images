"use client";

import { useState } from "react";
import { api } from "@/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import type { NotificationType } from "@/types/notifications";

const notificationTypes: NotificationType[] = [
  "TOURNAMENT_CREATED",
  "TOURNAMENT_JOINED",
  "TOURNAMENT_STARTED",
  "TOURNAMENT_COMPLETED",
  "TOURNAMENT_CANCELLED",
  "ROUND_STARTED",
  "MATCH_ASSIGNED",
  "MATCH_RESULT_SUBMITTED",
  "TEAM_CREATED",
  "TEAM_JOINED",
  "TEAM_MEMBER_ADDED",
  "TEAM_MEMBER_REMOVED",
  "TEAM_DELETED",
  "DECK_CREATED",
  "DECK_UPDATED",
  "DECK_SHARED",
  "DECK_LIKED",
  "USER_FOLLOWED",
  "USER_MENTIONED",
  "SYSTEM_MAINTENANCE",
  "SYSTEM_UPDATE",
];

export function NotificationTest() {
  const [userId, setUserId] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState<NotificationType>("SYSTEM_UPDATE");
  const [metadata, setMetadata] = useState("");

  const createNotification =
    api.notification.createTestNotification.useMutation({
      onSuccess: () => {
        toast.success("Notification created successfully");
        setTitle("");
        setMessage("");
        setMetadata("");
      },
      onError: (error) => {
        toast.error(`Error creating notification: ${error.message}`);
      },
    });

  const handleSubmit = () => {
    if (!userId || !title || !message) {
      toast.error("Please fill in all required fields");
      return;
    }

    let parsedMetadata = {};
    try {
      if (metadata.trim()) {
        parsedMetadata = JSON.parse(metadata);
      }
    } catch (error) {
      toast.error("Invalid JSON in metadata");
      return;
    }

    createNotification.mutate({
      userId,
      type,
      title,
      message,
      metadata: parsedMetadata,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Test</CardTitle>
        <CardDescription>
          Create test notifications to verify the system is working
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">User ID</label>
          <Input
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            placeholder="Enter user ID"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Type</label>
          <Select
            value={type}
            onValueChange={(value) => setType(value as NotificationType)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {notificationTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="text-sm font-medium">Title</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Notification title"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Message</label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Notification message"
            rows={3}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Metadata (JSON)</label>
          <Textarea
            value={metadata}
            onChange={(e) => setMetadata(e.target.value)}
            placeholder='{"tournamentId": "123", "matchId": "456"}'
            rows={3}
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={createNotification.isPending}
          className="w-full"
        >
          {createNotification.isPending ? "Creating..." : "Create Notification"}
        </Button>
      </CardContent>
    </Card>
  );
}
