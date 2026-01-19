// components/charter/ContactForm.tsx
"use client";

import React, { useState } from "react";
import { Button, Input } from "@pexjet/ui";
import { ArrowLeft, ArrowRight } from "lucide-react";

interface ContactFormProps {
  formData: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export function ContactForm({ formData, onNext, onBack }: ContactFormProps) {
  // Initialize with existing contact info if available
  const [contactInfo, setContactInfo] = useState({
    firstName: formData.contactInfo?.firstName || "",
    lastName: formData.contactInfo?.lastName || "",
    email: formData.contactInfo?.email || "",
    phone: formData.contactInfo?.phone || "",
    company: formData.contactInfo?.company || "",
    notes: formData.contactInfo?.notes || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext({ contactInfo });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Contact Information
        </h2>
        <p className="text-gray-600">
          Please provide your details so we can contact you
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <Input
              required
              value={contactInfo.firstName}
              onChange={(e) =>
                setContactInfo({ ...contactInfo, firstName: e.target.value })
              }
              placeholder="John"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <Input
              required
              value={contactInfo.lastName}
              onChange={(e) =>
                setContactInfo({ ...contactInfo, lastName: e.target.value })
              }
              placeholder="Doe"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <Input
              required
              type="email"
              value={contactInfo.email}
              onChange={(e) =>
                setContactInfo({ ...contactInfo, email: e.target.value })
              }
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone *
            </label>
            <Input
              required
              type="tel"
              value={contactInfo.phone}
              onChange={(e) =>
                setContactInfo({ ...contactInfo, phone: e.target.value })
              }
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company
          </label>
          <Input
            value={contactInfo.company}
            onChange={(e) =>
              setContactInfo({ ...contactInfo, company: e.target.value })
            }
            placeholder="Your company (optional)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes
          </label>
          <textarea
            value={contactInfo.notes}
            onChange={(e) =>
              setContactInfo({ ...contactInfo, notes: e.target.value })
            }
            placeholder="Any special requirements or notes..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
            rows={3}
          />
        </div>

        <div className="flex justify-between pt-6 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="border-gray-300"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button type="submit" variant={"outline"} className="bg-[#D4AF37]">
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </form>
    </div>
  );
}
