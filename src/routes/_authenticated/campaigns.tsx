import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type Timestamp,
} from "firebase/firestore";
import { getDb, COL } from "@/lib/firebase";
import { useShop } from "@/hooks/useShop";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Send } from "lucide-react";
import { toast } from "sonner";

type Campaign = {
  id: string;
  type: string;
  title: string;
  message: string;
  status: string;
  sentCount: number;
  createdAt: Timestamp | null;
};

export const Route = createFileRoute("/_authenticated/campaigns")({
  head: () => ({ meta: [{ title: "Campaigns · FoodCourtNotify" }] }),
  component: CampaignsPage,
});

function CampaignsPage() {
  const { shop } = useShop();
  const [rows, setRows] = useState<Campaign[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!shop) return;
    const db = getDb();
    const q = query(
      collection(db, COL.campaigns),
      where("shopId", "==", shop.id),
      orderBy("createdAt", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      setRows(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Campaign, "id">) })));
    });
    return () => unsub();
  }, [shop]);

  const send = async (c: Campaign) => {
    if (!shop) return;
    try {
      const db = getDb();
      // Push an in-app notification per customer of this shop.
      const customers = await getDocs(
        query(collection(db, COL.customers), where("shopId", "==", shop.id)),
      );
      const batch = writeBatch(db);
      let count = 0;
      customers.forEach((cust) => {
        const data = cust.data() as { mobile: string };
        const ref = doc(collection(db, COL.notifications));
        batch.set(ref, {
          shopId: shop.id,
          customerMobile: data.mobile,
          title: c.title,
          body: c.message,
          type: "campaign",
          read: false,
          createdAt: serverTimestamp(),
        });
        count++;
      });
      await batch.commit();
      await updateDoc(doc(db, COL.campaigns, c.id), { status: "sent", sentCount: count });
      toast.success(`Campaign sent to ${count} customer(s)`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="font-display text-3xl font-bold">Campaigns</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              New campaign
            </Button>
          </DialogTrigger>
          <CampaignForm onClose={() => setOpen(false)} />
        </Dialog>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {rows.length === 0 && <div className="text-muted-foreground">No campaigns yet.</div>}
        {rows.map((c) => (
          <Card key={c.id} className="shadow-soft">
            <CardContent className="pt-6 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-display font-semibold">{c.title}</h3>
                  <Badge variant="secondary" className="mt-1">
                    {c.type}
                  </Badge>
                </div>
                <Badge variant={c.status === "sent" ? "default" : "outline"}>{c.status}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{c.message}</p>
              <div className="flex justify-between items-center pt-2">
                <span className="text-xs text-muted-foreground">Sent: {c.sentCount ?? 0}</span>
                {c.status !== "sent" && (
                  <Button size="sm" onClick={() => send(c)}>
                    <Send className="w-3 h-3 mr-1" />
                    Send
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function CampaignForm({ onClose }: { onClose: () => void }) {
  const { shop } = useShop();
  const [f, setF] = useState({ type: "general", title: "", message: "" });
  const save = async () => {
    if (!shop) return;
    if (!f.title.trim() || !f.message.trim()) {
      toast.error("Title and message are required.");
      return;
    }
    try {
      await addDoc(collection(getDb(), COL.campaigns), {
        shopId: shop.id,
        type: f.type,
        title: f.title,
        message: f.message,
        status: "draft",
        sentCount: 0,
        createdAt: serverTimestamp(),
      });
      toast.success("Campaign created");
      onClose();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>New campaign</DialogTitle>
      </DialogHeader>
      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={f.type} onValueChange={(v) => setF({ ...f, type: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="festival">Festival</SelectItem>
              <SelectItem value="birthday">Birthday</SelectItem>
              <SelectItem value="loyalty">Loyalty</SelectItem>
              <SelectItem value="discount">Discount</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Title</Label>
          <Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Message</Label>
          <Textarea rows={4} value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />
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
