import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import DashboardDPD from "./pages/DashboardDPD";
import UploadLaporanMusda from "./pages/UploadLaporanMusda";
import InputDataPengurus from "./pages/InputDataPengurus";
import ProgressPengajuanSK from "./pages/ProgressPengajuanSK";
import DashboardAdmin from "./pages/DashboardAdmin";
import DetailPengajuan from "./pages/DetailPengajuan";
import NotFound from "./pages/NotFound";
import AuthAdmin from "./pages/AuthAdmin";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/auth-admin" element={<AuthAdmin />} />
          <Route path="/dashboard" element={<DashboardDPD />} />
          <Route path="/upload-laporan" element={<UploadLaporanMusda />} />
          <Route path="/input-pengurus" element={<InputDataPengurus />} />
          <Route path="/progress-sk" element={<ProgressPengajuanSK />} />
          <Route path="/dashboard-admin" element={<DashboardAdmin />} />
          <Route path="/detail-pengajuan/:id" element={<DetailPengajuan />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
