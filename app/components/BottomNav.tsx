import { NavLink } from "react-router";
import { Home, Calendar, Users, Wallet } from "lucide-react";

const tabs = [
  { to: "/", label: "Dashboard", end: true, icon: Home },
  { to: "/agenda", label: "Agenda", end: false, icon: Calendar },
  { to: "/members", label: "Keluarga", end: false, icon: Users },
  { to: "/finance", label: "Keuangan", end: false, icon: Wallet },
] as const;

export function BottomNav() {
  return (
    <nav className="sticky bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {tabs.map(({ to, label, end, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 py-2 text-xs transition-colors hover:text-foreground ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`
              }
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
