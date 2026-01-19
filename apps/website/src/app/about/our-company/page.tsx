"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Shield,
  Award,
  Heart,
  Globe,
  ArrowRight,
  Users,
  Star,
} from "lucide-react";
import { Button, Card, CardContent } from "@pexjet/ui";
import Navbar from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import NewsletterCTA from "@/components/home/NewsletterCTA";
import { aboutCompanyPageData } from "@/data";

const iconMap: Record<string, typeof Shield> = {
  Shield,
  Award,
  Heart,
  Globe,
  Users,
  Star,
};

export default function AboutCompanyPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="relative min-h-[60vh] flex items-center justify-center py-24 pt-32 overflow-hidden">
        <Image
          src={aboutCompanyPageData.hero.backgroundImage}
          alt="About PexJet"
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
              {aboutCompanyPageData.hero.title}
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto">
              {aboutCompanyPageData.hero.subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
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
                {aboutCompanyPageData.mission.title}
              </h2>
              <div className="w-24 h-1 bg-[#D4AF37] mb-8" />

              {aboutCompanyPageData.mission.paragraphs.map((p, index) => (
                <p
                  key={index}
                  className="text-gray-700 text-lg leading-relaxed mb-6"
                >
                  {p}
                </p>
              ))}

              <Button
                asChild
                className="bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90"
              >
                <Link href={aboutCompanyPageData.mission.cta.href}>
                  {aboutCompanyPageData.mission.cta.text}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
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
                src={aboutCompanyPageData.mission.image}
                alt={aboutCompanyPageData.mission.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-[#D4AF37]">
        <div className="w-full lg:w-10/12 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {aboutCompanyPageData.stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-bold mb-2 text-black">
                  {stat.value}
                </div>
                <div className="text-sm text-black/80">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-[#F7F7F7]">
        <div className="w-full lg:w-10/12 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-[#0C0C0C] mb-4 font-serif">
              {aboutCompanyPageData.values.title}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {aboutCompanyPageData.values.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {aboutCompanyPageData.values.items.map((value, index) => {
              const Icon = iconMap[value.icon];
              return (
                <motion.div
                  key={value.title}
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
                        {value.title}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {value.description}
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
