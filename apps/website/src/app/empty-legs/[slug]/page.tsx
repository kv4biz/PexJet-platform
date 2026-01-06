"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
// Helper functions for LT (local time) formatting - no timezone conversion
function formatDateLT(dateString: string): string {
  if (!dateString) return "TBD";
  try {
    const match = dateString.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (!match) return "TBD";
    const [, year, month, day] = match;
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthName = months[parseInt(month) - 1];
    return `${monthName} ${parseInt(day)}, ${year}`;
  } catch {
    return "TBD";
  }
}

function formatTimeLT(dateString: string): string {
  if (!dateString) return "TBD";
  try {
    const match = dateString.match(/T?(\d{2}):(\d{2})/);
    if (!match) return "TBD";
    const [, hours, minutes] = match;
    return `${hours}:${minutes}`; // 24-hour format, no AM/PM
  } catch {
    return "TBD";
  }
}
import {
  Plane,
  Calendar,
  Users,
  ArrowLeft,
  Clock,
  Tag,
  Check,
  ArrowRight,
  Loader2,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Input,
  Badge,
  Label,
  useToast,
  Textarea,
} from "@pexjet/ui";
import { emptyLegsPageData } from "@/data";
import Footer from "@/components/layout/footer";
import { FlightRouteMap } from "@/components/empty-leg/FlightRouteMap";

interface EmptyLegDetail {
  id: string;
  slug: string;
  departureAirport: {
    id: string;
    name: string;
    city: string;
    region: string;
    country: string;
    iataCode: string;
    icaoCode: string;
    latitude?: number;
    longitude?: number;
  };
  arrivalAirport: {
    id: string;
    name: string;
    city: string;
    region: string;
    country: string;
    iataCode: string;
    icaoCode: string;
    latitude?: number;
    longitude?: number;
  };
  departureDate: string;
  aircraft: {
    id: string;
    name: string;
    manufacturer: string;
    model: string;
    category: string;
    maxPassengers: number;
    images: string[];
  };
  availableSeats: number;
  totalSeats: number;
  priceUsd: number | null;
  priceText: string;
  priceType: string;
  ownerType: "admin" | "operator";
  createdByAdminId: string | null;
  createdByOperatorId: string | null;
  // InstaCharter operator information
  operatorName?: string;
  operatorEmail?: string;
  operatorPhone?: string;
  operatorWebsite?: string;
  operatorRating?: number;
  source?: string; // To distinguish InstaCharter deals
}

interface ContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  notes?: string;
}

export default function EmptyLegDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const slug = params.slug as string;

  // State
  const [emptyLeg, setEmptyLeg] = useState<EmptyLegDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Multi-step form
  const [currentStep, setCurrentStep] = useState(1);
  const [seatsRequested, setSeatsRequested] = useState(1);
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    notes: "",
  });

  // Success state
  const [showSuccess, setShowSuccess] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("");

  useEffect(() => {
    if (slug) {
      fetchEmptyLegDetail();
    }
  }, [slug]);

  // Add JSON-LD structured data for SEO
  useEffect(() => {
    if (!emptyLeg) return;

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "Product",
      name: `Private Jet ${emptyLeg.departureAirport.city} to ${emptyLeg.arrivalAirport.city}`,
      description: `Empty leg flight from ${emptyLeg.departureAirport.city}, ${emptyLeg.departureAirport.country} to ${emptyLeg.arrivalAirport.city}, ${emptyLeg.arrivalAirport.country} on ${emptyLeg.aircraft.name}. ${emptyLeg.priceText || "Contact for pricing"}.`,
      image:
        emptyLeg.aircraft.images?.[0] ||
        "https://res.cloudinary.com/dikzx4eyh/image/upload/v1764998923/pixverse-i2i-ori-9076e189-b32b-46cc-8701-506838512428_lkeyv0.png",
      brand: {
        "@type": "Brand",
        name: "PexJet",
      },
      offers: {
        "@type": "Offer",
        url: `https://pexjet.com/empty-legs/${slug}`,
        priceCurrency: "USD",
        price: emptyLeg.priceUsd || 0,
        priceValidUntil: emptyLeg.departureDate,
        availability:
          emptyLeg.availableSeats > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/SoldOut",
        seller: {
          "@type": "Organization",
          name: "PexJet",
        },
      },
      additionalProperty: [
        {
          "@type": "PropertyValue",
          name: "Departure",
          value: `${emptyLeg.departureAirport.city}, ${emptyLeg.departureAirport.country}`,
        },
        {
          "@type": "PropertyValue",
          name: "Arrival",
          value: `${emptyLeg.arrivalAirport.city}, ${emptyLeg.arrivalAirport.country}`,
        },
        {
          "@type": "PropertyValue",
          name: "Aircraft",
          value: emptyLeg.aircraft.name,
        },
        {
          "@type": "PropertyValue",
          name: "Available Seats",
          value: emptyLeg.availableSeats,
        },
      ],
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(jsonLd);
    script.id = "empty-leg-jsonld";

    // Remove existing script if any
    const existing = document.getElementById("empty-leg-jsonld");
    if (existing) existing.remove();

    document.head.appendChild(script);

    return () => {
      const el = document.getElementById("empty-leg-jsonld");
      if (el) el.remove();
    };
  }, [emptyLeg, slug]);

  const fetchEmptyLegDetail = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/empty-legs/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setEmptyLeg(data.emptyLeg);
      } else {
        router.push("/empty-legs");
      }
    } catch (error) {
      console.error("Failed to fetch empty leg:", error);
      router.push("/empty-legs");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (priceUsd: number | null, priceText?: string) => {
    if (priceText) return priceText;
    if (priceUsd === null || priceUsd === undefined) return "Contact for price";
    return `$${priceUsd.toLocaleString()}`;
  };

  // Calculate estimated flight time
  const calculateFlightTime = () => {
    if (!emptyLeg) return "N/A";
    const dep = emptyLeg.departureAirport;
    const arr = emptyLeg.arrivalAirport;

    // Handle InstaCharter deals where coordinates might be 0
    if (
      !dep.latitude ||
      !dep.longitude ||
      !arr.latitude ||
      !arr.longitude ||
      dep.latitude === 0 ||
      dep.longitude === 0 ||
      arr.latitude === 0 ||
      arr.longitude === 0
    ) {
      return "N/A";
    }

    // Haversine formula for distance in nautical miles
    const R = 3440.065;
    const dLat = ((arr.latitude - dep.latitude) * Math.PI) / 180;
    const dLon = ((arr.longitude - dep.longitude) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((dep.latitude * Math.PI) / 180) *
        Math.cos((arr.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceNm = R * c;

    // Average cruise speed ~450 knots + 30 min buffer
    const flightTimeHours = distanceNm / 450 + 0.5;
    const hours = Math.floor(flightTimeHours);
    const minutes = Math.round((flightTimeHours - hours) * 60);
    return `${hours}h ${minutes}m`;
  };

  const calculateTotalPrice = () => {
    if (!emptyLeg) return 0;
    return emptyLeg.priceUsd || 0; // Price is for full jet, not per seat
  };

  const handleContactChange = (field: keyof ContactInfo, value: string) => {
    setContactInfo((prev) => ({ ...prev, [field]: value }));
  };

  const isContactValid = () => {
    return (
      contactInfo.firstName.trim() !== "" &&
      contactInfo.lastName.trim() !== "" &&
      contactInfo.email.trim() !== "" &&
      contactInfo.phone.trim() !== ""
    );
  };

  const handleSubmit = async () => {
    if (!emptyLeg || !isContactValid()) return;

    setSubmitting(true);
    try {
      const response = await fetch("/api/quotes/empty-leg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          emptyLegId: emptyLeg.id,
          seatsRequested,
          contactInfo,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setReferenceNumber(data.referenceNumber);
        setShowSuccess(true);
        toast({
          title: "Quote Request Submitted!",
          description: `Your reference number is ${data.referenceNumber}`,
        });
      } else {
        toast({
          title: "Submission Failed",
          description: data.error || "Failed to submit quote request",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: "Contact Details" },
    { number: 2, title: "Review & Submit" },
  ];

  if (loading) {
    return (
      <main className="h-screen flex items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[#D4AF37]" />
          <p className="text-gray-600">Loading deal details...</p>
        </div>
      </main>
    );
  }

  if (!emptyLeg) {
    return (
      <main className="h-screen flex items-center justify-center">
        <div className="pt-32 pb-16 flex items-center justify-center">
          <div className="text-center">
            <Plane className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Deal Not Found</h2>
            <p className="text-gray-600 mb-6">
              This empty leg deal may no longer be available.
            </p>
            <Button asChild>
              <Link href="/empty-legs">Browse All Deals</Link>
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const totalPrice = calculateTotalPrice();

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Map Hero Section */}
      <section className="relative">
        {/* Back Button - Absolute positioned */}
        <div className="absolute top-4 left-4 z-20 hidden">
          <Button
            variant="ghost"
            asChild
            className="gap-2 bg-black/50 text-white hover:bg-black/70 hover:text-[#D4AF37]"
          >
            <Link href="/empty-legs">
              <ArrowLeft className="w-4 h-4" />
              Back to Empty Legs
            </Link>
          </Button>
        </div>

        {/* Route Header */}
        <div className="absolute top-20 left-0 right-0 z-10 text-center py-4">
          <div className="inline-flex items-center gap-3 bg-black/60 px-6 py-3 backdrop-blur-sm">
            <span className="text-white font-medium">
              {emptyLeg.departureAirport.city},{" "}
              {emptyLeg.departureAirport.country}
            </span>
            <Plane className="w-5 h-5 text-[#D4AF37] rotate-45" />
            <span className="text-white font-medium">
              {emptyLeg.arrivalAirport.city}, {emptyLeg.arrivalAirport.country}
            </span>
          </div>
        </div>

        {/* Flight Route Map */}
        <div className="h-[400px] md:h-[500px] relative z-0">
          <FlightRouteMap
            departureAirport={{
              ...emptyLeg.departureAirport,
              code:
                emptyLeg.departureAirport.iataCode ||
                emptyLeg.departureAirport.icaoCode,
            }}
            arrivalAirport={{
              ...emptyLeg.arrivalAirport,
              code:
                emptyLeg.arrivalAirport.iataCode ||
                emptyLeg.arrivalAirport.icaoCode,
            }}
            className="h-full"
          />
        </div>

        {/* Route Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent py-6">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
              <Badge className="bg-[#D4AF37] text-black text-sm px-4 py-1">
                {emptyLeg.priceType === "CONTACT"
                  ? "Contact for Price"
                  : "Special Offer"}
              </Badge>
              <h1 className="text-2xl md:text-3xl font-bold text-white text-center">
                {emptyLeg.departureAirport.city} →{" "}
                {emptyLeg.arrivalAirport.city}
              </h1>
              <p className="text-gray-300 text-sm md:text-base">
                {emptyLeg.aircraft.name} •{" "}
                {formatDateLT(emptyLeg.departureDate)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Back Link */}
      <div className="bg-gray-50 pt-4 px-4">
        <div className="container mx-auto">
          <Button
            variant="link"
            asChild
            className="text-gray-600 hover:text-[#D4AF37] p-0"
          >
            <Link href="/empty-legs">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Empty Legs
            </Link>
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <section className="py-4 md:py-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
            {/* Left Column - Deal Details & Form */}
            <div className="lg:col-span-2 space-y-4 md:space-y-6">
              {/* Deal Header */}
              <Card>
                <CardContent className="p-6">
                  {/* Discount Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <Badge className="bg-[#D4AF37] text-black text-lg px-4 py-1">
                      <Tag className="w-4 h-4 mr-2" />
                      {emptyLeg.priceType === "CONTACT"
                        ? "Contact for Price"
                        : "Special Offer"}
                    </Badge>
                  </div>

                  {/* Route */}
                  <div className="flex items-center justify-between py-6">
                    <div className=" flex-shrink-0 max-w-[100px] md:max-w-[200px] text-left">
                      <div className="text-2xl md:text-4xl font-bold">
                        {emptyLeg.departureAirport.iataCode ||
                          emptyLeg.departureAirport.icaoCode}
                      </div>
                      <div className="text-xs md:text-sm text-gray-600 mt-1">
                        {emptyLeg.departureAirport.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {emptyLeg.departureAirport.city ||
                          emptyLeg.departureAirport.region}
                        , {emptyLeg.departureAirport.country}
                      </div>
                    </div>
                    <div className="flex-1 px-2 md:px-8">
                      <div className="flex flex-col items-center">
                        <div className="flex items-center w-full">
                          <div className="h-px flex-1 bg-gray-300" />
                          <Plane className="h-6 w-6 md:h-8 md:w-8 mx-2 md:mx-4 text-[#D4AF37] rotate-45" />
                          <div className="h-px flex-1 bg-gray-300" />
                        </div>
                        <span className="text-xs text-gray-500 mt-1">
                          Est. {calculateFlightTime()}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 max-w-[100px] md:max-w-[200px]">
                      <div className="text-2xl md:text-4xl font-bold">
                        {emptyLeg.arrivalAirport.iataCode ||
                          emptyLeg.arrivalAirport.icaoCode}
                      </div>
                      <div className="text-xs md:text-sm text-gray-600 mt-1">
                        {emptyLeg.arrivalAirport.name}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {emptyLeg.arrivalAirport.city ||
                          emptyLeg.arrivalAirport.region}
                        , {emptyLeg.arrivalAirport.country}
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
                    <div className="text-center p-3 bg-gray-50">
                      <Calendar className="w-5 h-5 mx-auto mb-1 text-[#D4AF37]" />
                      <div className="text-sm text-gray-500">Date</div>
                      <div className="font-semibold">
                        {formatDateLT(emptyLeg.departureDate)}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50">
                      <Clock className="w-5 h-5 mx-auto mb-1 text-[#D4AF37]" />
                      <div className="text-sm text-gray-500">Time</div>
                      <div className="font-semibold">
                        {formatTimeLT(emptyLeg.departureDate)} LT
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50">
                      <Users className="w-5 h-5 mx-auto mb-1 text-[#D4AF37]" />
                      <div className="text-sm text-gray-500">Capacity</div>
                      <div className="font-semibold">
                        {emptyLeg.availableSeats}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-gray-50">
                      <Plane className="w-5 h-5 mx-auto mb-1 text-[#D4AF37] rotate-45" />
                      <div className="text-sm text-gray-500">Aircraft</div>
                      <div className="font-semibold text-sm">
                        {emptyLeg.aircraft.name}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* mobile & medium only*/}
              <div className="lg:col-span-1 lg:hidden block">
                <div className="">
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-lg mb-4">
                        Deal Summary
                      </h3>

                      {/* Aircraft Image */}
                      {emptyLeg.aircraft.images?.[0] && (
                        <div className="mb-4 overflow-hidden">
                          <img
                            src={emptyLeg.aircraft.images[0]}
                            alt={emptyLeg.aircraft.name}
                            className="w-full h-48 object-cover"
                          />
                        </div>
                      )}

                      {/* Details */}
                      <div className="py-3 space-y-2 text-sm border-b">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Date</span>
                          <span>{formatDateLT(emptyLeg.departureDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Time</span>
                          <span>{formatTimeLT(emptyLeg.departureDate)} LT</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Aircraft</span>
                          <span className="font-medium">
                            {emptyLeg.aircraft.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Category</span>
                          <span>{emptyLeg.aircraft.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Capacity</span>
                          <span>{emptyLeg.availableSeats}</span>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="pt-4">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Price</span>
                          <span className="text-2xl font-semibold capitalize text-[#D4AF37]">
                            {formatPrice(emptyLeg.priceUsd, emptyLeg.priceText)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
              {/* Multi-Step Form */}
              {!showSuccess ? (
                <Card>
                  <CardContent className="p-6">
                    {/* Step Indicator */}
                    <div className="flex justify-center mb-8">
                      <div className="flex items-center gap-4">
                        {steps.map((step, index) => (
                          <div key={step.number} className="flex items-center">
                            <div className="flex flex-col items-center">
                              <div
                                className={`w-10 h-10 flex items-center justify-center border-2 ${
                                  currentStep >= step.number
                                    ? "bg-[#D4AF37] border-[#D4AF37] text-white"
                                    : "border-gray-300 text-gray-300"
                                }`}
                              >
                                {currentStep > step.number ? (
                                  <Check className="w-5 h-5" />
                                ) : (
                                  step.number
                                )}
                              </div>
                              <span
                                className={`mt-2 text-sm ${
                                  currentStep >= step.number
                                    ? "text-[#D4AF37]"
                                    : "text-gray-400"
                                }`}
                              >
                                {step.title}
                              </span>
                            </div>
                            {index < steps.length - 1 && (
                              <div
                                className={`w-16 h-1 mx-2 ${
                                  currentStep > step.number
                                    ? "bg-[#D4AF37]"
                                    : "bg-gray-300"
                                }`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Step 1: Contact Details */}
                    {currentStep === 1 && (
                      <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-center mb-6">
                          Enter Your Contact Details
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm font-medium mb-1 block">
                              First Name *
                            </Label>
                            <Input
                              value={contactInfo.firstName}
                              onChange={(e) =>
                                handleContactChange("firstName", e.target.value)
                              }
                              placeholder="John"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-1 block">
                              Last Name *
                            </Label>
                            <Input
                              value={contactInfo.lastName}
                              onChange={(e) =>
                                handleContactChange("lastName", e.target.value)
                              }
                              placeholder="Doe"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-1 block">
                              Email *
                            </Label>
                            <Input
                              type="email"
                              value={contactInfo.email}
                              onChange={(e) =>
                                handleContactChange("email", e.target.value)
                              }
                              placeholder="john@example.com"
                            />
                          </div>
                          <div>
                            <Label className="text-sm font-medium mb-1 block">
                              Phone (WhatsApp) *
                            </Label>
                            <Input
                              value={contactInfo.phone}
                              onChange={(e) =>
                                handleContactChange("phone", e.target.value)
                              }
                              placeholder="+234..."
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-sm font-medium mb-1 block">
                              Company
                            </Label>
                            <Input
                              value={contactInfo.company}
                              onChange={(e) =>
                                handleContactChange("company", e.target.value)
                              }
                              placeholder="Company name (optional)"
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-sm font-medium mb-1 block">
                              Additional Notes
                            </Label>
                            <Textarea
                              value={contactInfo.notes}
                              onChange={(e) =>
                                handleContactChange("notes", e.target.value)
                              }
                              placeholder="Any special requests..."
                            />
                          </div>
                        </div>

                        <div className="flex justify-end pt-4">
                          <Button
                            onClick={() => setCurrentStep(2)}
                            disabled={!isContactValid()}
                            className="bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90"
                          >
                            Continue to Review
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Step 2: Review & Submit */}
                    {currentStep === 2 && (
                      <div className="space-y-6">
                        <h3 className="text-xl font-semibold text-center mb-6">
                          Review Your Quote Request
                        </h3>

                        {/* Flight Summary */}
                        <div className="p-4 bg-gray-50 border">
                          <h4 className="font-semibold mb-3">Flight Details</h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Route:</span>
                              <span className="ml-2 font-medium">
                                {emptyLeg.departureAirport.iataCode ||
                                  emptyLeg.departureAirport.icaoCode}{" "}
                                →{" "}
                                {emptyLeg.arrivalAirport.iataCode ||
                                  emptyLeg.arrivalAirport.icaoCode}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Date:</span>
                              <span className="ml-2 font-medium">
                                {formatDateLT(emptyLeg.departureDate)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Time:</span>
                              <span className="ml-2 font-medium">
                                {formatTimeLT(emptyLeg.departureDate)} LT
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Aircraft:</span>
                              <span className="ml-2 font-medium">
                                {emptyLeg.aircraft.name}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Contact Summary */}
                        <div className="p-4 bg-gray-50 border">
                          <h4 className="font-semibold mb-3">
                            Contact Information
                          </h4>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">Name:</span>
                              <span className="ml-2 font-medium">
                                {contactInfo.firstName} {contactInfo.lastName}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Email:</span>
                              <span className="ml-2 font-medium">
                                {contactInfo.email}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Phone:</span>
                              <span className="ml-2 font-medium">
                                {contactInfo.phone}
                              </span>
                            </div>
                            {contactInfo.company && (
                              <div>
                                <span className="text-gray-500">Company:</span>
                                <span className="ml-2 font-medium">
                                  {contactInfo.company}
                                </span>
                              </div>
                            )}
                          </div>
                          {contactInfo.notes && (
                            <div className="mt-3 pt-3 border-t">
                              <span className="text-gray-500 text-sm">
                                Notes:
                              </span>
                              <p className="text-sm mt-1">
                                {contactInfo.notes}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between pt-4">
                          <Button
                            variant="outline"
                            onClick={() => setCurrentStep(1)}
                          >
                            Back
                          </Button>
                          <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="bg-[#D4AF37] text-black hover:bg-[#D4AF37]/90"
                          >
                            {submitting ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                Submit Quote Request
                                <Check className="w-4 h-4 ml-2" />
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : null}
            </div>

            {/* Right Column - Summary Sidebar */}
            <div className="lg:col-span-1 hidden lg:block">
              <div className="lg:sticky lg:top-24">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">Deal Summary</h3>

                    {/* Aircraft Image */}
                    {emptyLeg.aircraft.images?.[0] && (
                      <div className="mb-4 overflow-hidden">
                        <img
                          src={emptyLeg.aircraft.images[0]}
                          alt={emptyLeg.aircraft.name}
                          className="w-full h-48 object-cover"
                        />
                      </div>
                    )}

                    {/* Details */}
                    <div className="py-3 space-y-2 text-sm border-b">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Date</span>
                        <span>{formatDateLT(emptyLeg.departureDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Time</span>
                        <span>{formatTimeLT(emptyLeg.departureDate)} LT </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Aircraft</span>
                        <span className="font-medium">
                          {emptyLeg.aircraft.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Category</span>
                        <span>{emptyLeg.aircraft.category}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Capacity</span>
                        <span>{emptyLeg.availableSeats}</span>
                      </div>
                    </div>

                    {/* Price */}
                    <div className="pt-4">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Price</span>
                        <span className="text-2xl font-semibold capitalize text-[#D4AF37]">
                          {formatPrice(emptyLeg.priceUsd, emptyLeg.priceText)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Modal with Disclaimer */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-8 border-b border-gray-200">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 mx-auto mb-4 flex items-center justify-center">
                  <Check className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Quote Request Submitted!
                </h3>
                {referenceNumber && (
                  <p className="text-lg font-mono text-[#D4AF37] mb-2">
                    Reference: {referenceNumber}
                  </p>
                )}
                <p className="text-gray-600">
                  We'll review your request and contact you via WhatsApp within
                  24 hours.
                </p>
              </div>
            </div>

            {/* Disclaimer Content */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-3xl mx-auto">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                  Empty Leg Terms & Disclaimer
                </h4>
                <div className="prose prose-sm max-w-none text-gray-600">
                  {emptyLegsPageData.disclaimer
                    .split("\n")
                    .map((paragraph: string, index: number) => (
                      <p key={index} className="mb-4 text-sm leading-relaxed">
                        {paragraph.trim()}
                      </p>
                    ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-center gap-4">
                <Button
                  onClick={() => {
                    setShowSuccess(false);
                    setCurrentStep(1);
                    setContactInfo({
                      firstName: "",
                      lastName: "",
                      email: "",
                      phone: "",
                      company: "",
                      notes: "",
                    });
                  }}
                  variant="outline"
                >
                  Close
                </Button>
                <Button asChild className="bg-[#D4AF37] text-black">
                  <Link href="/empty-legs">Browse More Deals</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  );
}
