import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { financesApi, getForecast, type Finance } from "@/services/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Repeat, Sparkles, TrendingUp, TrendingDown, Wallet, Calendar as CalendarIcon, ArrowRightLeft } from "lucide-react";
import { useAppNotification } from "@/hooks/useAppNotification";

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export default function FinancePage() {
  const qc = useQueryClient();
  const notify = useAppNotification();
  const now = new Date();
  const [ym, setYm] = useState(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`);
  const [year, month] = ym.split("-").map((s) => parseInt(s, 10));

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["finances", year, month - 1],
    queryFn: () => financesApi.byMonth(year, month - 1),
  });
  const forecastQ = useQuery({ queryKey: ["forecast"], queryFn: () => getForecast(3) });

  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [deletingFinance, setDeletingFinance] = useState<Finance | null>(null);

  const reset = () => { setDescription(""); setAmount(""); setType("expense"); setDate(new Date().toISOString().slice(0, 10)); };

  const save = useMutation({
    mutationFn: () =>
      financesApi.create({
        description,
        amount: parseInt(amount, 10) || 0,
        type,
        date: new Date(date).getTime(),
        isRecurring: false,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finances"] });
      qc.invalidateQueries({ queryKey: ["forecast"] });
      notify("Transaksi ditambahkan", description);
      setOpen(false); reset();
    },
  });

  const remove = useMutation({
    mutationFn: (f: Finance) => financesApi.remove(f.objectId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["finances"] });
      qc.invalidateQueries({ queryKey: ["forecast"] });
      notify("Transaksi dihapus", deletingFinance?.description);
      setDeletingFinance(null);
    },
  });

  const income = rows.filter((r) => r.type === "income").reduce((s, r) => s + r.amount, 0);
  const expense = rows.filter((r) => r.type === "expense").reduce((s, r) => s + r.amount, 0);
  const balance = income - expense;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent">Keuangan</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Catat pemasukan, pengeluaran, dan prediksi anggaran.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild className="h-8 rounded-lg shadow-sm border-muted">
            <Link to="/finance/recurring"><Repeat className="h-3.5 w-3.5 mr-1 text-primary" />Rutin</Link>
          </Button>
          <Dialog open={open} onOpenChange={(o: boolean) => { setOpen(o); if (!o) reset(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"><Plus className="h-3.5 w-3.5 mr-1" />Catat</Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm sm:max-w-md rounded-2xl">
              <DialogHeader><DialogTitle className="text-xl font-bold">Transaksi Baru</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="t-type" className="text-sm font-semibold">Jenis</Label>
                  <Select value={type} onValueChange={(v) => setType(v as "income" | "expense")}>
                    <SelectTrigger id="t-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Pemasukan</SelectItem>
                      <SelectItem value="expense">Pengeluaran</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="t-desc" className="text-sm font-semibold">Deskripsi</Label>
                  <Input id="t-desc" placeholder="Contoh: Gaji bulanan, Belanja sayur" value={description} onChange={(e) => setDescription(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="t-amount" className="text-sm font-semibold">Jumlah (Rp)</Label>
                  <Input id="t-amount" placeholder="0" type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div className="space-y-2 flex flex-col">
                  <Label htmlFor="t-date" className="text-sm font-semibold mb-2">Tanggal</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        id="t-date"
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal h-10 rounded-xl border-muted-foreground/20",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                        {date ? (
                          new Date(date).toLocaleDateString("id-ID", {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          })
                        ) : (
                          <span>Pilih Tanggal</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date ? new Date(date) : undefined}
                        onSelect={(d) => {
                          if (d) {
                            const y = d.getFullYear();
                            const m = String(d.getMonth() + 1).padStart(2, "0");
                            const day = String(d.getDate()).padStart(2, "0");
                            setDate(`${y}-${m}-${day}`);
                          } else {
                            setDate("");
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <DialogFooter className="mt-4">
                <Button className="w-full sm:w-auto" onClick={() => save.mutate()} disabled={!description || !amount || save.isPending}>
                  {save.isPending ? "Menyimpan..." : "Simpan Transaksi"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center gap-3 p-3 bg-muted/40 backdrop-blur-sm rounded-xl border border-muted max-w-fit">
        <Label htmlFor="f-month" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <CalendarIcon className="h-3.5 w-3.5" /> Bulan
        </Label>
        <Input id="f-month" type="month" value={ym} onChange={(e) => setYm(e.target.value)} className="h-8 max-w-[140px] py-1 px-2 text-sm bg-background border-none shadow-inner" />
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <Card className="overflow-hidden border border-emerald-500/10 bg-emerald-500/5 dark:bg-emerald-950/10 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
              <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">Masuk</span>
              <TrendingUp className="h-3.5 w-3.5 shrink-0" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 truncate">{rupiah(income)}</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border border-rose-500/10 bg-rose-500/5 dark:bg-rose-950/10 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-1">
              <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">Keluar</span>
              <TrendingDown className="h-3.5 w-3.5 shrink-0" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 truncate">{rupiah(expense)}</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border border-indigo-500/10 bg-indigo-500/5 dark:bg-indigo-950/10 shadow-sm">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-1">
              <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider">Saldo</span>
              <Wallet className="h-3.5 w-3.5 shrink-0" />
            </div>
            <p className={`text-xs sm:text-sm font-bold truncate ${balance >= 0 ? "text-indigo-600 dark:text-indigo-400" : "text-rose-600"}`}>
              {rupiah(balance)}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden border border-muted bg-card/60 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-3 pt-4 px-4 flex flex-row items-center justify-between space-y-0 border-b border-muted">
          <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-primary">
            <Sparkles className="h-4 w-4 text-amber-500" />
            Forecasting Pendapatan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {forecastQ.isLoading ? (
            <div className="h-28 w-full animate-pulse rounded-xl bg-muted" />
          ) : forecastQ.data ? (
            <>
              <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-indigo-500/10 border border-primary/10 p-4">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Saran Target Pendapatan Bulan Depan</p>
                <p className="text-2xl font-black text-primary mt-1 tracking-tight">{rupiah(forecastQ.data.suggestedIncome)}</p>
                <p className="text-xs text-muted-foreground mt-2 border-t border-primary/10 pt-2 flex items-center justify-between">
                  <span>Rata-rata pengeluaran bulanan:</span>
                  <span className="font-semibold text-foreground">{rupiah(forecastQ.data.averageExpense)}</span>
                </p>
              </div>
              <div className="rounded-xl border border-muted overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="text-xs font-bold h-9">Bulan</TableHead>
                      <TableHead className="text-right text-xs font-bold h-9">Masuk</TableHead>
                      <TableHead className="text-right text-xs font-bold h-9">Keluar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {forecastQ.data.months.map((m) => (
                      <TableRow key={m.label} className="hover:bg-muted/10">
                        <TableCell className="py-2.5 text-xs font-medium">{m.label}</TableCell>
                        <TableCell className="py-2.5 text-right text-xs font-semibold text-emerald-600 dark:text-emerald-400">{rupiah(m.income)}</TableCell>
                        <TableCell className="py-2.5 text-right text-xs font-semibold text-rose-600 dark:text-rose-400">{rupiah(m.expense)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-4">Data forecasting belum cukup tersedia.</p>
          )}
        </CardContent>
      </Card>

      <Card className="overflow-hidden border border-muted bg-card/60 backdrop-blur-sm shadow-sm">
        <CardHeader className="pb-3 pt-4 px-4 flex flex-row items-center justify-between space-y-0 border-b border-muted">
          <CardTitle className="text-sm font-bold flex items-center gap-1.5">
            <ArrowRightLeft className="h-4 w-4 text-primary" />
            Daftar Transaksi
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-12 w-full animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-8 px-4 flex flex-col items-center justify-center space-y-2">
              <div className="rounded-full bg-muted p-2.5">
                <Wallet className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground">Belum ada transaksi.</p>
              <p className="text-xs text-muted-foreground/70">Catat transaksi pertama Anda pada bulan ini.</p>
            </div>
          ) : (
            <div className="divide-y divide-muted max-h-[300px] overflow-y-auto scrollbar-thin">
              {rows.map((r) => (
                <div key={r.objectId} className="flex items-center justify-between py-3 px-4 hover:bg-muted/10 transition-colors gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground truncate">{r.description}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      {new Date(r.date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      {r.isRecurring && (
                        <span className="inline-flex items-center gap-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-1 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider">
                          <Repeat className="h-2 w-2" /> rutin
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-sm font-bold ${r.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600"}`}>
                      {r.type === "income" ? "+" : "-"}{rupiah(r.amount)}
                    </span>
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-destructive/10 text-destructive" onClick={() => setDeletingFinance(r)} aria-label="Hapus transaksi">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingFinance} onOpenChange={(o) => !o && setDeletingFinance(null)}>
        <AlertDialogContent className="max-w-xs sm:max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">Hapus Transaksi?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Apakah Anda yakin ingin menghapus transaksi <strong>{deletingFinance?.description}</strong> sebesar <strong>{deletingFinance && rupiah(deletingFinance.amount)}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 rounded-xl" onClick={() => deletingFinance && remove.mutate(deletingFinance)}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
