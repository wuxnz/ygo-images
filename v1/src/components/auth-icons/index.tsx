import type { SVGProps } from "react";

export function DiscordIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M19.54 0c1.356 0 2.46 1.104 2.46 2.472v19.528c0 .894-1.186 1.182-1.64.896l-2.582-1.296-1.492 1.478c-.28.28-.798.14-.798-.28v-2.002h.002c0-4.988-4.474-9-10-9s-10 4.012-10 9v2.002c0 .42-.518.56-.798.28l-1.492-1.478-2.582 1.296c-.454.286-1.64-.002-1.64-.896v-19.528c0-1.368 1.104-2.472 2.46-2.472h16.08zm-8.04 5.2c-2.32 0-4.2 1.88-4.2 4.2s1.88 4.2 4.2 4.2 4.2-1.88 4.2-4.2-1.88-4.2-4.2-4.2zm-8.2 11.2c0-2.32 1.88-4.2 4.2-4.2s4.2 1.88 4.2 4.2-1.88 4.2-4.2 4.2-4.2-1.88-4.2-4.2zm16.4 0c0-2.32 1.88-4.2 4.2-4.2s4.2 1.88 4.2 4.2-1.88 4.2-4.2 4.2-4.2-1.88-4.2-4.2z"
      />
    </svg>
  );
}

export function TwitchIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"
      />
    </svg>
  );
}

export function GoogleIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"
      />
    </svg>
  );
}
