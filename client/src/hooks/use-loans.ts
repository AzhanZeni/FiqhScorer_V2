import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { type CreateLoanRequest, type LoanAiScore } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export function useLoans() {
  const { toast } = useToast();

  return useQuery({
    queryKey: [api.loans.list.path],
    queryFn: async () => {
      const res = await fetch(api.loans.list.path, { credentials: "include" });
      if (res.status === 401) return null; // Handled by auth hook mostly, but safe fallback
      if (!res.ok) throw new Error("Failed to fetch loans");
      return api.loans.list.responses[200].parse(await res.json());
    },
  });
}

export function useLoan(id: number) {
  return useQuery({
    queryKey: [api.loans.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.loans.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch loan details");
      return api.loans.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useCreateLoan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (data: CreateLoanRequest) => {
      const res = await fetch(api.loans.create.path, {
        method: api.loans.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const error = api.loans.create.responses[400].parse(await res.json());
          throw new Error(error.message);
        }
        throw new Error("Failed to create loan application");
      }

      return api.loans.create.responses[201].parse(await res.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.loans.list.path] });
      toast({
        title: "Application Submitted",
        description: "Your loan application has been successfully received.",
      });
    },
    onError: (error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}

export function useAssessLoan() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.loans.assess.path, { id });
      const res = await fetch(url, {
        method: api.loans.assess.method,
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Assessment failed");
      }

      return api.loans.assess.responses[200].parse(await res.json());
    },
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: [api.loans.get.path, id] });
      toast({
        title: "Assessment Complete",
        description: "AI analysis has generated a credit score.",
      });
    },
    onError: (error) => {
      toast({
        title: "Assessment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
