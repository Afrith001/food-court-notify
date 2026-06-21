import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { updatePassword } from "firebase/auth";
import { getDb, getFirebaseAuth, COL } from "@/lib/firebase";
import { useShop } from "@/hooks/useShop";
import { useAuth } from "@/hooks/useAuth";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings · FoodCourtNotify" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="font-display text-3xl font-bold">Settings</h1>
      <Tabs defaultValue="profile">
        <TabsList className="flex flex-wrap h-auto w-full justify-start mb-4">
          <TabsTrigger value="profile">Shop profile</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <ShopProfile />
        </TabsContent>
        <TabsContent value="branding">
          <Branding />
        </TabsContent>
        <TabsContent value="notifications">
          <NotifPrefs />
        </TabsContent>
        <TabsContent value="staff">
          <StaffMgmt />
        </TabsContent>
        <TabsContent value="security">
          <Security />
        </TabsContent>
        <TabsContent value="data">
          <DataExport />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ShopProfile() {
  const { shop } = useShop();
  const [f, setF] = useState({ name: "", address: "", phone: "", email: "" });
  useEffect(() => {
    if (!shop) return;
    (async () => {
      const snap = await getDoc(doc(getDb(), COL.shops, shop.id));
      const d = snap.data() as { name?: string; address?: string; phone?: string; email?: string } | undefined;
      if (d) setF({ name: d.name ?? "", address: d.address ?? "", phone: d.phone ?? "", email: d.email ?? "" });
    })();
  }, [shop]);
  const save = async () => {
    if (!shop) return;
    try {
      await updateDoc(doc(getDb(), COL.shops, shop.id), f);
      toast.success("Saved");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  return (
    <Card className="shadow-soft mt-4">
      <CardHeader>
        <CardTitle>Shop profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label>Address</Label>
          <Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Phone</Label>
            <Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          </div>
        </div>
        <Button onClick={save}>Save</Button>
      </CardContent>
    </Card>
  );
}

function Branding() {
  const { shop } = useShop();
  const [color, setColor] = useState("#10b981");
  const [logo, setLogo] = useState("");
  useEffect(() => {
    if (!shop) return;
    (async () => {
      const snap = await getDoc(doc(getDb(), COL.shops, shop.id));
      const d = snap.data() as { themeColor?: string; logoUrl?: string } | undefined;
      if (d) {
        setColor(d.themeColor ?? "#10b981");
        setLogo(d.logoUrl ?? "");
      }
    })();
  }, [shop]);
  const save = async () => {
    if (!shop) return;
    await updateDoc(doc(getDb(), COL.shops, shop.id), { themeColor: color, logoUrl: logo || null });
    toast.success("Branding saved");
  };
  return (
    <Card className="shadow-soft mt-4">
      <CardHeader>
        <CardTitle>Branding</CardTitle>
        <CardDescription>Customize your customer portal.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label>Theme color</Label>
          <Input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="h-12 w-24" />
        </div>
        <div className="space-y-1.5">
          <Label>Logo URL</Label>
          <Input value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://…" />
        </div>
        <Button onClick={save}>Save</Button>
      </CardContent>
    </Card>
  );
}

function NotifPrefs() {
  const { user } = useAuth();
  const [push, setPush] = useState(true);
  useEffect(() => {
    if (!user) return;
    getDoc(doc(getDb(), COL.users, user.uid)).then((snap) => {
      const d = snap.data() as { notificationPrefs?: { push?: boolean } } | undefined;
      setPush(d?.notificationPrefs?.push ?? true);
    });
  }, [user]);
  const save = async () => {
    if (!user) return;
    await updateDoc(doc(getDb(), COL.users, user.uid), { notificationPrefs: { push } });
    toast.success("Saved");
  };
  return (
    <Card className="shadow-soft mt-4">
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Browser push</Label>
          <Switch checked={push} onCheckedChange={setPush} />
        </div>
        <Button onClick={save}>Save</Button>
      </CardContent>
    </Card>
  );
}

function StaffMgmt() {
  const { shop } = useShop();
  const [rows, setRows] = useState<Array<{ id: string; fullName: string | null; email: string | null; role: string }>>([]);
  useEffect(() => {
    if (!shop) return;
    (async () => {
      const snap = await getDocs(
        query(collection(getDb(), COL.staff), where("shopId", "==", shop.id)),
      );
      setRows(snap.docs.map((d) => ({ id: d.id, ...(d.data() as { fullName: string | null; email: string | null; role: string }) })));
    })();
  }, [shop]);
  return (
    <Card className="shadow-soft mt-4">
      <CardHeader>
        <CardTitle>Staff</CardTitle>
        <CardDescription>Manage shop team members. Invite flow coming soon.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {rows.map((r) => (
          <div
            key={r.id}
            className="flex justify-between items-center border-b border-border last:border-0 py-2"
          >
            <div>
              <div className="font-medium">{r.fullName ?? r.email}</div>
              <div className="text-xs text-muted-foreground">{r.email}</div>
            </div>
            <span className="text-xs px-2 py-0.5 rounded bg-secondary capitalize">{r.role}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function Security() {
  const [pass, setPass] = useState("");
  const change = async () => {
    const auth = getFirebaseAuth();
    if (!auth.currentUser) {
      toast.error("Not signed in.");
      return;
    }
    if (pass.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    try {
      await updatePassword(auth.currentUser, pass);
      toast.success("Password updated");
      setPass("");
    } catch (e) {
      toast.error((e as Error).message);
    }
  };
  return (
    <Card className="shadow-soft mt-4">
      <CardHeader>
        <CardTitle>Security</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label>New password</Label>
          <Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} />
        </div>
        <Button onClick={change}>Update password</Button>
      </CardContent>
    </Card>
  );
}

function DataExport() {
  const { shop } = useShop();
  const exp = async (table: "orders" | "customers") => {
    if (!shop) return;
    const snap = await getDocs(query(collection(getDb(), COL[table]), where("shopId", "==", shop.id)));
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (!rows.length) {
      toast.info("No rows to export");
      return;
    }
    const cols = Object.keys(rows[0] as object);
    const csv = [cols.join(",")]
      .concat(
        rows.map((r) =>
          cols.map((c) => JSON.stringify((r as Record<string, unknown>)[c] ?? "")).join(","),
        ),
      )
      .join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `${table}.csv`;
    a.click();
  };
  return (
    <Card className="shadow-soft mt-4">
      <CardHeader>
        <CardTitle>Data export</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" onClick={() => exp("orders")} className="w-full sm:w-auto">
          Export orders CSV
        </Button>
        <Button variant="outline" onClick={() => exp("customers")} className="w-full sm:w-auto">
          Export customers CSV
        </Button>
      </CardContent>
    </Card>
  );
}
