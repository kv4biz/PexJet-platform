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
  emptyLeg: {
    id: string;
    departureDateTime: string;
    departureCity?: string;
    departureIcao?: string;
    arrivalCity?: string;
    arrivalIcao?: string;
    departureAirport?: {
      name: string;
      icaoCode: string;
      municipality?: string;
    };
    arrivalAirport?: { name: string; icaoCode: string; municipality?: string };
    aircraft?: { name: string; manufacturer?: string } | null;
    aircraftName?: string;
    priceUsd?: number | null;
    availableSeats?: number;
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

  const getDepartureCode = () => {
    if (!quote) return "";
    return (
      quote.emptyLeg.departureIcao ||
      quote.emptyLeg.departureAirport?.icaoCode ||
      ""
    );
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

  const getArrivalCode = () => {
    if (!quote) return "";
    return (
      quote.emptyLeg.arrivalIcao ||
      quote.emptyLeg.arrivalAirport?.icaoCode ||
      ""
    );
  };

  const getAircraftName = () => {
    if (!quote) return "TBA";
    return (
      quote.emptyLeg.aircraftName || quote.emptyLeg.aircraft?.name || "TBA"
    );
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
                  <section className="grid gap-4 md:grid-cols-2">
                    <section className="space-y-2">
                      <Label>Departure</Label>
                      <Input
                        value={`${getDepartureCity()} (${getDepartureCode()})`}
                        disabled
                        className="bg-muted"
                      />
                    </section>
                    <section className="space-y-2">
                      <Label>Arrival</Label>
                      <Input
                        value={`${getArrivalCity()} (${getArrivalCode()})`}
                        disabled
                        className="bg-muted"
                      />
                    </section>
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
                      <Label>Aircraft</Label>
                      <Input
                        value={getAircraftName()}
                        disabled
                        className="bg-muted"
                      />
                    </section>
                    <section className="space-y-2">
                      <Label htmlFor="seatsRequested">Seats Requested</Label>
                      <Input
                        id="seatsRequested"
                        type="number"
                        min="1"
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

                {/* Bank Details */}
                <section className="space-y-4">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Bank Transfer Details
                  </h3>
                  <section className="grid gap-4 md:grid-cols-2">
                    <section className="space-y-2">
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input
                        id="bankName"
                        value={formData.bankName}
                        onChange={(e) =>
                          setFormData({ ...formData, bankName: e.target.value })
                        }
                        placeholder="e.g. First Bank"
                      />
                    </section>
                    <section className="space-y-2">
                      <Label htmlFor="bankAccountName">Account Name</Label>
                      <Input
                        id="bankAccountName"
                        value={formData.bankAccountName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bankAccountName: e.target.value,
                          })
                        }
                        placeholder="e.g. PexJet Ltd"
                      />
                    </section>
                    <section className="space-y-2">
                      <Label htmlFor="bankAccountNumber">Account Number</Label>
                      <Input
                        id="bankAccountNumber"
                        value={formData.bankAccountNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bankAccountNumber: e.target.value,
                          })
                        }
                        placeholder="e.g. 0123456789"
                      />
                    </section>
                    <section className="space-y-2">
                      <Label htmlFor="bankSortCode">Sort/Bank Code</Label>
                      <Input
                        id="bankSortCode"
                        value={formData.bankSortCode}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            bankSortCode: e.target.value,
                          })
                        }
                        placeholder="e.g. 011"
                      />
                    </section>
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
                  {/* Route */}
                  <section className="flex items-center justify-center gap-4 py-4 bg-muted/50 rounded-lg">
                    <section className="text-center">
                      <p className="text-2xl font-bold">{getDepartureCode()}</p>
                      <p className="text-sm text-muted-foreground">
                        {getDepartureCity()}
                      </p>
                    </section>
                    <Plane className="h-6 w-6 text-[#D4AF37]" />
                    <section className="text-center">
                      <p className="text-2xl font-bold">{getArrivalCode()}</p>
                      <p className="text-sm text-muted-foreground">
                        {getArrivalCity()}
                      </p>
                    </section>
                  </section>

                  <section className="grid gap-4 md:grid-cols-3">
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
                      <p className="text-sm text-muted-foreground">Aircraft</p>
                      <p className="font-medium">{getAircraftName()}</p>
                    </section>
                    <section>
                      <p className="text-sm text-muted-foreground">
                        Seats Requested
                      </p>
                      <p className="font-medium">{quote.seatsRequested}</p>
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
                    <p className="text-sm text-center py-2 text-green-600 font-medium">
                      ✓ Payment confirmed - Flight confirmation sent to client
                    </p>
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
    </section>
  );
}
