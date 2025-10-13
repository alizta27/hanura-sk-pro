import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { FileText, Users, CheckCircle2, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import hanuraLogo from "@/assets/hanura-logo.jpg";

const DashboardDPD = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const navigate = useNavigate();

  const steps = [
    {
      number: 1,
      title: "Upload Laporan MUSDA",
      description: "Upload file PDF laporan hasil MUSDA dan informasi pelaksanaan",
      icon: FileText,
      completed: false,
    },
    {
      number: 2,
      title: "Input Data Pengurus",
      description: "Isi data lengkap pengurus DPD beserta dokumen pendukung",
      icon: Users,
      completed: false,
    },
    {
      number: 3,
      title: "Tracking Progress SK",
      description: "Pantau status persetujuan SK dari OKK, Sekjend, hingga Ketum",
      icon: CheckCircle2,
      completed: false,
    },
  ];

  const progressPercentage = (currentStep / steps.length) * 100;

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Gagal logout");
    } else {
      toast.success("Berhasil logout");
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Header */}
      <header className="bg-card border-b shadow-soft sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img src={hanuraLogo} alt="HANURA" className="h-12 w-auto" />
              <div>
                <h1 className="text-xl font-bold text-foreground">HANURA SK Pro</h1>
                <p className="text-sm text-muted-foreground">Dashboard DPD</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Keluar
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Progress Bar */}
        <Card className="mb-8 shadow-medium">
          <CardHeader>
            <CardTitle>Progress Pengajuan SK</CardTitle>
            <CardDescription>
              Langkah {currentStep} dari {steps.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Progress value={progressPercentage} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Mulai</span>
                <span>{progressPercentage.toFixed(0)}%</span>
                <span>Selesai</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Steps Grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon;
            const isActive = step.number === currentStep;
            const isCompleted = step.completed;

            return (
              <Card
                key={step.number}
                className={`transition-all duration-300 cursor-pointer hover:shadow-large ${
                  isActive ? "ring-2 ring-primary shadow-large scale-105" : ""
                } ${isCompleted ? "bg-accent/50" : ""}`}
                onClick={() => setCurrentStep(step.number)}
              >
                <CardHeader>
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                        isActive
                          ? "bg-gradient-primary text-white"
                          : isCompleted
                          ? "bg-success text-success-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-muted-foreground">
                        Langkah {step.number}
                      </div>
                      <CardTitle className="text-lg">{step.title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  <Button
                    className="mt-4 w-full"
                    variant={isActive ? "default" : "outline"}
                    disabled={!isActive}
                  >
                    {isCompleted ? "Lihat Detail" : isActive ? "Mulai" : "Belum Aktif"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Help Section */}
        <Card className="mt-8 bg-accent/30 border-primary/20">
          <CardHeader>
            <CardTitle className="text-lg">Butuh Bantuan?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Jika Anda mengalami kesulitan dalam proses pengajuan SK, silakan hubungi tim dukungan kami.
            </p>
            <Button variant="outline" size="sm">
              Hubungi Dukungan
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default DashboardDPD;
