// components/charter/MultiStepForm.tsx
"use client";
import { Check } from "lucide-react";
import { Card } from "@pexjet/ui";
import { AircraftSelection } from "./AircraftSelection";
import { ContactForm } from "./ContactForm";
import { FinalReview } from "./FinalReview";

interface MultiStepFormProps {
  currentStep: number;
  formData: any;
  onStep1Next: (data: any) => void;
  onStep2Next: (data: any) => void;
  onStep2Back: () => void;
  onStep3Back: () => void;
  onSubmit: () => void;
  isSubmitting?: boolean;
}

export function MultiStepForm({
  currentStep,
  formData,
  onStep1Next,
  onStep2Next,
  onStep2Back,
  onStep3Back,
  onSubmit,
  isSubmitting = false,
}: MultiStepFormProps) {
  const steps = [
    { number: 1, title: "Select Aircraft", completed: currentStep > 1 },
    { number: 2, title: "Contact Details", completed: currentStep > 2 },
    { number: 3, title: "Review & Submit", completed: false },
  ];

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="flex justify-center mb-8">
        <div className="flex items-center space-x-8">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 flex items-center justify-center border-2 ${
                    currentStep >= step.number
                      ? "bg-[#D4AF37] border-[#D4AF37] text-white"
                      : "border-gray-300 text-gray-300"
                  }`}
                >
                  {step.completed ? <Check className="w-6 h-6" /> : step.number}
                </div>
                <span
                  className={`mt-2 text-sm font-medium ${
                    currentStep >= step.number
                      ? "text-[#D4AF37]"
                      : "text-gray-400"
                  }`}
                >
                  {step.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-16 h-1 ${
                    currentStep > step.number ? "bg-[#D4AF37]" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <Card className="p-5">
        {currentStep === 1 && (
          <AircraftSelection formData={formData} onNext={onStep1Next} />
        )}

        {currentStep === 2 && (
          <ContactForm
            formData={formData}
            onNext={onStep2Next}
            onBack={onStep2Back}
          />
        )}

        {currentStep === 3 && (
          <FinalReview
            formData={formData}
            onSubmit={onSubmit}
            onBack={onStep3Back}
            isSubmitting={isSubmitting}
          />
        )}
      </Card>
    </div>
  );
}
