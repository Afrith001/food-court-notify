import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { getDb, COL } from "@/lib/firebase";
import { useShop } from "@/hooks/useShop";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Coupon = {
  id: string;
  code: string;
  description: string | null;
  percentDiscount: number | null;
  fixedDiscount: number | null;
  expiry: string | null;
  usageLimit: number | null;
  usageCount: number;
  active: boolean;
};

export const Route = createFileRoute("/_authenticated/coupons")({
  head: () => ({
    meta: [
      { title: `${i18n.t("common.coupons")} · ${i18n.t("common.appName")}` },
    ],
  }),
  component: CouponsPage,
});

function CouponsPage() {
  const { shop } = useShop();
  const [rows, setRows] = useState<Coupon[]>([]);
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${t("common.coupons")} · ${t("common.appName")}`;
  }, [t]);

  useEffect(() => {
    if (!shop) return;
    const db = getDb();
    const q = query(
      collection(db, COL.coupons),
      where("shopId", "==", shop.id),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setRows(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Coupon, "id">) })));
    });
    return () => unsub();
  }, [shop]);

  const toggle = async (c: Coupon) => {
    await updateDoc(doc(getDb(), COL.coupons, c.id), { active: !c.active });
  };
  const del = async (c: Coupon) => {
    if (!confirm(`Delete coupon ${c.code}?`)) return;
    await deleteDoc(doc(getDb(), COL.coupons, c.id));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="font-display text-3xl font-bold">{t("common.coupons")}</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              New coupon
            </Button>
          </DialogTrigger>
          <CouponForm onClose={() => setOpen(false)} />
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.length === 0 && <div className="text-muted-foreground col-span-full">No coupons yet.</div>}
        {rows.map((c) => (
          <Card key={c.id} className="shadow-soft">
            <CardContent className="pt-6 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="font-mono font-bold text-lg">{c.code}</div>
                  {c.description && <div className="text-xs text-muted-foreground">{c.description}</div>}
                </div>
                <Switch checked={c.active} onCheckedChange={() => toggle(c)} />
              </div>
              <div className="flex gap-2 flex-wrap text-sm">
                {c.percentDiscount != null && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary rounded">{c.percentDiscount}% off</span>
                )}
                {c.fixedDiscount != null && (
                  <span className="px-2 py-0.5 bg-accent/20 text-accent-foreground rounded">
                    ₹{c.fixedDiscount} off
                  </span>
                )}
                {c.expiry && (
                  <span className="px-2 py-0.5 bg-muted rounded">
                    Exp {new Date(c.expiry).toLocaleDateString()}
                  </span>
                )}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>
                  Used {c.usageCount ?? 0}
                  {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                </span>
                <Button variant="ghost" size="sm" onClick={() => del(c)}>
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CouponForm({ onClose }: { onClose: () => void }) {
  const { shop } = useShop();
  const [f, setF] = useState({
    code: "",
    description: "",
    percent: "",
    fixed: "",
    expiry: "",
    limit: "",
  });
  const save = async () => {
    if (!shop) return;
    if (!f.code.trim()) {
      toast.error("Code is required.");
      return;
    }
    try {
      await addDoc(collection(getDb(), COL.coupons), {
        shopId: shop.id,
        code: f.code.toUpperCase().trim(),
        description: f.description || null,
        percentDiscount: f.percent ? Number(f.percent) : null,
        fixedDiscount: f.fixed ? Number(f.fixed) : null,
        expiry: f.expiry || null,
        usageLimit: f.limit ? Number(f.limit) : null,
        usageCount: 0,
        active: true,
        createdAt: serverTimestamp(),
      });
      toast.success("Coupon created");
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>New coupon</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Code</Label>
          <Input value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} placeholder="WELCOME10" />
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>% off</Label>
            <Input type="number" value={f.percent} onChange={(e) => setF({ ...f, percent: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Flat off</Label>
            <Input type="number" value={f.fixed} onChange={(e) => setF({ ...f, fixed: e.target.value })} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Expiry</Label>
            <Input
              type="datetime-local"
              value={f.expiry}
              onChange={(e) => setF({ ...f, expiry: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Usage limit</Label>
            <Input type="number" value={f.limit} onChange={(e) => setF({ ...f, limit: e.target.value })} />
          </div>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={save}>Create</Button>
      </DialogFooter>
    </DialogContent>
  );
}
