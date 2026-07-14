import { Link } from "react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { recurringApi, type RecurringExpense } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Trash2, Pencil, ArrowLeft, CalendarDays, Repeat } from "lucide-react";
import { useAppNotification } from "@/hooks/useAppNotification";

const rupiah = (n: number) =>
  new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);

export default function RecurringPage() {
  const qc = useQueryClient();
  const notify = useAppNotification();
  const { data = [], isLoading } = useQuery({ queryKey: ["recurring"], queryFn: () => recurringApi.list() });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringExpense | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dateSet, setDateSet] = useState("1");
  const [deletingRecurring, setDeletingRecurring] = useState<RecurringExpense | null>(null);

  const reset = () => { setEditing(null); setDescription(""); setAmount(""); setDateSet("1"); };

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        description,
        amount: parseInt(amount, 10) || 0,
        dateSet: Math.min(31, Math.max(1, parseInt(dateSet, 10) || 1)),
      };
      if (editing?.objectId) return recurringApi.update({ ...editing, ...payload });
      return recurringApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring"] });
      notify(editing ? "Pengeluaran rutin diperbarui" : "Pengeluaran rutin ditambahkan", description);
      setOpen(false); reset();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => recurringApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["recurring"] });
      notify("Pengeluaran rutin dihapus", deletingRecurring?.description);
      setDeletingRecurring(null);
    },
  });

  const openEdit = (r: RecurringExpense) => {
    setEditing(r); setDescription(r.description); setAmount(String(r.amount)); setDateSet(String(r.dateSet));
    setOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-lg hover:bg-muted shrink-0">
          <Link to="/finance"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent truncate">Pengeluaran Rutin</h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Kelola tagihan bulanan berulang.</p>
        </div>
        <Dialog open={open} onOpenChange={(o: boolean) => { setOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="h-8 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"><Plus className="h-3.5 w-3.5 mr-1" />Tambah</Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm sm:max-w-md rounded-2xl">
            <DialogHeader><DialogTitle className="text-xl font-bold">{editing ? "Ubah Tagihan" : "Tagihan Baru"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="rec-desc" className="text-sm font-semibold">Deskripsi</Label>
                <Input id="rec-desc" placeholder="Contoh: Listrik PLN, Wi-Fi" value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rec-amount" className="text-sm font-semibold">Jumlah (Rp)</Label>
                <Input id="rec-amount" placeholder="0" type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rec-day" className="text-sm font-semibold">Tanggal Jatuh Tempo (1-31)</Label>
                <Input id="rec-day" type="number" min={1} max={31} value={dateSet} onChange={(e) => setDateSet(e.target.value)} />
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button className="w-full sm:w-auto" onClick={() => save.mutate()} disabled={!description || !amount || save.isPending}>
                {save.isPending ? "Menyimpan..." : "Simpan Tagihan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-xl border border-primary/10 bg-primary/5 p-4 flex gap-3 items-start">
        <Repeat className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Tagihan bulanan yang pasti (Listrik, Cicilan, Internet). Sistem otomatis mencatatnya ke Keuangan saat aplikasi dibuka pada/setelah tanggal jatuh tempo.
        </p>
      </div>

      <div className="grid gap-3">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-16 w-full animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <Card className="border-dashed py-8 text-center">
            <CardContent className="flex flex-col items-center justify-center space-y-2">
              <div className="rounded-full bg-muted p-3">
                <CalendarDays className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground">Belum ada pengeluaran rutin.</p>
              <p className="text-xs text-muted-foreground/70">Tambahkan tagihan rutin bulanan Anda.</p>
            </CardContent>
          </Card>
        ) : (
          data.map((r) => (
            <Card key={r.objectId} className="overflow-hidden border border-muted bg-card/60 backdrop-blur-sm hover:bg-card hover:border-primary/20 shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="flex items-center justify-between py-3 px-4 gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-sm sm:text-base text-foreground truncate">{r.description}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                    <CalendarDays className="h-3.5 w-3.5 shrink-0 text-violet-500" />
                    Jatuh tempo setiap tanggal <span className="font-bold text-foreground bg-muted px-1.5 py-0.2 rounded text-[10px]">{r.dateSet}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <p className="text-sm font-bold text-foreground">{rupiah(r.amount)}</p>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted" onClick={() => openEdit(r)} aria-label="Ubah tagihan">
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-destructive" onClick={() => setDeletingRecurring(r)} aria-label="Hapus tagihan">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={!!deletingRecurring} onOpenChange={(o) => !o && setDeletingRecurring(null)}>
        <AlertDialogContent className="max-w-xs sm:max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">Hapus Tagihan Rutin?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Apakah Anda yakin ingin menghapus tagihan rutin <strong>{deletingRecurring?.description}</strong> sebesar <strong>{deletingRecurring && rupiah(deletingRecurring.amount)}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 rounded-xl" onClick={() => deletingRecurring?.objectId && remove.mutate(deletingRecurring.objectId)}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
