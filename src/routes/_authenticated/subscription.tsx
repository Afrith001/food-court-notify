import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/lib/i18n";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
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
import { Check } from "lucide-react";
import { toast } from "sonner";

const PLANS = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    limit: "100 orders / month, 1 staff",
    features: ["Basic QR", "Real-time orders"],
  },
  {
    id: "starter",
    name: "Starter",
    price: "₹499",
    limit: "1000 orders / month, 5 staff",
    features: ["Custom branding", "Coupons", "Customer CRM"],
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹1499",
    limit: "Unlimited",
    features: ["Marketing campaigns", "Advanced analytics", "Loyalty rewards", "Priority support"],
  },
] as const;

type Plan = (typeof PLANS)[number]["id"];
type Sub = { plan: Plan; ordersUsedThisMonth: number; expiresAt: string };

export const Route = createFileRoute("/_authenticated/subscription")({
  head: () => ({
    meta: [
      { title: `${i18n.t("common.subscription")} · ${i18n.t("common.appName")}` },
    ],
  }),
  component: SubscriptionPage,
});

function SubscriptionPage() {
  const { shop } = useShop();
  const [sub, setSub] = useState<Sub | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${t("common.subscription")} · ${t("common.appName")}`;
  }, [t]);

  const load = async () => {
    if (!shop) return;
    const snap = await getDoc(doc(getDb(), COL.subscriptions, shop.id));
    if (snap.exists()) setSub(snap.data() as Sub);
  };
  useEffect(() => {
    load();
  }, [shop]); // eslint-disable-line react-hooks/exhaustive-deps

  const upgrade = async (plan: Plan) => {
    if (!shop) return;
    try {
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      await setDoc(
        doc(getDb(), COL.subscriptions, shop.id),
        {
          shopId: shop.id,
          plan,
          renewedAt: serverTimestamp(),
          expiresAt: expires.toISOString(),
        },
        { merge: true },
      );
      toast.success(`Plan changed to ${plan}. Payments coming soon.`);
      load();
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="font-display text-3xl font-bold">{t("common.subscription")}</h1>
      {sub && (
        <Card className="shadow-soft gradient-card">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 sm:gap-0">
              <div>
                <CardTitle className="capitalize">{sub.plan} plan</CardTitle>
                <CardDescription>Renews {new Date(sub.expiresAt).toLocaleDateString()}</CardDescription>
              </div>
              <Badge variant="secondary">{sub.ordersUsedThisMonth ?? 0} orders used this month</Badge>
            </div>
          </CardHeader>
        </Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PLANS.map((p) => (
          <Card key={p.id} className={`shadow-soft ${sub?.plan === p.id ? "ring-2 ring-primary" : ""}`}>
            <CardHeader>
              <CardTitle className="font-display">{p.name}</CardTitle>
              <div className="text-3xl font-display font-bold">
                {p.price}
                <span className="text-sm text-muted-foreground font-normal">/mo</span>
              </div>
              <CardDescription>{p.limit}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {p.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm">
                  <Check className="w-4 h-4 text-success" />
                  {f}
                </div>
              ))}
              <Button className="w-full mt-4" disabled={sub?.plan === p.id} onClick={() => upgrade(p.id)}>
                {sub?.plan === p.id ? "Current plan" : "Choose plan"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Note: Payment processing isn't wired in this build. Plan changes update your record immediately.
      </p>
    </div>
  );
}
