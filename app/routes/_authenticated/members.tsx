import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { membersApi, type Member } from "@/services/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { Plus, Trash2, Pencil, User, Calendar as CalendarIcon } from "lucide-react";
import { useAppNotification } from "@/hooks/useAppNotification";

export default function MembersPage() {
  const qc = useQueryClient();
  const notify = useAppNotification();
  const { data = [], isLoading } = useQuery({ queryKey: ["members"], queryFn: () => membersApi.list() });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Member | null>(null);
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [alias, setAlias] = useState("");
  const [password, setPassword] = useState("");
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);

  const reset = () => { 
    setEditing(null); 
    setName(""); 
    setRole(""); 
    setBirthDate(""); 
    setAlias(""); 
    setPassword(""); 
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload = { 
        name, 
        role, 
        birthDate: new Date(birthDate).getTime(),
        alias,
        password: password || undefined
      };
      if (editing?.objectId) return membersApi.update({ ...editing, ...payload });
      return membersApi.create(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      notify(editing ? "Anggota diperbarui" : "Anggota ditambahkan", name);
      setOpen(false); reset();
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => membersApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["members"] });
      notify("Anggota dihapus", deletingMember?.name);
      setDeletingMember(null);
    },
  });

  const openEdit = (m: Member) => {
    setEditing(m); setName(m.name); setRole(m.role);
    setBirthDate(new Date(m.birthDate).toISOString().slice(0, 10));
    setAlias(m.alias || "");
    setPassword(m.password || "");
    setOpen(true);
  };

  const getInitials = (n: string) => {
    return n.split(" ").slice(0, 2).map(p => p[0]).join("").toUpperCase();
  };

  const getAge = (timestamp: number | string) => {
    const today = new Date();
    const birth = new Date(timestamp);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">Anggota Keluarga</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Kelola profil seluruh anggota keluarga Anda.</p>
        </div>
        <Dialog open={open} onOpenChange={(o: boolean) => { setOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="shadow-md hover:shadow-lg transition-all duration-300"><Plus className="h-4 w-4 mr-1" />Tambah</Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm sm:max-w-md rounded-2xl">
            <DialogHeader><DialogTitle className="text-xl font-bold">{editing ? "Ubah Anggota" : "Anggota Baru"}</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="m-name" className="text-sm font-semibold">Nama Lengkap</Label>
                <Input id="m-name" placeholder="Contoh: Budi Santoso" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-alias" className="text-sm font-semibold">Nama Panggilan (Alias untuk Login)</Label>
                <Input id="m-alias" placeholder="Contoh: budi" value={alias} onChange={(e) => setAlias(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-password" className="text-sm font-semibold">Kata Sandi (Password Login)</Label>
                <Input id="m-password" type="password" placeholder={editing ? "Kosongkan jika tidak diubah" : "Minimal 6 karakter"} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="m-role" className="text-sm font-semibold">Peran</Label>
                <Input id="m-role" placeholder="Contoh: Ayah, Ibu, Anak Pertama" value={role} onChange={(e) => setRole(e.target.value)} />
              </div>
              <div className="space-y-2 flex flex-col">
                <Label htmlFor="m-dob" className="text-sm font-semibold mb-2">Tanggal Lahir</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="m-dob"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal h-10 rounded-xl border-muted-foreground/20",
                        !birthDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                      {birthDate ? (
                        new Date(birthDate).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })
                      ) : (
                        <span>Pilih Tanggal Lahir</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      captionLayout="dropdown"
                      selected={birthDate ? new Date(birthDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          const y = date.getFullYear();
                          const m = String(date.getMonth() + 1).padStart(2, "0");
                          const d = String(date.getDate()).padStart(2, "0");
                          setBirthDate(`${y}-${m}-${d}`);
                        } else {
                          setBirthDate("");
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <DialogFooter className="mt-4">
              <Button className="w-full sm:w-auto" onClick={() => save.mutate()} disabled={!name || !alias || (!editing && !password) || !role || !birthDate || save.isPending}>
                {save.isPending ? "Menyimpan..." : "Simpan Anggota"}
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
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Belum ada anggota keluarga.</p>
              <p className="text-xs text-muted-foreground/70">Tambahkan anggota keluarga pertama Anda sekarang.</p>
            </CardContent>
          </Card>
        ) : (
          data.map((m) => (
            <Card key={m.objectId} className="overflow-hidden border border-muted bg-card/60 backdrop-blur-sm hover:bg-card hover:border-primary/20 shadow-sm hover:shadow-md transition-all duration-300">
              <CardContent className="flex items-center gap-3 py-3 px-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-violet-500/10 text-primary border border-primary/10">
                  <span className="text-sm font-bold tracking-wider">{getInitials(m.name)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm sm:text-base text-foreground truncate">{m.name}</p>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-muted-foreground">
                    <span className="font-medium text-violet-600 bg-violet-50 dark:bg-violet-950/30 px-1.5 py-0.2 rounded">{m.role}</span>
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="h-3 w-3" />
                      {new Date(m.birthDate).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </span>
                    <span>· {getAge(m.birthDate)} Tahun</span>
                  </div>
                </div>
                <div className="flex gap-0.5 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted" onClick={() => openEdit(m)} aria-label="Ubah anggota">
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-destructive" onClick={() => setDeletingMember(m)} aria-label="Hapus anggota">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <AlertDialog open={!!deletingMember} onOpenChange={(o) => !o && setDeletingMember(null)}>
        <AlertDialogContent className="max-w-xs sm:max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">Hapus Anggota Keluarga?</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Apakah Anda yakin ingin menghapus <strong>{deletingMember?.name}</strong>? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col-reverse sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction className="w-full sm:w-auto bg-destructive hover:bg-destructive/90 rounded-xl" onClick={() => deletingMember?.objectId && remove.mutate(deletingMember.objectId)}>
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
