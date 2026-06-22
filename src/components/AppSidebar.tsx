import { Link, useLocation } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard, ListOrdered, Users, Ticket, Megaphone,
  BarChart3, CreditCard, Bell, Settings as SettingsIcon, ChefHat,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useShop } from "@/hooks/useShop";

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
  const { shop } = useShop();

  return (
    <aside
      className={cn(
        "hidden lg:flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar",
        className
      )}
    >
      <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
        <div className="w-10 h-10 rounded-xl gradient-hero flex items-center justify-center shadow-elev transition-transform duration-300 hover:scale-105">
          <ChefHat className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="font-display font-bold text-sidebar-foreground leading-tight">
          <div className="text-base tracking-tight text-foreground">FoodCourt</div>
          <div className="text-xs text-primary font-sans font-semibold tracking-wider uppercase">Notify</div>
        </div>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {items.map((it) => {
          const active = loc.pathname.startsWith(it.to);
          const Icon = it.icon;
          return (
            <Link
              key={it.to}
              to={it.to}
              onClick={() => onNavigate?.()}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                active
                  ? "bg-secondary text-primary shadow-sm font-semibold"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground",
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{t("common." + it.key)}</span>
            </Link>
          );
        })}
      </nav>

      {shop && (
        <div className="p-4 border-t border-sidebar-border bg-muted/20">
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-muted/40 transition-colors">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-primary/10 flex items-center justify-center border border-border shrink-0">
              {shop.logoUrl ? (
                <img src={shop.logoUrl} alt={shop.name} className="w-full h-full object-cover" />
              ) : (
                <span className="font-bold text-primary font-display text-sm">
                  {shop.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground text-sm truncate">{shop.name}</div>
              <div className="text-xs text-muted-foreground font-medium capitalize">
                {t(`dashboard.role${shop.role.charAt(0).toUpperCase() + shop.role.slice(1)}`)}
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
