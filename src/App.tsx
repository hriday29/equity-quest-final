import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MaintenanceMode from "./components/MaintenanceMode";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Leaderboard from "./pages/Leaderboard";
import Messages from "./pages/Messages";
import TransactionHistory from "./pages/TransactionHistory";
import Admin from "./pages/Admin";
import MarketAnalysis from "./pages/MarketAnalysis";
import TeamManagement from "./pages/TeamManagement";
import ProtectedRoute from "./components/ProtectedRoute";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <MaintenanceMode>
                 <Routes>
                   <Route path="/" element={<Index />} />
                   <Route path="/auth" element={<Auth />} />
                   <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                   <Route path="/market" element={<ProtectedRoute><MarketAnalysis /></ProtectedRoute>} />
                   <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
                   <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
                   <Route path="/transactions" element={<ProtectedRoute><TransactionHistory /></ProtectedRoute>} />
                   <Route path="/teams" element={<ProtectedRoute><TeamManagement /></ProtectedRoute>} />
                   <Route path="/admin" element={<ProtectedRoute requireRole="admin"><Admin /></ProtectedRoute>} />
                   <Route path="*" element={<NotFound />} />
                 </Routes>
        </MaintenanceMode>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
