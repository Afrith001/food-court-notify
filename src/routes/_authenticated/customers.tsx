import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";
import {
  collection,
  onSnapshot,
  query,
  where,
  type Timestamp,
} from "firebase/firestore";
import { getDb, COL } from "@/lib/firebase";
import { useShop } from "@/hooks/useShop";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Search } from "lucide-react";

type Customer = {
  id: string;
  name: string | null;
  mobile: string;
  totalOrders: number;
  totalSpending: number;
  loyaltyPoints: number;
  lastVisit: Timestamp | null;
};

export const Route = createFileRoute("/_authenticated/customers")({
  head: () => ({
    meta: [
      { title: `${i18n.t("common.customers")} · ${i18n.t("common.appName")}` },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const { shop } = useShop();
  const [rows, setRows] = useState<Customer[]>([]);
  const [q, setQ] = useState("");
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${t("common.customers")} · ${t("common.appName")}`;
  }, [t]);

  useEffect(() => {
    if (!shop) return;
    const db = getDb();
    const qy = query(collection(db, COL.customers), where("shopId", "==", shop.id));
    const unsub = onSnapshot(qy, (snap) => {
      setRows(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Customer, "id">) })));
    });
    return () => unsub();
  }, [shop]);

  const filtered = useMemo(() => {
    const s = q.toLowerCase().trim();
    if (!s) return rows;
    return rows.filter(
      (r) => (r.name ?? "").toLowerCase().includes(s) || r.mobile.includes(s),
    );
  }, [rows, q]);

  const exportCsv = () => {
    const header = "Name,Mobile,Orders,Spending,Loyalty,LastVisit\n";
    const body = filtered
      .map((r) =>
        [
          r.name ?? "",
          r.mobile,
          r.totalOrders ?? 0,
          r.totalSpending ?? 0,
          r.loyaltyPoints ?? 0,
          r.lastVisit ? new Date(r.lastVisit.toMillis()).toISOString() : "",
        ].join(","),
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "customers.csv";
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="font-display text-3xl font-bold">{t("common.customers")}</h1>
        <Button variant="outline" onClick={exportCsv} className="w-full sm:w-auto">
          <Download className="w-4 h-4 mr-2" />
          {t("common.export")}
        </Button>
      </div>
      <div className="relative max-w-sm">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name or mobile…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      <Card className="shadow-soft overflow-hidden">
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Mobile</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Spending</TableHead>
                <TableHead className="text-right">Loyalty</TableHead>
                <TableHead>Last visit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-12">
                    No customers yet.
                  </TableCell>
                </TableRow>
              )}
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium whitespace-nowrap">{r.name ?? "—"}</TableCell>
                  <TableCell className="font-mono text-xs">{r.mobile}</TableCell>
                  <TableCell className="text-right">{r.totalOrders ?? 0}</TableCell>
                  <TableCell className="text-right">₹{Number(r.totalSpending ?? 0).toFixed(0)}</TableCell>
                  <TableCell className="text-right">{r.loyaltyPoints ?? 0}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {r.lastVisit ? new Date(r.lastVisit.toMillis()).toLocaleString() : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
