import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import InteractiveAvatar from "@/components/InteractiveAvatar";
import Preloader from "@/components/Preloader";
import ScrollToTop from "@/components/ScrollToTop";

// Lazy load heavy page components for blazing fast initial load
const Index = lazy(() => import("./pages/Index"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Contact = lazy(() => import("./pages/Contact"));
const Enquiry = lazy(() => import("./pages/Enquiry"));
const Terms = lazy(() => import("./pages/Terms"));
const Events = lazy(() => import("./pages/Events"));
const Facilities = lazy(() => import("./pages/Facilities"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const PerumburPage = lazy(() => import("./pages/LocationPage").then(m => ({ default: m.PerumburPage })));
const VyasarpadiPage = lazy(() => import("./pages/LocationPage").then(m => ({ default: m.VyasarpadiPage })));
const MadhavaramPage = lazy(() => import("./pages/LocationPage").then(m => ({ default: m.MadhavaramPage })));
const NotFound = lazy(() => import("./pages/NotFound"));
const Unsubscribe = lazy(() => import("./pages/Unsubscribe"));
const QRPage = lazy(() => import("./pages/QRPage"));
const QRScan = lazy(() => import("./pages/QRScan"));

// Global Cache Optimization
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // Cache for 5 minutes
      gcTime: 1000 * 60 * 15,
      refetchOnWindowFocus: false,
      retry: 1,
    }
  }
});

const AppAvatar = () => {
  const location = useLocation();
  if (
    location.pathname === "/enquiry" ||
    location.pathname.startsWith("/enquiry") ||
    location.pathname.startsWith("/admin") ||
    location.pathname === "/qr-scan" ||
    location.pathname === "/qr" ||
    location.pathname === "/terms"
  ) {
    return null;
  }
  return <InteractiveAvatar />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Preloader />
      <Toaster />
      <BrowserRouter>
        <ScrollToTop />
        <Navbar />
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin"></div></div>}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/gallery" element={<Gallery />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/enquiry" element={<Enquiry />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/events" element={<Events />} />
            <Route path="/facilities" element={<Facilities />} />
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/locations/perambur" element={<PerumburPage />} />
            <Route path="/locations/vyasarpadi" element={<VyasarpadiPage />} />
            <Route path="/locations/madhavaram" element={<MadhavaramPage />} />
            <Route path="/unsubscribe" element={<Unsubscribe />} />
            <Route path="/qr-scan" element={<QRScan />} />
            <Route path="/qr" element={<QRScan />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
        <Footer />
        <WhatsAppButton />
        <AppAvatar />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
