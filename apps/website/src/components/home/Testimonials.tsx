"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, User } from "lucide-react";
import { homePageData } from "@/data";

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const testimonials = homePageData.testimonials.items;

  // Auto-slide functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [testimonials.length]);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prev = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + testimonials.length) % testimonials.length,
    );
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="py-12 md:py-20 bg-white">
      <div className="w-full lg:w-10/12 mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8 md:mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl text-[#0C0C0C] mb-3 md:mb-4">
            {homePageData.testimonials.title}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto text-sm md:text-base">
            {homePageData.testimonials.subtitle}
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="bg-[#F7F7F7] p-5 sm:p-8 md:p-12 border-2 border-[#D4AF37]"
              >
                {/* Quote */}
                <p className="text-gray-700 text-base sm:text-lg md:text-xl mb-6 md:mb-8 leading-relaxed text-center">
                  &ldquo;{currentTestimonial.quote}&rdquo;
                </p>

                {/* Author */}
                <div className="flex items-center justify-center gap-3 md:gap-4 pt-4 md:pt-6 border-t border-gray-300">
                  <div className="w-12 h-12 md:w-14 md:h-14 bg-[#D4AF37]/20 flex items-center justify-center">
                    <User className="w-6 h-6 md:w-7 md:h-7 text-[#D4AF37]" />
                  </div>
                  <div className="text-center md:text-left">
                    <div className="font-semibold text-[#0C0C0C]">
                      {currentTestimonial.author}
                    </div>
                    <div className="text-sm text-gray-600">
                      {currentTestimonial.role}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows - Hidden on mobile, shown on md+ */}
            <button
              onClick={prev}
              className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-16 w-12 h-12 border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white transition-all items-center justify-center"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={next}
              className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-16 w-12 h-12 border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white transition-all items-center justify-center"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Mobile Navigation Arrows */}
          <div className="flex md:hidden justify-center gap-4 mt-6">
            <button
              onClick={prev}
              className="w-10 h-10 border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white transition-all flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={next}
              className="w-10 h-10 border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white transition-all flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center gap-2 mt-4 md:mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 transition-all ${
                  index === currentIndex ? "bg-[#D4AF37] w-8" : "bg-gray-300"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
