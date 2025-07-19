"use client";

import { NotificationBell } from "@/components/notifications/NotificationBell";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";
import { NotificationPreferences } from "@/components/notifications/NotificationPreferences";
import { NotificationTest } from "@/components/notifications/NotificationTest";
import { useWebSocketNotifications } from "@/hooks/useNotifications";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function NotificationTestPage() {
  const { isConnected } = useWebSocketNotifications();

  return (
    <div className="container mx-auto space-y-8 py-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold">Notification System Test</h1>
        <p className="text-muted-foreground">
          Test and verify the complete notification system functionality
        </p>
        <div className="mt-2">
          <Badge variant={isConnected ? "default" : "secondary"}>
            WebSocket: {isConnected ? "Connected" : "Disconnected"}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Notification Bell</CardTitle>
            <CardDescription>
              Test the notification bell component with real-time updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationBell />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Dropdown</CardTitle>
            <CardDescription>
              Test the notification dropdown with real-time updates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <NotificationBell />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <NotificationTest />

        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>
              Test notification preferences management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationPreferences />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
          <CardDescription>Current notification system status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>WebSocket Connection:</span>
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "Active" : "Inactive"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>Real-time Updates:</span>
              <Badge variant={isConnected ? "default" : "secondary"}>
                {isConnected ? "Enabled" : "Polling (30s)"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
