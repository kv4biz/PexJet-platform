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
  Textarea,
  ScrollArea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  ConfirmDialog,
} from "@pexjet/ui";
import {
  Search,
  Plus,
  Trash2,
  Plane,
  RefreshCw,
  X,
  ArrowUpAZ,
  ArrowDownAZ,
  Filter,
  Loader2,
  Save,
  Upload,
  ImageIcon,
  Pencil,
} from "lucide-react";

interface Aircraft {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
  category: string;
  availability: string;
  passengerCapacityMin: number;
  passengerCapacityMax: number;
  cruiseSpeedKnots: number;
  rangeNm: number;
  yearOfManufacture: number | null;
  exteriorImages: string[];
  interiorImages: string[];
  thumbnailImage: string | null;
  description: string | null;
  baggageCapacityCuFt: number | null;
  cabinLengthFt: number | null;
  cabinWidthFt: number | null;
  cabinHeightFt: number | null;
  lengthFt: number | null;
  wingspanFt: number | null;
  heightFt: number | null;
  hourlyRateUsd: number | null;
}

const categories = [
  { value: "", label: "All Categories" },
  { value: "HEAVY_JET", label: "Heavy Jet" },
  { value: "SUPER_MIDSIZE_JET", label: "Super Midsize Jet" },
  { value: "MIDSIZE_JET", label: "Midsize Jet" },
  { value: "LIGHT_JET", label: "Light Jet" },
  { value: "ULTRA_LONG_RANGE", label: "Ultra Long Range" },
];

const availabilityOptions = [
  { value: "NONE", label: "None" },
  { value: "LOCAL", label: "Local Only" },
  { value: "INTERNATIONAL", label: "International Only" },
  { value: "BOTH", label: "Both" },
];

const getEmptyForm = () => ({
  name: "",
  model: "",
  manufacturer: "",
  category: "MIDSIZE_JET",
  availability: "BOTH",
  passengerCapacityMin: 4,
  passengerCapacityMax: 8,
  cruiseSpeedKnots: 450,
  rangeNm: 2000,
  yearOfManufacture: new Date().getFullYear(),
  description: "",
  baggageCapacityCuFt: null as number | null,
  cabinLengthFt: null as number | null,
  cabinWidthFt: null as number | null,
  cabinHeightFt: null as number | null,
  lengthFt: null as number | null,
  wingspanFt: null as number | null,
  heightFt: null as number | null,
  hourlyRateUsd: null as number | null,
});

export default function AircraftPage() {
  const { toast } = useToast();
  const [aircraft, setAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(
    null,
  );
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(getEmptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingExterior, setUploadingExterior] = useState(false);
  const [uploadingInterior, setUploadingInterior] = useState(false);
  const [pendingExteriorFiles, setPendingExteriorFiles] = useState<File[]>([]);
  const [pendingInteriorFiles, setPendingInteriorFiles] = useState<File[]>([]);
  const exteriorInputRef = useRef<HTMLInputElement>(null);
  const interiorInputRef = useRef<HTMLInputElement>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteImageDialogOpen, setDeleteImageDialogOpen] = useState(false);
  const [pendingDeleteImage, setPendingDeleteImage] = useState<{
    url: string;
    type: "exterior" | "interior";
  } | null>(null);

  useEffect(() => {
    fetchAircraft();
  }, [page, searchQuery, sortOrder, categoryFilter]);

  const fetchAircraft = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        sort: sortOrder,
        ...(searchQuery && { search: searchQuery }),
        ...(categoryFilter && { category: categoryFilter }),
      });

      const response = await fetch(`/api/aircraft?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAircraft(data.aircraft);
        setTotalPages(data.totalPages);
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
        setIsEditing(false);
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
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url =
        isEditing && selectedAircraft
          ? `/api/aircraft/${selectedAircraft.id}`
          : "/api/aircraft";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const savedAircraft = await response.json();

        // Upload pending images if any
        if (pendingExteriorFiles.length > 0) {
          await uploadImages(
            savedAircraft.id,
            pendingExteriorFiles,
            "exterior",
          );
        }
        if (pendingInteriorFiles.length > 0) {
          await uploadImages(
            savedAircraft.id,
            pendingInteriorFiles,
            "interior",
          );
        }

        toast({
          title: isEditing ? "Aircraft Updated" : "Aircraft Added",
          description: isEditing
            ? "Changes saved successfully."
            : "New aircraft added to fleet.",
        });
        setShowForm(false);
        setIsEditing(false);
        setFormData(getEmptyForm());
        setPendingExteriorFiles([]);
        setPendingInteriorFiles([]);
        setSelectedAircraft(null);
        fetchAircraft();
      } else {
        const error = await response.json();
        toast({
          title: "Save Failed",
          description: error.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Save Failed",
        description: "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const uploadImages = async (
    aircraftId: string,
    files: File[],
    type: "exterior" | "interior",
  ) => {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    formData.append("type", type);

    await fetch(`/api/aircraft/${aircraftId}/images`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
      body: formData,
    });
  };

  const handleImageUpload = async (
    files: FileList | null,
    type: "exterior" | "interior",
  ) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);

    // If editing existing aircraft, upload immediately
    if (isEditing && selectedAircraft) {
      const setUploading =
        type === "exterior" ? setUploadingExterior : setUploadingInterior;
      setUploading(true);

      try {
        const formData = new FormData();
        fileArray.forEach((file) => formData.append("images", file));
        formData.append("type", type);

        const response = await fetch(
          `/api/aircraft/${selectedAircraft.id}/images`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
            },
            body: formData,
          },
        );

        if (response.ok) {
          const data = await response.json();
          setSelectedAircraft(data.aircraft);
          fetchAircraft();
          toast({
            title: "Images Uploaded",
            description: `${files.length} image(s) uploaded.`,
          });
        } else {
          const error = await response.json();
          toast({
            title: "Upload Failed",
            description: error.error,
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Upload Failed",
          description: "An error occurred.",
          variant: "destructive",
        });
      } finally {
        setUploading(false);
      }
    } else {
      // For new aircraft, store files to upload after save
      if (type === "exterior") {
        setPendingExteriorFiles((prev) => [...prev, ...fileArray]);
      } else {
        setPendingInteriorFiles((prev) => [...prev, ...fileArray]);
      }
      toast({
        title: "Images Queued",
        description: `${files.length} image(s) will be uploaded when saved.`,
      });
    }
  };

  const handleImageDelete = async (
    imageUrl: string,
    type: "exterior" | "interior",
  ) => {
    if (!selectedAircraft || !isEditing) return;

    try {
      const response = await fetch(
        `/api/aircraft/${selectedAircraft.id}/images`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
          body: JSON.stringify({ imageUrl, type }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        setSelectedAircraft(data.aircraft);
        fetchAircraft();
        toast({ title: "Image Deleted" });
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
    }
  };

  const removePendingFile = (index: number, type: "exterior" | "interior") => {
    if (type === "exterior") {
      setPendingExteriorFiles((prev) => prev.filter((_, i) => i !== index));
    } else {
      setPendingInteriorFiles((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const startEdit = () => {
    if (!selectedAircraft) return;
    setFormData({
      name: selectedAircraft.name,
      model: selectedAircraft.model,
      manufacturer: selectedAircraft.manufacturer,
      category: selectedAircraft.category,
      availability: selectedAircraft.availability,
      passengerCapacityMin: selectedAircraft.passengerCapacityMin,
      passengerCapacityMax: selectedAircraft.passengerCapacityMax,
      cruiseSpeedKnots: selectedAircraft.cruiseSpeedKnots,
      rangeNm: selectedAircraft.rangeNm,
      yearOfManufacture:
        selectedAircraft.yearOfManufacture || new Date().getFullYear(),
      description: selectedAircraft.description || "",
      baggageCapacityCuFt: selectedAircraft.baggageCapacityCuFt,
      cabinLengthFt: selectedAircraft.cabinLengthFt,
      cabinWidthFt: selectedAircraft.cabinWidthFt,
      cabinHeightFt: selectedAircraft.cabinHeightFt,
      lengthFt: selectedAircraft.lengthFt,
      wingspanFt: selectedAircraft.wingspanFt,
      heightFt: selectedAircraft.heightFt,
      hourlyRateUsd: selectedAircraft.hourlyRateUsd,
    });
    setIsEditing(true);
    setShowForm(false);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setFormData(getEmptyForm());
    setPendingExteriorFiles([]);
    setPendingInteriorFiles([]);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "HEAVY_JET":
        return "destructive";
      case "SUPER_MIDSIZE_JET":
        return "warning";
      case "MIDSIZE_JET":
        return "success";
      case "LIGHT_JET":
        return "secondary";
      case "ULTRA_LONG_RANGE":
        return "gold";
      default:
        return "secondary";
    }
  };

  // Render the form (used for both add and edit)
  const renderForm = () => (
    <form onSubmit={handleSave}>
      <ScrollArea className="h-[500px] px-4">
        <div className="space-y-4 py-4">
          {/* Basic Info */}
          <fieldset className="space-y-2">
            <Label htmlFor="name">Aircraft Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="e.g., Citation XLS"
              required
            />
          </fieldset>

          <section className="grid grid-cols-2 gap-2">
            <fieldset className="space-y-2">
              <Label htmlFor="manufacturer">Manufacturer *</Label>
              <Input
                id="manufacturer"
                value={formData.manufacturer}
                onChange={(e) =>
                  setFormData({ ...formData, manufacturer: e.target.value })
                }
                placeholder="e.g., Cessna"
                required
              />
            </fieldset>
            <fieldset className="space-y-2">
              <Label htmlFor="model">Model *</Label>
              <Input
                id="model"
                value={formData.model}
                onChange={(e) =>
                  setFormData({ ...formData, model: e.target.value })
                }
                placeholder="e.g., 560XL"
                required
              />
            </fieldset>
          </section>

          <section className="grid grid-cols-2 gap-2">
            <fieldset className="space-y-2">
              <Label>Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.slice(1).map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </fieldset>
            <fieldset className="space-y-2">
              <Label>Availability</Label>
              <Select
                value={formData.availability}
                onValueChange={(value) =>
                  setFormData({ ...formData, availability: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availabilityOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </fieldset>
          </section>

          <Separator />
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Capacity
          </p>

          <section className="grid grid-cols-3 gap-2">
            <fieldset className="space-y-2">
              <Label>Min Pax *</Label>
              <Input
                type="number"
                value={formData.passengerCapacityMin}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    passengerCapacityMin: parseInt(e.target.value) || 0,
                  })
                }
                required
              />
            </fieldset>
            <fieldset className="space-y-2">
              <Label>Max Pax *</Label>
              <Input
                type="number"
                value={formData.passengerCapacityMax}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    passengerCapacityMax: parseInt(e.target.value) || 0,
                  })
                }
                required
              />
            </fieldset>
            <fieldset className="space-y-2">
              <Label>Baggage (cu ft)</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.baggageCapacityCuFt || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    baggageCapacityCuFt: e.target.value
                      ? parseFloat(e.target.value)
                      : null,
                  })
                }
              />
            </fieldset>
          </section>

          <Separator />
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Performance
          </p>

          <section className="grid grid-cols-2 gap-2">
            <fieldset className="space-y-2">
              <Label>Range (nm) *</Label>
              <Input
                type="number"
                value={formData.rangeNm}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rangeNm: parseInt(e.target.value) || 0,
                  })
                }
                required
              />
            </fieldset>
            <fieldset className="space-y-2">
              <Label>Speed (kts) *</Label>
              <Input
                type="number"
                value={formData.cruiseSpeedKnots}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cruiseSpeedKnots: parseInt(e.target.value) || 0,
                  })
                }
                required
              />
            </fieldset>
          </section>

          <Separator />
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Cabin Dimensions (ft)
          </p>

          <section className="grid grid-cols-3 gap-2">
            <fieldset className="space-y-2">
              <Label>Length</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.cabinLengthFt || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cabinLengthFt: e.target.value
                      ? parseFloat(e.target.value)
                      : null,
                  })
                }
              />
            </fieldset>
            <fieldset className="space-y-2">
              <Label>Width</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.cabinWidthFt || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cabinWidthFt: e.target.value
                      ? parseFloat(e.target.value)
                      : null,
                  })
                }
              />
            </fieldset>
            <fieldset className="space-y-2">
              <Label>Height</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.cabinHeightFt || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cabinHeightFt: e.target.value
                      ? parseFloat(e.target.value)
                      : null,
                  })
                }
              />
            </fieldset>
          </section>

          <Separator />
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Exterior Dimensions (ft)
          </p>

          <section className="grid grid-cols-3 gap-2">
            <fieldset className="space-y-2">
              <Label>Length</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.lengthFt || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lengthFt: e.target.value
                      ? parseFloat(e.target.value)
                      : null,
                  })
                }
              />
            </fieldset>
            <fieldset className="space-y-2">
              <Label>Wingspan</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.wingspanFt || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    wingspanFt: e.target.value
                      ? parseFloat(e.target.value)
                      : null,
                  })
                }
              />
            </fieldset>
            <fieldset className="space-y-2">
              <Label>Height</Label>
              <Input
                type="number"
                step="0.1"
                value={formData.heightFt || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    heightFt: e.target.value
                      ? parseFloat(e.target.value)
                      : null,
                  })
                }
              />
            </fieldset>
          </section>

          <Separator />
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Additional Info
          </p>

          <section className="grid grid-cols-2 gap-2">
            <fieldset className="space-y-2">
              <Label>Year</Label>
              <Input
                type="number"
                value={formData.yearOfManufacture || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    yearOfManufacture: e.target.value
                      ? parseInt(e.target.value)
                      : new Date().getFullYear(),
                  })
                }
              />
            </fieldset>
            <fieldset className="space-y-2">
              <Label>Hourly Rate (USD)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.hourlyRateUsd || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hourlyRateUsd: e.target.value
                      ? parseFloat(e.target.value)
                      : null,
                  })
                }
              />
            </fieldset>
          </section>

          <fieldset className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Aircraft description..."
              rows={3}
            />
          </fieldset>

          {/* Image Upload Section */}
          <Separator />
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            Images
          </p>

          {/* Exterior Images */}
          <fieldset className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Exterior Images</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => exteriorInputRef.current?.click()}
                disabled={uploadingExterior}
              >
                {uploadingExterior ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Upload className="h-3 w-3 mr-1" />
                )}
                Add
              </Button>
              <input
                ref={exteriorInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleImageUpload(e.target.files, "exterior")}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {/* Show existing images when editing */}
              {isEditing &&
                selectedAircraft?.exteriorImages.map((img, idx) => (
                  <div key={`existing-ext-${idx}`} className="relative group">
                    <Image
                      src={img}
                      alt={`Exterior ${idx + 1}`}
                      width={100}
                      height={70}
                      className="object-cover w-full h-16"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100"
                      onClick={() => {
                        setPendingDeleteImage({ url: img, type: "exterior" });
                        setDeleteImageDialogOpen(true);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              {/* Show pending files */}
              {pendingExteriorFiles.map((file, idx) => (
                <div key={`pending-ext-${idx}`} className="relative group">
                  <div className="w-full h-16 bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    {file.name.substring(0, 10)}...
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100"
                    onClick={() => removePendingFile(idx, "exterior")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </fieldset>

          {/* Interior Images */}
          <fieldset className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Interior Images</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => interiorInputRef.current?.click()}
                disabled={uploadingInterior}
              >
                {uploadingInterior ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Upload className="h-3 w-3 mr-1" />
                )}
                Add
              </Button>
              <input
                ref={interiorInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleImageUpload(e.target.files, "interior")}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {isEditing &&
                selectedAircraft?.interiorImages.map((img, idx) => (
                  <div key={`existing-int-${idx}`} className="relative group">
                    <Image
                      src={img}
                      alt={`Interior ${idx + 1}`}
                      width={100}
                      height={70}
                      className="object-cover w-full h-16"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100"
                      onClick={() => {
                        setPendingDeleteImage({ url: img, type: "interior" });
                        setDeleteImageDialogOpen(true);
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              {pendingInteriorFiles.map((file, idx) => (
                <div key={`pending-int-${idx}`} className="relative group">
                  <div className="w-full h-16 bg-muted flex items-center justify-center text-xs text-muted-foreground">
                    {file.name.substring(0, 10)}...
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-5 w-5 opacity-0 group-hover:opacity-100"
                    onClick={() => removePendingFile(idx, "interior")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </fieldset>
        </div>
      </ScrollArea>

      <div className="p-4 border-t flex gap-2">
        {isEditing && (
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={cancelEdit}
          >
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="gold"
          className="flex-1"
          disabled={saving}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? "Update" : "Save"}
            </>
          )}
        </Button>
      </div>
    </form>
  );

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <article>
          <h1 className="text-3xl font-bold">Aircraft</h1>
          <p className="text-muted-foreground">Manage aircraft fleet</p>
        </article>
        <section className="flex gap-2">
          <Button variant="outline" onClick={fetchAircraft} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            variant="gold"
            onClick={() => {
              setShowForm(true);
              setSelectedAircraft(null);
              setIsEditing(false);
              setFormData(getEmptyForm());
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Aircraft
          </Button>
        </section>
      </header>

      {/* Search, Sort & Filter */}
      <Card>
        <CardContent className="pt-6">
          <section className="flex flex-col md:flex-row gap-4">
            <section className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, model, or manufacturer..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </section>

            <section className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setPage(1);
                }}
                className="h-10 pl-10 pr-4 border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring min-w-[180px]"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </section>

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

            {(searchQuery || categoryFilter) && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSearchQuery("");
                  setCategoryFilter("");
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </section>
        </CardContent>
      </Card>

      {/* Main Content */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Aircraft Table */}
        <Card
          className={
            selectedAircraft || showForm ? "lg:col-span-2" : "lg:col-span-3"
          }
        >
          <CardHeader>
            <CardTitle>Fleet Overview</CardTitle>
            <CardDescription>
              {aircraft.length > 0
                ? `Showing ${aircraft.length} aircraft`
                : "No aircraft found"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <section className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <section key={i} className="h-16 bg-muted animate-pulse" />
                ))}
              </section>
            ) : aircraft.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Aircraft</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Capacity</TableHead>
                      <TableHead>Range</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {aircraft.map((item) => (
                      <TableRow
                        key={item.id}
                        className={`cursor-pointer hover:bg-accent ${selectedAircraft?.id === item.id ? "bg-accent" : ""}`}
                        onClick={() => {
                          setSelectedAircraft(item);
                          setShowForm(false);
                          setIsEditing(false);
                        }}
                      >
                        <TableCell>
                          <section className="flex items-center gap-3">
                            {item.thumbnailImage ? (
                              <Image
                                src={item.thumbnailImage}
                                alt={item.name}
                                width={60}
                                height={40}
                                className="object-cover"
                              />
                            ) : (
                              <section className="w-[60px] h-[40px] bg-muted flex items-center justify-center">
                                <Plane className="h-5 w-5 text-muted-foreground" />
                              </section>
                            )}
                            <article>
                              <p className="font-medium">{item.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {item.manufacturer} {item.model}
                              </p>
                            </article>
                          </section>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={getCategoryColor(item.category) as any}
                          >
                            {item.category.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.passengerCapacityMin}-
                          {item.passengerCapacityMax} pax
                        </TableCell>
                        <TableCell>
                          {item.rangeNm.toLocaleString()} nm
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
                <Plane className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No aircraft found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || categoryFilter
                    ? "Try different search or filter"
                    : "Add your first aircraft"}
                </p>
                {!searchQuery && !categoryFilter && (
                  <Button variant="gold" onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Aircraft
                  </Button>
                )}
              </section>
            )}
          </CardContent>
        </Card>

        {/* Detail Panel (View Mode) */}
        {selectedAircraft && !showForm && !isEditing && (
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg">
                  {selectedAircraft.name}
                </CardTitle>
                <CardDescription>
                  {selectedAircraft.manufacturer} {selectedAircraft.model}
                </CardDescription>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="icon" onClick={startEdit}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedAircraft(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
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
                    value="specs"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                  >
                    Specs
                  </TabsTrigger>
                  <TabsTrigger
                    value="images"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                  >
                    Images
                  </TabsTrigger>
                </TabsList>

                {/* Details Tab */}
                <TabsContent value="details" className="p-4 space-y-3 mt-0">
                  <ScrollArea className="h-[350px] pr-4">
                    <article className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Category
                        </p>
                        <Badge
                          variant={
                            getCategoryColor(selectedAircraft.category) as any
                          }
                          className="mt-1"
                        >
                          {selectedAircraft.category.replace(/_/g, " ")}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Availability
                        </p>
                        <Badge
                          variant={
                            selectedAircraft.availability === "BOTH"
                              ? "success"
                              : selectedAircraft.availability === "NONE"
                                ? "secondary"
                                : "warning"
                          }
                          className="mt-1"
                        >
                          {selectedAircraft.availability}
                        </Badge>
                      </div>
                    </article>

                    <Separator className="my-3" />

                    <article>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        Passengers
                      </p>
                      <p className="font-medium">
                        {selectedAircraft.passengerCapacityMin}-
                        {selectedAircraft.passengerCapacityMax}
                      </p>
                    </article>

                    {selectedAircraft.yearOfManufacture && (
                      <article className="mt-3">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Year
                        </p>
                        <p className="font-medium">
                          {selectedAircraft.yearOfManufacture}
                        </p>
                      </article>
                    )}

                    {selectedAircraft.hourlyRateUsd && (
                      <article className="mt-3">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                          Hourly Rate
                        </p>
                        <p className="font-medium">
                          ${selectedAircraft.hourlyRateUsd.toLocaleString()}/hr
                        </p>
                      </article>
                    )}

                    {selectedAircraft.description && (
                      <>
                        <Separator className="my-3" />
                        <article>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                            Description
                          </p>
                          <p className="text-sm">
                            {selectedAircraft.description}
                          </p>
                        </article>
                      </>
                    )}
                  </ScrollArea>

                  <section className="pt-2 border-t">
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => setDeleteDialogOpen(true)}
                      disabled={deleting}
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </>
                      )}
                    </Button>
                  </section>
                </TabsContent>

                {/* Specs Tab */}
                <TabsContent value="specs" className="p-4 mt-0">
                  <ScrollArea className="h-[400px] pr-4">
                    <section className="space-y-4">
                      <article>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                          Performance
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">
                              Range:
                            </span>{" "}
                            <span className="font-medium">
                              {selectedAircraft.rangeNm.toLocaleString()} nm
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">
                              Speed:
                            </span>{" "}
                            <span className="font-medium">
                              {selectedAircraft.cruiseSpeedKnots} kts
                            </span>
                          </div>
                        </div>
                      </article>

                      {selectedAircraft.baggageCapacityCuFt && (
                        <article>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                            Baggage
                          </p>
                          <p className="text-sm font-medium">
                            {selectedAircraft.baggageCapacityCuFt} cu ft
                          </p>
                        </article>
                      )}

                      {(selectedAircraft.cabinLengthFt ||
                        selectedAircraft.cabinWidthFt ||
                        selectedAircraft.cabinHeightFt) && (
                        <article>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                            Cabin Dimensions
                          </p>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            {selectedAircraft.cabinLengthFt && (
                              <div>
                                <span className="text-muted-foreground">
                                  L:
                                </span>{" "}
                                <span className="font-medium">
                                  {selectedAircraft.cabinLengthFt} ft
                                </span>
                              </div>
                            )}
                            {selectedAircraft.cabinWidthFt && (
                              <div>
                                <span className="text-muted-foreground">
                                  W:
                                </span>{" "}
                                <span className="font-medium">
                                  {selectedAircraft.cabinWidthFt} ft
                                </span>
                              </div>
                            )}
                            {selectedAircraft.cabinHeightFt && (
                              <div>
                                <span className="text-muted-foreground">
                                  H:
                                </span>{" "}
                                <span className="font-medium">
                                  {selectedAircraft.cabinHeightFt} ft
                                </span>
                              </div>
                            )}
                          </div>
                        </article>
                      )}

                      {(selectedAircraft.lengthFt ||
                        selectedAircraft.wingspanFt ||
                        selectedAircraft.heightFt) && (
                        <article>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
                            Exterior Dimensions
                          </p>
                          <div className="grid grid-cols-3 gap-2 text-sm">
                            {selectedAircraft.lengthFt && (
                              <div>
                                <span className="text-muted-foreground">
                                  L:
                                </span>{" "}
                                <span className="font-medium">
                                  {selectedAircraft.lengthFt} ft
                                </span>
                              </div>
                            )}
                            {selectedAircraft.wingspanFt && (
                              <div>
                                <span className="text-muted-foreground">
                                  Span:
                                </span>{" "}
                                <span className="font-medium">
                                  {selectedAircraft.wingspanFt} ft
                                </span>
                              </div>
                            )}
                            {selectedAircraft.heightFt && (
                              <div>
                                <span className="text-muted-foreground">
                                  H:
                                </span>{" "}
                                <span className="font-medium">
                                  {selectedAircraft.heightFt} ft
                                </span>
                              </div>
                            )}
                          </div>
                        </article>
                      )}
                    </section>
                  </ScrollArea>
                </TabsContent>

                {/* Images Tab */}
                <TabsContent value="images" className="p-4 mt-0">
                  <ScrollArea className="h-[400px] pr-4">
                    <Accordion
                      type="multiple"
                      defaultValue={["exterior", "interior"]}
                      className="w-full"
                    >
                      <AccordionItem value="exterior">
                        <AccordionTrigger className="text-sm">
                          Exterior Images (
                          {selectedAircraft.exteriorImages.length})
                        </AccordionTrigger>
                        <AccordionContent>
                          {selectedAircraft.exteriorImages.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                              {selectedAircraft.exteriorImages.map(
                                (img, idx) => (
                                  <Image
                                    key={idx}
                                    src={img}
                                    alt={`Exterior ${idx + 1}`}
                                    width={150}
                                    height={100}
                                    className="object-cover w-full h-20"
                                  />
                                ),
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                              <ImageIcon className="h-8 w-8 mb-2" />
                              <p className="text-xs">No exterior images</p>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="interior">
                        <AccordionTrigger className="text-sm">
                          Interior Images (
                          {selectedAircraft.interiorImages?.length || 0})
                        </AccordionTrigger>
                        <AccordionContent>
                          {selectedAircraft.interiorImages?.length > 0 ? (
                            <div className="grid grid-cols-2 gap-2">
                              {selectedAircraft.interiorImages.map(
                                (img, idx) => (
                                  <Image
                                    key={idx}
                                    src={img}
                                    alt={`Interior ${idx + 1}`}
                                    width={150}
                                    height={100}
                                    className="object-cover w-full h-20"
                                  />
                                ),
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
                              <ImageIcon className="h-8 w-8 mb-2" />
                              <p className="text-xs">No interior images</p>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Edit Panel */}
        {selectedAircraft && isEditing && !showForm && (
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg">Edit Aircraft</CardTitle>
                <CardDescription>{selectedAircraft.name}</CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={cancelEdit}>
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">{renderForm()}</CardContent>
          </Card>
        )}

        {/* Add Aircraft Form */}
        {showForm && !isEditing && (
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg">Add Aircraft</CardTitle>
                <CardDescription>Enter aircraft details</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setShowForm(false);
                  setPendingExteriorFiles([]);
                  setPendingInteriorFiles([]);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">{renderForm()}</CardContent>
          </Card>
        )}
      </section>

      {/* Delete Aircraft Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Aircraft"
        description="Are you sure you want to delete this aircraft? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={() => {
          if (selectedAircraft) {
            handleDelete(selectedAircraft.id);
          }
          setDeleteDialogOpen(false);
        }}
      />

      {/* Delete Image Confirmation Dialog */}
      <ConfirmDialog
        open={deleteImageDialogOpen}
        onOpenChange={setDeleteImageDialogOpen}
        title="Delete Image"
        description="Are you sure you want to delete this image?"
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={() => {
          if (pendingDeleteImage) {
            handleImageDelete(pendingDeleteImage.url, pendingDeleteImage.type);
          }
          setDeleteImageDialogOpen(false);
          setPendingDeleteImage(null);
        }}
      />
    </section>
  );
}
