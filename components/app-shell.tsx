"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { Activity, CalendarClock, ClipboardList, FileBarChart, FileHeart, HeartHandshake, HeartPulse, LayoutDashboard, MoonStar, Pill, ShieldPlus, Stethoscope, SunMedium, Syringe, UserRound, Bell } from "lucide-react";
import { Avatar, Button, cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/health-profile", label: "Health Profile", icon: UserRound },
  { href: "/medications", label: "Medications", icon: Pill },
  { href: "/appointments", label: "Appointments", icon: CalendarClock },
  { href: "/labs", label: "Lab Results", icon: FileBarChart },
  { href: "/vitals", label: "Vitals", icon: Activity },
  { href: "/symptoms", label: "Symptoms", icon: HeartHandshake },
  { href: "/vaccinations", label: "Vaccinations", icon: Syringe },
  { href: "/documents", label: "Documents", icon: FileHeart },
  { href: "/doctors", label: "Doctors", icon: Stethoscope },
  { href: "/summary", label: "Printable Summary", icon: ClipboardList },
  { href: "/exports", label: "Exports", icon: ShieldPlus }
];

function Logo() {
  return <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-primary-foreground"><HeartPulse className="h-5 w-5" /></div><div><p className="text-sm font-semibold">Health Companion</p><p className="text-xs text-muted-foreground">Personal Health Record</p></div></div>;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data } = useSession();
  const { theme, setTheme } = useTheme();
  const initials = (data?.user?.name ?? data?.user?.email ?? "U").slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-72 shrink-0 border-r bg-card lg:flex lg:flex-col">
        <div className="p-6"><Logo /></div>
        <nav className="space-y-1 px-4">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return <Link key={item.href} href={item.href} className={cn("flex items-center gap-3 rounded-2xl px-4 py-3 text-sm", active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground")}><Icon className="h-4 w-4" />{item.label}</Link>;
          })}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b bg-background/85 px-6 backdrop-blur">
          <div><p className="text-sm text-muted-foreground">Your unified health space</p><h1 className="text-lg font-semibold">Personal Health Record Companion</h1></div>
          <div className="flex items-center gap-3">
            <button className="rounded-xl border p-2" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>{theme === "dark" ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}</button>
            <div className="rounded-xl border p-2"><Bell className="h-4 w-4" /></div>
            <Avatar initials={initials} />
            <Button variant="outline" onClick={() => signOut({ callbackUrl: "/login" })}>Logout</Button>
          </div>
        </header>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
