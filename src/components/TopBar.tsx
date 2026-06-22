import { Moon, Sun, LogOut, Languages, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { useShop } from "@/hooks/useShop";
import { signOut } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AppSidebar } from "@/components/AppSidebar";

export function TopBar() {
  const { theme, toggle } = useTheme();
  const { shop } = useShop();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut(getFirebaseAuth());
    navigate({ to: "/auth" });
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    if (typeof window !== "undefined") {
      localStorage.setItem("i18nextLng", lang);
    }
  };

  return (
    <header className="h-16 border-b border-border bg-card/60 backdrop-blur-md flex items-center justify-between px-4 lg:px-8 sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden">
              <Menu className="w-5 h-5 text-foreground" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 flex flex-col">
            <AppSidebar
              className="flex w-full border-r-0"
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </SheetContent>
        </Sheet>
        {shop && (
          <div className="flex items-center gap-3">
            <span className="font-display font-semibold text-foreground text-sm lg:text-base">{shop.name}</span>
            <span className="px-2 py-0.5 rounded-md bg-secondary text-primary font-mono text-[10px] lg:text-xs font-semibold tracking-wider">
              {shop.shopCode}
            </span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-xl hover:bg-muted">
              <Languages className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="rounded-xl min-w-[120px] shadow-soft">
            <DropdownMenuItem 
              onClick={() => handleLanguageChange("en")}
              className="cursor-pointer font-medium text-sm rounded-lg"
            >
              English
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleLanguageChange("ta")}
              className="cursor-pointer font-medium text-sm rounded-lg"
            >
              தமிழ்
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme" className="rounded-xl hover:bg-muted">
          {theme === "dark" ? <Sun className="w-4 h-4 text-muted-foreground" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
        </Button>
        <Button variant="ghost" size="icon" onClick={handleSignOut} aria-label="Sign out" className="rounded-xl hover:bg-muted text-destructive hover:text-destructive hover:bg-destructive/10">
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}
