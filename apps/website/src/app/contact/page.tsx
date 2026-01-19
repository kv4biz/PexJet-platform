"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";
import { Button, Card, CardContent } from "@pexjet/ui";
import Navbar from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import NewsletterCTA from "@/components/home/NewsletterCTA";
import { contactPageData } from "@/data";

const iconMap: Record<string, typeof Phone> = {
  Phone,
  Mail,
  MapPin,
  Clock,
};

const socialIconMap: Record<string, typeof Facebook> = {
  Facebook,
  Twitter,
  Instagram,
  LinkedIn: Linkedin,
};

export default function ContactPage() {
  // Build WhatsApp URL
  const whatsappUrl = `https://wa.me/${contactPageData.whatsapp.phoneNumber}?text=${encodeURIComponent(contactPageData.whatsapp.defaultMessage)}`;

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center py-24 pt-32 overflow-hidden">
        <Image
          src={contactPageData.hero.backgroundImage}
          alt={contactPageData.hero.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />

        <div className="relative z-10 w-full lg:w-10/12 mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center text-white"
          >
            <h1 className="text-5xl md:text-6xl mb-4 font-serif">
              {contactPageData.hero.title}
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 max-w-3xl mx-auto">
              {contactPageData.hero.subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20">
        <div className="w-full lg:w-10/12 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* WhatsApp CTA - Primary Contact Method */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl text-[#0C0C0C] mb-6 font-serif">
                Start a Conversation
              </h2>
              <p className="text-gray-600 mb-8">
                The fastest way to reach us is through WhatsApp. Our team
                responds instantly to help you with your private aviation needs.
              </p>

              {/* Large WhatsApp CTA */}
              <Card className="bg-[#25D366]/10 border-2 border-[#25D366] mb-8">
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 bg-[#25D366] flex items-center justify-center">
                      <MessageCircle className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl text-[#0C0C0C] font-semibold">
                        {contactPageData.whatsapp.title}
                      </h3>
                      <p className="text-gray-600">
                        {contactPageData.whatsapp.description}
                      </p>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-6">
                    Click below to start a WhatsApp conversation with our
                    concierge team. We&apos;re available 24/7 to assist with:
                  </p>

                  <ul className="space-y-2 mb-6 text-gray-700">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#25D366]" />
                      Charter flight inquiries & quotes
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#25D366]" />
                      Empty leg deal bookings
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#25D366]" />
                      Aircraft management questions
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#25D366]" />
                      General support & assistance
                    </li>
                  </ul>

                  <Button
                    asChild
                    size="lg"
                    className="w-full bg-[#25D366] text-white hover:bg-[#25D366]/90 text-lg py-6"
                  >
                    <Link
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      {contactPageData.whatsapp.buttonText}
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Social Media */}
              <div>
                <h3 className="text-[#0C0C0C] mb-4 font-semibold">Follow Us</h3>
                <div className="flex gap-4">
                  {contactPageData.socialMedia.map((social) => {
                    const Icon = socialIconMap[social.platform];
                    return (
                      <Link
                        key={social.platform}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-12 h-12 border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37] hover:text-white transition-all flex items-center justify-center"
                      >
                        {Icon && <Icon className="w-5 h-5" />}
                      </Link>
                    );
                  })}
                </div>
              </div>
            </motion.div>

            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl text-[#0C0C0C] mb-6 font-serif">
                  {contactPageData.mainHeading.title}
                </h2>
                <p className="text-gray-600 mb-8">
                  {contactPageData.mainHeading.description}
                </p>
              </div>

              {/* Contact Details */}
              <div className="space-y-6">
                {contactPageData.contactInfo.map((info, index) => {
                  const Icon = iconMap[info.icon];

                  // Handle phone info with multiple numbers
                  if ("phones" in info && info.phones) {
                    return (
                      <motion.div
                        key={info.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className="flex items-start gap-4 p-6 bg-[#F7F7F7]">
                          {Icon && (
                            <Icon className="w-6 h-6 text-[#D4AF37] shrink-0 mt-1" />
                          )}
                          <div>
                            <h3 className="text-[#0C0C0C] mb-2 font-semibold">
                              {info.title}
                            </h3>
                            {info.phones.map((phone, phoneIdx) => (
                              <Link
                                key={phoneIdx}
                                href={phone.href}
                                className="block text-gray-700 hover:text-[#D4AF37] transition-colors"
                              >
                                {phone.details[0]}
                              </Link>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    );
                  }

                  // Handle other contact info with details array
                  const content = (
                    <div className="flex items-start gap-4 p-6 bg-[#F7F7F7]">
                      {Icon && (
                        <Icon className="w-6 h-6 text-[#D4AF37] shrink-0 mt-1" />
                      )}
                      <div>
                        <h3 className="text-[#0C0C0C] mb-2 font-semibold">
                          {info.title}
                        </h3>
                        {"details" in info &&
                          info.details?.map((detail) => (
                            <p key={detail} className="text-gray-700">
                              {detail}
                            </p>
                          ))}
                      </div>
                    </div>
                  );

                  return (
                    <motion.div
                      key={info.title}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      {"href" in info && info.href ? (
                        <Link
                          href={info.href}
                          className="block hover:bg-[#F0F0F0] transition-colors"
                        >
                          {content}
                        </Link>
                      ) : (
                        content
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Map Section */}
      <section className="py-0">
        <div className="w-full h-96 bg-gray-200">
          <iframe
            src={contactPageData.map.embedUrl}
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={contactPageData.map.title}
          />
        </div>
      </section>

      <NewsletterCTA />
      <Footer />
    </main>
  );
}
