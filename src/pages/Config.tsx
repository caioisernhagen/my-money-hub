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
  { to: "/configuration", icon: Cog, label: "Configurações" },
];

export default function Config() {
  const { signOut, user } = useAuth();

  return (
    <MainLayout
      title="Cadastros e Configurações"
      subtitle="Gerencie os cadastros e configurações da sua conta"
    >
      <div className="stat-card grid grid-cols-1 gap-3 pb-20 lg:pb-0">
        <nav className="flex-1 space-y-1 px-3 py-4">
          {/* <div className="display: flex; flex-direction: column; gap: 0.5rem; w-full"> */}
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="nav-link !text-black/80 hover:!bg-white hover:!text-sidebar-primary"
            >
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
          {/* </div> */}
        </nav>

        {/* Footer */}
        <div className="px-4 py-4 border-t border-sidebar-border space-y-3">
          <div className="text-xs text-center !text-black">{user?.email}</div>
          <InstallButton />
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => signOut()}
          >
            <LogOut className="h-4 w-4  hover:!bg-blue-200" />
            Sair
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
