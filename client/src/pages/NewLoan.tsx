import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { z } from "zod";
import { useCreateLoan } from "@/hooks/use-loans";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { ObjectUploader } from "@/components/ObjectUploader";
import { Steps } from "@/components/Steps";
import { ArrowLeft, ArrowRight, UploadCloud, File, Trash2 } from "lucide-react";

// Wizard steps
const steps = ["Financing Details", "Financial Profile", "Documents", "Review"];

// Validation schemas for each step
const step1Schema = z.object({
  requestedAmount: z.preprocess(
    (val) => Number(val),
    z.number().positive("Amount must be > 0"),
  ),
  durationMonths: z.preprocess(
    (val) => Number(val),
    z.number().int().positive("Duration must be > 0"),
  ),
  contractType: z.string().min(1, "Contract type is required"),
  purpose: z.string().min(3, "Purpose is required"),
  assetType: z.string().optional(),
});

const step2Schema = z.object({
  monthlyIncome: z.preprocess(
    (val) => Number(val),
    z.number().min(0, "Income must be ≥ 0"),
  ),
  monthlyExpenses: z.preprocess(
    (val) => Number(val),
    z.number().min(0, "Expenses must be ≥ 0"),
  ),
  otherDebts: z.preprocess((val) => (val ? Number(val) : 0), z.number().min(0)),
  employmentType: z.string().min(1, "Employment type is required"),
  employerName: z.string().min(1, "Employer name is required"),
});

type FormData = z.infer<typeof step1Schema> & z.infer<typeof step2Schema>;

export default function NewLoan() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Partial<FormData>>({});
  const [documents, setDocuments] = useState<
    { type: string; fileName: string; fileUrl: string }[]
  >([]);
  const [, setLocation] = useLocation();
  const createLoan = useCreateLoan();

  const handleNext = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCurrentStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!formData.requestedAmount) return;

    try {
      await createLoan.mutateAsync({
        ...formData,
        documents,
      });
      setLocation("/dashboard");
    } catch (error) {
      console.error(error);
    }
  };

  const addDocument = (doc: {
    type: string;
    fileName: string;
    fileUrl: string;
  }) => {
    setDocuments((prev) => [...prev, doc]);
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/dashboard")}
            className="mb-4 pl-0 hover:pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
          <h1 className="text-3xl font-display font-bold text-primary mb-6">
            New Financing Application
          </h1>
          <Steps steps={steps} currentStep={currentStep} />
        </div>

        <Card className="border-none shadow-lg">
          <CardContent className="p-8">
            {currentStep === 0 && (
              <Step1Form onNext={handleNext} defaultValues={formData} />
            )}
            {currentStep === 1 && (
              <Step2Form
                onNext={handleNext}
                onBack={handleBack}
                defaultValues={formData}
              />
            )}
            {currentStep === 2 && (
              <Step3Documents
                onNext={() => setCurrentStep(3)}
                onBack={handleBack}
                documents={documents}
                addDocument={addDocument}
                removeDocument={removeDocument}
                contractType={formData.contractType}
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

function Step1Form({
  onNext,
  defaultValues,
}: {
  onNext: (data: any) => void;
  defaultValues: any;
}) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues,
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
            <Input
              id="amount"
              type="number"
              {...register("requestedAmount")}
              placeholder="e.g. 50000"
            />
            {errors.requestedAmount && (
              <span className="text-xs text-destructive">
                {errors.requestedAmount.message as string}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration (Months)</Label>
            <Input
              id="duration"
              type="number"
              {...register("durationMonths")}
              placeholder="e.g. 24"
            />
            {errors.durationMonths && (
              <span className="text-xs text-destructive">
                {errors.durationMonths.message as string}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Contract Type</Label>
          <Select
            onValueChange={(val) => setValue("contractType", val)}
            defaultValue={defaultValues.contractType}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select contract type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Murabahah">
                Murabahah (Cost-Plus Financing)
              </SelectItem>
              <SelectItem value="Musharakah">
                Musharakah (Partnership)
              </SelectItem>
              <SelectItem value="Qard Hasan">
                Qard Hasan (Benevolent Loan)
              </SelectItem>
            </SelectContent>
          </Select>
          {errors.contractType && (
            <span className="text-xs text-destructive">
              {errors.contractType.message as string}
            </span>
          )}
        </div>

        {contractType === "Murabahah" && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
            <Label htmlFor="asset">Asset Type</Label>
            <Input
              id="asset"
              {...register("assetType")}
              placeholder="e.g. Real Estate, Vehicle, Equipment"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="purpose">Purpose of Financing</Label>
          <Input
            id="purpose"
            {...register("purpose")}
            placeholder="Briefly describe the purpose"
          />
          {errors.purpose && (
            <span className="text-xs text-destructive">
              {errors.purpose.message as string}
            </span>
          )}
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

function Step2Form({
  onNext,
  onBack,
  defaultValues,
}: {
  onNext: (data: any) => void;
  onBack: () => void;
  defaultValues: any;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(step2Schema),
    defaultValues,
  });

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Personal & Financial Profile</h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="income">Monthly Income ($)</Label>
            <Input id="income" type="number" {...register("monthlyIncome")} />
            {errors.monthlyIncome && (
              <span className="text-xs text-destructive">
                {errors.monthlyIncome.message as string}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="expenses">Monthly Expenses ($)</Label>
            <Input
              id="expenses"
              type="number"
              {...register("monthlyExpenses")}
            />
            {errors.monthlyExpenses && (
              <span className="text-xs text-destructive">
                {errors.monthlyExpenses.message as string}
              </span>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Employment Type</Label>
            <Select
              onValueChange={(val) => setValue("employmentType", val)}
              defaultValue={defaultValues.employmentType}
            >
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
            {errors.employmentType && (
              <span className="text-xs text-destructive">
                {errors.employmentType.message as string}
              </span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="employer">Employer / Business Name</Label>
            <Input id="employer" {...register("employerName")} />
            {errors.employerName && (
              <span className="text-xs text-destructive">
                {errors.employerName.message as string}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="debts">Other Existing Debts ($)</Label>
          <Input id="debts" type="number" {...register("otherDebts")} />
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button type="submit">
          Next Step <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </form>
  );
}

function Step3Documents({
  onNext,
  onBack,
  documents,
  addDocument,
  removeDocument,
  contractType, // PASS THIS FROM STEP 1
}: any) {
  const [uploadType, setUploadType] = useState("identity");
  const uploadTypeRef = useRef(uploadType);

  const handleTypeChange = (val: string) => {
    setUploadType(val);
    uploadTypeRef.current = val;
  };

  // Request presigned URL from backend
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

  // ---------------------------
  // REQUIRED DOCUMENT RULES
  // ---------------------------

  const requiredTier1 = ["identity", "income", "bank_statement"];
  const hasTier1 = requiredTier1.every((t) =>
    documents.some((d: any) => d.type === t),
  );

  // Murabahah MUST have asset docs
  const assetTypes = ["car_quotation", "proforma_invoice", "sale_agreement"];
  const hasAssetDoc = documents.some((d: any) => assetTypes.includes(d.type));
  const murabahahMissingAsset = contractType === "Murabahah" && !hasAssetDoc;

  // Final Next button rule
  const canProceed = hasTier1 && !murabahahMissingAsset;

  return (
    <div className="space-y-6">
      {/* ================= HEADER ================= */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Supporting Documents</h2>
        <p className="text-sm text-muted-foreground">
          Upload required documents. All Tier 1 documents are mandatory.
          Murabahah requires asset documentation for Shariah compliance.
        </p>

        {/* ================= UPLOAD BOX ================= */}
        <div className="bg-secondary/30 rounded-lg p-6 border border-dashed border-secondary">
          <div className="mb-4">
            <Label className="mb-2 block">Document Type</Label>

            <Select value={uploadType} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-full sm:w-[240px] bg-background">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {/* ---------- Tier 1 Mandatory ---------- */}
                <SelectItem value="identity">
                  Identity Proof (IC / Passport) *
                </SelectItem>
                <SelectItem value="income">Payslip / Income Proof *</SelectItem>
                <SelectItem value="bank_statement">Bank Statement *</SelectItem>
                <SelectItem value="ccris">
                  CCRIS Credit Report (Optional)
                </SelectItem>

                {/* ---------- Murabahah Asset Docs ---------- */}
                {contractType === "Murabahah" && (
                  <>
                    <SelectItem value="car_quotation">
                      Quotation (Murabahah Required)
                    </SelectItem>
                    <SelectItem value="proforma_invoice">
                      Pro Forma Invoice (Murabahah Required)
                    </SelectItem>
                    <SelectItem value="sale_agreement">
                      Sale Agreement (Murabahah Required)
                    </SelectItem>
                  </>
                )}

                {/* ---------- Tier 2 ---------- */}
                <SelectItem value="utility_bill">
                  Utility Bills (Conditional)
                </SelectItem>
                <SelectItem value="rental_proof">
                  Rental Payment Proof (Conditional)
                </SelectItem>

                {/* ---------- Tier 3 ---------- */}
                <SelectItem value="business_registration">
                  SSM / Business Registration
                </SelectItem>
                <SelectItem value="ewallet_history">
                  E-Wallet Transaction History
                </SelectItem>
                <SelectItem value="merchant_payout">
                  Merchant Payout Report (Grab/Shopee/etc)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ================= FILE UPLOADER ================= */}
          <ObjectUploader
            onGetUploadParameters={getUploadParams}
            onComplete={(result) => {
              if (result.successful && result.successful.length > 0) {
                const file = result.successful[0];
                addDocument({
                  type: uploadTypeRef.current,
                  fileName: file.name,
                  fileUrl: file.uploadURL,
                });
              }
            }}
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-primary text-white font-bold rounded-md text-sm hover:bg-primary/90 transition cursor-pointer w-fit">
              <UploadCloud className="w-4 h-4" />
              Click to Upload PDF Document
            </div>

            <p className="text-xs text-muted-foreground mt-1">
              PDF only • Max 10MB recommended
            </p>
          </ObjectUploader>
        </div>

        {/* ================= UPLOADED FILE LIST ================= */}
        {documents.length > 0 && (
          <div className="space-y-2">
            <Label>Uploaded Documents</Label>
            <div className="grid gap-2">
              {documents.map((doc: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-white border rounded-lg shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded">
                      <File className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{doc.fileName}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {doc.type.replace("_", " ")}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeDocument(idx)}
                    className="text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= SHARIAH WARNING ================= */}
        {murabahahMissingAsset && (
          <p className="text-sm text-red-600 font-medium">
            ⚠ Murabahah requires asset documentation (quotation / invoice /
            sale agreement).
          </p>
        )}

        {!hasTier1 && (
          <p className="text-sm text-yellow-600">
            Please upload all Tier 1 documents (Identity, Income, Bank
            Statement).
          </p>
        )}
      </div>

      {/* ================= FOOTER BUTTONS ================= */}
      <div className="flex justify-between pt-4">
        <Button type="button" variant="outline" onClick={onBack}>
          Back
        </Button>

        <Button onClick={onNext} disabled={!canProceed}>
          Review Loan Request <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function Step4Review({
  formData,
  documents,
  onBack,
  onSubmit,
  isSubmitting,
}: any) {
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
              <span className="font-medium">
                {formData.durationMonths} Months
              </span>
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
              <span className="font-medium">
                ${formData.monthlyExpenses}/mo
              </span>
              <span className="text-muted-foreground">Employer:</span>
              <span className="font-medium">{formData.employerName}</span>
            </div>
          </div>

          <div className="bg-muted/30 p-4 rounded-lg space-y-3">
            <h3 className="font-semibold text-primary">
              Documents ({documents.length})
            </h3>
            <ul className="list-disc list-inside text-sm text-muted-foreground">
              {documents.map((d: any, i: number) => (
                <li key={i}>
                  {d.fileName}{" "}
                  <span className="text-xs opacity-70">({d.type})</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Back
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting} className="w-40">
          {isSubmitting ? "Submitting..." : "Submit Application"}
        </Button>
      </div>
    </div>
  );
}
