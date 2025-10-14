import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  FileText,
  Download,
  Eye,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { id as dateId } from "date-fns/locale";
import hanuraLogo from "@/assets/hanura-logo.jpg";
import { getSignedUrl } from "@/lib/storage";
import type { Database } from "@/integrations/supabase/types";

type PengajuanStatus = Database["public"]["Enums"]["pengajuan_status"];
type AppRole = Database["public"]["Enums"]["app_role"];

interface PengajuanDetail {
  id: string;
  status: PengajuanStatus;
  tanggal_musda: string;
  lokasi_musda: string;
  file_laporan_musda: string | null;
  catatan_revisi: string | null;
  created_at: string;
  profiles: {
    full_name: string;
    provinsi: string | null;
  };
}

interface PengurusData {
  id: string;
  jabatan: string;
  nama_lengkap: string;
  jenis_kelamin: string;
  file_ktp: string;
  urutan: number;
}

const DetailPengajuan = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [pengajuan, setPengajuan] = useState<PengajuanDetail | null>(null);
  const [pengurusList, setPengurusList] = useState<PengurusData[]>([]);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [catatanRevisi, setCatatanRevisi] = useState("");
  const [showPdfDialog, setShowPdfDialog] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");

  useEffect(() => {
    loadUserRole();
  }, []);

  useEffect(() => {
    if (userRole && id) {
      loadPengajuan();
      loadPengurus();
    }
  }, [userRole, id]);

  const loadUserRole = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("User tidak terautentikasi");
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      if (data && ["okk", "sekjend", "ketum"].includes(data.role)) {
        setUserRole(data.role as AppRole);
      } else {
        toast.error("Akses ditolak");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error loading user role:", error);
      toast.error("Gagal memuat data user");
    }
  };

  const loadPengajuan = async () => {
    try {
      const { data, error } = await supabase
        .from("pengajuan_sk")
        .select(
          `
          id,
          status,
          tanggal_musda,
          lokasi_musda,
          file_laporan_musda,
          catatan_revisi,
          created_at,
          profiles:dpd_id (
            full_name,
            provinsi
          )
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;

      setPengajuan(data as PengajuanDetail);
    } catch (error) {
      console.error("Error loading pengajuan:", error);
      toast.error("Gagal memuat data pengajuan");
      navigate("/dashboard-admin");
    } finally {
      setLoading(false);
    }
  };

  const loadPengurus = async () => {
    try {
      const { data, error } = await supabase
        .from("pengurus")
        .select("*")
        .eq("pengajuan_id", id)
        .order("urutan", { ascending: true });

      if (error) throw error;

      setPengurusList(data as PengurusData[]);
    } catch (error) {
      console.error("Error loading pengurus:", error);
    }
  };

  const handleVerifikasi = async (approved: boolean) => {
    if (!approved && !catatanRevisi.trim()) {
      toast.error("Catatan revisi wajib diisi untuk penolakan");
      return;
    }

    setActionLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User tidak terautentikasi");

      let newStatus: PengajuanStatus;
      let updateData: any = {};

      if (userRole === "okk") {
        if (approved) {
          newStatus = "diverifikasi_okk";
          updateData = {
            status: newStatus,
            verified_by_okk: user.id,
            verified_okk_at: new Date().toISOString(),
          };
        } else {
          newStatus = "ditolak_okk";
          updateData = {
            status: newStatus,
            catatan_revisi: catatanRevisi,
          };
        }
      } else if (userRole === "sekjend") {
        if (approved) {
          newStatus = "disetujui_sekjend";
          updateData = {
            status: newStatus,
            approved_by_sekjend: user.id,
            approved_sekjend_at: new Date().toISOString(),
          };
        } else {
          newStatus = "ditolak_sekjend";
          updateData = {
            status: newStatus,
            catatan_revisi: catatanRevisi,
          };
        }
      } else if (userRole === "ketum") {
        if (approved) {
          newStatus = "disetujui_ketum";
          updateData = {
            status: newStatus,
            approved_by_ketum: user.id,
            approved_ketum_at: new Date().toISOString(),
          };
        } else {
          newStatus = "ditolak_ketum";
          updateData = {
            status: newStatus,
            catatan_revisi: catatanRevisi,
          };
        }
      } else {
        throw new Error("Role tidak valid");
      }

      const { error } = await supabase
        .from("pengajuan_sk")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      toast.success(
        approved ? "Pengajuan berhasil disetujui" : "Pengajuan ditolak"
      );
      navigate("/dashboard-admin");
    } catch (error) {
      console.error("Error updating pengajuan:", error);
      toast.error("Gagal memproses pengajuan");
    } finally {
      setActionLoading(false);
    }
  };

  const handleTerbitkanSK = async () => {
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from("pengajuan_sk")
        .update({
          status: "sk_terbit",
          sk_terbit_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("SK berhasil diterbitkan");
      navigate("/dashboard-admin");
    } catch (error) {
      console.error("Error publishing SK:", error);
      toast.error("Gagal menerbitkan SK");
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewPdf = async (path: string) => {
    const bucket = path.includes("laporan-musda")
      ? "laporan-musda"
      : "ktp-pengurus";
    const signedUrl = await getSignedUrl(bucket, path);

    if (signedUrl) {
      setPdfUrl(signedUrl);
      setShowPdfDialog(true);
    } else {
      toast.error("Gagal memuat dokumen");
    }
  };

  const canApprove = () => {
    if (!pengajuan || !userRole) return false;

    if (userRole === "okk" && pengajuan?.status === "diupload") return true;
    if (userRole === "sekjend" && pengajuan?.status === "diverifikasi_okk")
      return true;
    if (userRole === "ketum" && pengajuan?.status === "disetujui_sekjend")
      return true;

    return false;
  };

  const canPublishSK = () => {
    return userRole === "ketum" && pengajuan?.status === "disetujui_ketum";
  };

  const perempuanCount = pengurusList.filter(
    (p) => p.jenis_kelamin === "Perempuan"
  ).length;
  const perempuanPercentage =
    pengurusList.length > 0 ? (perempuanCount / pengurusList.length) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (!pengajuan) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Data Tidak Ditemukan</CardTitle>
            <CardDescription>Pengajuan tidak ditemukan</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate("/dashboard-admin")}
              className="w-full"
            >
              Kembali ke Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <header className="bg-card border-b shadow-soft sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <img src={hanuraLogo} alt="HANURA" className="h-12 w-auto" />
            <div>
              <h1 className="text-xl font-bold text-foreground">
                H-Gate050: MUSDA System
              </h1>
              <p className="text-sm text-muted-foreground">
                Detail Pengajuan SK
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard-admin")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-large">
              <CardHeader>
                <CardTitle>Informasi Pengajuan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">DPD</Label>
                    <p className="font-semibold">
                      {pengajuan?.profiles?.full_name}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Provinsi</Label>
                    <p className="font-semibold">
                      {pengajuan?.profiles?.provinsi || "-"}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Tanggal MUSDA
                    </Label>
                    <p className="font-semibold">
                      {format(new Date(pengajuan?.tanggal_musda), "PPP", {
                        locale: dateId,
                      })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Lokasi MUSDA
                    </Label>
                    <p className="font-semibold">{pengajuan?.lokasi_musda}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">
                      Tanggal Pengajuan
                    </Label>
                    <p className="font-semibold">
                      {format(new Date(pengajuan?.created_at), "PPP", {
                        locale: dateId,
                      })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Status</Label>
                    <div className="mt-1">
                      <Badge>{pengajuan?.status}</Badge>
                    </div>
                  </div>
                </div>

                {pengajuan?.file_laporan_musda && (
                  <div className="border-t pt-4">
                    <Label className="text-muted-foreground">
                      Laporan MUSDA
                    </Label>
                    <div className="flex gap-2 mt-2">
                      {/* <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          handleViewPdf(pengajuan?.file_laporan_musda!)
                        }
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Lihat PDF
                      </Button> */}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const signedUrl = await getSignedUrl(
                            "laporan-musda",
                            pengajuan?.file_laporan_musda!
                          );
                          if (signedUrl) window.open(signedUrl, "_blank");
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Lihat PDF
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="shadow-large">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Data Pengurus ({pengurusList.length})</CardTitle>
                  <Badge
                    variant={
                      perempuanPercentage >= 30 ? "default" : "destructive"
                    }
                  >
                    Perempuan: {perempuanPercentage.toFixed(1)}%
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {pengurusList.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Belum ada data pengurus
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>No</TableHead>
                        <TableHead>Jabatan</TableHead>
                        <TableHead>Nama Lengkap</TableHead>
                        <TableHead>JK</TableHead>
                        <TableHead>KTP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pengurusList.map((pengurus, index) => (
                        <TableRow key={pengurus.id}>
                          <TableCell>{index + 1}</TableCell>
                          <TableCell className="font-medium">
                            {pengurus.jabatan}
                          </TableCell>
                          <TableCell>{pengurus.nama_lengkap}</TableCell>
                          <TableCell>
                            {pengurus.jenis_kelamin === "Laki-laki" ? "L" : "P"}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewPdf(pengurus.file_ktp)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {canApprove() && (
              <Card className="shadow-large border-primary">
                <CardHeader>
                  <CardTitle>Aksi Verifikasi</CardTitle>
                  <CardDescription>
                    {userRole === "okk" && "Verifikasi dokumen pengajuan"}
                    {userRole === "sekjend" && "Setujui atau tolak pengajuan"}
                    {userRole === "ketum" && "Persetujuan akhir pengajuan"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="catatan">
                      Catatan Revisi (Jika Ditolak)
                    </Label>
                    <Textarea
                      id="catatan"
                      placeholder="Masukkan alasan penolakan..."
                      value={catatanRevisi}
                      onChange={(e) => setCatatanRevisi(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => handleVerifikasi(true)}
                      disabled={actionLoading}
                      className="w-full"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      {actionLoading ? "Memproses..." : "Setujui"}
                    </Button>
                    <Button
                      onClick={() => handleVerifikasi(false)}
                      disabled={actionLoading}
                      variant="destructive"
                      className="w-full"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      {actionLoading ? "Memproses..." : "Tolak"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {canPublishSK() && (
              <Card className="shadow-large border-success">
                <CardHeader>
                  <CardTitle>Terbitkan SK</CardTitle>
                  <CardDescription>
                    Pengajuan sudah disetujui. Terbitkan SK sekarang.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleTerbitkanSK}
                    disabled={actionLoading}
                    className="w-full bg-success hover:bg-success/90"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    {actionLoading ? "Memproses..." : "Terbitkan SK"}
                  </Button>
                </CardContent>
              </Card>
            )}

            {pengajuan?.catatan_revisi && (
              <Card className="border-destructive">
                <CardHeader>
                  <CardTitle className="text-destructive">
                    Catatan Revisi
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{pengajuan?.catatan_revisi}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      <Dialog open={showPdfDialog} onOpenChange={setShowPdfDialog}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogTitle>Preview</DialogTitle>
          <div className="flex-1 overflow-hidden">
            <iframe
              src={pdfUrl}
              className="w-full h-full border rounded"
              title="PDF Preview"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DetailPengajuan;
