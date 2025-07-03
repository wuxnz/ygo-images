"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationIcon } from "@/components/notifications/NotificationIcon";
import { ThemeToggle } from "./ThemeToggle";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <nav className="flex items-center justify-between border-b p-4">
      <div className="flex items-center space-x-4">
        <Link href="/" className="text-lg font-bold">
          TDC
        </Link>
        {session?.user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost">Dashboard</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">Profile</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/dashboard/tournaments">Tournaments</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard/tournaments/create"
                  className="text-foreground!"
                >
                  Create Tournament
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      <div className="flex items-center space-x-4">
        {session?.user ? (
          <>
            <ThemeToggle />
            <NotificationIcon />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-gray-800 focus:outline-none">
                  <Avatar>
                    <AvatarImage
                      src={session.user.image ?? ""}
                      alt={session.user.name ?? "User"}
                    />
                    <AvatarFallback>
                      {session.user.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => signOut()}>
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        ) : (
          <>
            <ThemeToggle />
            <Button asChild variant="ghost">
              <Link href="/login">Sign In</Link>
            </Button>
          </>
        )}
      </div>
    </nav>
  );
}
