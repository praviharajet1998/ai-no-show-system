import Link from "next/link";

import { Button } from "@/components/ui/button";

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          AI No-Show Dashboard
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/">Appointments</Link>} />
          <Button
            variant="ghost"
            size="sm"
            nativeButton={false}
            render={<Link href="/analytics">Analytics</Link>}
          />
          <Button
            variant="default"
            size="sm"
            nativeButton={false}
            render={<Link href="/new">New appointment</Link>}
          />
        </nav>
      </div>
    </header>
  );
}
