"use client";

import { motion } from "framer-motion";
import { homePageData } from "@/data";

export default function MembershipBanner() {
  return (
    <section className="py-0 bg-white">
      <div className="relative h-[450px] sm:h-[550px] md:h-[650px] lg:h-[750px] overflow-hidden">
        {/* Background Image - Full Coverage */}
        <img
          src={homePageData.membership.image}
          alt="Executive lifestyle"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Gradient Overlay - Desktop: left to right (transparent to black) */}
        <div className="hidden md:block absolute inset-0 bg-gradient-to-r from-transparent via-black/70 to-black" />

        {/* Gradient Overlay - Mobile: bottom to top (transparent to black) */}
        <div className="md:hidden absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />

        {/* Content Overlay */}
        <div className="absolute inset-0 flex items-end md:items-center pb-8 md:pb-0">
          <div className="w-full lg:w-10/12 mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto md:ml-auto md:mr-0 text-center md:text-right">
              <motion.img
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                src={"/white-gold.png"}
                alt="PexJet"
                className="h-12 sm:h-16 md:h-20 w-auto mx-auto md:ml-auto md:mr-0 mb-3 md:mb-4 drop-shadow-2xl"
              />

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-[#D4AF37] text-lg sm:text-xl md:text-2xl mb-3 md:mb-4 tracking-widest"
              >
                {homePageData.membership.badge}
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="text-white text-base sm:text-lg md:text-xl mb-4 md:mb-8 leading-relaxed px-2 sm:px-0"
              >
                {homePageData.membership.description}
              </motion.p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
