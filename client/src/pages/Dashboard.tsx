import { useAuth } from "@/hooks/use-auth";
import { useLoans } from "@/hooks/use-loans";
import { Button } from "@/components/ui/button";
import { Plus, FileText, ChevronRight, Loader2, TrendingUp, TrendingDown, Minus, Award } from "lucide-react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { RiskBadge } from "@/components/RiskBadge";

function getScoreColor(score: number | null | undefined) {
  if (!score) return "text-muted-foreground";
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-amber-600";
  return "text-red-600";
}

function getScoreIcon(score: number | null | undefined) {
  if (!score) return <Minus className="w-4 h-4" />;
  if (score >= 80) return <TrendingUp className="w-4 h-4" />;
  if (score >= 60) return <Minus className="w-4 h-4" />;
  return <TrendingDown className="w-4 h-4" />;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { data: loans, isLoading } = useLoans();
  const [, setLocation] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-border sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="font-display font-bold text-xl text-primary">
            FiqhScorer
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <img
                src={
                  user?.profileImageUrl ||
                  "https://ui-avatars.com/api/?name=User"
                }
                alt="Profile"
                className="w-8 h-8 rounded-full border border-border"
              />
              <span className="text-sm font-medium hidden sm:block">
                {user?.firstName}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => logout()}>
              Log out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your loan applications and view scores.
            </p>
          </div>
          <Link href="/loans/new">
            <Button className="shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
              <Plus className="w-4 h-4 mr-2" /> New Application
            </Button>
          </Link>
        </div>

        {loans && loans.length > 0 ? (
          <div className="grid gap-4">
            {loans.map((loan) => (
              <div
                key={loan.id}
                onClick={() => setLocation(`/loans/${loan.id}`)}
                className="bg-card rounded-xl p-6 border border-border hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {loan.contractType} Application
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {loan.purpose} • Applied on{" "}
                        {format(new Date(loan.createdAt!), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        Amount
                      </div>
                      <div className="font-mono font-medium">
                        ${Number(loan.requestedAmount).toLocaleString()}
                      </div>
                    </div>

                    <div className="text-right min-w-[80px]">
                      <div className="text-sm text-muted-foreground">Score</div>
                      <div className={`flex items-center justify-end gap-1 font-semibold ${getScoreColor(loan.aiScore?.finalScore)}`}>
                        {getScoreIcon(loan.aiScore?.finalScore)}
                        <span>{loan.aiScore?.finalScore ?? "—"}</span>
                      </div>
                    </div>

                    <div className="min-w-[100px] text-right">
                      <RiskBadge
                        category={
                          loan.status === "submitted" ? "Pending" : loan.status
                        }
                        className={
                          loan.status === "submitted"
                            ? "bg-blue-100 text-blue-800 border-blue-200"
                            : ""
                        }
                      />
                    </div>

                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-border">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
            <p className="text-muted-foreground mb-6">
              Start your journey by creating a new financing request.
            </p>
            <Link href="/loans/new">
              <Button>Start Application</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
