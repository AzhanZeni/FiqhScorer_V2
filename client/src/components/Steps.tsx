import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface StepsProps {
  steps: string[];
  currentStep: number;
}

export function Steps({ steps, currentStep }: StepsProps) {
  return (
    <div className="relative">
      <div className="absolute top-4 left-0 w-full h-0.5 bg-secondary -z-10" />
      <div
        className="absolute top-4 left-0 h-0.5 bg-primary transition-all duration-500 -z-10"
        style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
      />
      
      <div className="flex justify-between w-full">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={step} className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 border-2",
                  isCompleted
                    ? "bg-primary border-primary text-white"
                    : isCurrent
                    ? "bg-background border-primary text-primary ring-4 ring-primary/10"
                    : "bg-background border-secondary text-muted-foreground"
                )}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : index + 1}
              </div>
              <span
                className={cn(
                  "text-xs font-medium transition-colors duration-300",
                  isCurrent ? "text-primary" : "text-muted-foreground"
                )}
              >
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
