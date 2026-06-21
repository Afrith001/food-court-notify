import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
  writeBatch,
  type Timestamp,
} from "firebase/firestore";
import { getDb, COL } from "@/lib/firebase";
import { useShop } from "@/hooks/useShop";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Trash2, Bell as BellIcon } from "lucide-react";

type Notif = {
  id: string;
  title: string;
  body: string;
  link: string | null;
  read: boolean;
  createdAt: Timestamp | null;
};

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications · FoodCourtNotify" }] }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { shop } = useShop();
  const [rows, setRows] = useState<Notif[]>([]);

  useEffect(() => {
    if (!shop) return;
    const db = getDb();
    const q = query(
      collection(db, COL.notifications),
      where("shopId", "==", shop.id),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setRows(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Notif, "id">) })));
    });
    return () => unsub();
  }, [shop]);

  const markRead = async (id: string) => {
    await updateDoc(doc(getDb(), COL.notifications, id), { read: true });
  };
  const del = async (id: string) => {
    await deleteDoc(doc(getDb(), COL.notifications, id));
  };
  const markAll = async () => {
    const db = getDb();
    const batch = writeBatch(db);
    rows.filter((r) => !r.read).forEach((r) => batch.update(doc(db, COL.notifications, r.id), { read: true }));
    await batch.commit();
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="font-display text-3xl font-bold">Notifications</h1>
        <Button variant="outline" size="sm" onClick={markAll} className="w-full sm:w-auto">
          Mark all as read
        </Button>
      </div>
      {rows.length === 0 && (
        <Card className="shadow-soft">
          <CardContent className="pt-12 pb-12 text-center text-muted-foreground">
            <BellIcon className="w-8 h-8 mx-auto mb-2 opacity-40" />
            No notifications yet.
          </CardContent>
        </Card>
      )}
      <div className="space-y-2">
        {rows.map((n) => (
          <Card key={n.id} className={`shadow-soft ${n.read ? "" : "border-primary/50"}`}>
            <CardContent className="pt-4 pb-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="font-medium">{n.title}</div>
                <div className="text-sm text-muted-foreground">{n.body}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {n.createdAt ? new Date(n.createdAt.toMillis()).toLocaleString() : ""}
                </div>
              </div>
              <div className="flex gap-1">
                {!n.read && (
                  <Button variant="ghost" size="icon" onClick={() => markRead(n.id)}>
                    <Check className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={() => del(n.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
