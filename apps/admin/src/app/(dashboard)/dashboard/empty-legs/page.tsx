"use client";

import { useEffect, useState } from "react";
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
} from "lucide-react";
import { formatNGN, formatDuration, formatTime } from "@/lib/format-currency";

interface EmptyLeg {
  id: string;
  slug: string;
  status: string;
  originalPriceNgn: number;
  discountPriceNgn: number;
  totalSeats: number;
  availableSeats: number;
  departureDateTime: string;
  estimatedArrival: string;
  estimatedDurationMin: number;
  aircraft: {
    id: string;
    name: string;
    model: string;
    manufacturer: string;
    category: string;
    passengerCapacityMax: number;
    thumbnailImage: string | null;
  };
  departureAirport: {
    id: string;
    name: string;
    municipality: string | null;
    iataCode: string | null;
    icaoCode: string | null;
    countryCode: string;
  };
  arrivalAirport: {
    id: string;
    name: string;
    municipality: string | null;
    iataCode: string | null;
    icaoCode: string | null;
    countryCode: string;
  };
  createdByAdmin: { id: string; fullName: string } | null;
  createdByOperator: { id: string; fullName: string } | null;
  _count: { bookings: number };
}

export default function EmptyLegsPage() {
  const [emptyLegs, setEmptyLegs] = useState<EmptyLeg[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchEmptyLegs();
  }, [page, searchQuery]);

  const fetchEmptyLegs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchQuery && { search: searchQuery }),
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
      }
    } catch (error) {
      console.error("Failed to fetch empty legs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return "success";
      case "OPEN":
        return "warning";
      case "CLOSED":
        return "secondary";
      default:
        return "secondary";
    }
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <article>
          <h1 className="text-3xl font-bold">Empty Legs</h1>
          <p className="text-muted-foreground">Manage empty leg deals</p>
        </article>
        <section className="flex gap-2">
          <Button variant="outline" onClick={fetchEmptyLegs} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button variant="gold" asChild>
            <Link href="/dashboard/empty-legs/new">
              <Plus className="h-4 w-4 mr-2" />
              Create Empty Leg
            </Link>
          </Button>
        </section>
      </header>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <section className="relative">
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
        </CardContent>
      </Card>

      {/* Empty Legs Table */}
      <Card>
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
                    <TableHead>Route</TableHead>
                    <TableHead>Aircraft</TableHead>
                    <TableHead>Schedule</TableHead>
                    <TableHead>Price/Seat</TableHead>
                    <TableHead>Seats</TableHead>
                    <TableHead>Bookings</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[70px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {emptyLegs.map((leg) => {
                    const discount = Math.round(
                      ((leg.originalPriceNgn - leg.discountPriceNgn) /
                        leg.originalPriceNgn) *
                        100,
                    );
                    return (
                      <TableRow key={leg.id}>
                        <TableCell>
                          <p className="font-medium">
                            {leg.departureAirport.iataCode ||
                              leg.departureAirport.icaoCode}{" "}
                            →{" "}
                            {leg.arrivalAirport.iataCode ||
                              leg.arrivalAirport.icaoCode}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {leg.departureAirport.municipality ||
                              leg.departureAirport.name}{" "}
                            →{" "}
                            {leg.arrivalAirport.municipality ||
                              leg.arrivalAirport.name}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{leg.aircraft.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {leg.aircraft.manufacturer} {leg.aircraft.model}
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">
                            {new Date(
                              leg.departureDateTime,
                            ).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatTime(leg.departureDateTime)} →{" "}
                            {formatTime(leg.estimatedArrival)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            ({formatDuration(leg.estimatedDurationMin)})
                          </p>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm line-through text-muted-foreground">
                            {formatNGN(leg.originalPriceNgn)}
                          </p>
                          <p className="font-medium text-[#D4AF37]">
                            {formatNGN(leg.discountPriceNgn)}
                          </p>
                          <Badge variant="success" className="text-xs mt-1">
                            {discount}% OFF
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {leg.availableSeats}/{leg.totalSeats}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              leg._count.bookings > 0 ? "default" : "secondary"
                            }
                          >
                            {leg._count.bookings}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusColor(leg.status) as any}>
                            {leg.status}
                          </Badge>
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
                                <Link href={`/dashboard/empty-legs/${leg.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/dashboard/empty-legs/${leg.id}/edit`}
                                >
                                  <Pencil className="h-4 w-4 mr-2" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-destructive">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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
    </section>
  );
}
