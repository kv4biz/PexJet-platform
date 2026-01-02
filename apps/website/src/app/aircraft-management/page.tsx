"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@pexjet/ui";
import Navbar from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import NewsletterCTA from "@/components/home/NewsletterCTA";
import { aircraftManagementPageData } from "@/data";

export default function AircraftManagementPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      {/* Hero Section */}
      <section className="relative min-h-screen bg-[#0C0C0C] overflow-hidden lg:-mt-20 py-10">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0C0C0C] via-[#1a1a1a] to-[#0C0C0C]" />

        <div className="relative z-10 px-2">
          {/* Jet Image - 4/5 width on large screens, full on small, aligned right on large */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full lg:w-4/5 lg:ml-auto"
          >
            <div className="relative flex justify-center lg:justify-end">
              {/* Gold glow effect behind jet */}
              <div className="absolute inset-0 bg-[#D4AF37]/10 blur-3xl scale-75" />
              <img
                src={aircraftManagementPageData.hero.image}
                alt="Private Jet"
                className="relative w-full h-auto object-cover drop-shadow-2xl"
              />
            </div>
          </motion.div>

          {/* Text Row - Two Columns */}
          <div className="w-full lg:w-3/4 mx-auto px-2 sm:px-4 lg:px-4 py-2">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 lg:gap-0 items-start">
              {/* Column 1: Headlines */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                <span className="text-4xl md:text-6xl font-extrabold lg:text-6xl text-white block">
                  You Own a Jet.
                </span>
                <span className="text-4xl md:text-6xl lg:text-6xl font-semibold text-[#D4AF37] block">
                  We Manage It.
                </span>
              </motion.div>

              {/* Column 2: Description */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                <p className="text-gray-300 text-lg leading-relaxed mb-8">
                  {aircraftManagementPageData.hero.description}
                </p>
                <a
                  href="https://wa.me/2348182113089?text=Hello!%20I%20would%20like%20to%20speak%20with%20a%20PEXJET%20advisor%20about%20aircraft%20management."
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button>{aircraftManagementPageData.hero.cta}</Button>
                </a>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section - What is Aircraft Management? */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        {/* Background image - very translucent */}
        <div className="absolute inset-0">
          <img
            src="https://res.cloudinary.com/dikzx4eyh/image/upload/v1767369821/beautiful-blue-sky-and-white-cumulus-clouds-abstract-background-cloudscape-background-blue-sky-and-fluffy-white-clouds-on-sunny-day-nature-weather-cotton-feel-texture-white-soft-clouds-background-free-photo_k9dofz.jpg"
            alt=""
            className="w-full h-full object-cover opacity-25"
          />
        </div>
        {/* White overlay to keep it bright */}
        <div className="absolute inset-0 bg-white/90" />

        <div className="relative z-10 w-full lg:w-10/12 mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className=" text-center lg:text-left"
          >
            <span className="text-2xl md:text-4xl lg:text-5xl font-semibold text-[#0C0C0C] block mb-8">
              {aircraftManagementPageData.about.headline}
            </span>
            <p className="text-[#0C0C0C] text-lg md:text-xl leading-relaxed max-w-4xl">
              {aircraftManagementPageData.about.description}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 lg:py-28 bg-white">
        <div className="w-full lg:w-10/12 mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Title */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <span className="text-2xl md:text-4xl lg:text-5xl font-semibold text-[#0C0C0C] block">
              {aircraftManagementPageData.services.headline}
            </span>
          </motion.div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {aircraftManagementPageData.services.items.map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative h-[400px] overflow-hidden group"
              >
                {/* Background Image */}
                <img
                  src={service.image}
                  alt={service.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Translucent Black Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />

                {/* Text Content at Bottom */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <span className="text-xl font-semibold block mb-2">
                    {service.title}
                  </span>
                  <p className="text-sm text-gray-200 leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <NewsletterCTA />

      <Footer />
    </div>
  );
}
