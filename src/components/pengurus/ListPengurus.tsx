import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2 } from "lucide-react";
import { Pengurus } from "@/lib/struktur-constants";

interface ListPengurusProps {
  pengurusList: Pengurus[];
  onEdit: (index: number) => void;
  onDelete: (index: number) => void;
}

export const ListPengurus = ({
  pengurusList,
  onEdit,
  onDelete,
}: ListPengurusProps) => {
  if (pengurusList.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8">
        Belum ada pengurus yang ditambahkan
      </p>
    );
  }

  return (
    <div className="overflow-auto max-h-[600px]">
      <Table>
        <TableHeader className="sticky top-0 bg-background z-10">
          <TableRow>
            <TableHead>Struktur</TableHead>
            <TableHead>Jabatan</TableHead>
            <TableHead>Nama</TableHead>
            <TableHead>JK</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pengurusList.map((pengurus, index) => (
            <TableRow key={index}>
              <TableCell className="text-sm">
                <div>
                  <div className="font-medium">{pengurus.jenis_struktur}</div>
                  {pengurus.bidang_struktur && (
                    <div className="text-xs text-muted-foreground">
                      {pengurus.bidang_struktur}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell className="font-medium">{pengurus.jabatan}</TableCell>
              <TableCell>{pengurus.nama_lengkap}</TableCell>
              <TableCell>
                {pengurus.jenis_kelamin === "Laki-laki" ? "L" : "P"}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onEdit(index)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
