import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { JENIS_STRUKTUR } from "@/lib/struktur-constants";
import { toast } from "sonner";

interface CustomJabatanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (jenisStruktur: string, namaJabatan: string) => void;
}

export const CustomJabatanDialog = ({
  open,
  onOpenChange,
  onAdd,
}: CustomJabatanDialogProps) => {
  const [jenisStruktur, setJenisStruktur] = useState("");
  const [namaJabatan, setNamaJabatan] = useState("");

  const handleSubmit = () => {
    if (!jenisStruktur) {
      toast.error("Jenis struktur harus dipilih");
      return;
    }
    if (!namaJabatan.trim()) {
      toast.error("Nama jabatan harus diisi");
      return;
    }

    onAdd(jenisStruktur, namaJabatan.trim());
    setJenisStruktur("");
    setNamaJabatan("");
    onOpenChange(false);
  };

  const handleCancel = () => {
    setJenisStruktur("");
    setNamaJabatan("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Tambah Jabatan Custom</DialogTitle>
          <DialogDescription>
            Buat jabatan baru yang tidak ada dalam daftar standar. Jabatan ini
            akan tersedia untuk struktur yang dipilih.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Jenis Struktur</Label>
            <Select value={jenisStruktur} onValueChange={setJenisStruktur}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih jenis struktur" />
              </SelectTrigger>
              <SelectContent>
                {JENIS_STRUKTUR.map((struktur) => (
                  <SelectItem key={struktur} value={struktur}>
                    {struktur}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="nama-jabatan">Nama Jabatan</Label>
            <Input
              id="nama-jabatan"
              placeholder="Contoh: Wakil Ketua Bidang Khusus"
              value={namaJabatan}
              onChange={(e) => setNamaJabatan(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Batal
          </Button>
          <Button onClick={handleSubmit}>Tambah</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
