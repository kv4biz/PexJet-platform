"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger, Button } from "@pexjet/ui";
import { navbarData } from "@/data";

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileActiveDropdown, setMobileActiveDropdown] = useState<
    string | null
  >(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-white/95 backdrop-blur-sm shadow-sm py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* ----------------------- LOGO ----------------------- */}
          <Link href="/" className="shrink-0">
            <Image
              src={navbarData.logoWhite}
              alt="PexJet"
              width={120}
              height={40}
              className={`h-10 w-auto transition-opacity ${isScrolled ? "hidden" : "block"}`}
            />
            <Image
              src={navbarData.logoBlack}
              alt="PexJet"
              width={120}
              height={40}
              className={`h-10 w-auto transition-opacity ${isScrolled ? "block" : "hidden"}`}
            />
          </Link>

          {/* ----------------------- DESKTOP NAV + MOBILE TOGGLE ----------------------- */}
          <div className="flex items-center space-x-4 xl:space-x-8">
            {/* Desktop nav items */}
            <div className="hidden lg:flex items-center space-x-4 xl:space-x-8">
              {navbarData.navItems.map((item) => (
                <div key={item.label} className="relative group">
                  {item.dropdown ? (
                    <>
                      <button
                        className={`flex items-center gap-1 transition-colors uppercase text-sm tracking-wide ${
                          isScrolled
                            ? "text-foreground hover:text-primary"
                            : "text-white hover:text-primary"
                        }`}
                      >
                        {item.label}
                        <ChevronDown className="w-4 h-4" />
                      </button>

                      <div className="absolute top-full left-0 mt-2 w-56 bg-white shadow-lg border-t-2 border-primary py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                        {item.dropdown.map((sub) => (
                          <Link
                            key={sub.label}
                            href={sub.href}
                            className="block px-4 py-2 text-foreground hover:bg-primary/10 hover:text-primary uppercase text-sm"
                          >
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    </>
                  ) : (
                    <Link
                      href={item.href!}
                      className={`uppercase text-sm tracking-wide transition-colors ${
                        isScrolled
                          ? "text-foreground hover:text-primary"
                          : "text-white hover:text-primary"
                      }`}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}

              {/* CTA */}
              <Link
                href={navbarData.ctaButton.href}
                className="px-6 py-2 bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-wide transition-all"
              >
                {navbarData.ctaButton.text}
              </Link>
            </div>

            {/* ----------------------- MOBILE NAV ----------------------- */}
            <div className="lg:hidden">
              {/* Mobile Menu Button */}
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={`bg-transparent ${
                      isScrolled ? "text-foreground" : "text-white"
                    }`}
                  >
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>

                <SheetContent side="right" className="w-[300px] bg-white p-0">
                  <div className="flex flex-col h-full">
                    {/* Logo in mobile menu */}
                    <div className="p-6 border-b border-gray-200">
                      <Link href="/" onClick={() => setMobileOpen(false)}>
                        <Image
                          src={navbarData.logoBlack}
                          alt="PexJet"
                          width={100}
                          height={32}
                          className="h-8 w-auto"
                        />
                      </Link>
                    </div>

                    <div className="flex-1 overflow-y-auto py-6">
                      <nav className="space-y-1">
                        {navbarData.navItems.map((item) => (
                          <div key={item.label}>
                            {item.dropdown ? (
                              <>
                                <button
                                  onClick={() =>
                                    setMobileActiveDropdown(
                                      mobileActiveDropdown === item.label
                                        ? null
                                        : item.label,
                                    )
                                  }
                                  className="w-full flex items-center justify-between px-6 py-3 text-foreground hover:bg-primary/10 uppercase text-sm"
                                >
                                  {item.label}
                                  <ChevronDown
                                    className={`w-4 h-4 transition-transform ${
                                      mobileActiveDropdown === item.label
                                        ? "rotate-180"
                                        : ""
                                    }`}
                                  />
                                </button>

                                {mobileActiveDropdown === item.label && (
                                  <div className="bg-muted py-2">
                                    {item.dropdown.map((sub) => (
                                      <Link
                                        key={sub.label}
                                        href={sub.href}
                                        onClick={() => setMobileOpen(false)}
                                        className="block px-10 py-2 text-sm text-muted-foreground hover:text-primary uppercase"
                                      >
                                        {sub.label}
                                      </Link>
                                    ))}
                                  </div>
                                )}
                              </>
                            ) : (
                              <Link
                                href={item.href!}
                                onClick={() => setMobileOpen(false)}
                                className="block px-6 py-3 text-foreground hover:bg-primary/10 uppercase text-sm"
                              >
                                {item.label}
                              </Link>
                            )}
                          </div>
                        ))}
                      </nav>
                    </div>

                    {/* CTA Button */}
                    <div className="p-6 border-t border-gray-200">
                      <Link
                        href={navbarData.ctaButton.href}
                        onClick={() => setMobileOpen(false)}
                        className="block w-full text-center px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/90 uppercase tracking-wide transition-all"
                      >
                        {navbarData.ctaButton.text}
                      </Link>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
