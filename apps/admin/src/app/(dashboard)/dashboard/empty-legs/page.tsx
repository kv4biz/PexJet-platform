"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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
  Search,
  Plus,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  Calendar,
  RefreshCw,
  Plane,
  Filter,
  Bell,
  Loader2,
  Cloud,
  ExternalLink,
  X,
  MapPin,
  DollarSign,
  Users,
  Clock,
  Globe,
  Mail,
  Phone,
} from "lucide-react";
import { formatUSD, formatDuration, formatTime } from "@/lib/format-currency";
import EmptyLegForm from "./EmptyLegForm";

interface EmptyLeg {
  id: string;
  slug: string;
  status: string;
  source: "ADMIN" | "OPERATOR" | "INSTACHARTER";
  priceType: "FIXED" | "CONTACT";
  priceUsd: number | null;
  originalPriceUsd: number | null;
  totalSeats: number;
  availableSeats: number;
  departureDateTime: string;
  estimatedArrival: string | null;
  estimatedDurationMin: number | null;
  // Direct ID fields (for form compatibility)
  aircraftId: string | null;
  departureAirportId: string | null;
  arrivalAirportId: string | null;
  // Denormalized fields (for InstaCharter)
  departureIcao: string | null;
  departureCity: string | null;
  arrivalIcao: string | null;
  arrivalCity: string | null;
  aircraftName: string | null;
  aircraftType: string | null;
  aircraftImage: string | null;
  // Operator fields (for InstaCharter)
  operatorName: string | null;
  operatorEmail: string | null;
  operatorPhone: string | null;
  operatorCompanyId: number | null;
  operatorWebsite: string | null;
  operatorRating: number | null;
  // Relations (for Admin/Operator)
  aircraft: {
    id: string;
    name: string;
    manufacturer: string;
    category: string;
    maxPax: number | null;
    image: string | null;
  } | null;
  departureAirport: {
    id: string;
    name: string;
    municipality: string | null;
    iataCode: string | null;
    icaoCode: string | null;
    countryCode: string;
  } | null;
  arrivalAirport: {
    id: string;
    name: string;
    municipality: string | null;
    iataCode: string | null;
    icaoCode: string | null;
    countryCode: string;
  } | null;
  createdByAdmin: { id: string; fullName: string } | null;
  createdByOperator: { id: string; fullName: string } | null;
  _count: { bookings: number };
}

interface SyncStatus {
  lastSync: string | null;
  status: string | null;
  dealsCount: number;
  nextScheduledSync: string;
}

export default function EmptyLegsPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [emptyLegs, setEmptyLegs] = useState<EmptyLeg[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [notifying, setNotifying] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmptyLeg, setSelectedEmptyLeg] = useState<EmptyLeg | null>(
    null,
  );
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    aircraftId: "",
    departureAirportId: "",
    arrivalAirportId: "",
    departureDate: { date: "", time: "" },
    totalSeats: "",
    priceType: "FIXED" as "FIXED" | "CONTACT",
    priceUsd: "",
  });

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch("/api/instacharter/sync", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setSyncStatus(data.status);
      }
    } catch (error) {
      console.error("Failed to fetch sync status:", error);
    }
  };

  const triggerSync = async () => {
    try {
      setSyncing(true);
      const response = await fetch("/api/instacharter/sync", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        toast({
          title: "Sync Complete",
          description: data.message,
        });
        fetchEmptyLegs();
        fetchSyncStatus();
      } else {
        toast({
          title: "Sync Failed",
          description: data.error || "Failed to sync InstaCharter deals",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sync InstaCharter deals",
        variant: "destructive",
      });
    } finally {
      setSyncing(false);
    }
  };

  const fetchEmptyLegs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchQuery && { search: searchQuery }),
        ...(sourceFilter !== "all" && { source: sourceFilter }),
      });

      const response = await fetch(`/api/empty-legs?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setEmptyLegs(data.emptyLegs);
        setTotalPages(data.totalPages);
      } else {
        console.error(
          "Empty legs API error:",
          response.status,
          response.statusText,
        );
      }
    } catch (error) {
      console.error("Failed to fetch empty legs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmptyLegs();
    fetchSyncStatus();
  }, [page, searchQuery, sourceFilter]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "success";
      case "OPEN":
        return "warning";
      case "CLOSED":
        return "secondary";
      case "UNAVAILABLE":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case "ADMIN":
        return "default";
      case "OPERATOR":
        return "secondary";
      case "INSTACHARTER":
        return "outline";
      default:
        return "secondary";
    }
  };

  const handleDelete = async () => {
    if (!selectedEmptyLeg) return;
    try {
      setDeleting(true);
      const response = await fetch(`/api/empty-legs/${selectedEmptyLeg.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (response.ok) {
        toast({
          title: "Deleted",
          description: "Empty leg deleted successfully",
        });
        setSelectedEmptyLeg(null);
        setIsEditing(false);
        fetchEmptyLegs();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to delete",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete empty leg",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const startEdit = () => {
    if (!selectedEmptyLeg) return;

    // Navigate to edit page instead of inline editing
    router.push(`/dashboard/empty-legs/${selectedEmptyLeg.id}/edit`);
  };

  const handleSave = async (data: any) => {
    try {
      const url =
        isEditing && selectedEmptyLeg
          ? `/api/empty-legs/${selectedEmptyLeg.id}`
          : "/api/empty-legs";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: isEditing ? "Empty Leg Updated" : "Empty Leg Created",
          description: isEditing
            ? "Changes saved successfully."
            : "New empty leg created.",
        });
        setIsEditing(false);
        setSelectedEmptyLeg(null);
        fetchEmptyLegs();
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to save empty leg",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save empty leg",
        variant: "destructive",
      });
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setFormData({
      aircraftId: "",
      departureAirportId: "",
      arrivalAirportId: "",
      departureDate: { date: "", time: "" },
      totalSeats: "",
      priceType: "FIXED",
      priceUsd: "",
    });
  };

  const notifySubscribers = async () => {
    try {
      setNotifying(true);
      const response = await fetch("/api/empty-legs/notify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ sendToAll: true }),
      });

      const data = await response.json();

      if (response.ok) {
        const { sent, totalSubscribers, failed, skipped, failedNumbers } =
          data.delivery;
        let description = `Sent to ${sent}/${totalSubscribers} subscribers`;
        if (skipped > 0) {
          description += ` | ${skipped} skipped (no match)`;
        }
        if (failed > 0) {
          description += ` | ${failed} failed`;
        }
        description += ` | ${data.dealsIncluded} deals`;

        toast({
          title: sent > 0 ? "Notifications Sent" : "No Notifications Sent",
          description,
          variant: sent > 0 ? "default" : "destructive",
        });

        // Log details for debugging
        console.log("Notification result:", data);
        if (failedNumbers && failedNumbers.length > 0) {
          console.log("Failed numbers:", failedNumbers);
        }
      } else {
        toast({
          title: "Error",
          description: data.error || "Failed to send notifications",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send notifications",
        variant: "destructive",
      });
    } finally {
      setNotifying(false);
    }
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <article>
          <h1 className="text-3xl font-bold">Empty Legs</h1>
          <p className="text-muted-foreground">
            Manage empty leg deals
            {syncStatus && syncStatus.dealsCount > 0 && (
              <span className="ml-2 text-xs">
                ({syncStatus.dealsCount} InstaCharter deals)
              </span>
            )}
          </p>
        </article>
        <section className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={fetchEmptyLegs} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="outline" onClick={triggerSync} disabled={syncing}>
            {syncing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Cloud className="h-4 w-4 mr-2" />
            )}
            Sync InstaCharter
          </Button>
          <Button
            variant="outline"
            onClick={notifySubscribers}
            disabled={notifying}
          >
            {notifying ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Bell className="h-4 w-4 mr-2" />
            )}
            Notify
          </Button>
          <Button variant="gold" asChild>
            <Link href="/dashboard/empty-legs/new">
              <Plus className="h-4 w-4 mr-2" />
              Create
            </Link>
          </Button>
        </section>
      </header>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <section className="flex flex-col sm:flex-row gap-4">
            <section className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by reference, route, or aircraft..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </section>
            <Select
              value={sourceFilter}
              onValueChange={(v) => {
                setSourceFilter(v);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sources</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
                <SelectItem value="INSTACHARTER">InstaCharter</SelectItem>
              </SelectContent>
            </Select>
          </section>
        </CardContent>
      </Card>

      {/* Main Content - Table and Detail Panel */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Empty Legs Table */}
        <Card className={selectedEmptyLeg ? "lg:col-span-2" : "lg:col-span-3"}>
          <CardHeader>
            <CardTitle>Available Deals</CardTitle>
            <CardDescription>
              {emptyLegs.length > 0
                ? `Showing ${emptyLegs.length} empty legs`
                : "No empty legs found"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <section className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <section key={i} className="h-16 bg-muted animate-pulse" />
                ))}
              </section>
            ) : emptyLegs.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Source</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Aircraft</TableHead>
                      <TableHead>Seats</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {emptyLegs.map((leg) => {
                      const currentPrice = leg.priceUsd ?? 0;
                      const originalPrice =
                        leg.originalPriceUsd ?? currentPrice;
                      const discount =
                        originalPrice > 0
                          ? Math.round(
                              ((originalPrice - currentPrice) / originalPrice) *
                                100,
                            )
                          : 0;
                      // Get route info (support both relations and denormalized)
                      const depCode =
                        leg.departureAirport?.iataCode ||
                        leg.departureAirport?.icaoCode ||
                        leg.departureIcao ||
                        "N/A";
                      const arrCode =
                        leg.arrivalAirport?.iataCode ||
                        leg.arrivalAirport?.icaoCode ||
                        leg.arrivalIcao ||
                        "N/A";
                      const depCity =
                        leg.departureAirport?.municipality ||
                        leg.departureAirport?.name ||
                        leg.departureCity ||
                        "";
                      const arrCity =
                        leg.arrivalAirport?.municipality ||
                        leg.arrivalAirport?.name ||
                        leg.arrivalCity ||
                        "";
                      // Get aircraft info
                      const aircraftName =
                        leg.aircraft?.name || leg.aircraftName || "N/A";
                      const aircraftDetail = leg.aircraft
                        ? `${leg.aircraft.manufacturer}`
                        : leg.aircraftType || "";

                      return (
                        <TableRow
                          key={leg.id}
                          className={`cursor-pointer hover:bg-accent ${selectedEmptyLeg?.id === leg.id ? "bg-accent" : ""}`}
                          onClick={() => setSelectedEmptyLeg(leg)}
                        >
                          <TableCell>
                            <Badge
                              variant={getSourceColor(leg.source) as any}
                              className="text-xs"
                            >
                              {leg.source === "INSTACHARTER"
                                ? "IC"
                                : leg.source}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">
                              {depCode} → {arrCode}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {depCity} → {arrCity}
                            </p>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium">{aircraftName}</p>
                            <p className="text-sm text-muted-foreground">
                              {aircraftDetail}
                            </p>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {leg.availableSeats}/{leg.totalSeats}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(leg.status) as any}>
                              {leg.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                    >
                      Next
                    </Button>
                  </section>
                </section>
              </>
            ) : (
              <section className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No empty legs found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? "Try a different search term"
                    : "Create your first empty leg deal"}
                </p>
                {!searchQuery && (
                  <Button variant="gold" asChild>
                    <Link href="/dashboard/empty-legs/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Empty Leg
                    </Link>
                  </Button>
                )}
              </section>
            )}
          </CardContent>
        </Card>

        {/* Empty Leg Detail Panel / Form */}
        {selectedEmptyLeg && (
          <>
            {isEditing ? (
              <EmptyLegForm
                emptyLeg={selectedEmptyLeg}
                onSave={handleSave}
                onCancel={cancelEdit}
                isEditing={true}
              />
            ) : (
              <Card className="lg:col-span-1">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-lg">Empty Leg Details</CardTitle>
                    <CardDescription>
                      {selectedEmptyLeg.source === "INSTACHARTER"
                        ? "InstaCharter Deal"
                        : "Admin Created"}
                    </CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedEmptyLeg(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Route Information */}
                  <section className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Route
                    </h3>
                    <section className="flex items-center gap-3">
                      <Plane className="h-5 w-5 text-[#D4AF37]" />
                      <section className="text-center">
                        <p className="text-lg font-bold">
                          {selectedEmptyLeg.departureAirport?.iataCode ||
                            selectedEmptyLeg.departureAirport?.icaoCode ||
                            selectedEmptyLeg.departureIcao ||
                            "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedEmptyLeg.departureAirport?.municipality ||
                            selectedEmptyLeg.departureAirport?.name ||
                            selectedEmptyLeg.departureCity ||
                            "Unknown"}
                        </p>
                      </section>
                      <div className="flex-1 border-t-2 border-dashed border-muted-foreground/30" />
                      <section className="text-center">
                        <p className="text-lg font-bold">
                          {selectedEmptyLeg.arrivalAirport?.iataCode ||
                            selectedEmptyLeg.arrivalAirport?.icaoCode ||
                            selectedEmptyLeg.arrivalIcao ||
                            "N/A"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {selectedEmptyLeg.arrivalAirport?.municipality ||
                            selectedEmptyLeg.arrivalAirport?.name ||
                            selectedEmptyLeg.arrivalCity ||
                            "Unknown"}
                        </p>
                      </section>
                    </section>
                  </section>

                  {/* Schedule */}
                  <section className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Schedule
                    </h3>
                    <article className="space-y-2">
                      <p className="text-xs text-muted-foreground">Departure</p>
                      <p className="font-medium">
                        {new Date(
                          selectedEmptyLeg.departureDateTime,
                        ).toLocaleString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      {selectedEmptyLeg.estimatedArrival && (
                        <>
                          <p className="text-xs text-muted-foreground mt-2">
                            Estimated Arrival
                          </p>
                          <p className="font-medium">
                            {new Date(
                              selectedEmptyLeg.estimatedArrival,
                            ).toLocaleString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </>
                      )}
                      {selectedEmptyLeg.estimatedDurationMin && (
                        <>
                          <p className="text-xs text-muted-foreground mt-2">
                            Duration
                          </p>
                          <p className="font-medium">
                            {formatDuration(
                              selectedEmptyLeg.estimatedDurationMin,
                            )}
                          </p>
                        </>
                      )}
                    </article>
                  </section>

                  {/* Aircraft */}
                  <section className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Aircraft
                    </h3>
                    {/* Aircraft Image for InstaCharter deals */}
                    {selectedEmptyLeg.source === "INSTACHARTER" &&
                      selectedEmptyLeg.aircraftImage && (
                        <div className="border rounded-lg overflow-hidden bg-muted/30">
                          <img
                            src={selectedEmptyLeg.aircraftImage}
                            alt={selectedEmptyLeg.aircraftType || "Aircraft"}
                            className="w-full h-32 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                    <article className="space-y-2">
                      <p className="font-medium">
                        {selectedEmptyLeg.aircraft?.name ||
                          selectedEmptyLeg.aircraftName ||
                          "N/A"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedEmptyLeg.aircraft?.manufacturer || ""}
                        {selectedEmptyLeg.aircraft?.category && (
                          <span className="ml-1">
                            (
                            {selectedEmptyLeg.aircraft.category.replace(
                              /_/g,
                              " ",
                            )}
                            )
                          </span>
                        )}
                      </p>
                      {selectedEmptyLeg.aircraft?.maxPax && (
                        <p className="text-sm text-muted-foreground">
                          Max Passengers: {selectedEmptyLeg.aircraft.maxPax}
                        </p>
                      )}
                    </article>
                  </section>

                  {/* Operator Information - Only for InstaCharter deals */}
                  {selectedEmptyLeg.source === "INSTACHARTER" && (
                    <section className="space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Operator
                      </h3>
                      <article className="space-y-2">
                        <p className="font-medium">
                          {selectedEmptyLeg.operatorName || "Unknown Operator"}
                        </p>
                        {selectedEmptyLeg.operatorEmail && (
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            {selectedEmptyLeg.operatorEmail}
                          </p>
                        )}
                        {selectedEmptyLeg.operatorPhone && (
                          <p className="text-sm text-muted-foreground flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            {selectedEmptyLeg.operatorPhone}
                          </p>
                        )}
                      </article>
                    </section>
                  )}

                  {/* Pricing */}
                  <section className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Pricing
                    </h3>
                    <article className="space-y-2">
                      <p className="text-xs text-muted-foreground">Type</p>
                      <Badge
                        variant={
                          selectedEmptyLeg.priceType === "FIXED"
                            ? "success"
                            : "secondary"
                        }
                      >
                        {selectedEmptyLeg.priceType === "FIXED"
                          ? "Fixed Price"
                          : "Contact for Price"}
                      </Badge>
                      {selectedEmptyLeg.priceType === "FIXED" &&
                        selectedEmptyLeg.priceUsd && (
                          <>
                            <p className="text-xs text-muted-foreground mt-2">
                              Price
                            </p>
                            <p className="text-xl font-bold text-[#D4AF37]">
                              {formatUSD(selectedEmptyLeg.priceUsd)}
                            </p>
                          </>
                        )}
                    </article>
                  </section>

                  {/* Availability */}
                  <section className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Availability
                    </h3>
                    <article className="space-y-2">
                      <p className="text-xs text-muted-foreground">Seats</p>
                      <Badge variant="outline" className="text-sm">
                        {selectedEmptyLeg.availableSeats} /{" "}
                        {selectedEmptyLeg.totalSeats} available
                      </Badge>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-[#D4AF37] h-2 rounded-full"
                          style={{
                            width: `${(selectedEmptyLeg.availableSeats / selectedEmptyLeg.totalSeats) * 100}%`,
                          }}
                        />
                      </div>
                    </article>
                  </section>

                  {/* Status */}
                  <section className="space-y-3">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </h3>
                    <Badge
                      variant={getStatusColor(selectedEmptyLeg.status) as any}
                    >
                      {selectedEmptyLeg.status}
                    </Badge>
                  </section>

                  {/* Bookings */}
                  {selectedEmptyLeg._count?.bookings > 0 && (
                    <section className="space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                        Bookings
                      </h3>
                      <p className="text-sm">
                        {selectedEmptyLeg._count.bookings} booking
                        {selectedEmptyLeg._count.bookings > 1 ? "s" : ""}
                      </p>
                    </section>
                  )}

                  {/* Actions */}
                  <section className="pt-4 space-y-2">
                    {selectedEmptyLeg.createdByAdmin && (
                      <Button
                        variant="outline"
                        onClick={() =>
                          router.push(
                            `/dashboard/empty-legs/${selectedEmptyLeg.id}/bookings`,
                          )
                        }
                        className="w-full bg-white text-black border-gray-300 hover:bg-gray-50"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Check Bookings
                      </Button>
                    )}
                    {selectedEmptyLeg.source !== "INSTACHARTER" && (
                      <Button onClick={startEdit} className="w-full">
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Empty Leg
                      </Button>
                    )}
                    {selectedEmptyLeg.source !== "INSTACHARTER" && (
                      <Button
                        variant="destructive"
                        onClick={() => setDeleteDialogOpen(true)}
                        disabled={deleting}
                        className="w-full"
                      >
                        {deleting ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Delete Empty Leg
                      </Button>
                    )}
                  </section>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </section>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Empty Leg</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this empty leg? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
