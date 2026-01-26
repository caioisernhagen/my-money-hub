import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { FinanceProvider } from "@/contexts/FinanceContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Accounts from "./pages/Accounts";
import Categories from "./pages/Categories";
import Transactions from "./pages/Transactions";
import CreditCards from "./pages/CreditCards";
import Auth from "./pages/Auth";
import Config from "./pages/Config";
import Configuration from "./pages/Configuration";
import Perfil from "./pages/Perfil";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <BrowserRouter basename={import.meta.env.DEV ? "/" : "/my-money-hub"}>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <FinanceProvider>
                    <Dashboard />
                  </FinanceProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/contas"
              element={
                <ProtectedRoute>
                  <FinanceProvider>
                    <Accounts />
                  </FinanceProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/categorias"
              element={
                <ProtectedRoute>
                  <FinanceProvider>
                    <Categories />
                  </FinanceProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/lancamentos"
              element={
                <ProtectedRoute>
                  <FinanceProvider>
                    <Transactions />
                  </FinanceProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cartoes"
              element={
                <ProtectedRoute>
                  <FinanceProvider>
                    <CreditCards />
                  </FinanceProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/perfil"
              element={
                <ProtectedRoute>
                  <FinanceProvider>
                    <Perfil />
                  </FinanceProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/config"
              element={
                <ProtectedRoute>
                  <FinanceProvider>
                    <Config />
                  </FinanceProvider>
                </ProtectedRoute>
              }
            />
            <Route
              path="/configuration"
              element={
                <ProtectedRoute>
                  <FinanceProvider>
                    <Configuration />
                  </FinanceProvider>
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
        <Toaster />
        <Sonner />
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
