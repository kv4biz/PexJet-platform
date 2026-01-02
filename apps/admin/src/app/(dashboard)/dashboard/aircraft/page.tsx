"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
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
  Label,
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
  Separator,
  useToast,
  ScrollArea,
  ConfirmDialog,
} from "@pexjet/ui";
import {
  Search,
  Plus,
  Trash2,
  Plane,
  RefreshCw,
  X,
  Loader2,
  Save,
  Pencil,
  Edit3,
} from "lucide-react";

interface Aircraft {
  id: string;
  name: string;
  manufacturer: string;
  category: string;
  availability: string;
  image: string | null;
  minPax: number | null;
  maxPax: number | null;
  baggageCuFt: number | null;
  rangeNm: number | null;
  cruiseSpeedKnots: number | null;
  fuelCapacityGal: number | null;
  cabinLengthFt: number | null;
  cabinWidthFt: number | null;
  cabinHeightFt: number | null;
  exteriorLengthFt: number | null;
  exteriorWingspanFt: number | null;
  exteriorHeightFt: number | null;
  basePricePerHour: number | null;
  createdAt: string;
  updatedAt: string;
}

const categories = [
  { value: "", label: "All Categories" },
  { value: "LIGHT", label: "Light" },
  { value: "MIDSIZE", label: "Midsize" },
  { value: "SUPER_MIDSIZE", label: "Super Midsize" },
  { value: "ULTRA_LONG_RANGE", label: "Ultra Long Range" },
  { value: "HEAVY", label: "Heavy" },
];

const availabilityOptions = [
  { value: "NONE", label: "None" },
  { value: "LOCAL", label: "Local Only" },
  { value: "INTERNATIONAL", label: "International Only" },
  { value: "BOTH", label: "Both" },
];

const getCategoryLabel = (value: string) => {
  const cat = categories.find((c) => c.value === value);
  return cat?.label || value;
};

const getCategoryColor = (value: string) => {
  // Always return light grey for all categories
  return "secondary";
};

export default function AircraftPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchAircraft();
  }, [page, searchQuery, categoryFilter]);

  const categorySelectValue = categoryFilter || "ALL";

  const fetchAircraft = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchQuery && { search: searchQuery }),
        ...(categoryFilter && { category: categoryFilter }),
      });

      const token = localStorage.getItem("accessToken");

      const response = await fetch(`/api/aircraft?${params}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();

        // Handle different response structures
        if (Array.isArray(data)) {
          // Direct array response
          setAircraft(data);
          setTotalPages(1);
        } else if (data.aircraft) {
          // Expected response with aircraft array
          setAircraft(data.aircraft);
          setTotalPages(data.totalPages || 1);
        } else {
          console.error("Unexpected response structure:", data);
          setAircraft([]);
          setTotalPages(1);
        }
      } else {
        const errorData = await response.json();
        console.error("API Error:", errorData);
      }
    } catch (error) {
      console.error("Failed to fetch aircraft:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/aircraft/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Aircraft Deleted",
          description: "The aircraft has been removed.",
        });
        setSelectedAircraft(null);
        fetchAircraft();
      } else {
        const error = await response.json();
        toast({
          title: "Delete Failed",
          description: error.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  const startEditing = (field: string, value: any) => {
    // Navigate to edit page instead of inline editing
    if (selectedAircraft) {
      router.push(`/dashboard/aircraft/${selectedAircraft.id}/edit`);
    }
  };

  const cancelEdit = () => {
    // No longer needed since we navigate to edit page
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Aircraft Management
          </h1>
          <p className="text-muted-foreground">
            Manage your fleet of aircraft and their specifications
          </p>
        </div>
        <Button variant="gold" asChild>
          <Link href="/dashboard/aircraft/new">
            <Plus className="mr-2 h-4 w-4" />
            Add Aircraft
          </Link>
        </Button>
      </div>

      {/* Main Content - Table and Detail Panel */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Aircraft Table */}
        <Card className={selectedAircraft ? "lg:col-span-2" : "lg:col-span-3"}>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search aircraft..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select
                value={categorySelectValue}
                onValueChange={(value) =>
                  setCategoryFilter(value === "ALL" ? "" : value)
                }
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by category" />
                </SelectTrigger>
                <SelectContent>
                  {categories
                    .filter((cat) => cat.value !== "")
                    .map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchAircraft}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : aircraft.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Plane className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No aircraft found</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Image</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Price/Hour</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aircraft.map((ac) => (
                      <TableRow
                        key={ac.id}
                        className={`cursor-pointer ${
                          selectedAircraft?.id === ac.id ? "bg-muted" : ""
                        }`}
                        onClick={() => {
                          setSelectedAircraft(ac);
                        }}
                      >
                        <TableCell>
                          {ac.image ? (
                            <Image
                              src={ac.image}
                              alt={ac.name}
                              width={60}
                              height={40}
                              className="rounded object-cover"
                            />
                          ) : (
                            <div className="w-[60px] h-[40px] bg-muted rounded flex items-center justify-center">
                              <Plane className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">{ac.name}</TableCell>
                        <TableCell>{ac.manufacturer}</TableCell>
                        <TableCell>
                          <Badge variant={getCategoryColor(ac.category) as any}>
                            {getCategoryLabel(ac.category)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {ac.minPax || "-"} - {ac.maxPax || "-"} pax
                        </TableCell>
                        <TableCell className="font-mono text-black">
                          {ac.basePricePerHour
                            ? `$${ac.basePricePerHour.toLocaleString()}`
                            : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page >= totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Detail Panel */}
        {selectedAircraft && (
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">Aircraft Details</CardTitle>
                <CardDescription>
                  {selectedAircraft.category} - {selectedAircraft.manufacturer}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedAircraft(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Aircraft Image */}
              {selectedAircraft.image && (
                <section className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Aircraft Image
                  </h3>
                  <div className="border rounded-lg overflow-hidden bg-muted/30">
                    <Image
                      src={selectedAircraft.image}
                      alt={selectedAircraft.name}
                      width={400}
                      height={250}
                      className="w-full h-auto object-contain max-h-80"
                    />
                  </div>
                </section>
              )}

              {/* Aircraft Name */}
              <section className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Aircraft
                </h3>
                <article className="flex items-center gap-3">
                  <Plane className="h-5 w-5 text-[#D4AF37]" />
                  <section className="text-center">
                    <p className="text-lg font-bold">{selectedAircraft.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedAircraft.manufacturer}
                    </p>
                  </section>
                </article>
              </section>

              {/* Basic Information */}
              <section className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Specifications
                </h3>
                <article className="space-y-2">
                  <p className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Category
                    </span>
                    <span className="font-medium">
                      {getCategoryLabel(selectedAircraft.category)}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Availability
                    </span>
                    <span className="font-medium">
                      {
                        availabilityOptions.find(
                          (o) => o.value === selectedAircraft.availability,
                        )?.label
                      }
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Max Passengers
                    </span>
                    <span className="font-medium">
                      {selectedAircraft.maxPax || "-"}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Baggage
                    </span>
                    <span className="font-medium">
                      {selectedAircraft.baggageCuFt
                        ? `${selectedAircraft.baggageCuFt} cu ft`
                        : "-"}
                    </span>
                  </p>
                </article>
              </section>

              {/* Performance */}
              <section className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Performance
                </h3>
                <article className="space-y-2">
                  <p className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Range</span>
                    <span className="font-medium">
                      {selectedAircraft.rangeNm
                        ? `${selectedAircraft.rangeNm} NM`
                        : "-"}
                    </span>
                  </p>
                  <p className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Speed</span>
                    <span className="font-medium">
                      {selectedAircraft.cruiseSpeedKnots
                        ? `${selectedAircraft.cruiseSpeedKnots} kts`
                        : "-"}
                    </span>
                  </p>
                </article>
              </section>

              {/* Pricing */}
              <section className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Pricing
                </h3>
                <article className="space-y-2">
                  <p className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Base Price/Hour
                    </span>
                    <span className="font-mono font-medium text-black">
                      {selectedAircraft.basePricePerHour
                        ? `$${selectedAircraft.basePricePerHour.toLocaleString()}`
                        : "-"}
                    </span>
                  </p>
                </article>
              </section>

              {/* Actions */}
              <section className="pt-4 space-y-2">
                <Button
                  onClick={() =>
                    router.push(
                      `/dashboard/aircraft/${selectedAircraft.id}/edit`,
                    )
                  }
                  className="w-full"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Edit Aircraft
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => setDeleteDialogOpen(true)}
                  disabled={deleting}
                  className="w-full"
                >
                  {deleting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  Delete Aircraft
                </Button>
              </section>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Aircraft"
        description={`Are you sure you want to delete ${selectedAircraft?.name}? This action cannot be undone.`}
        onConfirm={() => selectedAircraft && handleDelete(selectedAircraft.id)}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </div>
  );
}
