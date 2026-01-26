import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Wallet,
  Tag,
  Receipt,
  CreditCard,
  User,
  Cog,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  // { to: "/contas", icon: Wallet, label: "Contas" },
  { to: "/lancamentos", icon: Receipt, label: "Lançamentos" },
  // { to: "/categorias", icon: Tag, label: "Categorias" },
  { to: "/cartoes", icon: CreditCard, label: "Cartões" },
  // { to: "/perfil", icon: CreditCard, label: "Perfil" },
  { to: "/config", icon: Cog, label: "Configurações" },
];

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
      <div className="flex items-center justify-around py-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            <item.icon className="h-5 w-5" />
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
