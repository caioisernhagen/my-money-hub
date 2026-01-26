import { NavLink } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Wallet, Tag, TrendingUp, LogOut, User, Cog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import InstallButton from "../components/InstallButton";

const navItems = [
  { to: "/contas", icon: Wallet, label: "Contas" },
  { to: "/categorias", icon: Tag, label: "Categorias" },
  { to: "/perfil", icon: User, label: "Perfil" },
  // { to: "/config", icon: Cog, label: "Configurações" },
];

export default function Configuration() {
  const { signOut, user } = useAuth();

  return (
    <MainLayout
      title="Configurações"
      subtitle="Gerencie os configurações do app"
    >
      <div className="stat-card grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-20 lg:pb-0">
        <span>teste</span>
      </div>
    </MainLayout>
  );
}
