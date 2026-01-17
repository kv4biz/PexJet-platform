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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
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
  Plane,
  ArrowRight,
  MoreHorizontal,
  Eye,
  Check,
  X,
} from "lucide-react";
import Link from "next/link";

interface CharterQuote {
  id: string;
  referenceNumber: string;
  status: string;
  flightType: string;
  totalPriceUsd: number | null;
  createdAt: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  legs: {
    departureAirport: { name: string; icaoCode: string };
    arrivalAirport: { name: string; icaoCode: string };
    departureDateTime: string;
  }[];
}

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
  source: string;
  emptyLeg: {
    id: string;
    departureAirport: { name: string; icaoCode: string; municipality?: string };
    arrivalAirport: { name: string; icaoCode: string; municipality?: string };
    departureDateTime: string;
    aircraft: { name: string; manufacturer?: string } | null;
    priceUsd?: number | null;
    availableSeats?: number;
  };
}

export default function QuotesPage() {
  const [activeTab, setActiveTab] = useState("charter");

  // Charter quotes state
  const [charterQuotes, setCharterQuotes] = useState<CharterQuote[]>([]);
  const [charterLoading, setCharterLoading] = useState(true);
  const [charterSearchQuery, setCharterSearchQuery] = useState("");
  const [charterStatusFilter, setCharterStatusFilter] = useState("all");
  const [charterPage, setCharterPage] = useState(1);
  const [charterTotalPages, setCharterTotalPages] = useState(1);

  // Empty leg quotes state
  const [emptyLegQuotes, setEmptyLegQuotes] = useState<EmptyLegQuote[]>([]);
  const [emptyLegLoading, setEmptyLegLoading] = useState(true);
  const [emptyLegSearchQuery, setEmptyLegSearchQuery] = useState("");
  const [emptyLegStatusFilter, setEmptyLegStatusFilter] = useState("all");
  const [emptyLegPage, setEmptyLegPage] = useState(1);
  const [emptyLegTotalPages, setEmptyLegTotalPages] = useState(1);

  const router = useRouter();

  useEffect(() => {
    fetchCharterQuotes();
  }, [charterPage, charterSearchQuery, charterStatusFilter]);

  useEffect(() => {
    fetchEmptyLegQuotes();
  }, [emptyLegPage, emptyLegSearchQuery, emptyLegStatusFilter]);

  const fetchCharterQuotes = async () => {
    try {
      setCharterLoading(true);
      const params = new URLSearchParams({
        page: charterPage.toString(),
        limit: "10",
        ...(charterSearchQuery && { search: charterSearchQuery }),
        ...(charterStatusFilter !== "all" && { status: charterStatusFilter }),
      });

      const response = await fetch(`/api/quotes/charter?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCharterQuotes(data.quotes || []);
        setCharterTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch charter quotes:", error);
    } finally {
      setCharterLoading(false);
    }
  };

  const fetchEmptyLegQuotes = async () => {
    try {
      setEmptyLegLoading(true);
      const params = new URLSearchParams({
        page: emptyLegPage.toString(),
        limit: "10",
        ...(emptyLegSearchQuery && { search: emptyLegSearchQuery }),
        ...(emptyLegStatusFilter !== "all" && { status: emptyLegStatusFilter }),
      });

      const response = await fetch(`/api/quotes/empty-leg?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEmptyLegQuotes(data.quotes || []);
        setEmptyLegTotalPages(data.totalPages || 1);
      }
    } catch (error) {
      console.error("Failed to fetch empty leg quotes:", error);
    } finally {
      setEmptyLegLoading(false);
    }
  };

  const handleRefresh = () => {
    if (activeTab === "charter") {
      fetchCharterQuotes();
    } else {
      fetchEmptyLegQuotes();
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
      case "EXPIRED":
        return "secondary";
      case "PAID":
        return "default";
      case "COMPLETED":
        return "success";
      default:
        return "secondary";
    }
  };

  const isLoading = activeTab === "charter" ? charterLoading : emptyLegLoading;

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <article>
          <h1 className="text-3xl font-bold">Quotes</h1>
          <p className="text-muted-foreground">
            Manage charter and empty leg quote requests
          </p>
        </article>
        <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </header>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList>
          <TabsTrigger value="charter" className="gap-2">
            <Plane className="h-4 w-4" />
            Charter Quotes
          </TabsTrigger>
          <TabsTrigger value="empty-leg" className="gap-2">
            <ArrowRight className="h-4 w-4" />
            Empty Leg Quotes
          </TabsTrigger>
        </TabsList>

        {/* Charter Quotes Tab */}
        <TabsContent value="charter" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <section className="flex flex-col sm:flex-row gap-4">
                <section className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by reference, client name, or email..."
                    value={charterSearchQuery}
                    onChange={(e) => {
                      setCharterSearchQuery(e.target.value);
                      setCharterPage(1);
                    }}
                    className="pl-10"
                  />
                </section>
                <Select
                  value={charterStatusFilter}
                  onValueChange={(value) => {
                    setCharterStatusFilter(value);
                    setCharterPage(1);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </section>
            </CardContent>
          </Card>

          {/* Charter Quotes Table */}
          <Card>
            <CardHeader>
              <CardTitle>Charter Quote Requests</CardTitle>
              <CardDescription>
                {charterQuotes.length > 0
                  ? `Showing ${charterQuotes.length} charter quotes`
                  : "No charter quotes found"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {charterLoading ? (
                <section className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <section key={i} className="h-16 bg-muted animate-pulse" />
                  ))}
                </section>
              ) : charterQuotes.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="w-[70px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {charterQuotes.map((quote) => (
                        <TableRow key={quote.id}>
                          <TableCell className="font-mono font-medium">
                            {quote.referenceNumber}
                          </TableCell>
                          <TableCell>
                            <article>
                              <p className="font-medium">{quote.clientName}</p>
                              <p className="text-sm text-muted-foreground">
                                {quote.clientEmail}
                              </p>
                            </article>
                          </TableCell>
                          <TableCell>
                            {quote.legs[0] && (
                              <p className="text-sm">
                                {quote.legs[0].departureAirport.icaoCode} →{" "}
                                {quote.legs[0].arrivalAirport.icaoCode}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {quote.flightType.replace("_", " ")}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {quote.totalPriceUsd
                              ? `$${quote.totalPriceUsd.toLocaleString()}`
                              : "-"}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusColor(quote.status) as any}
                            >
                              {quote.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(quote.createdAt).toLocaleDateString()}
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
                                  <Link
                                    href={`/dashboard/quotes/charter/${quote.id}`}
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                {quote.status === "PENDING" && (
                                  <>
                                    <DropdownMenuItem className="text-green-600">
                                      <Check className="h-4 w-4 mr-2" />
                                      Approve
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="text-destructive">
                                      <X className="h-4 w-4 mr-2" />
                                      Reject
                                    </DropdownMenuItem>
                                  </>
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
                      Page {charterPage} of {charterTotalPages}
                    </p>
                    <section className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCharterPage((p) => Math.max(1, p - 1))
                        }
                        disabled={charterPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setCharterPage((p) =>
                            Math.min(charterTotalPages, p + 1),
                          )
                        }
                        disabled={charterPage === charterTotalPages}
                      >
                        Next
                      </Button>
                    </section>
                  </section>
                </>
              ) : (
                <section className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No charter quotes found
                  </h3>
                  <p className="text-muted-foreground">
                    {charterSearchQuery || charterStatusFilter !== "all"
                      ? "Try different filters"
                      : "Charter quote requests will appear here"}
                  </p>
                </section>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Empty Leg Quotes Tab */}
        <TabsContent value="empty-leg" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <section className="flex flex-col sm:flex-row gap-4">
                <section className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by reference, client name, or email..."
                    value={emptyLegSearchQuery}
                    onChange={(e) => {
                      setEmptyLegSearchQuery(e.target.value);
                      setEmptyLegPage(1);
                    }}
                    className="pl-10"
                  />
                </section>
                <Select
                  value={emptyLegStatusFilter}
                  onValueChange={(value) => {
                    setEmptyLegStatusFilter(value);
                    setEmptyLegPage(1);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                    <SelectItem value="EXPIRED">Expired</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </section>
            </CardContent>
          </Card>

          {/* Empty Leg Quotes Table */}
          <Card>
            <CardHeader>
              <CardTitle>Empty Leg Quote Requests</CardTitle>
              <CardDescription>
                {emptyLegQuotes.length > 0
                  ? `Showing ${emptyLegQuotes.length} empty leg quotes - Click a row to view details`
                  : "No empty leg quotes found"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {emptyLegLoading ? (
                <section className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <section key={i} className="h-16 bg-muted animate-pulse" />
                  ))}
                </section>
              ) : emptyLegQuotes.length > 0 ? (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Reference</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Route</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {emptyLegQuotes.map((quote) => (
                        <TableRow
                          key={quote.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() =>
                            router.push(
                              `/dashboard/quotes/empty-leg/${quote.id}`,
                            )
                          }
                        >
                          <TableCell className="font-mono font-medium">
                            {quote.referenceNumber}
                          </TableCell>
                          <TableCell>
                            <article>
                              <p className="font-medium">{quote.clientName}</p>
                              <p className="text-sm text-muted-foreground">
                                {quote.clientPhone}
                              </p>
                            </article>
                          </TableCell>
                          <TableCell>
                            <p className="text-sm">
                              {quote.emptyLeg.departureAirport.icaoCode} →{" "}
                              {quote.emptyLeg.arrivalAirport.icaoCode}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={getStatusColor(quote.status) as any}
                            >
                              {quote.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(quote.createdAt).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  <section className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Page {emptyLegPage} of {emptyLegTotalPages}
                    </p>
                    <section className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setEmptyLegPage((p) => Math.max(1, p - 1))
                        }
                        disabled={emptyLegPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setEmptyLegPage((p) =>
                            Math.min(emptyLegTotalPages, p + 1),
                          )
                        }
                        disabled={emptyLegPage === emptyLegTotalPages}
                      >
                        Next
                      </Button>
                    </section>
                  </section>
                </>
              ) : (
                <section className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    No empty leg quotes found
                  </h3>
                  <p className="text-muted-foreground">
                    {emptyLegSearchQuery || emptyLegStatusFilter !== "all"
                      ? "Try different filters"
                      : "Empty leg quote requests will appear here"}
                  </p>
                </section>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </section>
  );
}
