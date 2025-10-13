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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  Edit2,
  Upload,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import hanuraLogo from "@/assets/hanura-logo.jpg";

interface Pengurus {
  id?: string;
  jabatan: string;
  nama_lengkap: string;
  jenis_kelamin: string;
  file_ktp: File | string | null;
  urutan: number;
}

const DEFAULT_JABATAN = [
  "Ketua",
  "Sekretaris",
  "Bendahara",
  "Wakil Ketua Umum Bidang Organisasi",
  "Wakil Ketua Umum Bidang Hukum",
  "Wakil Ketua Umum Bidang Politik",
  "Wakil Sekretaris Jenderal Bidang OKK",
  "Wakil Bendahara Umum",
];

const InputDataPengurus = () => {
  const navigate = useNavigate();
  const [pengurusList, setPengurusList] = useState<Pengurus[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentPengurus, setCurrentPengurus] = useState<Pengurus>({
    jabatan: "",
    nama_lengkap: "",
    jenis_kelamin: "",
    file_ktp: null,
    urutan: 0,
  });
  const [customJabatan, setCustomJabatan] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [pengajuanId, setPengajuanId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  console.log({ pengajuanId });
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
        .eq("status", "draft")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setPengajuanId(data.id);
        loadPengurus(data.id);
      } else {
        toast.error(
          "Tidak ada pengajuan draft. Silakan upload laporan MUSDA terlebih dahulu"
        );
        navigate("/upload-laporan");
      }
    } catch (error) {
      console.error("Error loading pengajuan:", error);
      toast.error("Gagal memuat data pengajuan");
    }
  };

  const loadPengurus = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from("pengurus")
        .select("*")
        .eq("pengajuan_id", id)
        .order("urutan", { ascending: true });

      if (error) throw error;

      if (data) {
        setPengurusList(data);
      }
    } catch (error) {
      console.error("Error loading pengurus:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validTypes = ["image/jpeg", "image/png", "application/pdf"];

      if (!validTypes.includes(selectedFile.type)) {
        toast.error("File harus berformat JPG, PNG, atau PDF");
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 5MB");
        return;
      }
      setCurrentPengurus({ ...currentPengurus, file_ktp: selectedFile });
    }
  };

  const handleAddPengurus = () => {
    if (
      !currentPengurus.jabatan ||
      !currentPengurus.nama_lengkap ||
      !currentPengurus.jenis_kelamin ||
      !currentPengurus.file_ktp
    ) {
      toast.error("Semua field wajib diisi");
      return;
    }

    if (editingIndex !== null) {
      const updated = [...pengurusList];
      updated[editingIndex] = { ...currentPengurus, urutan: editingIndex };
      setPengurusList(updated);
      setEditingIndex(null);
    } else {
      setPengurusList([
        ...pengurusList,
        { ...currentPengurus, urutan: pengurusList.length },
      ]);
    }

    setCurrentPengurus({
      jabatan: "",
      nama_lengkap: "",
      jenis_kelamin: "",
      file_ktp: null,
      urutan: 0,
    });
    setShowCustomInput(false);
    setCustomJabatan("");
  };

  const handleEdit = (index: number) => {
    setCurrentPengurus(pengurusList[index]);
    setEditingIndex(index);
  };

  const handleDelete = (index: number) => {
    setPengurusList(pengurusList.filter((_, i) => i !== index));
  };

  const validatePerempuan = () => {
    const perempuanCount = pengurusList.filter(
      (p) => p.jenis_kelamin === "Perempuan"
    ).length;
    const percentage = (perempuanCount / pengurusList.length) * 100;
    return percentage >= 30;
  };

  const handleSubmit = async () => {
    if (pengurusList.length === 0) {
      toast.error("Minimal ada 1 pengurus yang harus diisi");
      return;
    }

    if (!validatePerempuan()) {
      toast.error("Keterwakilan perempuan minimal 30%");
      return;
    }

    if (!pengajuanId) {
      toast.error("Pengajuan tidak ditemukan");
      return;
    }

    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User tidak terautentikasi");

      for (const pengurus of pengurusList) {
        let ktpUrl = pengurus.file_ktp;

        if (pengurus.file_ktp instanceof File) {
          const fileExt = pengurus.file_ktp.name.split(".").pop();
          const fileName = `${user.id}/${Date.now()}-${pengurus.jabatan.replace(
            /\s+/g,
            "-"
          )}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("ktp-pengurus")
            .upload(fileName, pengurus.file_ktp);

          if (uploadError) throw uploadError;

          ktpUrl = fileName;
        }

        if (pengurus.id) {
          const { error } = await supabase
            .from("pengurus")
            .update({
              jabatan: pengurus.jabatan,
              nama_lengkap: pengurus.nama_lengkap,
              jenis_kelamin: pengurus.jenis_kelamin,
              file_ktp: ktpUrl,
              urutan: pengurus.urutan,
            })
            .eq("id", pengurus.id);

          if (error) throw error;
        } else {
          const { error } = await supabase.from("pengurus").insert({
            pengajuan_id: pengajuanId,
            jabatan: pengurus.jabatan,
            nama_lengkap: pengurus.nama_lengkap,
            jenis_kelamin: pengurus.jenis_kelamin,
            file_ktp: ktpUrl as string,
            urutan: pengurus.urutan,
          });

          if (error) throw error;
        }
      }

      const { error: updateError } = await supabase
        .from("pengajuan_sk")
        .update({ status: "diupload", dpd_id: user.id })
        .eq("id", pengajuanId);

      if (updateError) throw updateError;

      toast.success("Data pengurus berhasil disimpan");
      navigate("/progress-sk");
    } catch (error) {
      console.error("Error saving pengurus:", error);
      toast.error("Gagal menyimpan data pengurus");
    } finally {
      setUploading(false);
    }
  };

  const perempuanPercentage =
    pengurusList.length > 0
      ? (pengurusList.filter((p) => p.jenis_kelamin === "Perempuan").length /
          pengurusList.length) *
        100
      : 0;

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
                Input Data Pengurus
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
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
            <CardDescription>Langkah 2 dari 3</CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={66.66} className="h-3" />
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="shadow-large">
            <CardHeader>
              <CardTitle>Form Data Pengurus</CardTitle>
              <CardDescription>
                Isi data lengkap pengurus DPD beserta dokumen KTP
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Jabatan</Label>
                {!showCustomInput ? (
                  <div className="space-y-2">
                    <Select
                      value={currentPengurus.jabatan}
                      onValueChange={(value) => {
                        if (value === "custom") {
                          setShowCustomInput(true);
                        } else {
                          setCurrentPengurus({
                            ...currentPengurus,
                            jabatan: value,
                          });
                        }
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pilih jabatan" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEFAULT_JABATAN.map((jab) => (
                          <SelectItem key={jab} value={jab}>
                            {jab}
                          </SelectItem>
                        ))}
                        <SelectItem value="custom">
                          + Tambah Jabatan Lainnya
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Masukkan jabatan"
                      value={customJabatan}
                      onChange={(e) => setCustomJabatan(e.target.value)}
                    />
                    <Button
                      onClick={() => {
                        if (customJabatan) {
                          setCurrentPengurus({
                            ...currentPengurus,
                            jabatan: customJabatan,
                          });
                          setShowCustomInput(false);
                        }
                      }}
                    >
                      OK
                    </Button>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="nama">Nama Lengkap</Label>
                <Input
                  id="nama"
                  placeholder="Masukkan nama lengkap"
                  value={currentPengurus.nama_lengkap}
                  onChange={(e) =>
                    setCurrentPengurus({
                      ...currentPengurus,
                      nama_lengkap: e.target.value,
                    })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Jenis Kelamin</Label>
                <Select
                  value={currentPengurus.jenis_kelamin}
                  onValueChange={(value) =>
                    setCurrentPengurus({
                      ...currentPengurus,
                      jenis_kelamin: value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih jenis kelamin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Laki-laki">Laki-laki</SelectItem>
                    <SelectItem value="Perempuan">Perempuan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ktp">Upload KTP (JPG/PNG/PDF)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="ktp"
                    type="file"
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={handleFileChange}
                  />
                  {currentPengurus.file_ktp && (
                    <Upload className="h-4 w-4 text-primary" />
                  )}
                </div>
                <p className="text-sm text-muted-foreground">Maksimal 5MB</p>
              </div>

              <Button
                onClick={handleAddPengurus}
                className="w-full"
                variant={editingIndex !== null ? "default" : "outline"}
              >
                <Plus className="mr-2 h-4 w-4" />
                {editingIndex !== null ? "Update Pengurus" : "Tambah ke Daftar"}
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="shadow-medium">
              <CardHeader>
                <CardTitle>Keterwakilan Perempuan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Persentase Perempuan</span>
                    <span
                      className={
                        perempuanPercentage >= 30
                          ? "text-success"
                          : "text-destructive"
                      }
                    >
                      {perempuanPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={perempuanPercentage} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    Minimal 30% keterwakilan perempuan diperlukan
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-large">
              <CardHeader>
                <CardTitle>Daftar Pengurus ({pengurusList.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {pengurusList.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Belum ada pengurus yang ditambahkan
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Jabatan</TableHead>
                        <TableHead>Nama</TableHead>
                        <TableHead>JK</TableHead>
                        <TableHead>Aksi</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pengurusList.map((pengurus, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium">
                            {pengurus.jabatan}
                          </TableCell>
                          <TableCell>{pengurus.nama_lengkap}</TableCell>
                          <TableCell>
                            {pengurus.jenis_kelamin === "Laki-laki" ? "L" : "P"}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(index)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDelete(index)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <Card className="mt-6 shadow-medium">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => navigate("/upload-laporan")}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Kembali
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={uploading || pengurusList.length === 0}
                className="flex-1"
              >
                {uploading ? (
                  "Menyimpan..."
                ) : (
                  <>
                    Simpan & Lanjut ke Step 3
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default InputDataPengurus;
