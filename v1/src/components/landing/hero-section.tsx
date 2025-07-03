"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BackgroundBeams } from "../ui/background-beams";
import { useTheme } from "next-themes";

export function HeroSection() {
  const { resolvedTheme } = useTheme();

  // Determine background class based on theme
  const bgClass =
    resolvedTheme === "dark"
      ? "bg-neutral-950"
      : resolvedTheme === "light"
        ? "bg-white"
        : "bg-neutral-950"; // fallback to neutral-950

  return (
    <section
      className={`relative flex h-[calc(100vh-4rem)] w-full items-center justify-center rounded-md antialiased transition-colors duration-500`} // ${bgClass}`}
    >
      <div className="z-10 container mx-auto px-4 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="mb-6 text-4xl font-bold md:text-6xl">
            Create, Compete, Conquer
          </h1>
          <p className="mb-10 text-xl opacity-90 md:text-2xl">
            The ultimate platform for organizing and participating in
            competitive tournaments
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="text-foreground text-lg">
              <Link href="/dashboard/tournaments/create">
                Create Tournament
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary" className="text-lg">
              <Link href="/dashboard/tournaments">Browse Tournaments</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* <BackgroundBeams /> */}
    </section>
  );
}
