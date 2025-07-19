"use client";

import Link from "next/link";
import { Button } from "./button";
import { useRouter } from "next/navigation";

function BackButton() {
  const router = useRouter();

  return (
    <div className="mt-6">
      <Link href="" onClick={() => router.back()}>
        <Button variant="outline">← Go Back</Button>
      </Link>
    </div>
  );
}

export default BackButton;
