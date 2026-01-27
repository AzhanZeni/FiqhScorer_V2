import { 
  loanApplications, 
  loanDocuments, 
  loanAiScores, 
  type InsertLoanApplication, 
  type InsertLoanDocument,
  type LoanApplication,
  type LoanDocument,
  type LoanAiScore
} from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  createLoanApplication(data: InsertLoanApplication, documents: Omit<InsertLoanDocument, "applicationId">[]): Promise<LoanApplication>;
  getUserLoans(userId: string): Promise<LoanApplication[]>;
  getLoan(id: number): Promise<LoanApplication | undefined>;
  getLoanDocuments(applicationId: number): Promise<LoanDocument[]>;
  getLoanScore(applicationId: number): Promise<LoanAiScore | undefined>;
  createLoanScore(scoreData: any): Promise<LoanAiScore>;
  updateLoanStatus(id: number, status: string): Promise<LoanApplication | undefined>;
}

export class DatabaseStorage implements IStorage {
  async createLoanApplication(data: InsertLoanApplication, documents: Omit<InsertLoanDocument, "applicationId">[]): Promise<LoanApplication> {
    return await db.transaction(async (tx) => {
      const [app] = await tx.insert(loanApplications).values(data).returning();
      
      if (documents.length > 0) {
        await tx.insert(loanDocuments).values(
          documents.map(d => ({ ...d, applicationId: app.id }))
        );
      }
      
      return app;
    });
  }

  async getUserLoans(userId: string): Promise<LoanApplication[]> {
    return await db
      .select()
      .from(loanApplications)
      .where(eq(loanApplications.userId, userId))
      .orderBy(desc(loanApplications.createdAt));
  }

  async getLoan(id: number): Promise<LoanApplication | undefined> {
    const [loan] = await db
      .select()
      .from(loanApplications)
      .where(eq(loanApplications.id, id));
    return loan;
  }

  async getLoanDocuments(applicationId: number): Promise<LoanDocument[]> {
    return await db
      .select()
      .from(loanDocuments)
      .where(eq(loanDocuments.applicationId, applicationId));
  }

  async getLoanScore(applicationId: number): Promise<LoanAiScore | undefined> {
    const [score] = await db
      .select()
      .from(loanAiScores)
      .where(eq(loanAiScores.applicationId, applicationId));
    return score;
  }

  async createLoanScore(scoreData: any): Promise<LoanAiScore> {
    const [score] = await db
      .insert(loanAiScores)
      .values(scoreData)
      .returning();
    return score;
  }

  async updateLoanStatus(id: number, status: string): Promise<LoanApplication | undefined> {
    const [updated] = await db
      .update(loanApplications)
      .set({ status })
      .where(eq(loanApplications.id, id))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();
