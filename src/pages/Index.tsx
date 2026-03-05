import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Droplets, Users, Shield, ArrowRight, Activity, Building2 } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <header className="border-b border-border">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Heart className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-heading text-lg font-bold">LifeLink AI</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/signin"><Button variant="ghost">Sign In</Button></Link>
            <Link to="/signup"><Button>Get Started</Button></Link>
          </div>
        </div>
      </header>

      <section className="container py-20 text-center">
        <div className="mx-auto max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm">
            <Activity className="h-4 w-4 text-primary" />
            Intelligent Blood Donation & Emergency Coordination
          </div>
          <h1 className="font-heading text-4xl font-extrabold tracking-tight md:text-6xl">
            Every Drop <span className="text-gradient-primary">Saves a Life</span>
          </h1>
          <p className="text-lg text-muted-foreground">
            LifeLink AI connects blood donors, patients, hospitals, and blood banks through intelligent matching and real-time emergency coordination.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/signup"><Button size="lg">Start Saving Lives <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
            <Link to="/signin"><Button size="lg" variant="outline">Sign In</Button></Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-border bg-muted/50 py-20">
        <div className="container">
          <h2 className="mb-12 text-center font-heading text-3xl font-bold">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {[
              { icon: Droplets, title: "Smart Donor Matching", desc: "AI-powered matching based on blood type, location, availability, and eligibility." },
              { icon: Users, title: "Emergency Coordination", desc: "Real-time emergency feed with radius-based alerts to find donors fast." },
              { icon: Building2, title: "Blood Bank Network", desc: "Directory of blood banks with real-time stock availability and contact info." },
            ].map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-card p-6 text-center shadow-sm">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-heading text-lg font-semibold">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="container py-20">
        <div className="grid gap-8 text-center md:grid-cols-4">
          {[
            { value: "24/7", label: "Emergency Support" },
            { value: "Smart", label: "Donor Matching" },
            { value: "Real-time", label: "Blood Bank Data" },
            { value: "Secure", label: "Healthcare Grade" },
          ].map((s) => (
            <div key={s.label}>
              <p className="font-heading text-3xl font-bold text-primary">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} LifeLink AI. Saving lives through technology.</p>
        </div>
      </footer>
    </div>
  );
}
