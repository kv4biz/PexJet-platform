"use client";

import { useEffect, useState } from "react";
import {
  History,
  DollarSign,
  Calendar,
  Plane,
  Users,
  Loader2,
  Download,
  TrendingUp,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@pexjet/ui";

interface HistoryItem {
  id: string;
  referenceNumber: string;
  type: "EMPTY_LEG";
  clientName: string;
  route: string;
  date: string;
  seats: number;
  totalAmount: number;
  operatorAmount: number;
  status: string;
  paidAt: string | null;
}

interface PaymentSummary {
  totalEarnings: number;
  monthlyEarnings: number;
  pendingPayments: number;
  completedDeals: number;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [period, setPeriod] = useState("all");

  useEffect(() => {
    fetchHistory();
  }, [filter, period]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.set("status", filter);
      if (period !== "all") params.set("period", period);

      const response = await fetch(`/api/history?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHistory(data.history);
        setSummary(data.summary);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoading(false);
    }
  };

  // Format date as local time (LT) - uses UTC methods since we store local time as UTC
  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
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
    const month = months[d.getUTCMonth()];
    const day = d.getUTCDate();
    const year = d.getUTCFullYear();
    return `${month} ${day}, ${year}`;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "outline" | "destructive"> = {
      PAID: "default",
      COMPLETED: "default",
      PENDING: "outline",
      FAILED: "destructive",
    };
    return variants[status] || "outline";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">History & Payments</h1>
        <p className="text-muted-foreground">
          View your completed deals and payment history
        </p>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Earnings
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-gold-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gold-500">
                ₦{summary.totalEarnings.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Month
              </CardTitle>
              <Calendar className="h-4 w-4 text-gold-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{summary.monthlyEarnings.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending
              </CardTitle>
              <DollarSign className="h-4 w-4 text-gold-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₦{summary.pendingPayments.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed Deals
              </CardTitle>
              <Plane className="h-4 w-4 text-gold-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.completedDeals}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="week">This Week</SelectItem>
            <SelectItem value="month">This Month</SelectItem>
            <SelectItem value="year">This Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* History List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
        </div>
      ) : history.length > 0 ? (
        <div className="space-y-4">
          {history.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={getStatusBadge(item.status)}>
                        {item.status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {item.referenceNumber}
                      </span>
                    </div>

                    <p className="font-semibold">{item.clientName}</p>

                    <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Plane className="h-4 w-4" />
                        {item.route}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatDate(item.date)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {item.seats} seat(s)
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      Total: ₦{item.totalAmount.toLocaleString()}
                    </p>
                    <p className="text-lg font-bold text-gold-500">
                      Your Share: ₦{item.operatorAmount.toLocaleString()}
                    </p>
                    {item.paidAt && (
                      <p className="text-xs text-muted-foreground">
                        Paid on {formatDate(item.paidAt)}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <History className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No History Yet</h3>
            <p className="text-muted-foreground text-center">
              Your completed deals and payments will appear here
            </p>
          </CardContent>
        </Card>
      )}

      {/* Payment Info */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Information</CardTitle>
          <CardDescription>How payments work on PexJet</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <p>
            • Payments are automatically split when a client pays for your empty
            leg deal
          </p>
          <p>
            • Your share is transferred directly to your registered bank account
            via Paystack
          </p>
          <p>
            • PexJet retains a small commission as agreed in your operator
            agreement
          </p>
          <p>
            • Transfers typically arrive within 24-48 hours after payment
            confirmation
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
