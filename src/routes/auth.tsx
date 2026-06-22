import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  type AuthError,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  where,
} from "firebase/firestore";
import { getFirebaseAuth, getDb, COL, firebaseConfigured } from "@/lib/firebase";
import { pickUniqueShopCode } from "@/lib/shop-code";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChefHat, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign in · FoodCourtNotify" },
      {
        name: "description",
        content: "Sign in to your shop dashboard or create a new shop on FoodCourtNotify.",
      },
    ],
  }),
  component: AuthPage,
});

function describeAuthError(err: unknown): string {
  const code = (err as AuthError)?.code ?? "";
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Incorrect email or password.";
    case "auth/invalid-email":
      return "That email address is invalid.";
    case "auth/email-already-in-use":
      return "An account with this email already exists. Please sign in.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/network-request-failed":
      return "Network error — check your internet connection.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a minute and try again.";
    case "auth/api-key-not-valid":
    case "auth/invalid-api-key":
      return "Firebase API key is missing. Add VITE_FIREBASE_API_KEY to .env.";
    default:
      return (err as Error)?.message || "Something went wrong. Please try again.";
  }
}

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">(mode ?? "signin");

  useEffect(() => {
    if (!firebaseConfigured) return;
    const auth = getFirebaseAuth();
    const unsub = auth.onAuthStateChanged((u) => {
      if (u) navigate({ to: "/dashboard" });
    });
    return () => unsub();
  }, [navigate]);

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 gradient-hero p-12 text-primary-foreground flex-col justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center">
            <ChefHat className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg">FoodCourtNotify</span>
        </div>
        <div>
          <h2 className="font-display text-4xl font-bold leading-tight max-w-md">
            One platform. Every shop. Zero confusion.
          </h2>
          <p className="mt-4 text-primary-foreground/80 max-w-md">
            QR portals, real-time order alerts, customer CRM, coupons and campaigns — isolated per
            shop on Firebase.
          </p>
        </div>
        <div className="text-sm text-primary-foreground/70">© FoodCourtNotify</div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {!firebaseConfigured && (
            <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              Firebase API key is missing. Add <code>VITE_FIREBASE_API_KEY</code> to your{" "}
              <code>.env</code> file and reload.
            </div>
          )}
          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create shop</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <SignInCard />
            </TabsContent>
            <TabsContent value="signup">
              <SignUpCard onDone={() => setTab("signin")} />
            </TabsContent>
          </Tabs>
          <div className="text-center mt-6 text-sm">
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              ← Back home
            </Link>
          </div>
        </div>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  );
}

function SignInCard() {
  const navigate = useNavigate();
  const [shopName, setShopName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      toast.error("Please enter your shop name.");
      return;
    }
    if (!email.trim() || !password) {
      toast.error("Email and password are required.");
      return;
    }
    setBusy(true);
    try {
      const auth = getFirebaseAuth();
      const db = getDb();
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);

      // Verify the user belongs to a shop matching `shopName`
      let staffSnap = await getDocs(
        query(
          collection(db, COL.staff),
          where("userId", "==", cred.user.uid),
          where("active", "==", true),
        ),
      );

      if (staffSnap.empty) {
        // Attempt legacy account recovery by checking if there's a shop with ownerId === cred.user.uid
        const shopsSnap = await getDocs(
          query(
            collection(db, COL.shops),
            where("ownerId", "==", cred.user.uid),
            limit(1),
          ),
        );
        if (!shopsSnap.empty) {
          const shopDoc = shopsSnap.docs[0];
          const shopId = shopDoc.id;

          // Fetch user info for fullName & email
          const userDoc = await getDoc(doc(db, COL.users, cred.user.uid));
          const userData = userDoc.exists() ? userDoc.data() : null;
          const fullName = userData?.fullName || cred.user.displayName || "Owner";
          const emailVal = userData?.email || cred.user.email || "";

          // Create the missing owner staff record
          await setDoc(doc(collection(db, COL.staff)), {
            shopId,
            userId: cred.user.uid,
            role: "owner",
            fullName,
            email: emailVal,
            active: true,
            createdAt: serverTimestamp(),
          });

          // Re-query staff
          staffSnap = await getDocs(
            query(
              collection(db, COL.staff),
              where("userId", "==", cred.user.uid),
              where("active", "==", true),
            ),
          );
        }
      }

      if (staffSnap.empty) {
        await signOut(auth);
        toast.error("This account is not linked to any shop.");
        return;
      }
      const shopIds = staffSnap.docs.map((d) => (d.data() as { shopId: string }).shopId);
      const target = shopName.trim().toLowerCase();
      let matched = false;
      for (const sid of shopIds) {
        const sd = await getDoc(doc(db, COL.shops, sid));
        if (sd.exists() && ((sd.data() as { name: string }).name ?? "").toLowerCase().trim() === target) {
          matched = true;
          break;
        }
      }
      if (!matched) {
        // check if shop exists at all
        const existsSnap = await getDocs(
          query(collection(db, COL.shops), where("name", "==", shopName.trim()), limit(1)),
        );
        await signOut(auth);
        toast.error(existsSnap.empty ? "Shop not found." : "This account does not belong to the selected shop.");
        return;
      }
      toast.success("Welcome back!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(describeAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="font-display">Welcome back</CardTitle>
        <CardDescription>Sign in to your shop dashboard.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-1.5">
            <Label htmlFor="si-shop">Shop name</Label>
            <Input
              id="si-shop"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="e.g. Spice Hut"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="si-email">Email</Label>
            <Input id="si-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="si-pass">Password</Label>
            <Input id="si-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Sign in
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function SignUpCard({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({
    shopName: "",
    ownerName: "",
    email: "",
    password: "",
    mobile: "",
    category: "Food",
  });
  const [busy, setBusy] = useState(false);
  const set =
    (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.shopName.trim() || !form.email.trim() || !form.password) {
      toast.error("Shop name, email and password are required.");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      const auth = getFirebaseAuth();
      const db = getDb();

      const cred = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
      const uid = cred.user.uid;

      // Create user profile
      await setDoc(doc(db, COL.users, uid), {
        uid,
        fullName: form.ownerName || null,
        email: form.email.trim(),
        mobile: form.mobile || null,
        createdAt: serverTimestamp(),
      });

      // Create shop
      const shopCode = await pickUniqueShopCode();
      const shopRef = doc(collection(db, COL.shops));
      await setDoc(shopRef, {
        shopCode,
        name: form.shopName.trim(),
        category: form.category || null,
        themeColor: "#10b981",
        logoUrl: null,
        bannerUrl: null,
        address: null,
        phone: form.mobile || null,
        email: form.email.trim(),
        ownerId: uid,
        createdAt: serverTimestamp(),
      });

      // Owner staff record
      await setDoc(doc(collection(db, COL.staff)), {
        shopId: shopRef.id,
        userId: uid,
        role: "owner",
        fullName: form.ownerName || null,
        email: form.email.trim(),
        active: true,
        createdAt: serverTimestamp(),
      });

      // Default free subscription
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      await setDoc(doc(db, COL.subscriptions, shopRef.id), {
        shopId: shopRef.id,
        plan: "free",
        ordersUsedThisMonth: 0,
        renewedAt: serverTimestamp(),
        expiresAt: expires.toISOString(),
      });

      // Per-shop order counter
      await setDoc(doc(db, COL.shopCounters, shopRef.id), { orderNumber: 0 });

      toast.success(`Shop created! Code: ${shopCode}. Please sign in.`);
      await signOut(auth);
      onDone();
    } catch (err) {
      toast.error(describeAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="font-display">Open your shop</CardTitle>
        <CardDescription>Get your QR portal and dashboard in seconds.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={submit}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Shop name *</Label>
              <Input value={form.shopName} onChange={set("shopName")} required />
            </div>
            <div className="space-y-1.5">
              <Label>Owner name</Label>
              <Input value={form.ownerName} onChange={set("ownerName")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Email *</Label>
            <Input type="email" value={form.email} onChange={set("email")} required />
          </div>
          <div className="space-y-1.5">
            <Label>Password *</Label>
            <Input
              type="password"
              value={form.password}
              onChange={set("password")}
              required
              minLength={6}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Mobile</Label>
              <Input value={form.mobile} onChange={set("mobile")} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input value={form.category} onChange={set("category")} />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Create shop
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
