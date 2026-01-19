"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { homePageData } from "@/data";

export default function FleetPreview() {
  return (
    <section className="py-12 md:py-20 bg-white">
      <div className="w-full lg:w-10/12 mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl text-[#0C0C0C] mb-6 md:mb-8 text-center">
            {homePageData.fleetPreview.title}
          </h2>

          <div className="relative h-[280px] sm:h-[350px] md:h-[500px] overflow-hidden mb-4 md:mb-6">
            <img
              src={homePageData.fleetPreview.image}
              alt="Luxury Private Jet"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          </div>

          <div className="text-center max-w-3xl mx-auto mb-6 md:mb-8 px-2">
            <p className="text-gray-700 text-base md:text-lg leading-relaxed">
              {homePageData.fleetPreview.description}
            </p>
          </div>

          <div className="text-center">
            <a
              href={homePageData.fleetPreview.buttonLink}
              className="inline-flex items-center gap-2 text-[#0C0C0C] hover:text-[#D4AF37] transition-colors group"
            >
              <span className="border-b-2 border-[#D4AF37] pb-1 text-sm md:text-base">
                {homePageData.fleetPreview.buttonText}
              </span>
              <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
