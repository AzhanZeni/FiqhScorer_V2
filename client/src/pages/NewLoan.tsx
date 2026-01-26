import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { z } from "zod";
import { useCreateLoan } from "@/hooks/use-loans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Steps } from "@/components/Steps";
import { ArrowLeft, ArrowRight, UploadCloud, File, Trash2 } from "lucide-react";

// Wizard steps
const steps = [
  "Financing Details",
  "Financial Profile",
  "Documents",
  "Review"
];

// Validation schemas for each step
const step1Schema = z.object({
  requestedAmount: z.string().min(1, "Amount is required"),
  durationMonths: z.string().min(1, "Duration is required"),
  contractType: z.string().min(1, "Contract type is required"),
  purpose: z.string().min(3, "Purpose is required"),
  assetType: z.string().optional(),
});

const step2Schema = z.object({
  monthlyIncome: z.string().min(1, "Income is required"),
  employmentType: z.string().min(1, "Employment type is required"),
  employerName: z.string().min(1, "Employer name is required"),
  monthlyExpenses: z.string().min(1, "Expenses is required"),
  otherDebts: z.string().default("0"),
});

type FormData = z.infer<typeof step1Schema> & z.infer<typeof step2Schema>;

export default function NewLoan() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<FormData>>({});
  const [documents, setDocuments] = useState<{ type: string; fileName: string; fileUrl: string }[]>([]);
  const [, setLocation] = useLocation();
  const createLoan = useCreateLoan();

  const handleNext = (data: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!formData.requestedAmount) return;
    
    try {
      await createLoan.mutateAsync({
        ...formData as any,
        // Convert string inputs to numbers where expected by backend schema
        requestedAmount: parseFloat(formData.requestedAmount!),
        durationMonths: parseInt(formData.durationMonths!),
        monthlyIncome: parseFloat(formData.monthlyIncome!),
        monthlyExpenses: parseFloat(formData.monthlyExpenses!),
        otherDebts: parseFloat(formData.otherDebts || "0"),
        documents
      });
      setLocation("/dashboard");
    } catch (error) {
      console.error(error);
    }
  };

  const addDocument = (doc: { type: string; fileName: string; fileUrl: string }) => {
    setDocuments(prev => [...prev, doc]);
  };

  const removeDocument = (index: number) => {
    setDocuments(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => setLocation("/dashboard")} className="mb-4 pl-0 hover:pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
          <h1 className="text-3xl font-display font-bold text-primary mb-6">New Financing Application</h1>
          <Steps steps={steps} currentStep={currentStep} />
        </div>

        <Card className="border-none shadow-lg">
          <CardContent className="p-8">
            {currentStep === 0 && <Step1Form onNext={handleNext} defaultValues={formData} />}
            {currentStep === 1 && <Step2Form onNext={handleNext} onBack={handleBack} defaultValues={formData} />}
            {currentStep === 2 && (
              <Step3Documents 
                onNext={() => setCurrentStep(3)} 
                onBack={handleBack} 
                documents={documents}
                addDocument={addDocument}
                removeDocument={removeDocument}
              />
            )}
            {currentStep === 3 && (
              <Step4Review 
                formData={formData as FormData} 
                documents={documents}
                onBack={handleBack}
                onSubmit={handleSubmit}
                isSubmitting={createLoan.isPending}
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Step1Form({ onNext, defaultValues }: { onNext: (data: any) => void, defaultValues: any }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues
  });
  
  // Watch contract type to show conditional fields
  const contractType = watch("contractType");

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Financing Request</h2>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Requested Amount ($)</Label>
            <Input id="amount" type="number" {...register("requestedAmount")} placeholder="e.g. 50000" />
            {errors.requestedAmount && <span className="text-xs text-destructive">{errors.requestedAmount.message as string}</span>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="duration">Duration (Months)</Label>
            <Input id="duration" type="number" {...register("durationMonths")} placeholder="e.g. 24" />
            {errors.durationMonths && <span className="text-xs text-destructive">{errors.durationMonths.message as string}</span>}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Contract Type</Label>
          <Select onValueChange={(val) => setValue("contractType", val)} defaultValue={defaultValues.contractType}>
            <SelectTrigger>
              <SelectValue placeholder="Select contract type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Murabahah">Murabahah (Cost-Plus Financing)</SelectItem>
              <SelectItem value="Musharakah">Musharakah (Partnership)</SelectItem>
              <SelectItem value="Qard Hasan">Qard Hasan (Benevolent Loan)</SelectItem>
            </SelectContent>
          </Select>
          {errors.contractType && <span className="text-xs text-destructive">{errors.contractType.message as string}</span>}
        </div>

        {contractType === "Murabahah" && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            <Label htmlFor="asset">Asset Type</Label>
            <Input id="asset" {...register("assetType")} placeholder="e.g. Real Estate, Vehicle, Equipment" />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="purpose">Purpose of Financing</Label>
          <Input id="purpose" {...register("purpose")} placeholder="Briefly describe the purpose" />
          {errors.purpose && <span className="text-xs text-destructive">{errors.purpose.message as string}</span>}
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit">
          Next Step <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}

function Step2Form({ onNext, onBack, defaultValues }: { onNext: (data: any) => void, onBack: () => void, defaultValues: any }) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(step2Schema),
    defaultValues
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Personal & Financial Profile</h2>
        
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="income">Monthly Income ($)</Label>
            <Input id="income" type="number" {...register("monthlyIncome")} />
            {errors.monthlyIncome && <span className="text-xs text-destructive">{errors.monthlyIncome.message as string}</span>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="expenses">Monthly Expenses ($)</Label>
            <Input id="expenses" type="number" {...register("monthlyExpenses")} />
            {errors.monthlyExpenses && <span className="text-xs text-destructive">{errors.monthlyExpenses.message as string}</span>}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Employment Type</Label>
            <Select onValueChange={(val) => setValue("employmentType", val)} defaultValue={defaultValues.employmentType}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Full-time">Full-time</SelectItem>
                <SelectItem value="Part-time">Part-time</SelectItem>
                <SelectItem value="Self-employed">Self-employed</SelectItem>
                <SelectItem value="Business Owner">Business Owner</SelectItem>
              </SelectContent>
            </Select>
            {errors.employmentType && <span className="text-xs text-destructive">{errors.employmentType.message as string}</span>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="employer">Employer / Business Name</Label>
            <Input id="employer" {...register("employerName")} />
            {errors.employerName && <span className="text-xs text-destructive">{errors.employerName.message as string}</span>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="debts">Other Existing Debts ($)</Label>
          <Input id="debts" type="number" {...register("otherDebts")} />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <Button type="submit">Next Step <ArrowRight className="ml-2 w-4 h-4" /></Button>
      </div>
    </form>
  );
}

function Step3Documents({ onNext, onBack, documents, addDocument, removeDocument }: any) {
  const [uploadType, setUploadType] = useState("identity");

  const getUploadParams = async (file: File) => {
    const res = await fetch("/api/uploads/request-url", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: file.name,
        size: file.size,
        contentType: file.type,
      }),
    });
    const { uploadURL } = await res.json();
    return {
      method: "PUT" as const,
      url: uploadURL,
      headers: { "Content-Type": file.type },
    };
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Supporting Documents</h2>
        <p className="text-sm text-muted-foreground">Please upload proof of identity and income to support your application.</p>
        
        <div className="bg-secondary/30 rounded-lg p-6 border border-dashed border-secondary">
          <div className="mb-4">
            <Label className="mb-2 block">Document Type</Label>
            <Select value={uploadType} onValueChange={setUploadType}>
              <SelectTrigger className="w-full sm:w-[200px] bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="identity">Identity Proof (ID/Passport)</SelectItem>
                <SelectItem value="income">Proof of Income</SelectItem>
                <SelectItem value="bank_statement">Bank Statement</SelectItem>
                <SelectItem value="asset_proof">Proof of Asset (for Murabahah)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ObjectUploader
            onGetUploadParameters={getUploadParams}
            onComplete={(result) => {
              if (result.successful && result.successful.length > 0) {
                // The URL is constructed based on the backend routes we made
                // It's usually the direct storage URL or our proxy. 
                // For this demo, let's assume we use the proxy route or direct link.
                // The backend route returns { uploadURL, objectPath }. 
                // Uppy result has uploadURL. Let's use uploadURL for simplicity 
                // but stripped of query params if it's signed.
                // Actually, let's stick to simple file name handling for the UI list.
                const file = result.successful[0];
                const fileUrl = file.uploadURL; // simplified
                addDocument({
                  type: uploadType,
                  fileName: file.name,
                  fileUrl: fileUrl
                });
              }
            }}
          >
            <div className="flex flex-col items-center justify-center gap-2 cursor-pointer w-full">
              <UploadCloud className="w-8 h-8 text-primary" />
              <span className="text-sm font-medium text-primary">Click to Upload Document</span>
            </div>
          </ObjectUploader>
        </div>

        {documents.length > 0 && (
          <div className="space-y-2">
            <Label>Uploaded Documents</Label>
            <div className="grid gap-2">
              {documents.map((doc: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded">
                      <File className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{doc.fileName}</p>
                      <p className="text-xs text-muted-foreground capitalize">{doc.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeDocument(idx)} className="text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onNext} disabled={documents.length === 0}>
          Next Step <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function Step4Review({ formData, documents, onBack, onSubmit, isSubmitting }: any) {
  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Review Application</h2>
        
        <div className="grid gap-6">
          <div className="bg-muted/30 p-4 rounded-lg space-y-3">
            <h3 className="font-semibold text-primary">Financing Request</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Amount:</span>
              <span className="font-medium">${formData.requestedAmount}</span>
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-medium">{formData.durationMonths} Months</span>
              <span className="text-muted-foreground">Type:</span>
              <span className="font-medium">{formData.contractType}</span>
            </div>
          </div>

          <div className="bg-muted/30 p-4 rounded-lg space-y-3">
            <h3 className="font-semibold text-primary">Financial Profile</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Income:</span>
              <span className="font-medium">${formData.monthlyIncome}/mo</span>
              <span className="text-muted-foreground">Expenses:</span>
              <span className="font-medium">${formData.monthlyExpenses}/mo</span>
              <span className="text-muted-foreground">Employer:</span>
              <span className="font-medium">{formData.employerName}</span>
            </div>
          </div>

          <div className="bg-muted/30 p-4 rounded-lg space-y-3">
            <h3 className="font-semibold text-primary">Documents ({documents.length})</h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              {documents.map((d: any, i: number) => (
                <li key={i}>{d.fileName} <span className="text-xs opacity-70">({d.type})</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack} disabled={isSubmitting}>Back</Button>
        <Button onClick={onSubmit} disabled={isSubmitting} className="w-40">
          {isSubmitting ? "Submitting..." : "Submit Application"}
        </Button>
      </div>
    </div>
  );
}
