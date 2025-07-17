import Link from "next/link";
import { Button } from "@/components/ui/button";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-800 pt-12 text-center text-gray-400">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div>
            <h3 className="mb-4 text-xl font-bold">Top Deck Circuit</h3>
            <p className="text-gray-400">
              The ultimate platform for organizing and competing in tournaments
            </p>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Navigation</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-white">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/tournaments"
                  className="text-gray-400 hover:text-white"
                >
                  Tournaments
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard/profile"
                  className="text-gray-400 hover:text-white"
                >
                  My Profile
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-gray-400 hover:text-white">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Resources</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/docs" className="text-gray-400 hover:text-white">
                  Documentation
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-gray-400 hover:text-white">
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  href="/support"
                  className="text-gray-400 hover:text-white"
                >
                  Support
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-gray-400 hover:text-white"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 font-semibold">Stay Connected</h4>
            <p className="mb-4 text-gray-400">
              Subscribe to our newsletter for updates
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Your email"
                className="w-full rounded-lg rounded-r-none bg-[#1a1a1a] px-4 py-2 text-gray-400"
              />
              <Button className="rounded-l-none">Subscribe</Button>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-12 border-t border-gray-800 py-6 text-center text-gray-400">
        <p>&copy; {currentYear} Top Deck Circuit. All rights reserved.</p>
      </div>
    </footer>
  );
}
