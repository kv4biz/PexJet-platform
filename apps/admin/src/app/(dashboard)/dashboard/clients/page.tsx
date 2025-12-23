"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Label,
  Textarea,
  Separator,
  ScrollArea,
  useToast,
} from "@pexjet/ui";
import {
  Search,
  Mail,
  Phone,
  Users,
  RefreshCw,
  Bell,
  Plane,
  DollarSign,
  Calendar,
  MapPin,
  Upload,
  Send,
  Loader2,
  X,
  CheckCircle,
  XCircle,
  Clock,
  Megaphone,
  UserCheck,
  Filter,
  Plus,
} from "lucide-react";

interface Client {
  id: string;
  email: string | null;
  fullName: string | null;
  phone: string;
  createdAt: string;
  _count: {
    charterQuotes: number;
    emptyLegBookings: number;
  };
}

interface ClientDetails {
  client: {
    id: string;
    email: string | null;
    fullName: string | null;
    phone: string;
    createdAt: string;
    charterQuotes: any[];
    emptyLegBookings: any[];
    payments: any[];
  };
  stats: {
    totalCharterQuotes: number;
    totalEmptyLegBookings: number;
    paidCharterQuotes: number;
    paidEmptyLegBookings: number;
    totalSpentUsd: number;
  };
}

interface Subscriber {
  id: string;
  phone: string;
  type: "ALL" | "CITY" | "ROUTE";
  cities: string[];
  routeFrom: string | null;
  routeTo: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  imageUrl: string | null;
  sentAt: string | null;
  createdAt: string;
  createdBy: { fullName: string };
}

const subscriptionTypes = [
  { value: "", label: "All Types" },
  { value: "ALL", label: "All Deals" },
  { value: "CITY", label: "By City" },
  { value: "ROUTE", label: "By Route" },
];

const statusFilters = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export default function ClientsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("clients");

  // Clients state
  const [clients, setClients] = useState<Client[]>([]);
  const [clientsLoading, setClientsLoading] = useState(true);
  const [clientSearch, setClientSearch] = useState("");
  const [clientPage, setClientPage] = useState(1);
  const [clientTotalPages, setClientTotalPages] = useState(1);
  const [selectedClient, setSelectedClient] = useState<ClientDetails | null>(
    null,
  );
  const [clientDetailLoading, setClientDetailLoading] = useState(false);

  // Subscribers state
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [subscribersLoading, setSubscribersLoading] = useState(true);
  const [subscriberSearch, setSubscriberSearch] = useState("");
  const [subscriberPage, setSubscriberPage] = useState(1);
  const [subscriberTotalPages, setSubscriberTotalPages] = useState(1);
  const [subscriberTypeFilter, setSubscriberTypeFilter] = useState("");
  const [subscriberStatusFilter, setSubscriberStatusFilter] = useState("");
  const [subscriberStats, setSubscriberStats] = useState<any>(null);
  const [selectedSubscriber, setSelectedSubscriber] =
    useState<Subscriber | null>(null);

  // Announcements state
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [announcementsLoading, setAnnouncementsLoading] = useState(true);
  const [announcementPage, setAnnouncementPage] = useState(1);
  const [announcementTotalPages, setAnnouncementTotalPages] = useState(1);
  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [announcementImage, setAnnouncementImage] = useState<File | null>(null);
  const [sendingAnnouncement, setSendingAnnouncement] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Fetch clients
  useEffect(() => {
    if (activeTab === "clients") {
      fetchClients();
    }
  }, [clientPage, clientSearch, activeTab]);

  // Fetch subscribers
  useEffect(() => {
    if (activeTab === "subscribers") {
      fetchSubscribers();
    }
  }, [
    subscriberPage,
    subscriberSearch,
    subscriberTypeFilter,
    subscriberStatusFilter,
    activeTab,
  ]);

  // Fetch announcements
  useEffect(() => {
    if (activeTab === "announcements") {
      fetchAnnouncements();
    }
  }, [announcementPage, activeTab]);

  const fetchClients = async () => {
    try {
      setClientsLoading(true);
      const params = new URLSearchParams({
        page: clientPage.toString(),
        limit: "10",
        ...(clientSearch && { search: clientSearch }),
      });

      const response = await fetch(`/api/clients?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setClients(data.clients);
        setClientTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    } finally {
      setClientsLoading(false);
    }
  };

  const fetchClientDetails = async (clientId: string) => {
    try {
      setClientDetailLoading(true);
      const response = await fetch(`/api/clients/${clientId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedClient(data);
      }
    } catch (error) {
      console.error("Failed to fetch client details:", error);
      toast({
        title: "Error",
        description: "Failed to load client details",
        variant: "destructive",
      });
    } finally {
      setClientDetailLoading(false);
    }
  };

  const fetchSubscribers = async () => {
    try {
      setSubscribersLoading(true);
      const params = new URLSearchParams({
        page: subscriberPage.toString(),
        limit: "10",
        ...(subscriberSearch && { search: subscriberSearch }),
        ...(subscriberTypeFilter !== "all" && { type: subscriberTypeFilter }),
        ...(subscriberStatusFilter !== "all" && {
          status: subscriberStatusFilter,
        }),
      });

      const response = await fetch(`/api/subscribers?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscribers(data.subscribers);
        setSubscriberTotalPages(data.totalPages);
        setSubscriberStats(data.stats);
      }
    } catch (error) {
      console.error("Failed to fetch subscribers:", error);
    } finally {
      setSubscribersLoading(false);
    }
  };

  const fetchAnnouncements = async () => {
    try {
      setAnnouncementsLoading(true);
      const params = new URLSearchParams({
        page: announcementPage.toString(),
        limit: "10",
      });

      const response = await fetch(`/api/announcements?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.announcements);
        setAnnouncementTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
    } finally {
      setAnnouncementsLoading(false);
    }
  };

  const sendAnnouncement = async () => {
    if (!announcementTitle.trim() || !announcementMessage.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and message are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSendingAnnouncement(true);
      const formData = new FormData();
      formData.append("title", announcementTitle);
      formData.append("message", announcementMessage);
      formData.append("sendNow", "true");
      if (announcementImage) {
        formData.append("image", announcementImage);
      }

      const response = await fetch("/api/announcements", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Announcement Sent",
          description: data.delivery
            ? `Sent to ${data.delivery.sent}/${data.delivery.total} subscribers`
            : "Announcement created successfully",
        });
        setShowAnnouncementForm(false);
        setAnnouncementTitle("");
        setAnnouncementMessage("");
        setAnnouncementImage(null);
        fetchAnnouncements();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send announcement",
        variant: "destructive",
      });
    } finally {
      setSendingAnnouncement(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PAID":
      case "COMPLETED":
      case "SUCCESS":
        return (
          <Badge variant="success">
            <CheckCircle className="h-3 w-3 mr-1" />
            Paid
          </Badge>
        );
      case "PENDING":
        return (
          <Badge variant="warning">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
      case "REJECTED":
      case "FAILED":
        return (
          <Badge variant="destructive">
            <XCircle className="h-3 w-3 mr-1" />
            Rejected
          </Badge>
        );
      case "APPROVED":
        return (
          <Badge variant="gold">
            <CheckCircle className="h-3 w-3 mr-1" />
            Approved
          </Badge>
        );
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSubscriptionTypeBadge = (type: string) => {
    switch (type) {
      case "ALL":
        return <Badge variant="gold">All Deals</Badge>;
      case "CITY":
        return <Badge variant="secondary">By City</Badge>;
      case "ROUTE":
        return <Badge>By Route</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <article>
          <h1 className="text-3xl font-bold">Client Management</h1>
          <p className="text-muted-foreground">
            Manage clients, subscribers, and announcements
          </p>
        </article>
        <section className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              if (activeTab === "clients") fetchClients();
              else if (activeTab === "subscribers") fetchSubscribers();
              else fetchAnnouncements();
            }}
            disabled={
              clientsLoading || subscribersLoading || announcementsLoading
            }
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${clientsLoading || subscribersLoading || announcementsLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          {activeTab === "announcements" && (
            <Button
              variant="gold"
              onClick={() => {
                setSelectedAnnouncement(null);
                setShowAnnouncementForm(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Announcement
            </Button>
          )}
        </section>
      </header>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="clients" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Clients
          </TabsTrigger>
          <TabsTrigger value="subscribers" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Subscribers
          </TabsTrigger>
          <TabsTrigger
            value="announcements"
            className="flex items-center gap-2"
          >
            <Megaphone className="h-4 w-4" />
            Announcements
          </TabsTrigger>
        </TabsList>

        {/* CLIENTS TAB */}
        <TabsContent value="clients" className="space-y-4">
          {/* Search & Filter */}
          <Card>
            <CardContent className="pt-6">
              <section className="flex flex-col md:flex-row gap-4">
                <section className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={clientSearch}
                    onChange={(e) => {
                      setClientSearch(e.target.value);
                      setClientPage(1);
                    }}
                    className="pl-10"
                  />
                </section>
                {clientSearch && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setClientSearch("")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </section>
            </CardContent>
          </Card>

          {/* Two-Column Layout */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Clients Table */}
            <Card
              className={selectedClient ? "lg:col-span-2" : "lg:col-span-3"}
            >
              <CardHeader>
                <CardTitle>Client Database</CardTitle>
                <CardDescription>
                  {clients.length > 0
                    ? `Showing ${clients.length} clients`
                    : "No clients found"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {clientsLoading ? (
                  <section className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <section
                        key={i}
                        className="h-16 bg-muted animate-pulse"
                      />
                    ))}
                  </section>
                ) : clients.length > 0 ? (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Client</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Quotes</TableHead>
                          <TableHead>Joined</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clients.map((client) => (
                          <TableRow
                            key={client.id}
                            className={`cursor-pointer hover:bg-accent ${selectedClient?.client.id === client.id ? "bg-accent" : ""}`}
                            onClick={() => fetchClientDetails(client.id)}
                          >
                            <TableCell>
                              <section className="flex items-center gap-3">
                                <section className="w-10 h-10 bg-muted flex items-center justify-center">
                                  <Users className="h-5 w-5 text-muted-foreground" />
                                </section>
                                <article>
                                  <p className="font-medium">
                                    {client.fullName || "Unknown"}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {client.phone}
                                  </p>
                                </article>
                              </section>
                            </TableCell>
                            <TableCell>
                              {client.email ? (
                                <section className="flex items-center gap-1 text-sm">
                                  <Mail className="h-3 w-3 text-muted-foreground" />
                                  {client.email}
                                </section>
                              ) : (
                                <span className="text-muted-foreground text-sm">
                                  No email
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <section className="flex gap-2">
                                <Badge variant="secondary">
                                  {client._count.charterQuotes} Charter
                                </Badge>
                                <Badge variant="secondary">
                                  {client._count.emptyLegBookings} Empty
                                </Badge>
                              </section>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(client.createdAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <section className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Page {clientPage} of {clientTotalPages}
                      </p>
                      <section className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setClientPage((p) => Math.max(1, p - 1))
                          }
                          disabled={clientPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setClientPage((p) =>
                              Math.min(clientTotalPages, p + 1),
                            )
                          }
                          disabled={clientPage === clientTotalPages}
                        >
                          Next
                        </Button>
                      </section>
                    </section>
                  </>
                ) : (
                  <section className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No clients found
                    </h3>
                    <p className="text-muted-foreground">
                      {clientSearch
                        ? "Try a different search term"
                        : "Clients will appear here when they request quotes"}
                    </p>
                  </section>
                )}
              </CardContent>
            </Card>

            {/* Client Detail Panel */}
            {selectedClient && (
              <Card className="lg:col-span-1">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-lg">
                      {selectedClient.client.fullName || "Unknown"}
                    </CardTitle>
                    <CardDescription>
                      {selectedClient.client.phone}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedClient(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs defaultValue="overview" className="w-full">
                    <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                      <TabsTrigger
                        value="overview"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                      >
                        Overview
                      </TabsTrigger>
                      <TabsTrigger
                        value="charter"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                      >
                        Charter
                      </TabsTrigger>
                      <TabsTrigger
                        value="emptyleg"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                      >
                        Empty Leg
                      </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent
                      value="overview"
                      className="p-4 space-y-3 mt-0"
                    >
                      <ScrollArea className="h-[400px] pr-4">
                        <section className="space-y-4">
                          {/* Contact Info */}
                          <article>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                              Contact
                            </p>
                            <section className="space-y-2">
                              <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-muted-foreground" />
                                {selectedClient.client.phone}
                              </div>
                              {selectedClient.client.email && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Mail className="h-4 w-4 text-muted-foreground" />
                                  {selectedClient.client.email}
                                </div>
                              )}
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Calendar className="h-4 w-4" />
                                Member since{" "}
                                {new Date(
                                  selectedClient.client.createdAt,
                                ).toLocaleDateString()}
                              </div>
                            </section>
                          </article>

                          <Separator />

                          {/* Stats */}
                          <article>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                              Activity
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="bg-muted p-3">
                                <p className="text-2xl font-bold">
                                  {selectedClient.stats.totalCharterQuotes}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Charter Quotes
                                </p>
                                <p className="text-xs text-green-600">
                                  {selectedClient.stats.paidCharterQuotes} paid
                                </p>
                              </div>
                              <div className="bg-muted p-3">
                                <p className="text-2xl font-bold">
                                  {selectedClient.stats.totalEmptyLegBookings}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Empty Leg
                                </p>
                                <p className="text-xs text-green-600">
                                  {selectedClient.stats.paidEmptyLegBookings}{" "}
                                  paid
                                </p>
                              </div>
                            </div>
                          </article>

                          {selectedClient.stats.totalSpentUsd > 0 && (
                            <>
                              <Separator />
                              <article>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                                  Spending
                                </p>
                                <div className="flex items-center gap-2">
                                  <DollarSign className="h-5 w-5 text-green-500" />
                                  <span className="text-2xl font-bold">
                                    $
                                    {selectedClient.stats.totalSpentUsd.toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Total Spent (USD)
                                </p>
                              </article>
                            </>
                          )}
                        </section>
                      </ScrollArea>
                    </TabsContent>

                    {/* Charter Quotes Tab */}
                    <TabsContent value="charter" className="p-4 mt-0">
                      <ScrollArea className="h-[400px] pr-4">
                        {selectedClient.client.charterQuotes.length > 0 ? (
                          <section className="space-y-2">
                            {selectedClient.client.charterQuotes.map(
                              (quote: any) => (
                                <div key={quote.id} className="border p-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium text-sm">
                                        {quote.referenceNumber}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {quote.legs[0]?.departureAirport
                                          ?.icaoCode || "N/A"}{" "}
                                        →{" "}
                                        {quote.legs[0]?.arrivalAirport
                                          ?.icaoCode || "N/A"}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      {getStatusBadge(quote.status)}
                                      {quote.totalPriceUsd && (
                                        <p className="text-xs text-muted-foreground mt-1">
                                          $
                                          {quote.totalPriceUsd.toLocaleString()}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ),
                            )}
                          </section>
                        ) : (
                          <section className="text-center py-8">
                            <Plane className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              No charter quotes
                            </p>
                          </section>
                        )}
                      </ScrollArea>
                    </TabsContent>

                    {/* Empty Leg Tab */}
                    <TabsContent value="emptyleg" className="p-4 mt-0">
                      <ScrollArea className="h-[400px] pr-4">
                        {selectedClient.client.emptyLegBookings.length > 0 ? (
                          <section className="space-y-2">
                            {selectedClient.client.emptyLegBookings.map(
                              (booking: any) => (
                                <div key={booking.id} className="border p-3">
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium text-sm">
                                        {booking.referenceNumber}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {booking.emptyLeg?.departureAirport
                                          ?.icaoCode || "N/A"}{" "}
                                        →{" "}
                                        {booking.emptyLeg?.arrivalAirport
                                          ?.icaoCode || "N/A"}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      {getStatusBadge(booking.status)}
                                      <p className="text-xs text-muted-foreground mt-1">
                                        $
                                        {booking.totalPriceUsd?.toLocaleString() ||
                                          0}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ),
                            )}
                          </section>
                        ) : (
                          <section className="text-center py-8">
                            <Plane className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                            <p className="text-sm text-muted-foreground">
                              No empty leg bookings
                            </p>
                          </section>
                        )}
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </section>
        </TabsContent>

        {/* SUBSCRIBERS TAB */}
        <TabsContent value="subscribers" className="space-y-4">
          {/* Search & Filter */}
          <Card>
            <CardContent className="pt-6">
              <section className="flex flex-col md:flex-row gap-4">
                <section className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by phone number..."
                    value={subscriberSearch}
                    onChange={(e) => {
                      setSubscriberSearch(e.target.value);
                      setSubscriberPage(1);
                    }}
                    className="pl-10"
                  />
                </section>

                <section className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <select
                    value={subscriberTypeFilter}
                    onChange={(e) => {
                      setSubscriberTypeFilter(e.target.value);
                      setSubscriberPage(1);
                    }}
                    className="h-10 pl-10 pr-4 border border-input bg-background text-sm focus:outline-none min-w-[150px]"
                  >
                    {subscriptionTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </section>

                <section className="relative">
                  <select
                    value={subscriberStatusFilter}
                    onChange={(e) => {
                      setSubscriberStatusFilter(e.target.value);
                      setSubscriberPage(1);
                    }}
                    className="h-10 px-4 border border-input bg-background text-sm focus:outline-none min-w-[130px]"
                  >
                    {statusFilters.map((status) => (
                      <option key={status.value} value={status.value}>
                        {status.label}
                      </option>
                    ))}
                  </select>
                </section>

                {(subscriberSearch ||
                  subscriberTypeFilter ||
                  subscriberStatusFilter) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSubscriberSearch("");
                      setSubscriberTypeFilter("");
                      setSubscriberStatusFilter("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </section>
            </CardContent>
          </Card>

          {/* Two-Column Layout */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Subscribers Table */}
            <Card
              className={selectedSubscriber ? "lg:col-span-2" : "lg:col-span-3"}
            >
              <CardHeader>
                <CardTitle>Empty Leg Subscribers</CardTitle>
                <CardDescription>
                  {subscribers.length > 0
                    ? `Showing ${subscribers.length} subscribers`
                    : "No subscribers found"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {subscribersLoading ? (
                  <section className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <section
                        key={i}
                        className="h-16 bg-muted animate-pulse"
                      />
                    ))}
                  </section>
                ) : subscribers.length > 0 ? (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Subscriber</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Subscribed</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subscribers.map((subscriber) => (
                          <TableRow
                            key={subscriber.id}
                            className={`cursor-pointer hover:bg-accent ${selectedSubscriber?.id === subscriber.id ? "bg-accent" : ""}`}
                            onClick={() => setSelectedSubscriber(subscriber)}
                          >
                            <TableCell>
                              <section className="flex items-center gap-3">
                                <section className="w-10 h-10 bg-muted flex items-center justify-center">
                                  <Bell className="h-5 w-5 text-muted-foreground" />
                                </section>
                                <article>
                                  <p className="font-medium">
                                    {subscriber.phone}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {subscriber.type === "ALL" && "All deals"}
                                    {subscriber.type === "CITY" &&
                                      `${subscriber.cities.length} cities`}
                                    {subscriber.type === "ROUTE" &&
                                      "Specific route"}
                                  </p>
                                </article>
                              </section>
                            </TableCell>
                            <TableCell>
                              {getSubscriptionTypeBadge(subscriber.type)}
                            </TableCell>
                            <TableCell>
                              {subscriber.isActive ? (
                                <Badge variant="success">Active</Badge>
                              ) : (
                                <Badge variant="secondary">Inactive</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(
                                subscriber.createdAt,
                              ).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <section className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Page {subscriberPage} of {subscriberTotalPages}
                      </p>
                      <section className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setSubscriberPage((p) => Math.max(1, p - 1))
                          }
                          disabled={subscriberPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setSubscriberPage((p) =>
                              Math.min(subscriberTotalPages, p + 1),
                            )
                          }
                          disabled={subscriberPage === subscriberTotalPages}
                        >
                          Next
                        </Button>
                      </section>
                    </section>
                  </>
                ) : (
                  <section className="text-center py-12">
                    <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No subscribers found
                    </h3>
                    <p className="text-muted-foreground">
                      {subscriberSearch ||
                      subscriberTypeFilter ||
                      subscriberStatusFilter
                        ? "Try different search or filter"
                        : "Subscribers will appear here when users subscribe"}
                    </p>
                  </section>
                )}
              </CardContent>
            </Card>

            {/* Subscriber Detail Panel */}
            {selectedSubscriber && (
              <Card className="lg:col-span-1">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-lg">
                      {selectedSubscriber.phone}
                    </CardTitle>
                    <CardDescription>
                      {selectedSubscriber.isActive
                        ? "Active Subscriber"
                        : "Inactive"}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedSubscriber(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs defaultValue="details" className="w-full">
                    <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                      <TabsTrigger
                        value="details"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                      >
                        Details
                      </TabsTrigger>
                      <TabsTrigger
                        value="preferences"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                      >
                        Preferences
                      </TabsTrigger>
                    </TabsList>

                    {/* Details Tab */}
                    <TabsContent value="details" className="p-4 space-y-3 mt-0">
                      <ScrollArea className="h-[350px] pr-4">
                        <article className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Type
                            </p>
                            {getSubscriptionTypeBadge(selectedSubscriber.type)}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Status
                            </p>
                            {selectedSubscriber.isActive ? (
                              <Badge variant="success" className="mt-1">
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="mt-1">
                                Inactive
                              </Badge>
                            )}
                          </div>
                        </article>

                        <Separator className="my-3" />

                        <article>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                            Phone Number
                          </p>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium">
                              {selectedSubscriber.phone}
                            </p>
                          </div>
                        </article>

                        <article className="mt-3">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                            Subscribed On
                          </p>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium">
                              {new Date(
                                selectedSubscriber.createdAt,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </article>
                      </ScrollArea>
                    </TabsContent>

                    {/* Preferences Tab */}
                    <TabsContent value="preferences" className="p-4 mt-0">
                      <ScrollArea className="h-[350px] pr-4">
                        <section className="space-y-4">
                          <article>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                              Subscription Type
                            </p>
                            <p className="font-medium">
                              {selectedSubscriber.type === "ALL" &&
                                "All Empty Leg Deals"}
                              {selectedSubscriber.type === "CITY" && "By City"}
                              {selectedSubscriber.type === "ROUTE" &&
                                "Specific Route"}
                            </p>
                          </article>

                          {selectedSubscriber.type === "CITY" && (
                            <article>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                                Watching Cities
                              </p>
                              <section className="flex flex-wrap gap-2">
                                {selectedSubscriber.cities.length > 0 ? (
                                  selectedSubscriber.cities.map((city, idx) => (
                                    <Badge key={idx} variant="secondary">
                                      <MapPin className="h-3 w-3 mr-1" />
                                      {city}
                                    </Badge>
                                  ))
                                ) : (
                                  <p className="text-sm text-muted-foreground">
                                    No cities specified
                                  </p>
                                )}
                              </section>
                            </article>
                          )}

                          {selectedSubscriber.type === "ROUTE" && (
                            <article>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                                Watching Route
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {selectedSubscriber.routeFrom || "N/A"}
                                </Badge>
                                <span>→</span>
                                <Badge variant="outline">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {selectedSubscriber.routeTo || "N/A"}
                                </Badge>
                              </div>
                            </article>
                          )}

                          {selectedSubscriber.type === "ALL" && (
                            <article>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                                Coverage
                              </p>
                              <p className="text-sm">
                                Receives notifications for all empty leg deals
                                published on the platform.
                              </p>
                            </article>
                          )}
                        </section>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}
          </section>
        </TabsContent>

        {/* ANNOUNCEMENTS TAB */}
        <TabsContent value="announcements" className="space-y-4">
          {/* Two-Column Layout */}
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Announcements List */}
            <Card
              className={
                selectedAnnouncement || showAnnouncementForm
                  ? "lg:col-span-2"
                  : "lg:col-span-3"
              }
            >
              <CardHeader>
                <CardTitle>Public Announcements</CardTitle>
                <CardDescription>
                  {announcements.length > 0
                    ? `Showing ${announcements.length} announcements`
                    : "No announcements yet"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {announcementsLoading ? (
                  <section className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <section
                        key={i}
                        className="h-16 bg-muted animate-pulse"
                      />
                    ))}
                  </section>
                ) : announcements.length > 0 ? (
                  <>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Announcement</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Created By</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {announcements.map((announcement) => (
                          <TableRow
                            key={announcement.id}
                            className={`cursor-pointer hover:bg-accent ${selectedAnnouncement?.id === announcement.id ? "bg-accent" : ""}`}
                            onClick={() =>
                              setSelectedAnnouncement(announcement)
                            }
                          >
                            <TableCell>
                              <section className="flex items-center gap-3">
                                {announcement.imageUrl ? (
                                  <Image
                                    src={announcement.imageUrl}
                                    alt={announcement.title}
                                    width={60}
                                    height={40}
                                    className="object-cover"
                                  />
                                ) : (
                                  <section className="w-[60px] h-[40px] bg-muted flex items-center justify-center">
                                    <Megaphone className="h-5 w-5 text-muted-foreground" />
                                  </section>
                                )}
                                <article>
                                  <p className="font-medium">
                                    {announcement.title}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {announcement.message.length > 50
                                      ? announcement.message.substring(0, 50) +
                                        "..."
                                      : announcement.message}
                                  </p>
                                </article>
                              </section>
                            </TableCell>
                            <TableCell>
                              {announcement.sentAt ? (
                                <Badge variant="success">Sent</Badge>
                              ) : (
                                <Badge variant="secondary">Draft</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {announcement.createdBy.fullName}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {new Date(
                                announcement.sentAt || announcement.createdAt,
                              ).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>

                    <section className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Page {announcementPage} of {announcementTotalPages}
                      </p>
                      <section className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setAnnouncementPage((p) => Math.max(1, p - 1))
                          }
                          disabled={announcementPage === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            setAnnouncementPage((p) =>
                              Math.min(announcementTotalPages, p + 1),
                            )
                          }
                          disabled={announcementPage === announcementTotalPages}
                        >
                          Next
                        </Button>
                      </section>
                    </section>
                  </>
                ) : (
                  <section className="text-center py-12">
                    <Megaphone className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">
                      No announcements yet
                    </h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first announcement to send to all subscribers
                    </p>
                    <Button
                      variant="gold"
                      onClick={() => setShowAnnouncementForm(true)}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Announcement
                    </Button>
                  </section>
                )}
              </CardContent>
            </Card>

            {/* Announcement Detail Panel */}
            {selectedAnnouncement && (
              <Card className="lg:col-span-1">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-lg">
                      {selectedAnnouncement.title}
                    </CardTitle>
                    <CardDescription>
                      {selectedAnnouncement.sentAt ? "Sent" : "Draft"}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedAnnouncement(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Tabs defaultValue="details" className="w-full">
                    <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                      <TabsTrigger
                        value="details"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                      >
                        Details
                      </TabsTrigger>
                      <TabsTrigger
                        value="content"
                        className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                      >
                        Content
                      </TabsTrigger>
                    </TabsList>

                    {/* Details Tab */}
                    <TabsContent value="details" className="p-4 space-y-3 mt-0">
                      <ScrollArea className="h-[350px] pr-4">
                        <article className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Status
                            </p>
                            {selectedAnnouncement.sentAt ? (
                              <Badge variant="success" className="mt-1">
                                Sent
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="mt-1">
                                Draft
                              </Badge>
                            )}
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">
                              Has Image
                            </p>
                            <Badge
                              variant={
                                selectedAnnouncement.imageUrl
                                  ? "success"
                                  : "secondary"
                              }
                              className="mt-1"
                            >
                              {selectedAnnouncement.imageUrl ? "Yes" : "No"}
                            </Badge>
                          </div>
                        </article>

                        <Separator className="my-3" />

                        <article>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                            Created By
                          </p>
                          <p className="font-medium">
                            {selectedAnnouncement.createdBy.fullName}
                          </p>
                        </article>

                        <article className="mt-3">
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                            Created On
                          </p>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium">
                              {new Date(
                                selectedAnnouncement.createdAt,
                              ).toLocaleString()}
                            </p>
                          </div>
                        </article>

                        {selectedAnnouncement.sentAt && (
                          <article className="mt-3">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                              Sent On
                            </p>
                            <div className="flex items-center gap-2">
                              <Send className="h-4 w-4 text-green-500" />
                              <p className="font-medium">
                                {new Date(
                                  selectedAnnouncement.sentAt,
                                ).toLocaleString()}
                              </p>
                            </div>
                          </article>
                        )}
                      </ScrollArea>
                    </TabsContent>

                    {/* Content Tab */}
                    <TabsContent value="content" className="p-4 mt-0">
                      <ScrollArea className="h-[350px] pr-4">
                        <section className="space-y-4">
                          {selectedAnnouncement.imageUrl && (
                            <article>
                              <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                                Image
                              </p>
                              <Image
                                src={selectedAnnouncement.imageUrl}
                                alt={selectedAnnouncement.title}
                                width={300}
                                height={200}
                                className="object-cover w-full"
                              />
                            </article>
                          )}

                          <article>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                              Title
                            </p>
                            <p className="font-medium">
                              {selectedAnnouncement.title}
                            </p>
                          </article>

                          <article>
                            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                              Message
                            </p>
                            <p className="text-sm whitespace-pre-wrap">
                              {selectedAnnouncement.message}
                            </p>
                          </article>
                        </section>
                      </ScrollArea>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            )}

            {/* New Announcement Form Panel */}
            {showAnnouncementForm && !selectedAnnouncement && (
              <Card className="lg:col-span-1">
                <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-lg">New Announcement</CardTitle>
                    <CardDescription>Send to all subscribers</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setShowAnnouncementForm(false);
                      setAnnouncementTitle("");
                      setAnnouncementMessage("");
                      setAnnouncementImage(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[450px] pr-4">
                    <section className="space-y-4">
                      <fieldset className="space-y-2">
                        <Label>Title *</Label>
                        <Input
                          placeholder="e.g., Holiday Special Deals!"
                          value={announcementTitle}
                          onChange={(e) => setAnnouncementTitle(e.target.value)}
                        />
                      </fieldset>
                      <fieldset className="space-y-2">
                        <Label>Message *</Label>
                        <Textarea
                          placeholder="Write your announcement message..."
                          value={announcementMessage}
                          onChange={(e) =>
                            setAnnouncementMessage(e.target.value)
                          }
                          rows={6}
                        />
                      </fieldset>
                      <fieldset className="space-y-2">
                        <Label>Image (Optional)</Label>
                        <section className="space-y-2">
                          <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => imageInputRef.current?.click()}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            {announcementImage
                              ? "Change Image"
                              : "Upload Image"}
                          </Button>
                          {announcementImage && (
                            <section className="flex items-center justify-between p-2 bg-muted">
                              <span className="text-sm text-muted-foreground truncate">
                                {announcementImage.name}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => setAnnouncementImage(null)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </section>
                          )}
                          <input
                            ref={imageInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0]) {
                                setAnnouncementImage(e.target.files[0]);
                              }
                            }}
                          />
                        </section>
                      </fieldset>

                      <Separator className="my-4" />

                      <section className="flex gap-2">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => {
                            setShowAnnouncementForm(false);
                            setAnnouncementTitle("");
                            setAnnouncementMessage("");
                            setAnnouncementImage(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="gold"
                          className="flex-1"
                          onClick={sendAnnouncement}
                          disabled={sendingAnnouncement}
                        >
                          {sendingAnnouncement ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4 mr-2" />
                          )}
                          Send
                        </Button>
                      </section>
                    </section>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </section>
  );
}
