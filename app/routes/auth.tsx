import { useNavigate, Navigate } from "react-router";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Heart } from "lucide-react";

export default function AuthPage() {
  const { user, login, register, loading, configured } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/" />;

  const doLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(email, password);
      toast.success("Selamat datang kembali!");
      navigate("/");
    } catch (err) {
      toast.error("Gagal masuk", { description: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  const doRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await register(name, email, password);
      toast.success("Akun berhasil dibuat");
      navigate("/");
    } catch (err) {
      toast.error("Gagal mendaftar", { description: (err as Error).message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Heart className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">KeluargaKu</CardTitle>
          <CardDescription>
            Catat agenda, anggota, dan keuangan keluarga Anda.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!configured && (
            <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              Backendless belum dikonfigurasi. Isi{" "}
              <code>VITE_BACKENDLESS_APP_ID</code> dan{" "}
              <code>VITE_BACKENDLESS_API_KEY</code> di <code>.env</code>.
            </div>
          )}
          <Tabs defaultValue="login">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Masuk</TabsTrigger>
              <TabsTrigger value="register">Daftar</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <form onSubmit={doLogin} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="l-email">Email</Label>
                  <Input id="l-email" type="email" placeholder="nama@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="l-pass">Password</Label>
                  <Input id="l-pass" type="password" placeholder="Masukkan kata sandi" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button className="w-full" type="submit" disabled={busy || !configured}>
                  {busy ? "Memproses..." : "Masuk"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="register">
              <form onSubmit={doRegister} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="r-name">Nama</Label>
                  <Input id="r-name" placeholder="Nama Lengkap" required value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="r-email">Email</Label>
                  <Input id="r-email" type="email" placeholder="nama@email.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="r-pass">Password</Label>
                  <Input id="r-pass" type="password" placeholder="Buat kata sandi minimal 6 karakter" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button className="w-full" type="submit" disabled={busy || !configured}>
                  {busy ? "Memproses..." : "Buat Akun"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
