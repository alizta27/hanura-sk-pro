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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LogOut, Search, Filter, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import hanuraLogo from "@/assets/hanura-logo.jpg";
import type { Database } from "@/integrations/supabase/types";

type PengajuanStatus = Database["public"]["Enums"]["pengajuan_status"];
type AppRole = Database["public"]["Enums"]["app_role"];

interface PengajuanWithProfile {
  id: string;
  status: PengajuanStatus;
  tanggal_musda: string;
  lokasi_musda: string;
  created_at: string;
  profiles: {
    full_name: string;
    provinsi: string | null;
  } | null;
}

const STATUS_COLORS: Record<PengajuanStatus, string> = {
  draft: "bg-gray-500",
  diupload: "bg-blue-500",
  diverifikasi_okk: "bg-yellow-500",
  ditolak_okk: "bg-red-500",
  disetujui_sekjend: "bg-green-500",
  ditolak_sekjend: "bg-red-500",
  disetujui_ketum: "bg-green-500",
  ditolak_ketum: "bg-red-500",
  sk_terbit: "bg-primary",
};

const STATUS_LABELS: Record<PengajuanStatus, string> = {
  draft: "Draft",
  diupload: "Diupload",
  diverifikasi_okk: "Diverifikasi OKK",
  ditolak_okk: "Ditolak OKK",
  disetujui_sekjend: "Disetujui Sekjend",
  ditolak_sekjend: "Ditolak Sekjend",
  disetujui_ketum: "Disetujui Ketum",
  ditolak_ketum: "Ditolak Ketum",
  sk_terbit: "SK Terbit",
};

const DashboardAdmin = () => {
  const navigate = useNavigate();
  const [pengajuanList, setPengajuanList] = useState<PengajuanWithProfile[]>(
    []
  );
  const [filteredList, setFilteredList] = useState<PengajuanWithProfile[]>([]);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterProvinsi, setFilterProvinsi] = useState<string>("all");

  useEffect(() => {
    loadUserRole();
  }, []);

  useEffect(() => {
    if (userRole) {
      loadPengajuan();
    }
  }, [userRole]);

  useEffect(() => {
    filterPengajuan();
  }, [pengajuanList, searchQuery, filterStatus, filterProvinsi]);

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
        .maybeSingle();

      if (error) throw error;

      if (data && ["okk", "sekjend", "ketum"].includes(data.role)) {
        setUserRole(data.role as AppRole);
      } else {
        toast.error("Akses ditolak. Anda bukan admin.");
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
          created_at,
            profiles!dpd_id (
                  full_name,
                  provinsi
                )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      console.log({ data });
      setPengajuanList(data as PengajuanWithProfile[]);
    } catch (error) {
      console.error("Error loading pengajuan:", error);
      toast.error("Gagal memuat data pengajuan");
    } finally {
      setLoading(false);
    }
  };

  const filterPengajuan = () => {
    let filtered = [...pengajuanList];

    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.profiles?.full_name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          p.profiles?.provinsi
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          p.lokasi_musda.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((p) => p.status === filterStatus);
    }

    if (filterProvinsi !== "all") {
      filtered = filtered.filter(
        (p) => p.profiles?.provinsi === filterProvinsi
      );
    }

    setFilteredList(filtered);
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Gagal logout");
    } else {
      toast.success("Berhasil logout");
      navigate("/auth");
    }
  };

  const handleViewDetail = (id: string) => {
    navigate(`/detail-pengajuan/${id}`);
  };

  const uniqueProvinsi = Array.from(
    new Set(pengajuanList.map((p) => p.profiles?.provinsi).filter(Boolean))
  ) as string[];

  const stats = {
    total: pengajuanList.length,
    menunggu: pengajuanList.filter((p) => p.status === "diupload").length,
    diproses: pengajuanList.filter((p) =>
      ["diverifikasi_okk", "disetujui_sekjend", "disetujui_ketum"].includes(
        p.status
      )
    ).length,
    selesai: pengajuanList.filter((p) => p.status === "sk_terbit").length,
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

  return (
    <div className="min-h-screen bg-gradient-soft">
      <header className="bg-card border-b shadow-soft sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={hanuraLogo} alt="HANURA" className="h-12 w-auto" />
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  H-Gate050: MUSDA System
                </h1>
                <p className="text-sm text-muted-foreground">
                  Dashboard {userRole?.toUpperCase()}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card className="shadow-medium">
            <CardHeader className="pb-3">
              <CardDescription>Total Pengajuan</CardDescription>
              <CardTitle className="text-3xl">{stats.total}</CardTitle>
            </CardHeader>
          </Card>

          <Card className="shadow-medium">
            <CardHeader className="pb-3">
              <CardDescription>Menunggu Verifikasi</CardDescription>
              <CardTitle className="text-3xl text-blue-500">
                {stats.menunggu}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="shadow-medium">
            <CardHeader className="pb-3">
              <CardDescription>Sedang Diproses</CardDescription>
              <CardTitle className="text-3xl text-yellow-500">
                {stats.diproses}
              </CardTitle>
            </CardHeader>
          </Card>

          <Card className="shadow-medium">
            <CardHeader className="pb-3">
              <CardDescription>SK Terbit</CardDescription>
              <CardTitle className="text-3xl text-success">
                {stats.selesai}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        <Card className="shadow-large">
          <CardHeader>
            <CardTitle>Daftar Pengajuan SK</CardTitle>
            <CardDescription>
              Kelola dan verifikasi pengajuan SK dari seluruh DPD
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cari berdasarkan nama DPD, provinsi, atau lokasi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    <SelectItem value="diupload">Diupload</SelectItem>
                    <SelectItem value="diverifikasi_okk">
                      Diverifikasi OKK
                    </SelectItem>
                    <SelectItem value="disetujui_sekjend">
                      Disetujui Sekjend
                    </SelectItem>
                    <SelectItem value="disetujui_ketum">
                      Disetujui Ketum
                    </SelectItem>
                    <SelectItem value="sk_terbit">SK Terbit</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={filterProvinsi}
                  onValueChange={setFilterProvinsi}
                >
                  <SelectTrigger className="w-[180px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Provinsi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Provinsi</SelectItem>
                    {uniqueProvinsi.map((prov) => (
                      <SelectItem key={prov} value={prov}>
                        {prov}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filteredList.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Tidak ada data pengajuan
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>DPD Provinsi</TableHead>
                    <TableHead>Tanggal MUSDA</TableHead>
                    <TableHead>Lokasi</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Diajukan</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredList.map((pengajuan) => (
                    <TableRow key={pengajuan.id}>
                      <TableCell>
                        {pengajuan.profiles?.provinsi || "-"}
                      </TableCell>
                      <TableCell>
                        {format(
                          new Date(pengajuan.tanggal_musda),
                          "dd MMM yyyy",
                          {
                            locale: id,
                          }
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {pengajuan.lokasi_musda}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${
                            STATUS_COLORS[pengajuan.status]
                          } text-white`}
                        >
                          {STATUS_LABELS[pengajuan.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(new Date(pengajuan.created_at), "dd MMM yyyy", {
                          locale: id,
                        })}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetail(pengajuan.id)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DashboardAdmin;
