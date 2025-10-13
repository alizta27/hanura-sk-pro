import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import hanuraLogo from "@/assets/hanura-logo.jpg";
import type { Database } from "@/integrations/supabase/types";

type PengajuanStatus = Database["public"]["Enums"]["pengajuan_status"];

interface PengajuanSK {
  id: string;
  status: PengajuanStatus;
  tanggal_musda: string;
  lokasi_musda: string;
  file_laporan_musda: string | null;
  catatan_revisi: string | null;
  verified_okk_at: string | null;
  approved_sekjend_at: string | null;
  approved_ketum_at: string | null;
  sk_terbit_at: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<
  PengajuanStatus,
  { label: string; color: string; icon: any }
> = {
  draft: { label: "Draft", color: "bg-gray-500", icon: FileText },
  diupload: { label: "Diupload", color: "bg-blue-500", icon: Clock },
  diverifikasi_okk: {
    label: "Diverifikasi OKK",
    color: "bg-yellow-500",
    icon: Clock,
  },
  ditolak_okk: { label: "Ditolak OKK", color: "bg-red-500", icon: XCircle },
  disetujui_sekjend: {
    label: "Disetujui Sekjend",
    color: "bg-green-500",
    icon: CheckCircle2,
  },
  ditolak_sekjend: {
    label: "Ditolak Sekjend",
    color: "bg-red-500",
    icon: XCircle,
  },
  disetujui_ketum: {
    label: "Disetujui Ketum",
    color: "bg-green-500",
    icon: CheckCircle2,
  },
  ditolak_ketum: { label: "Ditolak Ketum", color: "bg-red-500", icon: XCircle },
  sk_terbit: { label: "SK Terbit", color: "bg-primary", icon: CheckCircle2 },
};

const ProgressPengajuanSK = () => {
  const navigate = useNavigate();
  const [pengajuan, setPengajuan] = useState<PengajuanSK | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPengajuan();
  }, []);

  const loadPengajuan = async () => {
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
        .from("pengajuan_sk")
        .select("*")
        .eq("dpd_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPengajuan(data as PengajuanSK);
      } else {
        toast.info("Belum ada pengajuan SK");
        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Error loading pengajuan:", error);
      toast.error("Gagal memuat data pengajuan");
    } finally {
      setLoading(false);
    }
  };

  const getProgressValue = (status: PengajuanStatus): number => {
    const progress: Record<PengajuanStatus, number> = {
      draft: 10,
      diupload: 25,
      diverifikasi_okk: 50,
      ditolak_okk: 25,
      disetujui_sekjend: 75,
      ditolak_sekjend: 50,
      disetujui_ketum: 90,
      ditolak_ketum: 75,
      sk_terbit: 100,
    };
    return progress[status] || 0;
  };

  const getStepStatus = (
    step: string
  ): "completed" | "current" | "pending" | "rejected" => {
    if (!pengajuan) return "pending";

    const { status } = pengajuan;

    if (step === "upload") {
      if (status === "draft") return "pending";
      if (status === "diupload") return "current";
      return "completed";
    }

    if (step === "okk") {
      if (["draft", "diupload"].includes(status)) return "pending";
      if (status === "ditolak_okk") return "rejected";
      if (status === "diverifikasi_okk") return "current";
      return "completed";
    }

    if (step === "sekjend") {
      if (
        ["draft", "diupload", "diverifikasi_okk", "ditolak_okk"].includes(
          status
        )
      )
        return "pending";
      if (status === "ditolak_sekjend") return "rejected";
      if (status === "disetujui_sekjend") return "current";
      return "completed";
    }

    if (step === "ketum") {
      if (!["disetujui_ketum", "ditolak_ketum", "sk_terbit"].includes(status))
        return "pending";
      if (status === "ditolak_ketum") return "rejected";
      if (status === "disetujui_ketum") return "current";
      return "completed";
    }

    if (step === "terbit") {
      return status === "sk_terbit" ? "completed" : "pending";
    }

    return "pending";
  };

  const handleRevisi = () => {
    navigate("/upload-laporan");
  };

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
            <CardTitle>Tidak Ada Data</CardTitle>
            <CardDescription>
              Belum ada pengajuan SK yang ditemukan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/dashboard")} className="w-full">
              Kembali ke Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStatus = STATUS_CONFIG[pengajuan.status];
  const StatusIcon = currentStatus.icon;
  const progressValue = getProgressValue(pengajuan.status);
  const isDitolak = pengajuan.status.includes("ditolak");

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
                Progress Pengajuan SK
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="outline"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Dashboard
        </Button>

        <Card className="mb-8 shadow-medium">
          <CardHeader>
            <CardTitle>Progress Pengajuan SK</CardTitle>
            <CardDescription>Langkah 3 dari 3</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={100} className="h-3" />
          </CardContent>
        </Card>

        <Card className="mb-6 shadow-large">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Status Pengajuan</CardTitle>
                <CardDescription>
                  Diajukan pada{" "}
                  {format(new Date(pengajuan.created_at), "PPP", {
                    locale: id,
                  })}
                </CardDescription>
              </div>
              <Badge className={`${currentStatus.color} text-white`}>
                <StatusIcon className="mr-2 h-4 w-4" />
                {currentStatus.label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Detail MUSDA</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Tanggal:</span>
                    <p className="font-medium">
                      {format(new Date(pengajuan.tanggal_musda), "PPP", {
                        locale: id,
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Lokasi:</span>
                    <p className="font-medium">{pengajuan.lokasi_musda}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4">Timeline Proses</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        getStepStatus("upload") === "completed"
                          ? "bg-primary text-white"
                          : getStepStatus("upload") === "current"
                          ? "bg-primary/20 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Dokumen Diupload</p>
                      <p className="text-sm text-muted-foreground">
                        {pengajuan.created_at
                          ? format(new Date(pengajuan.created_at), "PPP", {
                              locale: id,
                            })
                          : "-"}
                      </p>
                    </div>
                    {getStepStatus("upload") === "completed" && (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        getStepStatus("okk") === "completed"
                          ? "bg-primary text-white"
                          : getStepStatus("okk") === "current"
                          ? "bg-primary/20 text-primary"
                          : getStepStatus("okk") === "rejected"
                          ? "bg-destructive text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Verifikasi OKK</p>
                      <p className="text-sm text-muted-foreground">
                        {pengajuan.verified_okk_at
                          ? format(new Date(pengajuan.verified_okk_at), "PPP", {
                              locale: id,
                            })
                          : "Menunggu verifikasi"}
                      </p>
                    </div>
                    {getStepStatus("okk") === "completed" && (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    )}
                    {getStepStatus("okk") === "rejected" && (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        getStepStatus("sekjend") === "completed"
                          ? "bg-primary text-white"
                          : getStepStatus("sekjend") === "current"
                          ? "bg-primary/20 text-primary"
                          : getStepStatus("sekjend") === "rejected"
                          ? "bg-destructive text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Persetujuan Sekjend</p>
                      <p className="text-sm text-muted-foreground">
                        {pengajuan.approved_sekjend_at
                          ? format(
                              new Date(pengajuan.approved_sekjend_at),
                              "PPP",
                              { locale: id }
                            )
                          : "Menunggu persetujuan"}
                      </p>
                    </div>
                    {getStepStatus("sekjend") === "completed" && (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    )}
                    {getStepStatus("sekjend") === "rejected" && (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        getStepStatus("ketum") === "completed"
                          ? "bg-primary text-white"
                          : getStepStatus("ketum") === "current"
                          ? "bg-primary/20 text-primary"
                          : getStepStatus("ketum") === "rejected"
                          ? "bg-destructive text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Persetujuan Ketum</p>
                      <p className="text-sm text-muted-foreground">
                        {pengajuan.approved_ketum_at
                          ? format(
                              new Date(pengajuan.approved_ketum_at),
                              "PPP",
                              { locale: id }
                            )
                          : "Menunggu persetujuan"}
                      </p>
                    </div>
                    {getStepStatus("ketum") === "completed" && (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    )}
                    {getStepStatus("ketum") === "rejected" && (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full ${
                        getStepStatus("terbit") === "completed"
                          ? "bg-success text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">SK Terbit</p>
                      <p className="text-sm text-muted-foreground">
                        {pengajuan.sk_terbit_at
                          ? format(new Date(pengajuan.sk_terbit_at), "PPP", {
                              locale: id,
                            })
                          : "Belum terbit"}
                      </p>
                    </div>
                    {getStepStatus("terbit") === "completed" && (
                      <CheckCircle2 className="h-5 w-5 text-success" />
                    )}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1">
                    <div className="text-sm text-muted-foreground mb-1">
                      Progress Keseluruhan
                    </div>
                    <Progress value={progressValue} className="h-2" />
                  </div>
                  <span className="text-sm font-medium">{progressValue}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isDitolak && pengajuan.catatan_revisi && (
          <Card className="mb-6 border-destructive shadow-large">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-destructive">
                  Catatan Revisi
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">{pengajuan.catatan_revisi}</p>
              <Button onClick={handleRevisi} variant="destructive">
                Revisi & Upload Ulang
              </Button>
            </CardContent>
          </Card>
        )}

        {pengajuan.status === "sk_terbit" && (
          <Card className="border-success shadow-large">
            <CardHeader>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <CardTitle className="text-success">
                  SK Berhasil Terbit!
                </CardTitle>
              </div>
              <CardDescription>
                Selamat! Surat Keputusan kepengurusan DPD Anda telah terbit
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                <FileText className="mr-2 h-4 w-4" />
                Download SK
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default ProgressPengajuanSK;
