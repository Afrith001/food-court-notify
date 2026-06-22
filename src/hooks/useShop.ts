import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, limit, query, setDoc, serverTimestamp, where } from "firebase/firestore";
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
        console.log("[useShop Debug] user.uid:", user.uid);
        const db = getDb();
        let staffSnap = await getDocs(
          query(
            collection(db, COL.staff),
            where("userId", "==", user.uid),
            where("active", "==", true),
            limit(1),
          ),
        );
        if (cancelled) return;

        console.log("[useShop Debug] staff query result (empty?):", staffSnap.empty);

        if (staffSnap.empty) {
          console.log("[useShop Debug] No staff document exists for user, checking if they own a shop (legacy account check).");
          // Try to recover legacy owner account by checking if there's a shop with ownerId === user.uid
          const shopsSnap = await getDocs(
            query(
              collection(db, COL.shops),
              where("ownerId", "==", user.uid),
              limit(1),
            ),
          );
          if (cancelled) return;

          console.log("[useShop Debug] shop owner query result (empty?):", shopsSnap.empty);

          if (!shopsSnap.empty) {
            const shopDoc = shopsSnap.docs[0];
            const shopId = shopDoc.id;
            console.log("[useShop Debug] Found legacy shop where ownerId matches user.uid. shopId:", shopId);

            // Fetch user info for fullName & email
            const userDoc = await getDoc(doc(db, COL.users, user.uid));
            if (cancelled) return;
            const userData = userDoc.exists() ? userDoc.data() : null;
            const fullName = userData?.fullName || user.displayName || "Owner";
            const email = userData?.email || user.email || "";

            // Automatically create missing owner staff record
            const staffRef = doc(collection(db, COL.staff));
            await setDoc(staffRef, {
              shopId,
              userId: user.uid,
              role: "owner",
              fullName,
              email,
              active: true,
              createdAt: serverTimestamp(),
            });
            console.log("[useShop Debug] Automatically created missing owner staff record for shopId:", shopId);

            // Re-query staff record
            staffSnap = await getDocs(
              query(
                collection(db, COL.staff),
                where("userId", "==", user.uid),
                where("active", "==", true),
                limit(1),
              ),
            );
            if (cancelled) return;
            console.log("[useShop Debug] Re-queried staff empty after repair:", staffSnap.empty);
          }
        }

        if (staffSnap.empty) {
          setShop(null);
          setLoading(false);
          return;
        }

        const staffDoc = staffSnap.docs[0];
        const staff = staffDoc.data() as { shopId: string; role: ShopContext["role"]; active: boolean };
        console.log("[useShop Debug] staff doc found. role:", staff.role, "active:", staff.active, "shopId:", staff.shopId);

        if (staff.active !== true) {
          console.warn("[useShop Debug] Staff record is inactive.");
          setShop(null);
          setLoading(false);
          return;
        }

        const shopDoc = await getDoc(doc(db, COL.shops, staff.shopId));
        if (cancelled) return;

        console.log("[useShop Debug] shop document existence:", shopDoc.exists());

        if (!shopDoc.exists()) {
          console.error("[useShop Debug] shopId points to non-existent shop document:", staff.shopId);
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
          console.log("[useShop Debug] Shop successfully loaded:", s.name);
        }
      } catch (e) {
        console.error("[useShop Debug] Error in useShop hooks execution:", e);
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
