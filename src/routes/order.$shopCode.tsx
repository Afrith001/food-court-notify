import { createFileRoute, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { getDb, COL } from "@/lib/firebase";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Loader2, ChefHat, Phone, MapPin } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export const Route = createFileRoute("/order/$shopCode")({
  ssr: false,
  component: CustomerPortal,
});

type Shop = {
  id: string;
  shopCode: string;
  name: string;
  category: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  themeColor: string;
  address: string | null;
  phone: string | null;
};

type ActiveOrder = { id: string; orderNumber: number; status: string };

const STATUS_COPY: Record<string, { label: string; tone: "default" | "secondary" | "destructive" }> = {
  pending: { label: "Pending", tone: "secondary" },
  preparing: { label: "Preparing", tone: "secondary" },
  ready: { label: "Ready for pickup!", tone: "default" },
  completed: { label: "Completed", tone: "default" },
  cancelled: { label: "Cancelled", tone: "destructive" },
};

function CustomerPortal() {
  const { shopCode } = useParams({ from: "/order/$shopCode" });
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [items, setItems] = useState("");
  const [total, setTotal] = useState("");
  const [coupon, setCoupon] = useState("");
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState<ActiveOrder | null>(null);

  // Load shop by code
  useEffect(() => {
    (async () => {
      try {
        const db = getDb();
        const snap = await getDocs(
          query(collection(db, COL.shops), where("shopCode", "==", shopCode), limit(1)),
        );
        if (snap.empty) {
          setShop(null);
        } else {
          const d = snap.docs[0];
          const data = d.data() as Omit<Shop, "id">;
          setShop({ id: d.id, ...data });
        }
      } catch (e) {
        console.error("[portal] load shop", e);
        setShop(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [shopCode]);

  // Real-time status of placed order
  useEffect(() => {
    if (!order?.id) return;
    const unsub = onSnapshot(doc(getDb(), COL.orders, order.id), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as { status: string };
      setOrder((o) => {
        if (!o || o.status === data.status) return o;
        return { ...o, status: data.status };
      });
      if (data.status === "ready") toast.success("Your order is ready for pickup!");
    });
    return () => unsub();
  }, [order?.id]);

  const place = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop) return;
    if (!name.trim() || !mobile.trim() || !items.trim()) {
      toast.error("Name, mobile and items are required.");
      return;
    }
    setBusy(true);
    try {
      const db = getDb();
      const itemsList = items
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean)
        .map((n) => ({ name: n }));
      const totalNum = Number(total) || 0;

      // Atomically increment per-shop order number
      const counterRef = doc(db, COL.shopCounters, shop.id);
      const orderNumber = await runTransaction(db, async (tx) => {
        const c = await tx.get(counterRef);
        const current = (c.exists() ? (c.data().orderNumber as number) : 0) || 0;
        const next = current + 1;
        tx.set(counterRef, { orderNumber: next }, { merge: true });
        return next;
      });

      // Create order
      const orderRef = doc(collection(db, COL.orders));
      await setDoc(orderRef, {
        shopId: shop.id,
        shopCode: shop.shopCode,
        orderNumber,
        status: "pending",
        total: totalNum,
        items: itemsList,
        customerName: name.trim(),
        customerMobile: mobile.trim(),
        couponCode: coupon || null,
        notes: null,
        createdAt: serverTimestamp(),
      });

      // Upsert customer (per shop)
      const customerId = `${shop.id}_${mobile.trim()}`;
      const customerRef = doc(db, COL.customers, customerId);
      await runTransaction(db, async (tx) => {
        const c = await tx.get(customerRef);
        if (c.exists()) {
          const prev = c.data() as { totalOrders: number; totalSpending: number; loyaltyPoints: number };
          tx.update(customerRef, {
            name: name.trim(),
            totalOrders: (prev.totalOrders ?? 0) + 1,
            totalSpending: (prev.totalSpending ?? 0) + totalNum,
            loyaltyPoints: (prev.loyaltyPoints ?? 0) + Math.floor(totalNum / 10),
            lastVisit: serverTimestamp(),
          });
        } else {
          tx.set(customerRef, {
            shopId: shop.id,
            mobile: mobile.trim(),
            name: name.trim(),
            totalOrders: 1,
            totalSpending: totalNum,
            loyaltyPoints: Math.floor(totalNum / 10),
            createdAt: serverTimestamp(),
            lastVisit: serverTimestamp(),
          });
        }
      });

      // Notify shop owner (in-app notification)
      try {
        await setDoc(doc(collection(db, COL.notifications)), {
          userId: null,
          shopId: shop.id,
          title: "New order",
          body: `#${orderNumber} from ${name.trim()} — ₹${totalNum.toFixed(0)}`,
          type: "new_order",
          read: false,
          createdAt: serverTimestamp(),
        });
      } catch (e) {
        console.warn("[portal] notify failed", e);
      }

      setOrder({ id: orderRef.id, orderNumber, status: "pending" });
      toast.success(`Order #${orderNumber} placed!`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (loading)
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  if (!shop)
    return (
      <div className="min-h-screen grid place-items-center p-6 text-center">
        <div>
          <h1 className="font-display text-2xl font-bold">Shop not found</h1>
          <p className="text-muted-foreground mt-2">
            Code <code>{shopCode}</code> doesn't match any active shop.
          </p>
        </div>
      </div>
    );

  const tone = shop.themeColor || "#10b981";

  return (
    <div className="min-h-screen bg-background">
      <div className="h-32 relative" style={{ background: `linear-gradient(135deg, ${tone}, ${tone}cc)` }}>
        <div className="absolute inset-0 bg-black/10" />
      </div>
      <div className="max-w-xl mx-auto px-4 -mt-16 relative">
        <Card className="shadow-elev">
          <CardHeader className="text-center">
            <div
              className="w-16 h-16 rounded-2xl mx-auto bg-card border-4 border-card shadow-soft -mt-12 flex items-center justify-center"
              style={{ backgroundColor: tone + "20" }}
            >
              {shop.logoUrl ? (
                <img src={shop.logoUrl} alt={shop.name} className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <ChefHat className="w-7 h-7" style={{ color: tone }} />
              )}
            </div>
            <CardTitle className="font-display text-2xl mt-2">{shop.name}</CardTitle>
            <CardDescription className="flex flex-wrap gap-3 justify-center text-xs">
              {shop.category && <span>{shop.category}</span>}
              {shop.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  {shop.phone}
                </span>
              )}
              {shop.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {shop.address}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {order ? (
              <div className="space-y-3 text-center py-6">
                <Badge variant={STATUS_COPY[order.status]?.tone ?? "secondary"} className="text-sm">
                  {STATUS_COPY[order.status]?.label ?? order.status}
                </Badge>
                <h2 className="font-display text-3xl font-bold">Order #{order.orderNumber}</h2>
                <p className="text-muted-foreground text-sm">
                  Track this page — status updates live.
                </p>
                <Button variant="outline" onClick={() => setOrder(null)}>
                  Place another order
                </Button>
              </div>
            ) : (
              <form className="space-y-3" onSubmit={place}>
                <div className="space-y-1.5">
                  <Label>Your name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-1.5">
                  <Label>Mobile number</Label>
                  <Input value={mobile} onChange={(e) => setMobile(e.target.value)} required type="tel" />
                </div>
                <div className="space-y-1.5">
                  <Label>Items (one per line)</Label>
                  <Textarea
                    rows={4}
                    value={items}
                    onChange={(e) => setItems(e.target.value)}
                    placeholder={"Veg biryani\nCold coffee"}
                    required
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Total</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={total}
                      onChange={(e) => setTotal(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Coupon (optional)</Label>
                    <Input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} />
                  </div>
                </div>
                <Button type="submit" className="w-full" style={{ backgroundColor: tone }} disabled={busy}>
                  {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Place order
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
        <div className="text-center text-xs text-muted-foreground py-6">
          Powered by FoodCourtNotify · {shop.shopCode}
        </div>
      </div>
      <Toaster richColors position="top-center" />
    </div>
  );
}
