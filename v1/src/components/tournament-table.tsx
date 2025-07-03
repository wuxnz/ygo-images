"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { RouterOutputs } from "@/trpc/react";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { api } from "@/trpc/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Tournament = RouterOutputs["tournament"]["getAll"][number];

export function TournamentTable({
  tournaments,
}: {
  tournaments: Tournament[];
}) {
  const router = useRouter();
  const utils = api.useUtils();

  const deleteMutation = api.tournament.delete.useMutation({
    onSuccess: () => {
      toast.success("Tournament deleted successfully");
      utils.tournament.getAll.invalidate();
      router.refresh();
    },
    onError: (error) => {
      toast.error("Failed to delete tournament", {
        description: error.message,
      });
    },
  });

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Bracket Type</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>End Date</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tournaments.map((tournament) => (
          <TableRow key={tournament.id}>
            <TableCell className="font-medium">
              <Link
                href={`/dashboard/tournaments/${tournament.id}`}
                className="text-primary hover:underline"
              >
                {tournament.name}
              </Link>
            </TableCell>
            <TableCell>{tournament.size}</TableCell>
            <TableCell>{tournament.bracketType}</TableCell>
            <TableCell>{format(tournament.startDate, "MMM d, yyyy")}</TableCell>
            <TableCell>{format(tournament.endDate, "MMM d, yyyy")}</TableCell>
            <TableCell>
              <Button asChild size="sm" variant="outline">
                <Link href={`/dashboard/tournaments/${tournament.id}`}>
                  View
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
