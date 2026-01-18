"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Separator,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  useToast,
} from "@pexjet/ui";
import {
  ArrowLeft,
  Plane,
  Calendar,
  Users,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  Check,
  XCircle,
  CreditCard,
  Loader2,
  ExternalLink,
  Edit,
  Send,
  Building2,
  Clock,
  FileText,
  Briefcase,
} from "lucide-react";
import BookingChat from "@/components/quotes/BookingChat";

interface EmptyLegQuote {
  id: string;
  referenceNumber: string;
  status: string;
  totalPriceUsd: number | null;
  seatsRequested: number;
  createdAt: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  receiptUrl?: string | null;
  paymentDeadline?: string | null;
  source: string;
  approvedBy?: {
    id: string;
    fullName: string;
    phone: string;
  } | null;
  emptyLeg: {
    id: string;
    departureDateTime: string;
    departureCity?: string;
    departureIcao?: string;
    departureIata?: string;
    arrivalCity?: string;
    arrivalIcao?: string;
    arrivalIata?: string;
    totalSeats?: number;
    availableSeats?: number;
    aircraftName?: string;
    aircraftCategory?: string;
    aircraftImage?: string;
    priceUsd?: number | null;
    departureAirport?: {
      name: string;
      icaoCode: string;
      iataCode?: string;
      municipality?: string;
      country?: { name: string };
    };
    arrivalAirport?: {
      name: string;
      icaoCode: string;
      iataCode?: string;
      municipality?: string;
      country?: { name: string };
    };
    aircraft?: {
      name: string;
      manufacturer?: string;
      category?: string;
      image?: string;
    } | null;
  };
}

interface Settings {
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankCode: string;
}

const REJECTION_REASONS = [
  { value: "AIRCRAFT_UNAVAILABLE", label: "Aircraft Unavailable" },
  { value: "ROUTE_NOT_SERVICEABLE", label: "Route Not Serviceable" },
  { value: "INVALID_DATES", label: "Invalid Dates" },
  { value: "PRICING_ISSUE", label: "Pricing Issue" },
  { value: "CAPACITY_EXCEEDED", label: "Capacity Exceeded" },
  { value: "DEAL_NOT_AVAILABLE", label: "Deal Not Available" },
  { value: "OTHER", label: "Other" },
];

export default function EmptyLegQuoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const quoteId = params.id as string;

  const [quote, setQuote] = useState<EmptyLegQuote | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);

  // Editable form fields
  const [formData, setFormData] = useState({
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    seatsRequested: 1,
    totalPriceUsd: "",
    departureDateTime: "",
    paymentDeadline: "",
    bankName: "",
    bankAccountName: "",
    bankAccountNumber: "",
    bankSortCode: "",
  });

  // Dialog states
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showConfirmPaymentDialog, setShowConfirmPaymentDialog] =
    useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionNote, setRejectionNote] = useState("");
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [showResendDialog, setShowResendDialog] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendPrice, setResendPrice] = useState("");

  // Flight document dialog states
  const [showFlightDocDialog, setShowFlightDocDialog] = useState(false);
  const [sendingFlightDoc, setSendingFlightDoc] = useState(false);
  const [flightDocData, setFlightDocData] = useState({
    eTicketNumber: "",
    checkinTime: "",
    terminal: "",
    gate: "",
    boardingTime: "",
    crewInformation: "",
    luggageInformation: "",
  });

  // Template preview states
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [templateType, setTemplateType] = useState<
    "quote" | "flight-confirmation"
  >("quote");
  const [previewHtml, setPreviewHtml] = useState("");
  const [loadingPreview, setLoadingPreview] = useState(false);

  const fetchQuote = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/quotes/empty-leg/${quoteId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setQuote(data.booking);

        // Initialize form data
        const departure =
          data.booking.emptyLeg.departureCity ||
          data.booking.emptyLeg.departureAirport?.municipality ||
          data.booking.emptyLeg.departureAirport?.name ||
          "";
        const arrival =
          data.booking.emptyLeg.arrivalCity ||
          data.booking.emptyLeg.arrivalAirport?.municipality ||
          data.booking.emptyLeg.arrivalAirport?.name ||
          "";

        setFormData({
          clientName: data.booking.clientName || "",
          clientEmail: data.booking.clientEmail || "",
          clientPhone: data.booking.clientPhone || "",
          seatsRequested: data.booking.seatsRequested || 1,
          totalPriceUsd:
            data.booking.totalPriceUsd?.toString() ||
            data.booking.emptyLeg.priceUsd?.toString() ||
            "",
          departureDateTime: data.booking.emptyLeg.departureDateTime
            ? new Date(data.booking.emptyLeg.departureDateTime)
                .toISOString()
                .slice(0, 16)
            : "",
          paymentDeadline: data.booking.paymentDeadline
            ? new Date(data.booking.paymentDeadline).toISOString().slice(0, 16)
            : new Date(Date.now() + 24 * 60 * 60 * 1000)
                .toISOString()
                .slice(0, 16),
          bankName: "",
          bankAccountName: "",
          bankAccountNumber: "",
          bankSortCode: "",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch quote details",
          variant: "destructive",
        });
        router.push("/dashboard/quotes");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch quote details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [quoteId, router, toast]);

  const fetchSettings = useCallback(async () => {
    try {
      const response = await fetch("/api/settings", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);

        // Pre-fill bank details from settings
        setFormData((prev) => ({
          ...prev,
          bankName: data.settings?.bankName || "",
          bankAccountName: data.settings?.bankAccountName || "",
          bankAccountNumber: data.settings?.bankAccountNumber || "",
          bankSortCode: data.settings?.bankCode || "",
        }));
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    }
  }, []);

  useEffect(() => {
    fetchQuote();
    fetchSettings();
  }, [fetchQuote, fetchSettings]);

  const handleApprove = async () => {
    if (!formData.totalPriceUsd || isNaN(parseFloat(formData.totalPriceUsd))) {
      toast({
        title: "Error",
        description: "Please enter a valid price",
        variant: "destructive",
      });
      return;
    }

    if (
      !formData.bankName ||
      !formData.bankAccountName ||
      !formData.bankAccountNumber
    ) {
      toast({
        title: "Error",
        description: "Please fill in all bank details",
        variant: "destructive",
      });
      return;
    }

    try {
      setApproving(true);
      const response = await fetch(`/api/quotes/empty-leg/${quoteId}/approve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          totalPriceUsd: parseFloat(formData.totalPriceUsd),
          clientName: formData.clientName,
          clientEmail: formData.clientEmail,
          clientPhone: formData.clientPhone,
          seatsRequested: formData.seatsRequested,
          departureDateTime: formData.departureDateTime,
          paymentDeadline: formData.paymentDeadline,
          bankName: formData.bankName,
          bankAccountName: formData.bankAccountName,
          bankAccountNumber: formData.bankAccountNumber,
          bankSortCode: formData.bankSortCode,
        }),
      });

      if (response.ok) {
        toast({
          title: "Quote Approved",
          description: "Quote confirmation sent to client via WhatsApp",
        });
        setIsEditMode(false);
        fetchQuote();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to approve quote",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve quote",
        variant: "destructive",
      });
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      toast({
        title: "Error",
        description: "Please select a rejection reason",
        variant: "destructive",
      });
      return;
    }

    try {
      setRejecting(true);
      const response = await fetch(`/api/quotes/empty-leg/${quoteId}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          rejectionReason,
          rejectionNote,
        }),
      });

      if (response.ok) {
        toast({
          title: "Quote Rejected",
          description: "Rejection message sent to client",
        });
        setShowRejectDialog(false);
        fetchQuote();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to reject quote",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject quote",
        variant: "destructive",
      });
    } finally {
      setRejecting(false);
    }
  };

  const handleConfirmPayment = async () => {
    try {
      setConfirmingPayment(true);
      const response = await fetch(
        `/api/quotes/empty-leg/${quoteId}/confirm-payment`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        },
      );

      if (response.ok) {
        toast({
          title: "Payment Confirmed",
          description: "Flight confirmation sent to client via WhatsApp",
        });
        setShowConfirmPaymentDialog(false);
        fetchQuote();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to confirm payment",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to confirm payment",
        variant: "destructive",
      });
    } finally {
      setConfirmingPayment(false);
    }
  };

  const handleResendQuote = async () => {
    if (!resendPrice || isNaN(parseFloat(resendPrice))) {
      toast({
        title: "Error",
        description: "Please enter a valid price",
        variant: "destructive",
      });
      return;
    }

    try {
      setResending(true);
      const response = await fetch(`/api/quotes/empty-leg/${quoteId}/resend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          totalPriceUsd: parseFloat(resendPrice),
        }),
      });

      if (response.ok) {
        toast({
          title: "Quote Resent",
          description: "Updated quote document sent to client via WhatsApp",
        });
        setShowResendDialog(false);
        setResendPrice("");
        fetchQuote();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to resend quote",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resend quote",
        variant: "destructive",
      });
    } finally {
      setResending(false);
    }
  };

  // Template preview functions
  const handlePreviewTemplate = async (
    type: "quote" | "flight-confirmation",
  ) => {
    try {
      setLoadingPreview(true);
      setTemplateType(type);

      // Prepare template data
      const templateData = {
        // Client Information
        clientName: quote?.clientName || "",
        clientEmail: quote?.clientEmail || "",
        clientPhone: quote?.clientPhone || "",
        passengers: quote?.seatsRequested?.toString() || "1",

        // Flight Information
        departureIata: getDepartureIata(),
        departureIcao: getDepartureIcao(),
        departureAirport: quote?.emptyLeg.departureAirport?.name || "",
        departureCity: getDepartureCity(),
        arrivalIata: getArrivalIata(),
        arrivalIcao: getArrivalIcao(),
        arrivalAirport: quote?.emptyLeg.arrivalAirport?.name || "",
        arrivalCity: getArrivalCity(),
        departureDate: new Date(
          quote?.emptyLeg.departureDateTime || "",
        ).toLocaleDateString(),
        departureTime: new Date(
          quote?.emptyLeg.departureDateTime || "",
        ).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        arrivalTime: "", // Calculate based on flight duration
        aircraftName: getAircraftName(),
        aircraftCategory: getAircraftCategory(),
        aircraftImage: getAircraftImage() || "",

        // Quote Information
        referenceNumber: quote?.referenceNumber || "",
        issueDate: new Date().toLocaleDateString(),
        totalPrice: quote?.totalPriceUsd?.toString() || "",
        originalPrice: quote?.emptyLeg.priceUsd?.toString() || "",
        flightDescription: `Private Charter Flight: ${getDepartureIata()} to ${getArrivalIata()}`,

        // Payment Information
        bankName: settings?.bankName || "",
        accountName: settings?.bankAccountName || "",
        accountNumber: settings?.bankAccountNumber || "",
        bankCode: settings?.bankCode || "",
        paymentDeadline: quote?.paymentDeadline
          ? new Date(quote.paymentDeadline).toLocaleDateString()
          : "",

        // Flight Confirmation Specific
        eTicketNumber: flightDocData.eTicketNumber,
        confirmationDate: new Date().toLocaleDateString(),
        bookingStatus: "CONFIRMED",
        paymentDate: "", // Will be set when payment is confirmed
        checkinTime: flightDocData.checkinTime
          ? new Date(flightDocData.checkinTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
        terminal: flightDocData.terminal,
        gate: flightDocData.gate,
        boardingTime: flightDocData.boardingTime
          ? new Date(flightDocData.boardingTime).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : "",
        crewInformation: flightDocData.crewInformation,
        luggageInformation: flightDocData.luggageInformation,
      };

      const response = await fetch("/api/templates/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({
          templateType: type,
          data: templateData,
        }),
      });

      if (response.ok) {
        const html = await response.text();
        setPreviewHtml(html);
        setShowTemplatePreview(true);
      } else {
        toast({
          title: "Error",
          description: "Failed to generate template preview",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate template preview",
        variant: "destructive",
      });
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleSendFlightDocument = async () => {
    if (!flightDocData.eTicketNumber) {
      toast({
        title: "Error",
        description: "Please fill in e-ticket number",
        variant: "destructive",
      });
      return;
    }

    try {
      setSendingFlightDoc(true);
      const response = await fetch(
        `/api/quotes/empty-leg/${quoteId}/send-flight-doc`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify(flightDocData),
        },
      );

      if (response.ok) {
        toast({
          title: "Flight Document Sent",
          description:
            "Flight confirmation document sent to client via WhatsApp",
        });
        setShowFlightDocDialog(false);
        setFlightDocData({
          eTicketNumber: "",
          checkinTime: "",
          terminal: "",
          gate: "",
          boardingTime: "",
          crewInformation: "",
          luggageInformation: "",
        });
        fetchQuote();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to send flight document",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send flight document",
        variant: "destructive",
      });
    } finally {
      setSendingFlightDoc(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "warning";
      case "APPROVED":
        return "success";
      case "REJECTED":
        return "destructive";
      case "PAID":
        return "default";
      case "COMPLETED":
        return "success";
      default:
        return "secondary";
    }
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getDepartureCity = () => {
    if (!quote) return "";
    return (
      quote.emptyLeg.departureCity ||
      quote.emptyLeg.departureAirport?.municipality ||
      quote.emptyLeg.departureAirport?.name ||
      ""
    );
  };

  const getDepartureCountry = () => {
    if (!quote) return "";
    return quote.emptyLeg.departureAirport?.country?.name || "";
  };

  const getDepartureIata = () => {
    if (!quote) return "";
    return (
      quote.emptyLeg.departureIata ||
      quote.emptyLeg.departureAirport?.iataCode ||
      ""
    );
  };

  const getDepartureIcao = () => {
    if (!quote) return "";
    return (
      quote.emptyLeg.departureIcao ||
      quote.emptyLeg.departureAirport?.icaoCode ||
      ""
    );
  };

  const getDepartureCode = () => {
    const iata = getDepartureIata();
    const icao = getDepartureIcao();
    if (iata && icao) return `${iata}/${icao}`;
    return iata || icao || "";
  };

  const getArrivalCity = () => {
    if (!quote) return "";
    return (
      quote.emptyLeg.arrivalCity ||
      quote.emptyLeg.arrivalAirport?.municipality ||
      quote.emptyLeg.arrivalAirport?.name ||
      ""
    );
  };

  const getArrivalCountry = () => {
    if (!quote) return "";
    return quote.emptyLeg.arrivalAirport?.country?.name || "";
  };

  const getArrivalIata = () => {
    if (!quote) return "";
    return (
      quote.emptyLeg.arrivalIata ||
      quote.emptyLeg.arrivalAirport?.iataCode ||
      ""
    );
  };

  const getArrivalIcao = () => {
    if (!quote) return "";
    return (
      quote.emptyLeg.arrivalIcao ||
      quote.emptyLeg.arrivalAirport?.icaoCode ||
      ""
    );
  };

  const getArrivalCode = () => {
    const iata = getArrivalIata();
    const icao = getArrivalIcao();
    if (iata && icao) return `${iata}/${icao}`;
    return iata || icao || "";
  };

  const getAircraftName = () => {
    if (!quote) return "TBA";
    return (
      quote.emptyLeg.aircraftName || quote.emptyLeg.aircraft?.name || "TBA"
    );
  };

  const getAircraftCategory = () => {
    if (!quote) return "";
    const category =
      quote.emptyLeg.aircraftCategory || quote.emptyLeg.aircraft?.category;
    if (!category) return "";
    return category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getAircraftImage = () => {
    if (!quote) return null;
    return (
      quote.emptyLeg.aircraftImage || quote.emptyLeg.aircraft?.image || null
    );
  };

  const getTotalSeats = () => {
    if (!quote) return 0;
    return quote.emptyLeg.totalSeats || quote.emptyLeg.availableSeats || 0;
  };

  if (loading) {
    return (
      <section className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </section>
    );
  }

  if (!quote) {
    return (
      <section className="flex flex-col items-center justify-center h-96 space-y-4">
        <p className="text-muted-foreground">Quote not found</p>
        <Button onClick={() => router.push("/dashboard/quotes")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Quotes
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <section className="flex items-center justify-between">
        <section className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/dashboard/quotes")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <section>
            <section className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                Quote {quote.referenceNumber}
              </h1>
              <Badge variant={getStatusColor(quote.status) as any}>
                {quote.status}
              </Badge>
              {quote.source === "INSTACHARTER" && (
                <Badge variant="secondary">InstaCharter</Badge>
              )}
            </section>
            <p className="text-sm text-muted-foreground">
              Created {formatDateTime(quote.createdAt)}
            </p>
          </section>
        </section>
      </section>

      {/* Main Content - 2 Column Layout */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Left Column - Details/Edit (2/3 width) */}
        <section className="lg:col-span-2 space-y-6">
          {isEditMode ? (
            /* Edit Mode - Approval Form */
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Prepare Quote Confirmation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Client Information */}
                <section className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Client Information
                  </h3>
                  <section className="grid gap-4 md:grid-cols-2">
                    <section className="space-y-2">
                      <Label htmlFor="clientName">Full Name</Label>
                      <Input
                        id="clientName"
                        value={formData.clientName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            clientName: e.target.value,
                          })
                        }
                      />
                    </section>
                    <section className="space-y-2">
                      <Label htmlFor="clientEmail">Email</Label>
                      <Input
                        id="clientEmail"
                        type="email"
                        value={formData.clientEmail}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            clientEmail: e.target.value,
                          })
                        }
                      />
                    </section>
                    <section className="space-y-2">
                      <Label htmlFor="clientPhone">Phone (WhatsApp)</Label>
                      <Input
                        id="clientPhone"
                        value={formData.clientPhone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            clientPhone: e.target.value,
                          })
                        }
                      />
                    </section>
                  </section>
                </section>

                <Separator />

                {/* Flight Details */}
                <section className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Flight Details
                  </h3>

                  {/* Route Display */}
                  <section className="flex items-center justify-center gap-4 py-3 bg-muted/50 rounded-lg">
                    <section className="text-center">
                      <p className="text-lg font-bold">
                        {getDepartureIata() || getDepartureIcao()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getDepartureCity()}
                      </p>
                    </section>
                    <Plane className="h-5 w-5 text-muted-foreground" />
                    <section className="text-center">
                      <p className="text-lg font-bold">
                        {getArrivalIata() || getArrivalIcao()}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {getArrivalCity()}
                      </p>
                    </section>
                  </section>

                  <section className="grid gap-4 md:grid-cols-2">
                    <section className="space-y-2">
                      <Label htmlFor="departureDateTime">Date & Time</Label>
                      <Input
                        id="departureDateTime"
                        type="datetime-local"
                        value={formData.departureDateTime}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            departureDateTime: e.target.value,
                          })
                        }
                      />
                    </section>
                    <section className="space-y-2">
                      <Label htmlFor="seatsRequested">
                        Seats Requested
                        {getTotalSeats() > 0 && (
                          <span className="text-muted-foreground font-normal ml-1">
                            (max: {getTotalSeats()})
                          </span>
                        )}
                      </Label>
                      <Input
                        id="seatsRequested"
                        type="number"
                        min="1"
                        max={getTotalSeats() || undefined}
                        value={formData.seatsRequested}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            seatsRequested: parseInt(e.target.value) || 1,
                          })
                        }
                      />
                    </section>
                  </section>

                  {/* Aircraft Info (Read-only) */}
                  <section className="space-y-2">
                    <Label>Aircraft (Read-only)</Label>
                    <section className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      {getAircraftImage() && (
                        <img
                          src={getAircraftImage()!}
                          alt={getAircraftName()}
                          className="w-20 h-14 object-cover rounded"
                        />
                      )}
                      <section>
                        <p className="font-medium">{getAircraftName()}</p>
                        {getAircraftCategory() && (
                          <Badge variant="secondary" className="text-xs">
                            {getAircraftCategory()}
                          </Badge>
                        )}
                      </section>
                    </section>
                  </section>
                </section>

                <Separator />

                {/* Pricing */}
                <section className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Pricing
                  </h3>
                  <section className="grid gap-4 md:grid-cols-2">
                    <section className="space-y-2">
                      <Label htmlFor="totalPriceUsd">Total Price (USD)</Label>
                      <section className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="totalPriceUsd"
                          type="number"
                          value={formData.totalPriceUsd}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              totalPriceUsd: e.target.value,
                            })
                          }
                          className="pl-9"
                          placeholder="0.00"
                        />
                      </section>
                    </section>
                    <section className="space-y-2">
                      <Label htmlFor="paymentDeadline">Payment Deadline</Label>
                      <Input
                        id="paymentDeadline"
                        type="datetime-local"
                        value={formData.paymentDeadline}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            paymentDeadline: e.target.value,
                          })
                        }
                      />
                    </section>
                  </section>
                </section>

                <Separator />

                {/* Payment Method */}
                <section className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Payment Method
                  </h3>

                  {/* Payment Toggle - PayStack disabled for now */}
                  <section className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                    <section className="flex items-center gap-2">
                      <input
                        type="radio"
                        id="paymentBank"
                        name="paymentMethod"
                        checked={true}
                        readOnly
                        className="h-4 w-4"
                      />
                      <Label
                        htmlFor="paymentBank"
                        className="cursor-pointer font-normal"
                      >
                        Bank Transfer
                      </Label>
                    </section>
                    <section className="flex items-center gap-2 opacity-50">
                      <input
                        type="radio"
                        id="paymentPaystack"
                        name="paymentMethod"
                        disabled
                        className="h-4 w-4"
                      />
                      <Label
                        htmlFor="paymentPaystack"
                        className="cursor-not-allowed font-normal"
                      >
                        PayStack Link
                        <Badge variant="outline" className="ml-2 text-xs">
                          Coming Soon
                        </Badge>
                      </Label>
                    </section>
                  </section>

                  {/* Bank Details - Read Only from Settings */}
                  <section className="space-y-3">
                    <section className="flex items-center justify-between">
                      <Label className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Bank Transfer Details
                      </Label>
                      <Badge variant="secondary" className="text-xs">
                        From Settings
                      </Badge>
                    </section>
                    <section className="grid gap-3 md:grid-cols-2 p-3 bg-muted rounded-lg">
                      <section>
                        <p className="text-xs text-muted-foreground">
                          Bank Name
                        </p>
                        <p className="font-medium">
                          {formData.bankName || "Not configured"}
                        </p>
                      </section>
                      <section>
                        <p className="text-xs text-muted-foreground">
                          Account Name
                        </p>
                        <p className="font-medium">
                          {formData.bankAccountName || "Not configured"}
                        </p>
                      </section>
                      <section>
                        <p className="text-xs text-muted-foreground">
                          Account Number
                        </p>
                        <p className="font-medium">
                          {formData.bankAccountNumber || "Not configured"}
                        </p>
                      </section>
                      <section>
                        <p className="text-xs text-muted-foreground">
                          Sort/Bank Code
                        </p>
                        <p className="font-medium">
                          {formData.bankSortCode || "Not configured"}
                        </p>
                      </section>
                    </section>
                    {(!formData.bankName || !formData.bankAccountNumber) && (
                      <p className="text-xs text-destructive">
                        ⚠️ Bank details not configured. Please update in
                        Settings.
                      </p>
                    )}
                  </section>
                </section>

                <Separator />

                {/* Action Buttons */}
                <section className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsEditMode(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleApprove}
                    disabled={approving}
                    className="flex-1"
                  >
                    {approving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Approve & Send to Client
                  </Button>
                </section>
              </CardContent>
            </Card>
          ) : (
            /* View Mode - Quote Details */
            <>
              {/* Client Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="h-5 w-5" />
                    Client Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <section className="grid gap-4 md:grid-cols-3">
                    <section>
                      <p className="text-sm text-muted-foreground">Name</p>
                      <p className="font-medium">{quote.clientName}</p>
                    </section>
                    <section>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <section className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{quote.clientEmail}</p>
                      </section>
                    </section>
                    <section>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <section className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">{quote.clientPhone}</p>
                      </section>
                    </section>
                  </section>
                </CardContent>
              </Card>

              {/* Flight Details Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Plane className="h-5 w-5" />
                    Flight Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Route with IATA/ICAO codes */}
                  <section className="flex items-center justify-center gap-6 py-4 bg-muted/50 rounded-lg">
                    <section className="text-center">
                      <p className="text-2xl font-bold">
                        {getDepartureIata() || getDepartureIcao()}
                      </p>
                      {getDepartureIata() && getDepartureIcao() && (
                        <p className="text-xs text-muted-foreground">
                          ({getDepartureIcao()})
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {getDepartureCity()}
                      </p>
                      {getDepartureCountry() && (
                        <p className="text-xs text-muted-foreground">
                          {getDepartureCountry()}
                        </p>
                      )}
                    </section>
                    <Plane className="h-6 w-6 text-muted-foreground" />
                    <section className="text-center">
                      <p className="text-2xl font-bold">
                        {getArrivalIata() || getArrivalIcao()}
                      </p>
                      {getArrivalIata() && getArrivalIcao() && (
                        <p className="text-xs text-muted-foreground">
                          ({getArrivalIcao()})
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {getArrivalCity()}
                      </p>
                      {getArrivalCountry() && (
                        <p className="text-xs text-muted-foreground">
                          {getArrivalCountry()}
                        </p>
                      )}
                    </section>
                  </section>

                  {/* Date & Time */}
                  <section className="grid gap-4 md:grid-cols-2">
                    <section>
                      <p className="text-sm text-muted-foreground">
                        Date & Time
                      </p>
                      <section className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <p className="font-medium">
                          {formatDateTime(quote.emptyLeg.departureDateTime)}
                        </p>
                      </section>
                    </section>
                    <section>
                      <p className="text-sm text-muted-foreground">Seats</p>
                      <p className="font-medium">
                        {quote.seatsRequested} requested
                        {getTotalSeats() > 0 && (
                          <span className="text-muted-foreground">
                            {" "}
                            / {getTotalSeats()} available
                          </span>
                        )}
                      </p>
                    </section>
                  </section>

                  <Separator />

                  {/* Aircraft Info with Image */}
                  <section className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Aircraft
                    </p>
                    <section className="flex gap-4">
                      {getAircraftImage() && (
                        <img
                          src={getAircraftImage()!}
                          alt={getAircraftName()}
                          className="w-32 h-20 object-cover rounded"
                        />
                      )}
                      <section>
                        <p className="font-medium">{getAircraftName()}</p>
                        {getAircraftCategory() && (
                          <Badge variant="secondary" className="mt-1">
                            {getAircraftCategory()}
                          </Badge>
                        )}
                      </section>
                    </section>
                  </section>
                </CardContent>
              </Card>

              {/* Pricing Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <DollarSign className="h-5 w-5" />
                    Pricing
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <section className="flex items-center justify-between">
                    <section>
                      <p className="text-sm text-muted-foreground">
                        Total Price
                      </p>
                      <p className="text-3xl font-bold text-[#D4AF37]">
                        {quote.totalPriceUsd
                          ? `$${quote.totalPriceUsd.toLocaleString()}`
                          : "Not set"}
                      </p>
                    </section>
                    {quote.paymentDeadline && (
                      <section>
                        <p className="text-sm text-muted-foreground">
                          Payment Deadline
                        </p>
                        <section className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium">
                            {formatDateTime(quote.paymentDeadline)}
                          </p>
                        </section>
                      </section>
                    )}
                  </section>
                </CardContent>
              </Card>

              {/* Receipt Card (if uploaded) */}
              {quote.receiptUrl && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CreditCard className="h-5 w-5" />
                      Payment Receipt
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <a
                      href={quote.receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img
                        src={quote.receiptUrl}
                        alt="Payment Receipt"
                        className="max-w-full rounded border max-h-64 object-contain"
                      />
                      <section className="flex items-center gap-1 mt-2 text-sm text-primary">
                        <ExternalLink className="h-4 w-4" />
                        View Full Image
                      </section>
                    </a>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <Card>
                <CardContent className="py-4">
                  {quote.status === "PENDING" && (
                    <section className="flex gap-3">
                      <Button
                        className="flex-1"
                        onClick={() => setIsEditMode(true)}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve Quote
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => setShowRejectDialog(true)}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </section>
                  )}

                  {quote.status === "APPROVED" && (
                    <section className="space-y-3">
                      {quote.receiptUrl ? (
                        <Button
                          className="w-full"
                          onClick={() => setShowConfirmPaymentDialog(true)}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Confirm Payment
                        </Button>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-2">
                          Waiting for client to upload payment receipt...
                        </p>
                      )}
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setResendPrice(quote.totalPriceUsd?.toString() || "");
                          setShowResendDialog(true);
                        }}
                      >
                        <Send className="h-4 w-4 mr-2" />
                        Resend Quote with New Price
                      </Button>
                    </section>
                  )}

                  {quote.status === "PAID" && (
                    <section className="space-y-3">
                      <p className="text-sm text-center py-2 text-green-600 font-medium">
                        ✓ Payment confirmed
                      </p>
                      <Button
                        className="w-full"
                        onClick={() => setShowFlightDocDialog(true)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Send Flight Document
                      </Button>
                    </section>
                  )}

                  {quote.status === "REJECTED" && (
                    <p className="text-sm text-center py-2 text-destructive">
                      Quote was rejected
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </section>

        {/* Right Column - Chat (1/3 width) */}
        <section className="lg:col-span-1">
          <Card className="h-[calc(100vh-200px)] flex flex-col">
            <CardHeader className="py-3 border-b flex-shrink-0">
              <CardTitle className="text-base">Chat with Client</CardTitle>
              <p className="text-sm text-muted-foreground">
                {quote.clientPhone}
              </p>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <BookingChat
                bookingId={quote.id}
                bookingType="empty_leg"
                clientName={quote.clientName}
                clientPhone={quote.clientPhone}
              />
            </CardContent>
          </Card>
        </section>
      </section>

      {/* Reject Dialog */}
      <AlertDialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Quote</AlertDialogTitle>
            <AlertDialogDescription>
              This will send a rejection message to the client via WhatsApp.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <section className="py-4 space-y-4">
            <section>
              <Label>Rejection Reason</Label>
              <Select
                value={rejectionReason}
                onValueChange={setRejectionReason}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  {REJECTION_REASONS.map((reason) => (
                    <SelectItem key={reason.value} value={reason.value}>
                      {reason.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </section>
            <section>
              <Label>Additional Note (Optional)</Label>
              <Textarea
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                placeholder="Add any additional details..."
                className="mt-2"
              />
            </section>
          </section>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              disabled={rejecting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {rejecting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4 mr-2" />
              )}
              Reject Quote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Payment Dialog */}
      <AlertDialog
        open={showConfirmPaymentDialog}
        onOpenChange={setShowConfirmPaymentDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Have you verified the payment receipt? This will send the flight
              confirmation document to the client via WhatsApp.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmPayment}
              disabled={confirmingPayment}
            >
              {confirmingPayment ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4 mr-2" />
              )}
              Confirm & Send Flight Doc
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Resend Quote Dialog */}
      <AlertDialog open={showResendDialog} onOpenChange={setShowResendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resend Quote with New Price</AlertDialogTitle>
            <AlertDialogDescription>
              Enter the new agreed price. A new quote document will be generated
              and sent to the client via WhatsApp.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <section className="py-4">
            <Label htmlFor="resendPrice">New Price (USD)</Label>
            <section className="relative mt-2">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="resendPrice"
                type="number"
                value={resendPrice}
                onChange={(e) => setResendPrice(e.target.value)}
                className="pl-9"
                placeholder="0.00"
              />
            </section>
            {quote?.totalPriceUsd && (
              <p className="text-xs text-muted-foreground mt-2">
                Previous price: ${quote.totalPriceUsd.toLocaleString()}
              </p>
            )}
          </section>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResendQuote} disabled={resending}>
              {resending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Updated Quote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Flight Document Dialog */}
      <AlertDialog
        open={showFlightDocDialog}
        onOpenChange={setShowFlightDocDialog}
      >
        <AlertDialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Send Flight Confirmation Document
            </AlertDialogTitle>
            <AlertDialogDescription>
              Fill in the flight details to generate and send the confirmation
              document to the client.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <section className="py-4 space-y-4">
            {/* Passenger Information */}
            <section className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Passenger Information
              </h4>
              <section className="grid gap-3 md:grid-cols-2">
                <section className="space-y-2">
                  <Label htmlFor="eTicketNumber">E-Ticket Number *</Label>
                  <Input
                    id="eTicketNumber"
                    value={flightDocData.eTicketNumber}
                    onChange={(e) =>
                      setFlightDocData({
                        ...flightDocData,
                        eTicketNumber: e.target.value,
                      })
                    }
                    placeholder="e.g. PEX-2024-001234"
                  />
                </section>
              </section>
            </section>

            <Separator />

            {/* Check-in & Boarding */}
            <section className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Check-in & Boarding
              </h4>
              <section className="grid gap-3 md:grid-cols-3">
                <section className="space-y-2">
                  <Label htmlFor="checkinTime">Check-in Time</Label>
                  <Input
                    id="checkinTime"
                    type="datetime-local"
                    value={flightDocData.checkinTime}
                    onChange={(e) =>
                      setFlightDocData({
                        ...flightDocData,
                        checkinTime: e.target.value,
                      })
                    }
                  />
                </section>
                <section className="space-y-2">
                  <Label htmlFor="terminal">Terminal</Label>
                  <Input
                    id="terminal"
                    value={flightDocData.terminal}
                    onChange={(e) =>
                      setFlightDocData({
                        ...flightDocData,
                        terminal: e.target.value,
                      })
                    }
                    placeholder="e.g. Terminal 2"
                  />
                </section>
                <section className="space-y-2">
                  <Label htmlFor="gate">Gate</Label>
                  <Input
                    id="gate"
                    value={flightDocData.gate}
                    onChange={(e) =>
                      setFlightDocData({
                        ...flightDocData,
                        gate: e.target.value,
                      })
                    }
                    placeholder="e.g. Gate B12"
                  />
                </section>
              </section>
              <section className="space-y-2">
                <Label htmlFor="boardingTime">Boarding Time</Label>
                <Input
                  id="boardingTime"
                  type="datetime-local"
                  value={flightDocData.boardingTime}
                  onChange={(e) =>
                    setFlightDocData({
                      ...flightDocData,
                      boardingTime: e.target.value,
                    })
                  }
                />
              </section>
            </section>

            <Separator />

            {/* Luggage Information */}
            <section className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Luggage Information
              </h4>
              <section className="space-y-2">
                <Label htmlFor="luggageInformation">
                  Luggage Allowance & Details
                </Label>
                <Textarea
                  id="luggageInformation"
                  value={flightDocData.luggageInformation}
                  onChange={(e) =>
                    setFlightDocData({
                      ...flightDocData,
                      luggageInformation: e.target.value,
                    })
                  }
                  placeholder="e.g. 2 checked bags (23kg each), 1 carry-on (8kg)\nSpecial items: Golf bag, Ski equipment"
                  rows={3}
                />
              </section>
            </section>

            <Separator />

            {/* Crew Information */}
            <section className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Crew Information
              </h4>
              <section className="space-y-2">
                <Label htmlFor="crewInformation">Crew Information</Label>
                <Textarea
                  id="crewInformation"
                  value={flightDocData.crewInformation}
                  onChange={(e) =>
                    setFlightDocData({
                      ...flightDocData,
                      crewInformation: e.target.value,
                    })
                  }
                  placeholder="Captain: James Wilson\nFirst Officer: Sarah Chen\nFlight Attendant: Michael Roberts\nGround Crew: David Lee"
                  rows={4}
                />
              </section>
            </section>
          </section>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleSendFlightDocument}
              disabled={sendingFlightDoc}
            >
              {sendingFlightDoc ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send Flight Document
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
