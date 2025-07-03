"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const tournamentFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  size: z.coerce.number().min(2, "Must have at least 2 participants"),
  bracketType: z.string().min(1, "Bracket type is required"),
  rules: z.string().min(1, "Rules are required"),
  prize: z.string().min(1, "Prize is required"),
  startDate: z.date(),
  endDate: z.date(),
});

type TournamentFormValues = z.infer<typeof tournamentFormSchema>;

interface TournamentFormProps {
  defaultValues?: Partial<TournamentFormValues>;
  onSubmit: (values: TournamentFormValues) => Promise<void>;
  isSubmitting: boolean;
}

export function TournamentForm({
  defaultValues,
  onSubmit,
  isSubmitting,
}: TournamentFormProps) {
  const form = useForm<TournamentFormValues>({
    resolver: zodResolver(tournamentFormSchema),
    defaultValues: defaultValues ?? {
      name: "",
      size: 8,
      bracketType: "SINGLE_ELIMINATION",
      rules: "",
      prize: "",
      startDate: new Date(),
      endDate: new Date(),
    },
  });

  const handleSubmit = async (values: TournamentFormValues) => {
    try {
      // Remove the unnecessary Date conversions since values are already Date objects
      await onSubmit(values);
      toast.success("Tournament saved successfully");
    } catch (error) {
      toast.error("Failed to save tournament", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tournament Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter tournament name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Number of Participants</FormLabel>
              <FormControl>
                <Input type="number" min={2} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bracketType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bracket Type</FormLabel>
              <FormControl>
                <select
                  {...field}
                  className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="SINGLE_ELIMINATION">Single Elimination</option>
                  <option value="DOUBLE_ELIMINATION">Double Elimination</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rules"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rules</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe tournament rules"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="prize"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prize</FormLabel>
              <FormControl>
                <Input placeholder="Describe the prize" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Start Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>End Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground",
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < (form.getValues("startDate") ?? new Date())
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button
          type="submit"
          disabled={isSubmitting}
          className="text-foreground! w-full"
        >
          {isSubmitting ? "Saving..." : "Save Tournament"}
        </Button>
      </form>
    </Form>
  );
}
