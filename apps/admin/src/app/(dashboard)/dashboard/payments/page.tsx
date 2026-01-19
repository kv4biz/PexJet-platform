"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@pexjet/ui";
import {
  Search,
  FileText,
  RefreshCw,
  Filter,
  CreditCard,
  ArrowRight,
  MoreHorizontal,
  Eye,
  Download,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import Link from "next/link";

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
  };
  emptyLegBooking?: {
    referenceNumber: string;
    clientName: string;
    emptyLeg: {
      departureAirport: { name: string; icaoCode: string };
      arrivalAirport: { name: string; icaoCode: string };
    };
  };
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const router = useRouter();

  useEffect(() => {
    fetchPayments();
  }, [page, searchQuery, statusFilter, typeFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchQuery && { search: searchQuery }),
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(typeFilter !== "all" && { type: typeFilter }),
      });

      const response = await fetch(`/api/payments?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
        setTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchPayments();
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
        return <Clock className="h-4 w-4" />;
      case "SUCCESS":
        return <CheckCircle className="h-4 w-4" />;
      case "FAILED":
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getPaymentTypeColor = (type: string) => {
    return type === "CHARTER" ? "default" : "secondary";
  };

  const downloadReceipt = async (payment: Payment) => {
    try {
      // For bank transfers, try to download receipt if available
      if (payment.method === "BANK_TRANSFER" && payment.emptyLegBooking) {
        // Check if there's a receipt URL from the booking
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
            // Create download link
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

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <article>
          <h1 className="text-3xl font-bold">Payments</h1>
          <p className="text-muted-foreground">
            Manage and track all payment transactions
          </p>
        </article>
        <Button variant="outline" onClick={handleRefresh} disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </header>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <section className="flex flex-col sm:flex-row gap-4">
            <section className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by reference, client name, or email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </section>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="SUCCESS">Success</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <CreditCard className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="CHARTER">Charter</SelectItem>
                <SelectItem value="EMPTY_LEG">Empty Leg</SelectItem>
              </SelectContent>
            </Select>
          </section>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Transactions</CardTitle>
          <CardDescription>
            {payments.length > 0
              ? `Showing ${payments.length} payments`
              : "No payments found"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <section className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <section key={i} className="h-16 bg-muted animate-pulse" />
              ))}
            </section>
          ) : payments.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono font-medium">
                        {payment.referenceNumber}
                      </TableCell>
                      <TableCell>
                        <article>
                          <p className="font-medium">
                            {payment.client.fullName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {payment.client.email}
                          </p>
                        </article>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getPaymentTypeColor(payment.type) as any}
                        >
                          {payment.type === "CHARTER" ? "Charter" : "Empty Leg"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <article className="flex items-center gap-1">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-medium">
                            ${payment.amountUsd.toLocaleString()}
                          </span>
                        </article>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {payment.method === "PAYSTACK"
                            ? "Paystack"
                            : "Bank Transfer"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <article className="flex items-center gap-2">
                          {getStatusIcon(payment.status)}
                          <Badge
                            variant={getStatusColor(payment.status) as any}
                          >
                            {payment.status}
                          </Badge>
                        </article>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/dashboard/payments/${payment.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </Link>
                            </DropdownMenuItem>
                            {payment.method === "BANK_TRANSFER" && (
                              <DropdownMenuItem
                                onClick={() => downloadReceipt(payment)}
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download Receipt
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <section className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </p>
                <section className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </section>
              </section>
            </>
          ) : (
            <section className="text-center py-12">
              <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No payments found</h3>
              <p className="text-muted-foreground">
                {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                  ? "Try different filters"
                  : "Payment transactions will appear here"}
              </p>
            </section>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
