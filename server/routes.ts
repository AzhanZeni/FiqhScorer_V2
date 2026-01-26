import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./replit_integrations/auth";
import { registerAuthRoutes } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat"; // Optional: keep if chat is needed
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { openai } from "./replit_integrations/audio/client"; // Reusing the configured client

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // 1. Setup Integrations
  await setupAuth(app);
  registerAuthRoutes(app);
  registerChatRoutes(app);
  registerObjectStorageRoutes(app);

  // 2. Loan Routes

  // List Loans
  app.get(api.loans.list.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user.claims.sub;
    const loans = await storage.getUserLoans(userId);
    res.json(loans);
  });

  // Create Loan
  app.post(api.loans.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.loans.create.input.parse(req.body);
      
      // Inject userId from auth
      const loanData = {
        ...input,
        userId: req.user.claims.sub,
      };
      
      // Separate documents from loan data
      const { documents, ...applicationData } = loanData;
      
      const loan = await storage.createLoanApplication(applicationData, documents);
      res.status(201).json(loan);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get Loan Details
  app.get(api.loans.get.path, isAuthenticated, async (req: any, res) => {
    const loanId = parseInt(req.params.id);
    const userId = req.user.claims.sub;

    const loan = await storage.getLoan(loanId);
    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    // Security check: Ensure user owns the loan
    if (loan.userId !== userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const documents = await storage.getLoanDocuments(loanId);
    const aiScore = await storage.getLoanScore(loanId);

    res.json({
      ...loan,
      documents,
      aiScore: aiScore || null,
    });
  });

  // AI Assessment Route
  app.post(api.loans.assess.path, isAuthenticated, async (req: any, res) => {
    const loanId = parseInt(req.params.id);
    const userId = req.user.claims.sub;

    const loan = await storage.getLoan(loanId);
    if (!loan) {
      return res.status(404).json({ message: "Loan not found" });
    }

    if (loan.userId !== userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check if score already exists
    const existingScore = await storage.getLoanScore(loanId);
    if (existingScore) {
      return res.json(existingScore);
    }

    // Prepare prompt for AI
    const systemPrompt = `You are an Islamic finance credit risk analyst.
Score loan applications deterministically.
Apply contract-specific Islamic finance rules.
Explain scores briefly in bullet points.
Return only valid JSON.
Do not include text outside JSON.`;

    const userPrompt = `Evaluate this Islamic financing application.

Scoring Rules:
- Murabahah requires asset proof and is lower risk for asset purchases.
- Musharakah requires business proof and profit potential; higher uncertainty.
- Qard Hasan is for social welfare; penalize large commercial requests.

Return JSON structure:
{
  "affordability_score": number,
  "stability_score": number,
  "documentation_score": number,
  "shariah_score": number,
  "contract_compliance_score": number,
  "final_score": number,
  "risk_category": "Low Risk | Medium Risk | High Risk | Reject",
  "decision": "Approve | Manual Review | Conditional | Reject",
  "score_explanation": ["string"],
  "key_risks": ["string"],
  "recommendations": ["string"],
  "contract_suitability_advice": "string",
  "shariah_warning_flag": "string"
}

Application Data:
${JSON.stringify(loan, null, 2)}`;

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0, // Deterministic
      });

      const result = JSON.parse(completion.choices[0].message.content || "{}");

      // Save score
      const score = await storage.createLoanScore({
        applicationId: loanId,
        affordabilityScore: result.affordability_score,
        stabilityScore: result.stability_score,
        documentationScore: result.documentation_score,
        shariahScore: result.shariah_score,
        contractComplianceScore: result.contract_compliance_score,
        finalScore: result.final_score,
        riskCategory: result.risk_category,
        decision: result.decision,
        explanation: result.score_explanation,
        keyRisks: result.key_risks,
        recommendations: result.recommendations,
      });

      res.json(score);

    } catch (error) {
      console.error("AI Assessment Error:", error);
      res.status(500).json({ message: "Failed to run AI assessment" });
    }
  });

  return httpServer;
}
