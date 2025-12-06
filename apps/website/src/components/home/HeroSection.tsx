"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { homePageData } from "@/data";

export default function HeroSection() {
  return (
    <section className="relative h-screen lg:h-[70vh] w-full overflow-hidden">
      {/* Image Background */}
      <div className="absolute inset-0 bg-[#0C0C0C]">
        <Image
          src={homePageData.hero.imageURL}
          alt="Private jet flying over clouds"
          fill
          priority
          className="object-cover lg:object-bottom"
        />

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center md:items-center">
        <div className="mx-auto px-6 pb-28 md:pb-32 w-full">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-center md:text-left"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-light leading-tight">
              <span className="text-white block font-serif">
                {homePageData.hero.title.line1}
              </span>
              <span className="text-[#D4AF37] block font-medium font-serif">
                {homePageData.hero.title.line2}
              </span>
            </h1>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.3, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-white/40 flex justify-center rounded-full pt-2">
          <motion.div
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-3 bg-white/60"
          />
        </div>
      </motion.div>
    </section>
  );
}
