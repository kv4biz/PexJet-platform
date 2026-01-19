"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { format } from "date-fns";
import {
  Plane,
  Calendar,
  Users,
  MapPin,
  Phone,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Input,
  Textarea,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useToast,
} from "@pexjet/ui";
import Navbar from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { quotePageData, footerData } from "@/data";

export default function QuotePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    flightType: "",
    departureCity: "",
    arrivalCity: "",
    departureDate: "",
    returnDate: "",
    passengers: "",
    specialRequests: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientName: formData.name,
          clientEmail: formData.email,
          clientPhone: formData.phone,
          flightType: formData.flightType,
          departureCity: formData.departureCity,
          arrivalCity: formData.arrivalCity,
          departureDate: formData.departureDate,
          returnDate: formData.returnDate || null,
          passengerCount: parseInt(formData.passengers.split("-")[0]) || 1,
          specialRequests: formData.specialRequests || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to submit quote");
      }

      setSubmitted(true);
      toast({
        title: "Quote Request Submitted",
        description: "We'll get back to you within 24 hours.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit quote request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (submitted) {
    return (
      <main className="min-h-screen">
        <Navbar />

        <section className="pt-32 pb-20">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-lg mx-auto text-center"
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-primary/10 flex items-center justify-center">
                <CheckCircle className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-3xl font-serif font-bold mb-4">
                {quotePageData.success.title}
              </h1>
              <p className="text-muted-foreground mb-8">
                {quotePageData.success.description}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild>
                  <Link href="/">{quotePageData.success.buttons.home}</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/empty-legs">
                    {quotePageData.success.buttons.emptyLegs}
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-foreground text-background">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold mb-6">
              {quotePageData.hero.title}
            </h1>
            <p className="text-lg md:text-xl text-background/80 max-w-3xl mx-auto">
              {quotePageData.hero.subtitle}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Quote Form */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <h2 className="text-2xl font-serif font-bold mb-6">
                    {quotePageData.form.title}
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Contact Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder="John Doe"
                          value={formData.name}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone (WhatsApp) *</Label>
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="+234 800 000 0000"
                          value={formData.phone}
                          onChange={handleChange}
                          required
                        />
                      </div>
                    </div>

                    {/* Flight Type & Passengers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label>Flight Type *</Label>
                        <Select
                          value={formData.flightType}
                          onValueChange={(value) =>
                            handleSelectChange("flightType", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select flight type" />
                          </SelectTrigger>
                          <SelectContent>
                            {quotePageData.form.flightTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Passengers *</Label>
                        <Select
                          value={formData.passengers}
                          onValueChange={(value) =>
                            handleSelectChange("passengers", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select passengers" />
                          </SelectTrigger>
                          <SelectContent>
                            {quotePageData.form.passengerOptions.map(
                              (option) => (
                                <SelectItem
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Route */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="departureCity">Departure City *</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="departureCity"
                            name="departureCity"
                            placeholder="Lagos, Nigeria"
                            value={formData.departureCity}
                            onChange={handleChange}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="arrivalCity">Arrival City *</Label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="arrivalCity"
                            name="arrivalCity"
                            placeholder="Abuja, Nigeria"
                            value={formData.arrivalCity}
                            onChange={handleChange}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="departureDate">Departure Date *</Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="departureDate"
                            name="departureDate"
                            type="date"
                            value={formData.departureDate}
                            onChange={handleChange}
                            className="pl-10"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="returnDate">
                          Return Date{" "}
                          {formData.flightType === "ROUND_TRIP" && "*"}
                        </Label>
                        <div className="relative">
                          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="returnDate"
                            name="returnDate"
                            type="date"
                            value={formData.returnDate}
                            onChange={handleChange}
                            className="pl-10"
                            required={formData.flightType === "ROUND_TRIP"}
                            disabled={formData.flightType === "ONE_WAY"}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Special Requests */}
                    <div className="space-y-2">
                      <Label htmlFor="specialRequests">Special Requests</Label>
                      <Textarea
                        id="specialRequests"
                        name="specialRequests"
                        placeholder="Any special requirements, catering preferences, or additional information..."
                        value={formData.specialRequests}
                        onChange={handleChange}
                        rows={4}
                      />
                    </div>

                    {/* Submit */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
                      <p className="text-sm text-muted-foreground">
                        {quotePageData.contactAlternative}{" "}
                        <a
                          href={`tel:${footerData.contactInfo.phone.replace(/\s/g, "")}`}
                          className="text-primary font-medium"
                        >
                          {footerData.contactInfo.phone}
                        </a>
                      </p>
                      <Button type="submit" size="lg" disabled={loading}>
                        {loading
                          ? "Submitting..."
                          : quotePageData.form.submitButton}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
