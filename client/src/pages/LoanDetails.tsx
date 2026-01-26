import { useLocation, useRoute } from "wouter";
import { useLoan, useAssessLoan } from "@/hooks/use-loans";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, ArrowLeft, BrainCircuit, CheckCircle, AlertTriangle } from "lucide-react";
import { ScoreGauge } from "@/components/ScoreGauge";
import { RiskBadge } from "@/components/RiskBadge";
import { format } from "date-fns";

export default function LoanDetails() {
  const [, params] = useRoute("/loans/:id");
  const id = params ? parseInt(params.id) : 0;
  const { data: loan, isLoading } = useLoan(id);
  const assessLoan = useAssessLoan();
  const [, setLocation] = useLocation();

  if (isLoading || !loan) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const handleAssess = () => {
    assessLoan.mutate(id);
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Button variant="ghost" onClick={() => setLocation("/dashboard")} className="mb-6 pl-0 text-muted-foreground hover:bg-transparent hover:text-foreground">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-display font-bold text-primary mb-2">
                  {loan.contractType} Application
                </h1>
                <p className="text-muted-foreground">ID: #{loan.id} • Submitted on {format(new Date(loan.createdAt!), "MMMM d, yyyy")}</p>
              </div>
              <RiskBadge category={loan.status === 'submitted' ? 'Pending Review' : loan.status} className="text-sm px-4 py-2" />
            </div>

            {/* Application Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle>Request Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="grid sm:grid-cols-2 gap-x-4 gap-y-6 text-sm">
                  <div>
                    <dt className="text-muted-foreground">Amount Requested</dt>
                    <dd className="text-lg font-semibold">${Number(loan.requestedAmount).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Duration</dt>
                    <dd className="text-lg font-semibold">{loan.durationMonths} Months</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">Purpose</dt>
                    <dd className="font-medium">{loan.purpose}</dd>
                  </div>
                  {loan.assetType && (
                    <div>
                      <dt className="text-muted-foreground">Asset Type</dt>
                      <dd className="font-medium">{loan.assetType}</dd>
                    </div>
                  )}
                  <div className="sm:col-span-2 border-t pt-4 mt-2">
                    <dt className="text-muted-foreground mb-1">Documents</dt>
                    <dd className="flex gap-2 flex-wrap">
                      {loan.documents.map((doc, i) => (
                        <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-secondary text-secondary-foreground border border-secondary-foreground/10">
                          {doc.fileName}
                        </span>
                      ))}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* AI Analysis Section */}
            {loan.aiScore ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BrainCircuit className="w-5 h-5 text-primary" /> AI Analysis Report
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-2">Key Risks</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {(loan.aiScore.keyRisks as string[]).map((risk, i) => (
                          <li key={i}>{risk}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Recommendations</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {(loan.aiScore.recommendations as string[]).map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-white p-4 rounded-lg border">
                      <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-muted-foreground">Score Explanation</h4>
                      <div className="space-y-2">
                        {(loan.aiScore.explanation as string[]).map((exp, i) => (
                          <p key={i} className="text-sm">{exp}</p>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="bg-gradient-to-br from-secondary/30 to-background border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <BrainCircuit className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">AI Assessment Pending</h3>
                  <p className="text-muted-foreground max-w-md mb-6">
                    Run our Shariah-compliant AI model to evaluate this application's eligibility and risk profile.
                  </p>
                  <Button onClick={handleAssess} disabled={assessLoan.isPending} size="lg">
                    {assessLoan.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...
                      </>
                    ) : (
                      "Run Assessment"
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar Score Card */}
          <div className="space-y-6">
            {loan.aiScore && (
              <Card className="overflow-hidden shadow-lg border-primary/20">
                <div className="h-2 bg-gradient-to-r from-primary to-primary/60" />
                <CardContent className="pt-6">
                  <h3 className="text-center font-semibold text-muted-foreground uppercase tracking-widest text-xs mb-4">Final Eligibility Score</h3>
                  <ScoreGauge score={loan.aiScore.finalScore || 0} />
                  
                  <div className="text-center mb-6">
                    <RiskBadge category={loan.aiScore.riskCategory || 'Unknown'} className="text-sm px-3 py-1" />
                    <p className="mt-2 text-sm font-medium">Decision Recommendation: <span className="text-primary">{loan.aiScore.decision}</span></p>
                  </div>

                  <div className="space-y-3 pt-4 border-t">
                    <ScoreRow label="Affordability" score={loan.aiScore.affordabilityScore || 0} />
                    <ScoreRow label="Stability" score={loan.aiScore.stabilityScore || 0} />
                    <ScoreRow label="Documentation" score={loan.aiScore.documentationScore || 0} />
                    <ScoreRow label="Shariah Compl." score={loan.aiScore.shariahScore || 0} />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ScoreRow({ label, score }: { label: string; score: number }) {
  // Determine color bar width and color
  const colorClass = score > 80 ? "bg-primary" : score > 50 ? "bg-yellow-500" : "bg-red-500";
  
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{score}/100</span>
      </div>
      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
        <div className={`h-full ${colorClass} rounded-full transition-all duration-1000`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
