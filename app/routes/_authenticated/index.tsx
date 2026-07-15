import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { eventsApi, financesApi, recurringApi } from "@/services/api";
import { CalendarClock, TrendingUp, TrendingDown, AlertCircle, CheckCircle2, Wallet, Calendar, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export default function Dashboard() {
  const { user } = useAuth();
  const now = new Date();
  const financesQ = useQuery({
    queryKey: ["finances", now.getFullYear(), now.getMonth()],
    queryFn: () => financesApi.byMonth(now.getFullYear(), now.getMonth()),
  });
  const eventsQ = useQuery({ queryKey: ["events", "upcoming"], queryFn: () => eventsApi.upcoming(5) });
  const recurringQ = useQuery({ queryKey: ["recurring"], queryFn: () => recurringApi.list() });

  const income = (financesQ.data ?? []).filter((f) => f.type === "income").reduce((s, f) => s + f.amount, 0);
  const expense = (financesQ.data ?? []).filter((f) => f.type === "expense").reduce((s, f) => s + f.amount, 0);
  const balance = income - expense;

  const today = now.getDate();
  const paidRecurring = new Set(
    (financesQ.data ?? [])
      .filter((f) => f.isRecurring)
      .map((f) => f.description.trim().toLowerCase()),
  );
  const dueSoon = (recurringQ.data ?? []).filter(
    (r) => !paidRecurring.has(r.description.trim().toLowerCase()) && r.dateSet <= today + 3,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent flex items-center gap-2">
          Halo, {user?.alias || user?.name || "Keluarga"}! <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Ringkasan aktivitas keluarga Anda di bulan {now.toLocaleDateString("id-ID", { month: "long", year: "numeric" })}
        </p>
      </div>

      <Card className="overflow-hidden border border-primary/10 bg-gradient-to-br from-primary/5 via-indigo-500/5 to-background shadow-md">
        <CardContent className="p-5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-widest">
            <Wallet className="h-3.5 w-3.5 text-primary" /> Saldo Keluarga Anda
          </div>
          <p className={`text-3xl font-black mt-2 tracking-tight ${balance >= 0 ? "text-foreground" : "text-rose-600"}`}>
            {rupiah(balance)}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm border-t border-muted pt-3">
            <div className="flex items-center gap-2 rounded-xl bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-500/10 p-2.5">
              <div className="rounded-lg bg-emerald-500/10 p-1.5 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase">Masuk</p>
                <p className="font-bold text-emerald-600 dark:text-emerald-400 truncate">{rupiah(income)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-rose-500/5 dark:bg-rose-950/10 border border-rose-500/10 p-2.5">
              <div className="rounded-lg bg-rose-500/10 p-1.5 text-rose-600 dark:text-rose-400">
                <TrendingDown className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground font-medium uppercase">Keluar</p>
                <p className="font-bold text-rose-600 dark:text-rose-400 truncate">{rupiah(expense)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-muted bg-card/60 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-3 pt-4 px-4 flex flex-row items-center justify-between space-y-0 border-b border-muted">
          <CardTitle className="text-sm font-bold flex items-center gap-1.5">
            <Calendar className="h-4 w-4 text-primary" />
            Acara Terdekat
          </CardTitle>
          <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-bold">Agenda</Badge>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          {eventsQ.isLoading ? (
            <div className="h-16 w-full animate-pulse rounded-lg bg-muted" />
          ) : eventsQ.data && eventsQ.data.length > 0 ? (
            eventsQ.data.slice(0, 3).map((e) => (
              <div key={e.objectId} className="flex items-center justify-between border-b border-muted pb-2.5 last:border-0 last:pb-0 gap-3 min-w-0">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{e.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {new Date(e.date).toLocaleDateString("id-ID", { day: "numeric", month: "long" })}
                  </p>
                </div>
                <Badge variant="secondary" className="text-[10px] font-semibold px-2 py-0 shrink-0 bg-primary/10 text-primary border-none">{e.type}</Badge>
              </div>
            ))
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">Belum ada acara mendatang.</p>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-muted bg-card/60 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-3 pt-4 px-4 flex flex-row items-center justify-between space-y-0 border-b border-muted">
          <CardTitle className="text-sm font-bold flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            Peringatan Tagihan
          </CardTitle>
          <Badge variant="outline" className="text-[9px] uppercase tracking-wider font-bold border-amber-500/30 text-amber-600 bg-amber-500/5">Tagihan</Badge>
        </CardHeader>
        <CardContent className="p-4 space-y-2.5">
          {recurringQ.isLoading ? (
            <div className="h-12 w-full animate-pulse rounded-lg bg-muted" />
          ) : dueSoon.length > 0 ? (
            dueSoon.map((r) => (
              <div key={r.objectId} className="flex items-center justify-between rounded-xl bg-amber-500/5 border border-amber-500/10 p-3 hover:bg-amber-500/10 transition-colors gap-3">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-amber-700 dark:text-amber-400 truncate">{r.description}</p>
                  <p className="text-[10px] text-muted-foreground/80 mt-0.5">Jatuh tempo setiap tanggal {r.dateSet}</p>
                </div>
                <p className="text-xs sm:text-sm font-black text-amber-700 dark:text-amber-400 shrink-0">{rupiah(r.amount)}</p>
              </div>
            ))
          ) : (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2 justify-center">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span>Semua tagihan terbayar bulan ini!</span>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-emerald-500/10 bg-emerald-500/5 dark:bg-emerald-950/10 shadow-sm">
        <CardContent className="flex items-center gap-3 py-3 px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400">Auto-Sync Recurring Aktif</p>
            <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">
              Sistem akan otomatis mencatat tagihan yang jatuh tempo setiap kali Anda membuka aplikasi.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
