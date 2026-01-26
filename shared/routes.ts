import { z } from 'zod';
import { insertLoanApplicationSchema, loanApplications, loanDocuments, loanAiScores, insertLoanDocumentSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

export const api = {
  loans: {
    create: {
      method: 'POST' as const,
      path: '/api/loans',
      input: insertLoanApplicationSchema.extend({
        documents: z.array(insertLoanDocumentSchema.omit({ applicationId: true }))
      }),
      responses: {
        201: z.custom<typeof loanApplications.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    list: {
      method: 'GET' as const,
      path: '/api/loans',
      responses: {
        200: z.array(z.custom<typeof loanApplications.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/loans/:id',
      responses: {
        200: z.custom<typeof loanApplications.$inferSelect & { 
          documents: typeof loanDocuments.$inferSelect[], 
          aiScore: typeof loanAiScores.$inferSelect | null 
        }>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    assess: {
      method: 'POST' as const,
      path: '/api/loans/:id/assess',
      responses: {
        200: z.custom<typeof loanAiScores.$inferSelect>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
        500: errorSchemas.internal,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
