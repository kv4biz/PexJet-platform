"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Separator,
} from "@pexjet/ui";
import {
  ArrowLeft,
  Download,
  Calendar,
  DollarSign,
  User,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Plane,
  MapPin,
  FileText,
} from "lucide-react";

interface Payment {
  id: string;
  referenceNumber: string;
  clientId: string;
  type: "CHARTER" | "EMPTY_LEG";
  status: "PENDING" | "SUCCESS" | "FAILED";
  amountUsd: number;
  adminAmountUsd?: number;
  operatorAmountUsd?: number;
  method: "PAYSTACK" | "BANK_TRANSFER";
  paystackReference?: string;
  bankTransferConfirmed: boolean;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  confirmedById?: string;
  client: {
    fullName: string;
    email: string;
    phone: string;
  };
  charterQuote?: {
    referenceNumber: string;
    clientName: string;
    totalPriceUsd: number;
    flightType: string;
    legs: {
      departureAirport: { name: string; icaoCode: string };
      arrivalAirport: { name: string; icaoCode: string };
      departureDateTime: string;
    }[];
  };
  emptyLegBooking?: {
    referenceNumber: string;
    clientName: string;
    totalPriceUsd: number;
    seatsRequested: number;
    emptyLeg: {
      departureAirport: { name: string; icaoCode: string };
      arrivalAirport: { name: string; icaoCode: string };
      departureDateTime: string;
      aircraft: { name: string; manufacturer?: string };
    };
  };
}

export default function PaymentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchPayment(params.id as string);
    }
  }, [params.id]);

  const fetchPayment = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/payments/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPayment(data.payment);
      } else {
        console.error("Failed to fetch payment");
      }
    } catch (error) {
      console.error("Failed to fetch payment:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "warning";
      case "SUCCESS":
        return "success";
      case "FAILED":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-5 w-5" />;
      case "SUCCESS":
        return <CheckCircle className="h-5 w-5" />;
      case "FAILED":
        return <XCircle className="h-5 w-5" />;
      default:
        return <Clock className="h-5 w-5" />;
    }
  };

  const downloadReceipt = async () => {
    if (!payment) return;

    try {
      if (payment.method === "BANK_TRANSFER" && payment.emptyLegBooking) {
        const response = await fetch(
          `/api/bookings/${payment.emptyLegBooking.referenceNumber}/receipt`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          if (data.receiptUrl) {
            const link = document.createElement("a");
            link.href = data.receiptUrl;
            link.download = `receipt-${payment.referenceNumber}.jpg`;
            link.target = "_blank";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } else {
            alert("No receipt available for this payment");
          }
        }
      } else {
        alert("Receipt download only available for bank transfer payments");
      }
    } catch (error) {
      console.error("Failed to download receipt:", error);
      alert("Failed to download receipt");
    }
  };

  if (loading) {
    return (
      <section className="space-y-6">
        <header className="flex items-center gap-4">
          <Button variant="ghost" size="icon" disabled>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        </header>
        <Card>
          <CardContent className="pt-6">
            <section className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <section
                  key={i}
                  className="h-12 bg-muted animate-pulse rounded"
                />
              ))}
            </section>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (!payment) {
    return (
      <section className="space-y-6">
        <header className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Payment Not Found</h1>
        </header>
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              The payment you're looking for doesn't exist.
            </p>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex items-center justify-between">
        <section className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <article>
            <h1 className="text-3xl font-bold">Payment Details</h1>
            <p className="text-muted-foreground">
              Reference: {payment.referenceNumber}
            </p>
          </article>
        </section>
        {payment.method === "BANK_TRANSFER" && (
          <Button onClick={downloadReceipt}>
            <Download className="h-4 w-4 mr-2" />
            Download Receipt
          </Button>
        )}
      </header>

      {/* Payment Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon(payment.status)}
            Payment Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <section className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Status</span>
            <Badge variant={getStatusColor(payment.status) as any}>
              {payment.status}
            </Badge>
          </section>
          <section className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              Payment Method
            </span>
            <Badge variant="outline">
              {payment.method === "PAYSTACK" ? "Paystack" : "Bank Transfer"}
            </Badge>
          </section>
          <section className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Type</span>
            <Badge variant="outline">
              {payment.type === "CHARTER" ? "Charter Flight" : "Empty Leg"}
            </Badge>
          </section>
          {payment.paystackReference && (
            <section className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Paystack Reference
              </span>
              <span className="font-mono text-sm">
                {payment.paystackReference}
              </span>
            </section>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Amount Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Amount Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <section className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Total Amount
              </span>
              <span className="font-semibold text-lg">
                ${payment.amountUsd.toLocaleString()}
              </span>
            </section>
            {payment.adminAmountUsd && (
              <section className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Admin Amount
                </span>
                <span>${payment.adminAmountUsd.toLocaleString()}</span>
              </section>
            )}
            {payment.operatorAmountUsd && (
              <section className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Operator Amount
                </span>
                <span>${payment.operatorAmountUsd.toLocaleString()}</span>
              </section>
            )}
            <Separator />
            <section className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Created</span>
              <span>{new Date(payment.createdAt).toLocaleDateString()}</span>
            </section>
            {payment.paidAt && (
              <section className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Paid At</span>
                <span>{new Date(payment.paidAt).toLocaleDateString()}</span>
              </section>
            )}
          </CardContent>
        </Card>

        {/* Client Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Client Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <section className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="font-medium">{payment.client.fullName}</span>
            </section>
            <section className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm">{payment.client.email}</span>
            </section>
            <section className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Phone</span>
              <span className="text-sm">{payment.client.phone}</span>
            </section>
          </CardContent>
        </Card>
      </div>

      {/* Booking Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Booking Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payment.type === "CHARTER" && payment.charterQuote ? (
            <section className="space-y-4">
              <section className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Quote Reference
                </span>
                <span className="font-mono">
                  {payment.charterQuote.referenceNumber}
                </span>
              </section>
              <section className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Flight Type
                </span>
                <Badge variant="outline">
                  {payment.charterQuote.flightType.replace("_", " ")}
                </Badge>
              </section>
              <section className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Total Price
                </span>
                <span>
                  ${payment.charterQuote.totalPriceUsd?.toLocaleString()}
                </span>
              </section>
              <div className="space-y-2">
                <p className="text-sm font-medium">Flight Route:</p>
                {payment.charterQuote.legs.map((leg, index) => (
                  <section
                    key={index}
                    className="flex items-center gap-2 text-sm"
                  >
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {leg.departureAirport.icaoCode} →{" "}
                      {leg.arrivalAirport.icaoCode}
                    </span>
                    <span className="text-muted-foreground">
                      ({new Date(leg.departureDateTime).toLocaleDateString()})
                    </span>
                  </section>
                ))}
              </div>
            </section>
          ) : payment.type === "EMPTY_LEG" && payment.emptyLegBooking ? (
            <section className="space-y-4">
              <section className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Booking Reference
                </span>
                <span className="font-mono">
                  {payment.emptyLegBooking.referenceNumber}
                </span>
              </section>
              <section className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Seats Requested
                </span>
                <span>{payment.emptyLegBooking.seatsRequested}</span>
              </section>
              <section className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Aircraft</span>
                <span>{payment.emptyLegBooking.emptyLeg.aircraft?.name}</span>
              </section>
              <section className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>
                  {payment.emptyLegBooking.emptyLeg.departureAirport.icaoCode} →{" "}
                  {payment.emptyLegBooking.emptyLeg.arrivalAirport.icaoCode}
                </span>
                <span className="text-muted-foreground">
                  (
                  {new Date(
                    payment.emptyLegBooking.emptyLeg.departureDateTime,
                  ).toLocaleDateString()}
                  )
                </span>
              </section>
            </section>
          ) : (
            <p className="text-muted-foreground">
              No booking information available
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
