"use client";

import Link from "next/link";
import Image from "next/image";
import {
  MapPin,
  Phone,
  Mail,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
} from "lucide-react";
import { footerData } from "@/data";

// Icon mapping for social media
const socialIcons: Record<string, typeof Facebook> = {
  Facebook: Facebook,
  Twitter: Twitter,
  Instagram: Instagram,
  LinkedIn: Linkedin,
};

export function Footer() {
  return (
    <footer className="bg-[#0C0C0C] text-white pt-10 md:pt-16 pb-6 md:pb-8">
      <div className="w-full lg:w-10/12 mx-auto px-4">
        {/* Main Footer Content */}
        <div className="flex flex-col lg:flex-row items-start lg:items-end gap-8 lg:gap-10 mb-8 md:mb-12">
          {/* Logo & Description */}
          <div className="w-full lg:w-auto">
            <Image
              src={footerData.logo}
              alt="PexJet"
              width={120}
              height={40}
              className="h-8 md:h-10 w-auto mb-3 md:mb-4"
            />
            <p className="text-gray-400 mb-4 md:mb-6 max-w-xs text-sm md:text-base">
              {footerData.description}
            </p>

            {/* Contact Info */}
            <div className="space-y-2 md:space-y-3 text-sm w-full">
              <div className="flex items-start gap-3 text-gray-400">
                <MapPin className="w-4 h-4 mt-1 flex-shrink-0" />
                <span>
                  {footerData.contactInfo.address.line1}
                  <br />
                  {footerData.contactInfo.address.line2}
                </span>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Phone className="w-4 h-4 flex-shrink-0" />
                <a
                  href={`tel:${footerData.contactInfo.phone.replace(/\s/g, "")}`}
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  {footerData.contactInfo.phone}
                </a>
              </div>
              <div className="flex items-center gap-3 text-gray-400">
                <Mail className="w-4 h-4 flex-shrink-0" />
                <a
                  href={`mailto:${footerData.contactInfo.email}`}
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  {footerData.contactInfo.email}
                </a>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="flex flex-wrap lg:flex-nowrap gap-10 lg:gap-16 lg:flex-1 lg:justify-end">
            {Object.entries(footerData.links).map(([category, links]) => (
              <div key={category} className="min-w-[140px]">
                <h3 className="text-[#D4AF37] mb-4 font-medium tracking-wider uppercase text-sm">
                  {category}
                </h3>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-gray-400 hover:text-white text-sm transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Copyright */}
            <p className="text-gray-500 text-sm text-center md:text-left">
              {footerData.copyright}
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-4">
              {footerData.socialMedia.map((social) => {
                const Icon = socialIcons[social.platform];
                return (
                  <a
                    key={social.platform}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={social.platform}
                    className="w-10 h-10 border border-gray-700 flex items-center justify-center text-gray-400 hover:text-[#D4AF37] hover:border-[#D4AF37] transition-all"
                  >
                    {Icon && <Icon className="w-5 h-5" />}
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
