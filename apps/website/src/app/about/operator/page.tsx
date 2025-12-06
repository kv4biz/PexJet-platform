"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Shield,
  CreditCard,
  Headphones,
  BarChart,
  Globe,
  CheckCircle,
  ArrowRight,
  Mail,
} from "lucide-react";
import { Button, Card, CardContent } from "@pexjet/ui";
import Navbar from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import NewsletterCTA from "@/components/home/NewsletterCTA";
import { aboutOperatorPageData } from "@/data";

const iconMap: Record<string, typeof TrendingUp> = {
  TrendingUp,
  Shield,
  CreditCard,
  Headphones,
  BarChart,
  Globe,
};

export default function AboutOperatorPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center py-24 pt-32 overflow-hidden">
        <Image
          src={aboutOperatorPageData.hero.backgroundImage}
          alt="Partner with PexJet"
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
              {aboutOperatorPageData.hero.title}
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto">
              {aboutOperatorPageData.hero.subtitle}
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
                {aboutOperatorPageData.intro.title}
              </h2>
              <div className="w-24 h-1 bg-[#D4AF37] mb-8" />

              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                {aboutOperatorPageData.intro.description}
              </p>
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
                src={aboutOperatorPageData.intro.image}
                alt={aboutOperatorPageData.intro.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 bg-[#F7F7F7]">
        <div className="w-full lg:w-10/12 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#0C0C0C] mb-4 font-serif">
              {aboutOperatorPageData.benefits.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {aboutOperatorPageData.benefits.items.map((benefit, index) => {
              const Icon = iconMap[benefit.icon];
              return (
                <motion.div
                  key={benefit.title}
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
                        {benefit.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {benefit.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="py-20 bg-white">
        <div className="w-full lg:w-10/12 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#0C0C0C] mb-4 font-serif">
              {aboutOperatorPageData.process.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {aboutOperatorPageData.process.steps.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-5xl font-bold text-[#D4AF37]/30 mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2 text-[#0C0C0C]">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-20 bg-[#F7F7F7]">
        <div className="w-full lg:w-10/12 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-[#0C0C0C] mb-8 text-center font-serif">
              {aboutOperatorPageData.requirements.title}
            </h2>
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-8">
                <h4 className="text-xl font-semibold text-[#0C0C0C] mb-6">
                  Operator Partnership Requirements:
                </h4>
                <ul className="space-y-4">
                  {aboutOperatorPageData.requirements.items.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-[#D4AF37] flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{item}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 p-4 bg-[#D4AF37]/10 border border-[#D4AF37]/20">
                  <p className="text-gray-700 text-sm mb-4">
                    <strong>
                      Ready to expand your reach and grow your business? Partner
                      with PexJet today.
                    </strong>
                  </p>
                  <Button
                    asChild
                    className="bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90"
                  >
                    <Link href="/contact">
                      <Mail className="w-4 h-4 mr-2" />
                      Contact Partnerships
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <NewsletterCTA />
      <Footer />
    </main>
  );
}
