import { Link, useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard, ListOrdered, Users, Ticket, Megaphone,
  BarChart3, CreditCard, Bell, Settings as SettingsIcon, ChefHat,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/dashboard", icon: LayoutDashboard, key: "dashboard" as const },
  { to: "/orders", icon: ListOrdered, key: "orders" as const },
  { to: "/customers", icon: Users, key: "customers" as const },
  { to: "/coupons", icon: Ticket, key: "coupons" as const },
  { to: "/campaigns", icon: Megaphone, key: "campaigns" as const },
  { to: "/analytics", icon: BarChart3, key: "analytics" as const },
  { to: "/subscription", icon: CreditCard, key: "subscription" as const },
  { to: "/notifications", icon: Bell, key: "notifications" as const },
  { to: "/settings", icon: SettingsIcon, key: "settings" as const },
];

export function AppSidebar({
  className,
  onNavigate,
}: {
  className?: string;
  onNavigate?: () => void;
}) {
  const { t } = useTranslation();
  const loc = useLocation();
  return (
    <aside
      className={cn(
        "hidden lg:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar",
        className
      )}
    >
      <div className="flex items-center gap-2 px-6 py-5 border-b border-sidebar-border">
        <div className="w-9 h-9 rounded-lg gradient-hero flex items-center justify-center shadow-elev">
          <ChefHat className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="font-display font-bold text-sidebar-foreground leading-tight">
          <div>FoodCourt</div>
          <div className="text-xs text-muted-foreground font-sans font-normal">Notify</div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((it) => {
          const active = loc.pathname.startsWith(it.to);
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              onClick={() => onNavigate?.()}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/60",
              )}
            >
              <Icon className="w-4 h-4" />
              {t(`common.${it.key}`)}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-sidebar-border text-xs text-muted-foreground">
        v1.0 · Lovable Cloud
      </div>
    </aside>
  );
}
