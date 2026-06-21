import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  type Timestamp,
} from "firebase/firestore";
import { getDb, COL } from "@/lib/firebase";
import { useShop } from "@/hooks/useShop";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics · FoodCourtNotify" }] }),
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const { shop } = useShop();
  const [hourly, setHourly] = useState<Array<{ hour: string; orders: number }>>([]);
  const [daily, setDaily] = useState<Array<{ day: string; revenue: number }>>([]);

  useEffect(() => {
    if (!shop) return;
    (async () => {
      const db = getDb();
      const snap = await getDocs(query(collection(db, COL.orders), where("shopId", "==", shop.id)));
      const since = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const rows = snap.docs
        .map((d) => d.data() as { createdAt: Timestamp | null; total: number })
        .filter((r) => (r.createdAt?.toMillis?.() ?? 0) >= since);
      const h: Record<number, number> = {};
      const d: Record<string, number> = {};
      rows.forEach((r) => {
        const dt = new Date(r.createdAt!.toMillis());
        h[dt.getHours()] = (h[dt.getHours()] ?? 0) + 1;
        const key = dt.toISOString().slice(0, 10);
        d[key] = (d[key] ?? 0) + Number(r.total || 0);
      });
      setHourly(Array.from({ length: 24 }, (_, i) => ({ hour: `${i}h`, orders: h[i] ?? 0 })));
      setDaily(Object.keys(d).sort().map((k) => ({ day: k.slice(5), revenue: d[k] })));
    })();
  }, [shop]);

  return (
    <div className="space-y-4 max-w-6xl">
      <h1 className="font-display text-3xl font-bold">Analytics</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Revenue (last 14 days)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <LineChart data={daily}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="day" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="var(--color-primary)" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Peak hours</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer>
              <BarChart data={hourly}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="hour" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="orders" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
