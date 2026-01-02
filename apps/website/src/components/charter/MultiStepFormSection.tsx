// components/charter/MultiStepFormSection.tsx
"use client";

import React, { useState, useEffect } from "react";
import { LoadingAnimation } from "./LoadingAnimation";
import { MultiStepForm } from "./MultiStepForm";
import { charterPageData } from "@/data";
import { Button, useToast } from "@pexjet/ui";

export function MultiStepFormSection() {
  const [showForm, setShowForm] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [hasProcessedSearch, setHasProcessedSearch] = useState(false);
  const [searchDataProcessed, setSearchDataProcessed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState<string | null>(null);
  const { toast } = useToast();

  // Check for stored search data on component mount
  useEffect(() => {
    const processStoredSearchData = () => {
      const storedSearchData = sessionStorage.getItem("charterSearchData");

      if (storedSearchData && !searchDataProcessed) {
        try {
          const searchData = JSON.parse(storedSearchData);
          console.log(
            "MultiStepFormSection: Processing stored search data:",
            searchData,
          );

          // Mark that we've processed this data
          setSearchDataProcessed(true);

          // Store the search data and trigger animation
          setFormData(searchData);
          setShowLoading(true);
          setShowForm(false);
          setHasProcessedSearch(true);

          // Clear the stored data immediately so CompactSearchForm doesn't see it
          sessionStorage.removeItem("charterSearchData");

          // After loading animation, show the form
          setTimeout(() => {
            setShowLoading(false);
            setShowForm(true);
            setCurrentStep(1);
          }, 8000);
        } catch (error) {
          console.error("Error parsing stored search data:", error);
        }
      }
    };

    // Check immediately on mount
    processStoredSearchData();

    // Also set up an interval to check for a short period in case there's a race condition
    const intervalId = setInterval(() => {
      processStoredSearchData();
    }, 100);

    // Clear interval after 2 seconds
    setTimeout(() => {
      clearInterval(intervalId);
    }, 2000);

    return () => clearInterval(intervalId);
  }, [searchDataProcessed]);

  // Keep the existing event listener for backward compatibility
  useEffect(() => {
    const handleSearchSubmitted = (event: CustomEvent) => {
      const searchData = event.detail;
      console.log(
        "MultiStepFormSection: Received searchSubmitted event:",
        searchData,
      );

      setFormData(searchData);
      setShowLoading(true);
      setShowForm(false);
      setHasProcessedSearch(true);

      setTimeout(() => {
        setShowLoading(false);
        setShowForm(true);
        setCurrentStep(1);
      }, 8000);
    };

    window.addEventListener(
      "searchSubmitted",
      handleSearchSubmitted as EventListener,
    );

    return () => {
      window.removeEventListener(
        "searchSubmitted",
        handleSearchSubmitted as EventListener,
      );
    };
  }, []);

  const handleStep1Next = (data: any) => {
    setFormData({ ...formData, ...data });
    setCurrentStep(2);
    // Scroll to top of form section so user can see step labels
    const element = document.getElementById("multi-step-form-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleStep2Next = (data: any) => {
    setFormData({ ...formData, ...data });
    setCurrentStep(3);
    // Scroll to top of form section so user can see step labels
    const element = document.getElementById("multi-step-form-section");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleStep2Back = () => {
    setCurrentStep(1);
  };

  const handleStep3Back = () => {
    setCurrentStep(2);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/quotes/charter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setReferenceNumber(data.referenceNumber);
        setShowSuccessModal(true);
        toast({
          title: "Quote Request Submitted!",
          description: `Your reference number is ${data.referenceNumber}. We'll contact you within 24 hours.`,
        });
      } else {
        toast({
          title: "Submission Failed",
          description:
            data.error || "Failed to submit quote request. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Charter quote submission error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setShowSuccessModal(false);
    setShowForm(false);
    setShowLoading(false);
    setCurrentStep(1);
    setFormData({});
    setHasProcessedSearch(false);
    setSearchDataProcessed(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Show the section if we have data to process or are already showing form/loading
  if (!showForm && !showLoading && !hasProcessedSearch) {
    return null;
  }

  return (
    <section id="multi-step-form-section" className="py-16 bg-white">
      <div className="w-full max-w-7xl mx-auto px-4">
        {/* Loading Animation - Full Width */}
        {showLoading && !showForm && (
          <div className="flex justify-center">
            <LoadingAnimation
              onComplete={() => {
                setShowLoading(false);
                setShowForm(true);
                setCurrentStep(1);
              }}
            />
          </div>
        )}

        {/* Form - Centered Layout */}
        {showForm && !showLoading && (
          <div className="flex justify-center w-full">
            <div className="w-full max-w-4xl">
              <MultiStepForm
                currentStep={currentStep}
                formData={formData}
                onStep1Next={handleStep1Next}
                onStep2Next={handleStep2Next}
                onStep2Back={handleStep2Back}
                onStep3Back={handleStep3Back}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            </div>
          </div>
        )}

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-8 border-b border-gray-200">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    {charterPageData.form.success.title}
                  </h3>
                  {referenceNumber && (
                    <p className="text-lg font-mono text-[#D4AF37] mb-2">
                      Reference: {referenceNumber}
                    </p>
                  )}
                  <p className="text-gray-600">
                    {charterPageData.form.success.description}
                  </p>
                </div>
              </div>

              {/* Disclaimer Content */}
              <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-3xl mx-auto">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                    Charter Agreement Terms & Disclaimer
                  </h4>
                  <div className="prose prose-sm max-w-none text-gray-600">
                    {charterPageData.disclaimer
                      .split("\n")
                      .map((paragraph: string, index: number) => (
                        <p key={index} className="mb-4 text-sm leading-relaxed">
                          {paragraph.trim()}
                        </p>
                      ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="text-center">
                  <Button
                    onClick={handleModalClose}
                    className="bg-[#D4AF37] text-[#0C0C0C] hover:bg-[#B8941F]"
                  >
                    {charterPageData.form.success.buttonText}
                  </Button>
                  <p className="text-xs text-gray-500 mt-3">
                    {charterPageData.form.success.disclaimer}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
