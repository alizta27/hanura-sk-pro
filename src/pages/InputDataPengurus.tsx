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
import { ArrowLeft, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import hanuraLogo from "@/assets/hanura-logo.jpg";
import { Pengurus, CustomJabatan } from "@/lib/struktur-constants";
import { FormPengurus } from "@/components/pengurus/FormPengurus";
import { ListPengurus } from "@/components/pengurus/ListPengurus";
import { ProgressGender } from "@/components/pengurus/ProgressGender";
import { CustomJabatanDialog } from "@/components/pengurus/CustomJabatanDialog";

const InputDataPengurus = () => {
  const navigate = useNavigate();
  const [pengurusList, setPengurusList] = useState<Pengurus[]>([]);
  const [customJabatanList, setCustomJabatanList] = useState<CustomJabatan[]>(
    []
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentPengurus, setCurrentPengurus] = useState<Pengurus>({
    jenis_struktur: "",
    bidang_struktur: "",
    jabatan: "",
    nama_lengkap: "",
    jenis_kelamin: "",
    file_ktp: null,
    urutan: 0,
  });
  const [pengajuanId, setPengajuanId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);

  useEffect(() => {
    loadPengajuan();
    loadCustomJabatan();
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
        setPengurusList(data as Pengurus[]);
      }
    } catch (error) {
      console.error("Error loading pengurus:", error);
    }
  };

  const loadCustomJabatan = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("custom_jabatan")
        .select("*")
        .eq("dpd_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data) {
        setCustomJabatanList(data as CustomJabatan[]);
      }
    } catch (error) {
      console.error("Error loading custom jabatan:", error);
    }
  };

  const handleAddCustomJabatan = async (
    jenisStruktur: string,
    namaJabatan: string
  ) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const exists = customJabatanList.some(
        (cj) =>
          cj.jenis_struktur === jenisStruktur &&
          cj.nama_jabatan === namaJabatan
      );

      if (exists) {
        toast.error("Jabatan ini sudah ada dalam daftar");
        return;
      }

      const { data, error } = await supabase
        .from("custom_jabatan")
        .insert({
          dpd_id: user.id,
          jenis_struktur: jenisStruktur,
          nama_jabatan: namaJabatan,
        })
        .select()
        .single();

      if (error) throw error;

      setCustomJabatanList([...customJabatanList, data as CustomJabatan]);
      toast.success("Jabatan custom berhasil ditambahkan");
    } catch (error) {
      console.error("Error adding custom jabatan:", error);
      toast.error("Gagal menambahkan jabatan custom");
    }
  };

  const handleAddPengurus = () => {
    if (
      !currentPengurus.jenis_struktur ||
      !currentPengurus.jabatan ||
      !currentPengurus.nama_lengkap ||
      !currentPengurus.jenis_kelamin ||
      !currentPengurus.file_ktp
    ) {
      toast.error("Semua field wajib diisi");
      return;
    }

    if (
      currentPengurus.jenis_struktur === "Biro-Biro" &&
      !currentPengurus.bidang_struktur
    ) {
      toast.error("Pilih biro terlebih dahulu");
      return;
    }

    if (editingIndex !== null) {
      const updated = [...pengurusList];
      updated[editingIndex] = { ...currentPengurus, urutan: editingIndex };
      setPengurusList(updated);
      setEditingIndex(null);
      toast.success("Data pengurus berhasil diupdate");
    } else {
      setPengurusList([
        ...pengurusList,
        { ...currentPengurus, urutan: pengurusList.length },
      ]);
      toast.success("Pengurus berhasil ditambahkan ke daftar");
    }

    setCurrentPengurus({
      jenis_struktur: "",
      bidang_struktur: "",
      jabatan: "",
      nama_lengkap: "",
      jenis_kelamin: "",
      file_ktp: null,
      urutan: 0,
    });
  };

  const handleEdit = (index: number) => {
    setCurrentPengurus(pengurusList[index]);
    setEditingIndex(index);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (index: number) => {
    setPengurusList(pengurusList.filter((_, i) => i !== index));
    toast.success("Pengurus berhasil dihapus");
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

      const { data: existingPengurus } = await supabase
        .from("pengurus")
        .select("id")
        .eq("pengajuan_id", pengajuanId);

      if (existingPengurus && existingPengurus.length > 0) {
        const { error: deleteError } = await supabase
          .from("pengurus")
          .delete()
          .eq("pengajuan_id", pengajuanId);

        if (deleteError) throw deleteError;
      }

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

        const { error } = await supabase.from("pengurus").insert({
          pengajuan_id: pengajuanId,
          jenis_struktur: pengurus.jenis_struktur,
          bidang_struktur: pengurus.bidang_struktur || "",
          jabatan: pengurus.jabatan,
          nama_lengkap: pengurus.nama_lengkap,
          jenis_kelamin: pengurus.jenis_kelamin,
          file_ktp: ktpUrl as string,
          urutan: pengurus.urutan,
        });

        if (error) throw error;
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
            <CardContent>
              <FormPengurus
                currentPengurus={currentPengurus}
                setCurrentPengurus={setCurrentPengurus}
                editingIndex={editingIndex}
                onAddPengurus={handleAddPengurus}
                customJabatanList={customJabatanList}
                onOpenCustomDialog={() => setCustomDialogOpen(true)}
              />
            </CardContent>
          </Card>

          <div className="space-y-6">
            <ProgressGender pengurusList={pengurusList} />

            <Card className="shadow-large">
              <CardHeader>
                <CardTitle>Daftar Pengurus ({pengurusList.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <ListPengurus
                  pengurusList={pengurusList}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
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

      <CustomJabatanDialog
        open={customDialogOpen}
        onOpenChange={setCustomDialogOpen}
        onAdd={handleAddCustomJabatan}
      />
    </div>
  );
};

export default InputDataPengurus;
