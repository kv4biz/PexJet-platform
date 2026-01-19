"use client";
import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { charterPageData } from "../../data";

export function CharterFAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-10">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-4">
          <h2 className="text-2xl lg:text-3xl mb-2">
            {charterPageData.charterFAQ.title}
          </h2>
        </div>

        {/* FAQ Accordion */}
        <div className="max-w-4xl mx-auto space-y-4">
          {charterPageData.charterFAQ.faq.map((faq, index) => (
            <div key={index} className="overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full p-2 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              >
                <span className="text-md pr-4">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="w-6 h-6  shrink-0" />
                ) : (
                  <ChevronDown className="w-6 h-6 shrink-0" />
                )}
              </button>

              {openIndex === index && (
                <div className="px-6 pb-2">
                  <div className="pt-4 border-t border-gray-300">
                    <p className="text-gray-700 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
