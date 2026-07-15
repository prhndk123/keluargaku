import { Outlet, Navigate, useNavigate } from "react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useAutoSyncRecurring } from "@/hooks/useAutoSyncRecurring";
import { ensureNotificationPermission } from "@/hooks/useAppNotification";
import { BottomNav } from "@/components/BottomNav";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

export default function AuthenticatedLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

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
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full border border-primary/20 bg-muted flex items-center justify-center overflow-hidden shrink-0">
            {user.photoUrl ? (
              <img src={user.photoUrl} alt={user.alias} className="h-full w-full object-cover" />
            ) : (
              <User className="h-4.5 w-4.5 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground leading-none">Halo,</p>
            <p className="text-sm font-semibold mt-0.5 leading-none">{user.alias || user.name}</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => setShowLogoutConfirm(true)} aria-label="Keluar">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>
      <main className="flex-1 px-4 py-4 pb-24">
        <Outlet />
      </main>
      <BottomNav />

      <AlertDialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <AlertDialogContent className="max-w-xs sm:max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">Keluar Aplikasi</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Apakah Anda yakin ingin keluar dari akun KeluargaKu? Anda perlu masuk kembali untuk mengakses data Anda.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:justify-end">
            <AlertDialogCancel className="flex-1 sm:flex-none rounded-xl mt-0">Batal</AlertDialogCancel>
            <AlertDialogAction className="flex-1 sm:flex-none rounded-xl bg-destructive hover:bg-destructive/95 text-destructive-foreground" onClick={handleLogout}>
              Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
