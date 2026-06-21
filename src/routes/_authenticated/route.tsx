import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { getFirebaseAuth } from "@/lib/firebase";
import { AppSidebar } from "@/components/AppSidebar";
import { TopBar } from "@/components/TopBar";
import { Toaster } from "@/components/ui/sonner";
import { useShop } from "@/hooks/useShop";
import { useAuth } from "@/hooks/useAuth";
import {
  requestNotificationPermissionAndSaveToken,
  listenForegroundMessages,
  fcmConfigured,
} from "@/lib/fcm";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AuthLayout,
});

function AuthLayout() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { shop, loading } = useShop();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      setChecked(true);
      if (!u) navigate({ to: "/auth" });
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    if (user && fcmConfigured) {
      requestNotificationPermissionAndSaveToken(user.uid);
      const unsub = listenForegroundMessages((title, body) => toast(title, { description: body }));
      return () => unsub();
    }
  }, [user]);

  if (!checked || authLoading || loading) {
    return <div className="min-h-screen grid place-items-center text-muted-foreground">Loading…</div>;
  }

  if (!user) return null;

  if (!shop) {
    return (
      <div className="min-h-screen grid place-items-center p-6">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-2xl font-semibold">No shop linked to this account</h1>
          <p className="text-muted-foreground text-sm">
            Your account isn't associated with any shop yet. Create a new shop from the signup page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}
