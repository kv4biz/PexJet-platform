"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Banknote,
  FileCheck,
  Building2,
  Clock,
  Shield,
  HeartHandshake,
  Link as LinkIcon,
  Plane,
  ClipboardCheck,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { Button, Card, CardContent } from "@pexjet/ui";
import Navbar from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import NewsletterCTA from "@/components/home/NewsletterCTA";
import { aboutAssetPageData } from "@/data";

const financingIconMap: Record<string, typeof Banknote> = {
  Banknote,
  FileCheck,
  Building2,
  Clock,
  Shield,
  Handshake: HeartHandshake,
};

const whyChooseIconMap: Record<string, typeof LinkIcon> = {
  Link: LinkIcon,
  Plane,
  ClipboardCheck,
  CheckCircle,
};

export default function AssetAcquisitionPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center py-24 pt-32 overflow-hidden">
        <Image
          src={aboutAssetPageData.hero.backgroundImage}
          alt="Asset Acquisition"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/40" />

        <div className="relative z-10 w-full lg:w-10/12 mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center text-white"
          >
            <h1 className="text-5xl md:text-6xl mb-4 font-serif">
              {aboutAssetPageData.hero.title}
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto">
              {aboutAssetPageData.hero.subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Intro Section */}
      <section className="py-20 bg-white">
        <div className="w-full lg:w-10/12 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl md:text-5xl text-[#0C0C0C] mb-6 font-bold font-serif">
                {aboutAssetPageData.intro.title}
              </h2>
              <div className="w-24 h-1 bg-[#D4AF37] mb-8" />

              {aboutAssetPageData.intro.paragraphs.map((p, index) => (
                <p
                  key={index}
                  className="text-gray-700 text-lg leading-relaxed mb-6"
                >
                  {p}
                </p>
              ))}
            </motion.div>

            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative h-[500px]"
            >
              <Image
                src={aboutAssetPageData.intro.image}
                alt={aboutAssetPageData.intro.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Aviation Asset Acquisition */}
      <section className="py-20 bg-[#F7F7F7]">
        <div className="w-full lg:w-10/12 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Image */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative h-[500px] lg:order-1"
            >
              <Image
                src={aboutAssetPageData.aviation.image}
                alt="Aviation Assets"
                fill
                className="object-cover"
              />
            </motion.div>

            {/* Text Content */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="lg:order-2"
            >
              <h2 className="text-4xl md:text-5xl text-[#0C0C0C] mb-6 font-bold font-serif">
                {aboutAssetPageData.aviation.title}
              </h2>
              <div className="w-24 h-1 bg-[#D4AF37] mb-8" />

              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                {aboutAssetPageData.aviation.description}
              </p>

              <div className="space-y-3 mb-6">
                <h4 className="text-lg font-semibold text-[#0C0C0C]">
                  We support acquisition of:
                </h4>
                {aboutAssetPageData.aviation.items.map((item, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-[#D4AF37]" />
                    <span className="text-gray-700">{item}</span>
                  </div>
                ))}
              </div>

              <p className="text-gray-600 italic">
                {aboutAssetPageData.aviation.services}
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Financing Options */}
      <section className="py-20 bg-white">
        <div className="w-full lg:w-10/12 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#0C0C0C] mb-4 font-serif">
              {aboutAssetPageData.financing.title}
            </h2>
            <p className="text-gray-600 max-w-3xl mx-auto">
              {aboutAssetPageData.financing.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {aboutAssetPageData.financing.items.map((item, index) => {
              const Icon = financingIconMap[item.icon];
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full border-0 shadow-lg bg-white">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 bg-[#D4AF37]/10 flex items-center justify-center mb-4">
                        {Icon && <Icon className="h-6 w-6 text-[#D4AF37]" />}
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-[#0C0C0C]">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-12 p-6 bg-[#D4AF37]/10 border border-[#D4AF37]/20 text-center"
          >
            <p className="text-gray-700">{aboutAssetPageData.financing.note}</p>
          </motion.div>
        </div>
      </section>

      {/* Beyond Aviation */}
      <section className="py-20 bg-[#0C0C0C] text-white">
        <div className="w-full lg:w-10/12 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 font-serif">
              {aboutAssetPageData.beyondAviation.title}
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              {aboutAssetPageData.beyondAviation.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {aboutAssetPageData.beyondAviation.items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="flex items-center gap-3 p-4 bg-white/5 border border-white/10"
              >
                <CheckCircle className="w-5 h-5 text-[#D4AF37] flex-shrink-0" />
                <span className="text-gray-200">{item}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-white">
        <div className="w-full lg:w-10/12 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#0C0C0C] mb-4 font-serif">
              {aboutAssetPageData.whyChooseUs.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {aboutAssetPageData.whyChooseUs.items.map((item, index) => {
              const Icon = whyChooseIconMap[item.icon];
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full border-0 shadow-lg text-center bg-white">
                    <CardContent className="p-6">
                      <div className="w-14 h-14 mx-auto mb-4 bg-[#D4AF37]/10 flex items-center justify-center">
                        {Icon && <Icon className="h-7 w-7 text-[#D4AF37]" />}
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-[#0C0C0C]">
                        {item.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <NewsletterCTA />
      <Footer />
    </main>
  );
}
