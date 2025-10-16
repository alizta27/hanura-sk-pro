import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Calendar as CalendarIcon,
  Upload,
  ArrowLeft,
  ArrowRight,
  Eye,
  Trash,
} from "lucide-react";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import hanuraLogo from "@/assets/hanura-logo.jpg";
import { getSignedUrl } from "@/lib/storage";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const UploadLaporanMusda = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState<Date>();
  const [lokasi, setLokasi] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [musdaFileUrl, setMusdaFileUrl] = useState<string>("");
  const [isEdit, setIsEdit] = useState(false);

  useEffect(() => {
    loadPengajuan();
  }, []);

  const loadPengajuan = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("pengajuan_sk")
        .select("*")
        .eq("dpd_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        if (
          data?.file_laporan_musda ||
          data?.lokasi_musda ||
          data?.tanggal_musda
        ) {
          setIsEdit(true);
        }
        setDate(data.tanggal_musda ? new Date(data.tanggal_musda) : undefined);
        setLokasi(data.lokasi_musda || "");
        const signedUrl = await getSignedUrl(
          "laporan-musda",
          data?.file_laporan_musda!
        );
        setMusdaFileUrl(signedUrl || "");
      }
    } catch (error) {
      console.error("Error loading pengajuan:", error);
      toast.error("Gagal memuat data pengajuan");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        toast.error("File harus berformat PDF");
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 10MB");
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!date || !lokasi || (!file && !musdaFileUrl)) {
      toast.error("Semua field wajib diisi");
      return;
    }

    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("User tidak terautentikasi");
        return;
      }

      let fileName;
      if (!musdaFileUrl && file) {
        const fileExt = file.name.split(".").pop();
        fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("laporan-musda")
          .upload(fileName, file);

        if (uploadError) {
          throw uploadError;
        }
      }

      let dbError;
      console.log({ musdaFileUrl, fileName, data: musdaFileUrl ?? fileName });
      if (isEdit) {
        const { error } = await supabase
          .from("pengajuan_sk")
          .update({
            dpd_id: user.id,
            tanggal_musda: format(date, "yyyy-MM-dd"),
            lokasi_musda: lokasi,
            file_laporan_musda: musdaFileUrl || fileName,
            status: "draft",
          })
          .eq("dpd_id", user.id);
        dbError = error;
      } else {
        const { error } = await supabase.from("pengajuan_sk").insert({
          dpd_id: user.id,
          tanggal_musda: format(date, "yyyy-MM-dd"),
          lokasi_musda: lokasi,
          file_laporan_musda: fileName,
          status: "draft",
        });
        dbError = error;
      }

      if (dbError) {
        throw dbError;
      }

      toast.success("Laporan MUSDA berhasil diupload");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error uploading:", error);
      toast.error("Gagal mengupload laporan");
    } finally {
      setUploading(false);
    }
  };
  console.log({ musdaFileUrl });
  const handleDeleteFile = async () => {
    if (!musdaFileUrl) {
      toast.error("Tidak ada file untuk dihapus");
      return;
    }

    // Extract the file path relative to your Supabase bucket
    const filePath = musdaFileUrl.split("/").slice(-2).join("/"); // e.g. "user-id/12345.pdf"

    try {
      setUploading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        toast.error("User tidak terautentikasi");
        return;
      }

      // 1️⃣ Delete from Supabase Storage
      const { error: storageError } = await supabase.storage
        .from("laporan-musda")
        .remove([filePath]);

      if (storageError) throw storageError;

      // 2️⃣ Update DB record (set file_laporan_musda to null)
      const { error: dbError } = await supabase
        .from("pengajuan_sk")
        .update({ file_laporan_musda: null })
        .eq("dpd_id", user.id);

      if (dbError) throw dbError;

      // 3️⃣ Update state
      setFile(null);
      setMusdaFileUrl(null);

      toast.success("File laporan berhasil dihapus");
    } catch (error) {
      console.error("Error deleting file:", error);
      toast.error("Gagal menghapus file laporan");
    } finally {
      setUploading(false);
    }
  };

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
                Upload Laporan MUSDA
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
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
            <CardDescription>Langkah 1 dari 3</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={33.33} className="h-3" />
          </CardContent>
        </Card>

        <Card className="shadow-large">
          <CardHeader>
            <CardTitle>Upload Laporan Hasil MUSDA</CardTitle>
            <CardDescription>
              Lengkapi informasi dan upload file laporan hasil Musyawarah Daerah
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="tanggal">Tanggal Pelaksanaan MUSDA</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date
                        ? format(date, "PPP", { locale: id })
                        : "Pilih tanggal"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lokasi">Lokasi Pelaksanaan MUSDA</Label>
                <Input
                  id="lokasi"
                  placeholder="Contoh: Hotel Grand Sahid, Jakarta"
                  value={lokasi}
                  onChange={(e) => setLokasi(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-3">
                <Label htmlFor="file" className="text-sm font-medium">
                  Upload File Laporan (PDF)
                </Label>

                {musdaFileUrl && (
                  <div className="flex items-center justify-between bg-muted/40 p-2 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                      <Upload className="h-4 w-4 text-muted-foreground" />
                      <span className="truncate max-w-[200px]">
                        {musdaFileUrl.split("/").pop()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                window.open(musdaFileUrl, "_blank")
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Lihat File</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={handleDeleteFile}
                            >
                              <Trash className="h-4 w-4 text-destructive" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Hapus File</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                )}
                {musdaFileUrl ? null : (
                  <div className="flex items-center gap-4">
                    <Input
                      id="file"
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="flex-1 cursor-pointer"
                    />
                    {file && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Upload className="h-4 w-4" />
                        <span className="truncate max-w-[200px]">
                          {file.name}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Format: <span className="font-medium">PDF</span>, Maksimal{" "}
                  <span className="font-medium">10MB</span>
                </p>
              </div>
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  className="flex-1"
                >
                  Simpan Draft
                </Button>
                <Button type="submit" disabled={uploading} className="flex-1">
                  {uploading ? (
                    "Mengupload..."
                  ) : (
                    <>
                      Lanjut ke Step 2
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default UploadLaporanMusda;
