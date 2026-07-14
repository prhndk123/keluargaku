import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { eventsApi, type FamilyEvent } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, Calendar as CalendarIcon, MapPin, Gift, Users, Award } from "lucide-react";
import { useAppNotification } from "@/hooks/useAppNotification";

const TYPES = ["Ulang Tahun", "Liburan", "Pertemuan", "Lainnya"];

export default function AgendaPage() {
  const qc = useQueryClient();
  const notify = useAppNotification();
  const { data = [], isLoading } = useQuery({ queryKey: ["events"], queryFn: () => eventsApi.list() });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FamilyEvent | null>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState(TYPES[0]);
  const [deletingEvent, setDeletingEvent] = useState<FamilyEvent | null>(null);

  const reset = () => {
    setEditing(null);
    setTitle("");
    setDate("");
    setType(TYPES[0]);
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload = { title, date: new Date(date).getTime(), type };
      if (editing?.objectId) return eventsApi.update({ ...editing, ...payload });
      return eventsApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      notify(editing ? "Acara diperbarui" : "Acara ditambahkan", title);
      setOpen(false);
      reset();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => eventsApi.remove(id),
    onSuccess: (_d, id) => {
      qc.invalidateQueries({ queryKey: ["events"] });
      notify("Acara dihapus", deletingEvent?.title);
      setDeletingEvent(null);
    },
  });

  const openEdit = (e: FamilyEvent) => {
    setEditing(e);
    setTitle(e.title);
    setDate(new Date(e.date).toISOString().slice(0, 10));
    setType(e.type);
    setOpen(true);
  };

  const getEventStyles = (eventType: string) => {
    switch (eventType) {
      case "Ulang Tahun":
        return {
          icon: <Gift className="h-4 w-4" />,
          colorClass: "from-pink-500/10 to-rose-500/10 text-pink-600 dark:text-pink-400 border-pink-200/30",
          badge: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300"
        };
      case "Liburan":
        return {
          icon: <MapPin className="h-4 w-4" />,
          colorClass: "from-sky-500/10 to-blue-500/10 text-sky-600 dark:text-sky-400 border-sky-200/30",
          badge: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300"
        };
      case "Pertemuan":
        return {
          icon: <Users className="h-4 w-4" />,
          colorClass: "from-indigo-500/10 to-violet-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200/30",
          badge: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
        };
      default:
        return {
          icon: <Award className="h-4 w-4" />,
          colorClass: "from-slate-500/10 to-gray-500/10 text-slate-600 dark:text-slate-400 border-slate-200/30",
          badge: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300"
        };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-indigo-600 bg-clip-text text-transparent">Agenda Keluarga</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Jadwal liburan, ulang tahun, dan pertemuan penting.</p>
        </div>
        <Dialog open={open} onOpenChange={(o: boolean) => { setOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="shadow-md hover:shadow-lg transition-all duration-300"><Plus className="h-4 w-4 mr-1" />Tambah</Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm sm:max-w-md rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">{editing ? "Ubah Acara" : "Acara Baru"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="ev-title" className="text-sm font-semibold">Judul Acara</Label>
                <Input id="ev-title" placeholder="Contoh: Ulang Tahun Ibu" value={title} onChange={(e) => setTitle(e.target.value)} />
              </div>
              <div className="space-y-2 flex flex-col">
                <Label htmlFor="ev-date" className="text-sm font-semibold mb-2">Tanggal</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="ev-date"
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
              <div className="space-y-2">
                <Label htmlFor="ev-type" className="text-sm font-semibold">Jenis Acara</Label>
                <Select value={type} onValueChange={setType}>
                  <SelectTrigger id="ev-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button className="w-full sm:w-auto" onClick={() => save.mutate()} disabled={!title || !date || save.isPending}>
                {save.isPending ? "Menyimpan..." : "Simpan Acara"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 w-full animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <Card className="border-dashed py-8 text-center">
            <CardContent className="flex flex-col items-center justify-center space-y-2">
              <div className="rounded-full bg-muted p-3">
                <CalendarIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Belum ada acara mendatang.</p>
              <p className="text-xs text-muted-foreground/70">Jadwalkan agenda seru keluarga Anda hari ini.</p>
            </CardContent>
          </Card>
        ) : (
          data.map((e) => {
            const styles = getEventStyles(e.type);
            return (
              <Card key={e.objectId} className="overflow-hidden border border-muted bg-card/60 backdrop-blur-sm hover:bg-card hover:border-primary/20 shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="flex items-center justify-between py-3 px-4 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br border ${styles.colorClass}`}>
                      {styles.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm sm:text-base text-foreground truncate">{e.title}</p>
                        <Badge className={`${styles.badge} border-none font-medium px-1.5 py-0 text-[10px] shrink-0`}>{e.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <CalendarIcon className="h-3 w-3 shrink-0" />
                        {new Date(e.date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted" onClick={() => openEdit(e)} aria-label="Ubah acara">
                      <Pencil className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-destructive" onClick={() => setDeletingEvent(e)} aria-label="Hapus acara">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <AlertDialog open={!!deletingEvent} onOpenChange={(o) => !o && setDeletingEvent(null)}>
        <AlertDialogContent className="max-w-xs sm:max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">Hapus Acara Agenda?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Apakah Anda yakin ingin menghapus agenda <strong>{deletingEvent?.title}</strong>? Tindakan ini tidak dapat diurungkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 rounded-xl" onClick={() => deletingEvent?.objectId && remove.mutate(deletingEvent.objectId)}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
