import { Outlet, Navigate, useNavigate } from "react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAutoSyncRecurring } from "@/hooks/useAutoSyncRecurring";
import { ensureNotificationPermission } from "@/hooks/useAppNotification";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export default function AuthenticatedLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) void ensureNotificationPermission();
  }, [user]);

  useAutoSyncRecurring(Boolean(user));

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Memuat...
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" />;

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col bg-background">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <div>
          <p className="text-xs text-muted-foreground">Halo,</p>
          <p className="text-sm font-semibold">{user.name || user.email}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Keluar">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>
      <main className="flex-1 px-4 py-4 pb-24">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
