"use client";

import { useEffect, useState } from "react";
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
  Separator,
} from "@pexjet/ui";
import {
  Search,
  MapPin,
  RefreshCw,
  X,
  Globe,
  ArrowUpAZ,
  ArrowDownAZ,
  Filter,
} from "lucide-react";

interface Airport {
  id: string;
  ident: string;
  icaoCode: string | null;
  iataCode: string | null;
  name: string;
  municipality: string | null;
  countryCode: string;
  regionCode: string;
  continent: string;
  type: string;
  latitude: number;
  longitude: number;
  elevationFt: number | null;
  scheduledService: boolean;
  country: { name: string };
  region: { name: string };
}

const airportTypes = [
  { value: "", label: "All Types" },
  { value: "large_airport", label: "Large Airport" },
  { value: "medium_airport", label: "Medium Airport" },
];

export default function AirportsPage() {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);

  useEffect(() => {
    fetchAirports();
  }, [page, searchQuery, sortOrder, typeFilter]);

  const fetchAirports = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        sort: sortOrder,
        ...(searchQuery && { search: searchQuery }),
        ...(typeFilter && { type: typeFilter }),
      });

      const response = await fetch(`/api/airports?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAirports(data.airports);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      }
    } catch (error) {
      console.error("Failed to fetch airports:", error);
    } finally {
      setLoading(false);
    }
  };

  const searchByCountry = (countryName: string) => {
    setSearchQuery(countryName);
    setPage(1);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "large_airport":
        return "success";
      case "medium_airport":
        return "warning";
      case "small_airport":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <article>
          <h1 className="text-3xl font-bold">Airports</h1>
          <p className="text-muted-foreground">
            View and search airport database
          </p>
        </article>
        <Button variant="outline" onClick={fetchAirports} disabled={loading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </header>

      {/* Search, Sort & Filter */}
      <Card>
        <CardContent className="pt-6">
          <section className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <section className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, ICAO, IATA, city, country, or region..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </section>

            {/* Type Filter */}
            <section className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setPage(1);
                }}
                className="h-10 pl-10 pr-4 border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[160px]"
              >
                {airportTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </section>

            {/* Sort Toggle */}
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="gap-2"
            >
              {sortOrder === "asc" ? (
                <>
                  <ArrowUpAZ className="h-4 w-4" />
                  A-Z
                </>
              ) : (
                <>
                  <ArrowDownAZ className="h-4 w-4" />
                  Z-A
                </>
              )}
            </Button>

            {/* Clear */}
            {(searchQuery || typeFilter) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSearchQuery("");
                  setTypeFilter("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </section>
        </CardContent>
      </Card>

      {/* Main Content - Table and Detail Panel */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Airports Table */}
        <Card className={selectedAirport ? "lg:col-span-2" : "lg:col-span-3"}>
          <CardHeader>
            <CardTitle>Airport Database</CardTitle>
            <CardDescription>
              {total > 0
                ? `Showing ${airports.length} of ${total.toLocaleString()} airports`
                : "No airports found"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <section className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <section key={i} className="h-12 bg-muted animate-pulse" />
                ))}
              </section>
            ) : airports.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ICAO</TableHead>
                      <TableHead>IATA</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Type</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {airports.map((airport) => (
                      <TableRow
                        key={airport.id}
                        className={`cursor-pointer hover:bg-accent ${selectedAirport?.id === airport.id ? "bg-accent" : ""}`}
                        onClick={() => setSelectedAirport(airport)}
                      >
                        <TableCell className="font-mono font-medium">
                          {airport.icaoCode || "-"}
                        </TableCell>
                        <TableCell className="font-mono">
                          {airport.iataCode || "-"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {airport.name}
                        </TableCell>
                        <TableCell>{airport.municipality || "-"}</TableCell>
                        <TableCell>
                          {airport.country?.name || airport.countryCode}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getTypeColor(airport.type) as any}>
                            {airport.type.replace(/_/g, " ")}
                          </Badge>
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
                <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No airports found
                </h3>
                <p className="text-muted-foreground">
                  {searchQuery || typeFilter
                    ? "Try a different search term or filter"
                    : "No airports in database"}
                </p>
              </section>
            )}
          </CardContent>
        </Card>

        {/* Airport Detail Panel */}
        {selectedAirport && (
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">
                  {selectedAirport.name}
                </CardTitle>
                <CardDescription>Airport Details</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedAirport(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Codes */}
              <section className="grid grid-cols-2 gap-4">
                <article>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    ICAO Code
                  </p>
                  <p className="font-mono font-bold text-lg">
                    {selectedAirport.icaoCode || "-"}
                  </p>
                </article>
                <article>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    IATA Code
                  </p>
                  <p className="font-mono font-bold text-lg">
                    {selectedAirport.iataCode || "-"}
                  </p>
                </article>
              </section>

              <Separator />

              {/* Type */}
              <article>
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  Type
                </p>
                <Badge
                  variant={getTypeColor(selectedAirport.type) as any}
                  className="text-sm"
                >
                  {selectedAirport.type.replace(/_/g, " ")}
                </Badge>
              </article>

              <Separator />

              {/* Location */}
              <section className="space-y-3">
                <article>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Country
                  </p>
                  <p className="font-medium">
                    {selectedAirport.country?.name ||
                      selectedAirport.countryCode}
                  </p>
                </article>
                <article>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Region
                  </p>
                  <p className="font-medium">
                    {selectedAirport.region?.name || selectedAirport.regionCode}
                  </p>
                </article>
                <article>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Continent
                  </p>
                  <p className="font-medium">{selectedAirport.continent}</p>
                </article>
                {selectedAirport.municipality && (
                  <article>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      City/Municipality
                    </p>
                    <p className="font-medium">
                      {selectedAirport.municipality}
                    </p>
                  </article>
                )}
              </section>

              <Separator />

              {/* Coordinates */}
              <section className="space-y-3">
                <article>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Latitude
                  </p>
                  <p className="font-mono">
                    {selectedAirport.latitude.toFixed(6)}°
                  </p>
                </article>
                <article>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Longitude
                  </p>
                  <p className="font-mono">
                    {selectedAirport.longitude.toFixed(6)}°
                  </p>
                </article>
                {selectedAirport.elevationFt && (
                  <article>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Elevation
                    </p>
                    <p className="font-mono">
                      {selectedAirport.elevationFt.toLocaleString()} ft
                    </p>
                  </article>
                )}
              </section>

              <Separator />

              {/* Additional Info */}
              <article>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Scheduled Service
                </p>
                <Badge
                  variant={
                    selectedAirport.scheduledService ? "success" : "secondary"
                  }
                >
                  {selectedAirport.scheduledService ? "Yes" : "No"}
                </Badge>
              </article>

              {/* Quick Actions */}
              <section className="pt-4">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() =>
                    searchByCountry(
                      selectedAirport.country?.name ||
                        selectedAirport.countryCode,
                    )
                  }
                >
                  <Globe className="h-4 w-4 mr-2" />
                  View all in{" "}
                  {selectedAirport.country?.name || selectedAirport.countryCode}
                </Button>
              </section>
            </CardContent>
          </Card>
        )}
      </section>
    </section>
  );
}
