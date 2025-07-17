import { DiscordIcon, TwitchIcon, GoogleIcon } from "@/components/auth-icons";
import { Button } from "@/components/ui/button";
import { signIn } from "@/server/auth";
import { redirect } from "next/navigation";

export default function LoginPage() {
  return (
    <div className="fle flex flex-1 items-center justify-center">
      <div className="bg-card w-full max-w-md rounded-lg p-8 shadow-md">
        <h1 className="text-foreground mb-6 text-center text-3xl font-bold">
          Sign in to your account
        </h1>

        <div className="space-y-4">
          <form
            action={async () => {
              "use server";
              await signIn("discord");
            }}
          >
            <Button className="bg-primary hover:primary-hover flex w-full items-center justify-center gap-3 rounded-md px-4 py-2 text-white">
              <DiscordIcon />
              <span>Sign in with Discord</span>
            </Button>
          </form>

          {/* <form
            action={async () => {
              "use server";
              await signIn("twitch")
          >
            <button className="flex w-full items-center justify-center gap-3 rounded-md bg-[#9146FF] px-4 py-2 text-white hover:bg-[#7c3ae0]">
              <TwitchIcon />
              <span>Sign in with Twitch</span>
            </button>
          </form> */}

          <form
            action={async () => {
              "use server";
              await signIn("google");
            }}
          >
            <Button className="bg-primary hover:primary-hover flex w-full items-center justify-center gap-3 rounded-md px-4 py-2 text-white">
              <GoogleIcon />
              <span>Sign in with Google</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
