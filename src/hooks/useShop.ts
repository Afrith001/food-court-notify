import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, limit, query, where } from "firebase/firestore";
import { getDb, COL } from "@/lib/firebase";
import { useAuth } from "./useAuth";

export interface ShopContext {
  id: string;
  shopCode: string;
  name: string;
  category: string | null;
  themeColor: string;
  logoUrl: string | null;
  role: "owner" | "manager" | "cashier" | "staff";
}

export function useShop() {
  const { user, loading: authLoading } = useAuth();
  const [shop, setShop] = useState<ShopContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setShop(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const db = getDb();
        const staffSnap = await getDocs(
          query(
            collection(db, COL.staff),
            where("userId", "==", user.uid),
            where("active", "==", true),
            limit(1),
          ),
        );
        if (cancelled) return;
        if (staffSnap.empty) {
          setShop(null);
          setLoading(false);
          return;
        }
        const staff = staffSnap.docs[0].data() as { shopId: string; role: ShopContext["role"] };
        const shopDoc = await getDoc(doc(db, COL.shops, staff.shopId));
        if (cancelled) return;
        if (!shopDoc.exists()) {
          setShop(null);
        } else {
          const s = shopDoc.data() as Omit<ShopContext, "id" | "role">;
          setShop({
            id: shopDoc.id,
            shopCode: s.shopCode,
            name: s.name,
            category: s.category ?? null,
            themeColor: s.themeColor ?? "#10b981",
            logoUrl: s.logoUrl ?? null,
            role: staff.role,
          });
        }
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return { shop, loading: loading || authLoading, error };
}
