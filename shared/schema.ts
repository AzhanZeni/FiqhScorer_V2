export * from "./models/auth";
export * from "./models/chat";

import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";
import { users } from "./models/auth";

// === TABLE DEFINITIONS ===

export const loanApplications = pgTable("loan_applications", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(), // References auth.users.id
  
  // Step 1: Financing Request
  requestedAmount: decimal("requested_amount").notNull(),
  durationMonths: integer("duration_months").notNull(),
  contractType: text("contract_type").notNull(), // Murabahah, Musharakah, Qard Hasan
  purpose: text("purpose").notNull(),
  assetType: text("asset_type"), // Required for Murabahah
  
  // Step 2: Personal & Financial Profile
  monthlyIncome: decimal("monthly_income").notNull(),
  employmentType: text("employment_type").notNull(),
  employerName: text("employer_name"),
  monthlyExpenses: decimal("monthly_expenses").notNull(),
  otherDebts: decimal("other_debts").default("0"),
  
  // Meta
  status: text("status").notNull().default("submitted"), // submitted, processing, approved, rejected, manual_review
  createdAt: timestamp("created_at").defaultNow(),
});

export const loanDocuments = pgTable("loan_documents", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => loanApplications.id),
  type: text("type").notNull(), // identity, income, bank_statement
  fileUrl: text("file_url").notNull(),
  fileName: text("file_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const loanAiScores = pgTable("loan_ai_scores", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => loanApplications.id),
  
  // Component Scores
  affordabilityScore: integer("affordability_score"),
  stabilityScore: integer("stability_score"),
  documentationScore: integer("documentation_score"),
  shariahScore: integer("shariah_score"),
  contractComplianceScore: integer("contract_compliance_score"),
  finalScore: integer("final_score"),
  
  // Decision
  riskCategory: text("risk_category"), // Low Risk, Medium Risk, High Risk, Reject
  decision: text("decision"), // Approve, Manual Review, Conditional, Reject
  
  // AI Output
  explanation: jsonb("explanation"), // string[]
  keyRisks: jsonb("key_risks"), // string[]
  recommendations: jsonb("recommendations"), // string[]
  
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===

export const loanApplicationRelations = relations(loanApplications, ({ one, many }) => ({
  documents: many(loanDocuments),
  aiScore: one(loanAiScores, {
    fields: [loanApplications.id],
    references: [loanAiScores.applicationId],
  }),
}));

export const loanDocumentRelations = relations(loanDocuments, ({ one }) => ({
  application: one(loanApplications, {
    fields: [loanDocuments.applicationId],
    references: [loanApplications.id],
  }),
}));

export const loanAiScoreRelations = relations(loanAiScores, ({ one }) => ({
  application: one(loanApplications, {
    fields: [loanAiScores.applicationId],
    references: [loanApplications.id],
  }),
}));

// === ZOD SCHEMAS ===

export const insertLoanApplicationSchema = createInsertSchema(loanApplications).omit({ 
  id: true, 
  userId: true, // Set by backend
  status: true, 
  createdAt: true 
});

export const insertLoanDocumentSchema = createInsertSchema(loanDocuments).omit({ 
  id: true, 
  createdAt: true 
});

// === TYPES ===

export type LoanApplication = typeof loanApplications.$inferSelect;
export type InsertLoanApplication = z.infer<typeof insertLoanApplicationSchema>;

export type LoanDocument = typeof loanDocuments.$inferSelect;
export type InsertLoanDocument = z.infer<typeof insertLoanDocumentSchema>;

export type LoanAiScore = typeof loanAiScores.$inferSelect;

// Request Types
export interface CreateLoanRequest extends InsertLoanApplication {
  documents: Omit<InsertLoanDocument, "applicationId">[];
}

// AI Analysis Result Type (matches JSON output from OpenAI)
export interface AiAnalysisResult {
  affordability_score: number;
  stability_score: number;
  documentation_score: number;
  shariah_score: number;
  contract_compliance_score: number;
  final_score: number;
  risk_category: string;
  decision: string;
  score_explanation: string[];
  key_risks: string[];
  recommendations: string[];
  contract_suitability_advice: string;
  shariah_warning_flag: string;
}
