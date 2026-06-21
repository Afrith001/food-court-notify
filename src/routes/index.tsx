import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ChefHat, QrCode, Bell, BarChart3, Users, Ticket, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FoodCourtNotify — Order alerts & customer engagement for food courts" },
      { name: "description", content: "Multi-shop SaaS with QR ordering, real-time order Kanban, CRM, coupons, campaigns and browser push notifications." },
      { property: "og:title", content: "FoodCourtNotify" },
      { property: "og:description", content: "QR ordering, real-time notifications and CRM for food courts." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-hero flex items-center justify-center">
              <ChefHat className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold">FoodCourtNotify</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/auth"><Button variant="ghost" size="sm">Sign in</Button></Link>
            <Link to="/auth" search={{ mode: "signup" }}><Button size="sm">Get started</Button></Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-20 lg:py-32 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-xs font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Built for multi-shop food courts
          </div>
          <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl mx-auto leading-[1.05]">
            The order notification platform your food court was missing.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
            Every shop gets its own QR code, customer portal, real-time order board, CRM, coupons, campaigns and browser push notifications. Set up in 60 seconds.
          </p>
          <div className="mt-10 flex gap-3 justify-center">
            <Link to="/auth" search={{ mode: "signup" }}>
              <Button size="lg" className="shadow-elev">Open your shop free</Button>
            </Link>
            <Link to="/auth"><Button size="lg" variant="outline">Sign in</Button></Link>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">Free forever for up to 100 orders/month. No card required.</div>
        </div>
        <div className="absolute inset-0 -z-10 opacity-30 pointer-events-none gradient-hero blur-3xl rounded-full top-40 mx-auto max-w-2xl h-64" />
      </section>

      <section className="max-w-7xl mx-auto px-4 lg:px-8 py-20 grid md:grid-cols-3 gap-6">
        {[
          { i: QrCode, t: "Unique QR per shop", d: "Auto-generated SHOP code & QR. Customers scan, order, and track." },
          { i: Bell, t: "Browser push", d: "Customers get pinged the moment their order is ready — no SMS bills." },
          { i: BarChart3, t: "Real-time dashboard", d: "Orders Kanban, revenue, peak hours, returning customers." },
          { i: Users, t: "Customer CRM", d: "Visit history, favorites, loyalty points — per shop, isolated." },
          { i: Ticket, t: "Coupons & campaigns", d: "Festival promos, birthday rewards, loyalty offers." },
          { i: CheckCircle2, t: "Multi-tenant secure", d: "Row-level security ensures shops never see each other's data." },
        ].map((f) => (
          <div key={f.t} className="gradient-card border border-border rounded-2xl p-6 shadow-soft">
            <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mb-4">
              <f.i className="w-5 h-5" />
            </div>
            <h3 className="font-display font-semibold text-lg">{f.t}</h3>
            <p className="text-sm text-muted-foreground mt-1">{f.d}</p>
          </div>
        ))}
      </section>

      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8 text-sm text-muted-foreground flex justify-between">
          <div>© FoodCourtNotify</div>
          <div>Built on Lovable Cloud</div>
        </div>
      </footer>
    </div>
  );
}
