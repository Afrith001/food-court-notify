import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  type Timestamp,
} from "firebase/firestore";
import { getDb, COL } from "@/lib/firebase";
import { useShop } from "@/hooks/useShop";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type Order = {
  id: string;
  orderNumber: number;
  status: string;
  total: number;
  customerName: string | null;
  customerMobile: string;
  items: Array<{ name: string }>;
  createdAt: Timestamp | null;
};

const COLUMNS: Array<{ key: string; label: string; next?: string }> = [
  { key: "pending", label: "Pending", next: "preparing" },
  { key: "preparing", label: "Preparing", next: "ready" },
  { key: "ready", label: "Ready", next: "completed" },
  { key: "completed", label: "Completed" },
];

export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({ meta: [{ title: "Orders · FoodCourtNotify" }] }),
  component: OrdersPage,
});

function OrdersPage() {
  const { shop } = useShop();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!shop) return;
    const db = getDb();
    const q = query(
      collection(db, COL.orders),
      where("shopId", "==", shop.id),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setOrders(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Order, "id">) })));
        setLoading(false);
      },
      (err) => {
        console.error("[orders] snapshot", err);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [shop]);

  const advance = async (id: string, next: string) => {
    try {
      await updateDoc(doc(getDb(), COL.orders, id), { status: next });
      toast.success(`Moved to ${next}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  if (!shop) return null;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Orders</h1>
      <p className="text-muted-foreground text-sm">Real-time order Kanban — advance through the stages.</p>
      {loading ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {COLUMNS.map((col) => {
            const colOrders = orders.filter((o) => o.status === col.key);
            return (
              <div key={col.key} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="font-medium text-sm">{col.label}</h3>
                  <Badge variant="secondary">{colOrders.length}</Badge>
                </div>
                <div className="space-y-2 min-h-[100px]">
                  {colOrders.map((o) => (
                    <Card key={o.id} className="shadow-soft">
                      <CardContent className="pt-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-display font-bold">#{o.orderNumber}</span>
                          <span className="text-xs text-muted-foreground">
                            {o.createdAt
                              ? new Date(o.createdAt.toMillis()).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })
                              : ""}
                          </span>
                        </div>
                        <div className="text-sm font-medium">{o.customerName ?? "Customer"}</div>
                        <div className="text-xs text-muted-foreground">{o.customerMobile}</div>
                        <div className="text-xs text-muted-foreground">
                          {(o.items ?? []).map((i) => i.name).join(", ")}
                        </div>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-sm font-semibold">₹{Number(o.total).toFixed(0)}</span>
                          {col.next && (
                            <Button size="sm" variant="outline" onClick={() => advance(o.id, col.next!)}>
                              Mark {col.next}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
