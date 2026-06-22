import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
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

  useEffect(() => {
    // Do not redirect until:
    // 1. Firebase auth state restored (authLoading is false)
    // 2. staff lookup completed (useShop loading is false)
    // 3. shop lookup completed (useShop loading is false)
    if (authLoading || loading) return;

    if (!user) {
      console.log("[AuthLayout] Auth state is fully restored and user is null. Redirecting to /auth.");
      navigate({ to: "/auth" });
    }
  }, [user, authLoading, loading, navigate]);

  useEffect(() => {
    if (user && fcmConfigured) {
      requestNotificationPermissionAndSaveToken(user.uid);
      const unsub = listenForegroundMessages((title, body) => toast(title, { description: body }));
      return () => unsub();
    }
  }, [user]);

  if (authLoading || loading) {
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
