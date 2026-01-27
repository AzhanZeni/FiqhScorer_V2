import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  FileText,
  Lock,
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-card border-b border-border/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <span className="font-display font-bold text-xl text-primary">
              FiqhScorer
            </span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link href="/dashboard">
                <Button className="rounded-full">Dashboard</Button>
              </Link>
            ) : (
              <a href="/api/login">
                <Button variant="outline">Sign In</Button>
              </a>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 text-primary text-sm font-medium mb-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            Shariah-Compliant AI Credit Assessment
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-bold text-primary mb-6 leading-tight max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
            Ethical Financing Powered by{" "}
            <span className="italic text-primary/80">Intelligence</span>
          </h1>

          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
            Secure, transparent, and fully compliant Islamic financing
            assessment. Get instant eligibility scoring tailored to Murabahah,
            Musharakah, and Qard Hasan contracts.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
            <Link href={user ? "/dashboard" : "/api/login"}>
              <Button
                size="lg"
                className="rounded-full px-8 h-12 text-base shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
              >
                Check Eligibility <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="lg"
              className="rounded-full px-8 h-12 text-base"
            >
              Learn How It Works
            </Button>
          </div>
        </div>

        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-0 w-full h-full -z-0 opacity-40 pointer-events-none">
          <div className="absolute top-1/4 left-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-accent/30 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-white/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-border/50 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-display">
                AI-Driven Scoring
              </h3>
              <p className="text-muted-foreground">
                Advanced algorithms analyze financial data while strictly
                adhering to Islamic finance principles.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-border/50 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-display">
                Contract Specific
              </h3>
              <p className="text-muted-foreground">
                Tailored assessment models for various contract types including
                Murabahah and Musharakah.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-border/50 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                <Lock className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-display">
                Secure & Private
              </h3>
              <p className="text-muted-foreground">
                Your financial data is encrypted and processed securely. We
                prioritize your privacy above all.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
