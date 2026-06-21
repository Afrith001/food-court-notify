import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  type Timestamp,
} from "firebase/firestore";
import { getDb, COL } from "@/lib/firebase";
import { useShop } from "@/hooks/useShop";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, QrCode, ListOrdered, Users, IndianRupee, TrendingUp } from "lucide-react";
import { generateQrDataUrl, buildPortalUrl } from "@/lib/qr";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · FoodCourtNotify" }] }),
  component: Dashboard,
});

type OrderRow = { status: string; total: number; createdAt: Timestamp | null };

function Dashboard() {
  const { shop } = useShop();
  const [qr, setQr] = useState<string>("");
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    pending: 0,
    preparing: 0,
    ready: 0,
    completed: 0,
    customers: 0,
    revenue: 0,
  });

  useEffect(() => {
    if (!shop) return;
    const url = buildPortalUrl(shop.shopCode);
    generateQrDataUrl(url, shop.themeColor).then(setQr);
  }, [shop]);

  useEffect(() => {
    if (!shop) return;
    const db = getDb();
    const ordersQ = query(collection(db, COL.orders), where("shopId", "==", shop.id));
    const customersQ = query(collection(db, COL.customers), where("shopId", "==", shop.id));

    let orderRows: OrderRow[] = [];
    let customerCount = 0;
    const recompute = () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setStats({
        total: orderRows.length,
        today: orderRows.filter((r) => {
          const t = r.createdAt?.toMillis?.() ?? 0;
          return t >= today.getTime();
        }).length,
        pending: orderRows.filter((r) => r.status === "pending").length,
        preparing: orderRows.filter((r) => r.status === "preparing").length,
        ready: orderRows.filter((r) => r.status === "ready").length,
        completed: orderRows.filter((r) => r.status === "completed").length,
        customers: customerCount,
        revenue: orderRows.reduce((a, r) => a + Number(r.total || 0), 0),
      });
    };

    const u1 = onSnapshot(ordersQ, (snap) => {
      orderRows = snap.docs.map((d) => d.data() as OrderRow);
      recompute();
    });
    const u2 = onSnapshot(customersQ, (snap) => {
      customerCount = snap.size;
      recompute();
    });
    return () => {
      u1();
      u2();
    };
  }, [shop]);

  if (!shop) return null;
  const portalUrl = buildPortalUrl(shop.shopCode);

  const copyUrl = async () => {
    await navigator.clipboard.writeText(portalUrl);
    toast.success("Portal URL copied");
  };
  const downloadQr = () => {
    const a = document.createElement("a");
    a.href = qr;
    a.download = `${shop.shopCode}-qr.png`;
    a.click();
  };

  const cards = [
    { label: "Total orders", value: stats.total, icon: ListOrdered },
    { label: "Today's orders", value: stats.today, icon: TrendingUp },
    { label: "Customers", value: stats.customers, icon: Users },
    { label: "Revenue", value: `₹${stats.revenue.toFixed(0)}`, icon: IndianRupee },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="font-display text-3xl font-bold">Welcome, {shop.name}</h1>
        <p className="text-muted-foreground text-sm mt-1">Your real-time shop overview.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 shadow-soft">
          <CardHeader>
            <CardTitle>Customer portal</CardTitle>
            <CardDescription>Share this link or QR with diners.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted font-mono text-sm break-all">
              {portalUrl}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button onClick={copyUrl} variant="outline" size="sm">
                <Copy className="w-4 h-4 mr-2" />
                Copy URL
              </Button>
              <Button onClick={downloadQr} size="sm" disabled={!qr}>
                <Download className="w-4 h-4 mr-2" />
                Download QR
              </Button>
              <Badge variant="secondary" className="ml-auto self-center">
                Shop code: {shop.shopCode}
              </Badge>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              QR code
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            {qr ? (
              <img src={qr} alt="QR" className="w-44 h-44 rounded-lg border border-border" />
            ) : (
              <div className="w-44 h-44 bg-muted rounded-lg animate-pulse" />
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="shadow-soft gradient-card">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">{c.label}</div>
                <c.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="font-display text-3xl font-bold mt-2">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { k: "pending", label: "Pending", n: stats.pending, color: "bg-warning/20 text-warning-foreground" },
          { k: "preparing", label: "Preparing", n: stats.preparing, color: "bg-chart-3/20 text-chart-3" },
          { k: "ready", label: "Ready", n: stats.ready, color: "bg-success/20 text-success" },
          { k: "completed", label: "Completed", n: stats.completed, color: "bg-muted text-muted-foreground" },
        ].map((s) => (
          <Card key={s.k} className="shadow-soft">
            <CardContent className="pt-6">
              <div className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium ${s.color}`}>
                {s.label}
              </div>
              <div className="font-display text-3xl font-bold mt-2">{s.n}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
