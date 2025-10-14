import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowRight, FileText, Users, Shield } from "lucide-react";
import hanuraLogo from "@/assets/hanura-logo.jpg";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profile) {
          if (["okk", "sekjend", "ketum"].includes(profile.role)) {
            navigate("/dashboard-admin");
          } else {
            navigate("/dashboard");
          }
        }
      }
    };
    checkSession();
  }, [navigate]);

  const features = [
    {
      icon: FileText,
      title: "Pengajuan SK Digital",
      description:
        "Proses pengajuan SK yang mudah, cepat, dan terorganisir secara digital",
    },
    {
      icon: Users,
      title: "Manajemen Pengurus",
      description:
        "Input dan kelola data pengurus DPD dengan sistem yang terintegrasi",
    },
    {
      icon: Shield,
      title: "Tracking Real-time",
      description:
        "Pantau status persetujuan SK secara real-time dari OKK hingga Ketum",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Logo */}
          <div className="flex justify-center">
            <img src={hanuraLogo} alt="HANURA Logo" className="h-32 w-auto" />
          </div>

          {/* Title */}
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                H-Gate050: MUSDA System
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground font-medium">
              Sistem Pengajuan SK dan Laporan MUSDA
            </p>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Platform digital terintegrasi untuk memudahkan proses pengajuan
              Surat Keputusan dan pelaporan hasil Musyawarah Daerah Partai
              HANURA
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="text-lg px-8 shadow-large hover:shadow-xl transition-all"
              onClick={() => navigate("/auth")}
            >
              Login
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            {/* <Button
              size="lg"
              variant="outline"
              className="text-lg px-8"
              onClick={() => navigate("/auth")}
            >
              Login
            </Button> */}
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="bg-card rounded-xl p-6 shadow-medium hover:shadow-large transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-gradient-primary">
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <div className="bg-card rounded-xl p-8 shadow-large text-center">
            <h2 className="text-2xl font-bold mb-4">Proses yang Sederhana</h2>
            <p className="text-muted-foreground mb-6">
              Sistem kami dirancang untuk memudahkan DPD dalam mengajukan SK
              dengan 3 langkah mudah:
            </p>
            <div className="grid gap-4 md:grid-cols-3 text-left">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    1
                  </div>
                  Upload MUSDA
                </div>
                <p className="text-sm text-muted-foreground pl-10">
                  Upload laporan hasil Musyawarah Daerah
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    2
                  </div>
                  Input Pengurus
                </div>
                <p className="text-sm text-muted-foreground pl-10">
                  Isi data lengkap pengurus DPD
                </p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    3
                  </div>
                  Tracking Status
                </div>
                <p className="text-sm text-muted-foreground pl-10">
                  Pantau proses persetujuan SK
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-card mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2025 Partai Hati Nurani Rakyat (HANURA). All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
