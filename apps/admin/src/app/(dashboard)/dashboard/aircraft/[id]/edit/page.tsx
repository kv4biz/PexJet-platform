"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NextImage from "next/image";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useToast,
  Separator,
} from "@pexjet/ui";
import {
  ArrowLeft,
  Plane,
  Upload,
  ImageIcon,
  Loader2,
  Save,
  X,
  Trash2,
} from "lucide-react";

const categories = [
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
}

export default function EditAircraftPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [aircraft, setAircraft] = useState<Aircraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    manufacturer: "",
    category: "MIDSIZE",
    availability: "BOTH",
    minPax: null as number | null,
    maxPax: null as number | null,
    baggageCuFt: null as number | null,
    rangeNm: null as number | null,
    cruiseSpeedKnots: null as number | null,
    fuelCapacityGal: null as number | null,
    cabinLengthFt: null as number | null,
    cabinWidthFt: null as number | null,
    cabinHeightFt: null as number | null,
    exteriorLengthFt: null as number | null,
    exteriorWingspanFt: null as number | null,
    exteriorHeightFt: null as number | null,
    basePricePerHour: null as number | null,
  });
  const [saving, setSaving] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);
  const [deletingImage, setDeletingImage] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    fetchAircraft();
  }, [params.id]);

  // Cleanup object URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const fetchAircraft = async () => {
    try {
      const response = await fetch(`/api/aircraft/${params.id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAircraft(data);
        setFormData({
          name: data.name,
          manufacturer: data.manufacturer,
          category: data.category,
          availability: data.availability,
          minPax: data.minPax,
          maxPax: data.maxPax,
          baggageCuFt: data.baggageCuFt,
          rangeNm: data.rangeNm,
          cruiseSpeedKnots: data.cruiseSpeedKnots,
          fuelCapacityGal: data.fuelCapacityGal,
          cabinLengthFt: data.cabinLengthFt,
          cabinWidthFt: data.cabinWidthFt,
          cabinHeightFt: data.cabinHeightFt,
          exteriorLengthFt: data.exteriorLengthFt,
          exteriorWingspanFt: data.exteriorWingspanFt,
          exteriorHeightFt: data.exteriorHeightFt,
          basePricePerHour: data.basePricePerHour,
        });
      } else {
        toast({
          title: "Error",
          description: "Aircraft not found",
          variant: "destructive",
        });
        router.push("/dashboard/aircraft");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch aircraft",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // First update the aircraft data
      const response = await fetch(`/api/aircraft/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const savedAircraft = await response.json();
        console.log("Aircraft updated:", savedAircraft);

        // Upload pending image if any (after aircraft is updated)
        let imageUploadFailed = false;
        if (pendingImageFile) {
          console.log("Uploading image for aircraft:", savedAircraft.id);
          try {
            const uploadResult = await uploadImage(
              savedAircraft.id,
              pendingImageFile,
            );
            console.log("Image upload result:", uploadResult);
          } catch (uploadError: any) {
            console.error("Image upload error:", uploadError);
            imageUploadFailed = true;
            toast({
              title: "Image Upload Failed",
              description:
                uploadError.message ||
                "Failed to upload image. Aircraft saved without image.",
              variant: "destructive",
            });
          }
        }

        if (!imageUploadFailed) {
          toast({
            title: "Aircraft Updated",
            description: pendingImageFile
              ? "Aircraft with new image updated successfully."
              : "Changes saved successfully.",
          });
        } else {
          toast({
            title: "Aircraft Updated (Without Image)",
            description: "Aircraft was updated but the image failed to upload.",
            variant: "default",
          });
        }

        router.push("/dashboard/aircraft");
      } else {
        const error = await response.json();
        toast({
          title: "Save Failed",
          description: error.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast({
        title: "Save Failed",
        description: "An error occurred.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const uploadImage = async (aircraftId: string, file: File) => {
    console.log("uploadImage called with:", {
      aircraftId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    const uploadFormData = new FormData();
    uploadFormData.append("image", file);

    console.log("Sending POST to:", `/api/aircraft/${aircraftId}/images`);

    const response = await fetch(`/api/aircraft/${aircraftId}/images`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
      body: uploadFormData,
    });

    console.log("Upload response status:", response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error("Upload error response:", error);
      throw new Error(error.error || "Failed to upload image");
    }

    return response.json();
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Image must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Cleanup previous preview URL
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setPendingImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleDeleteImage = async () => {
    if (!aircraft) return;

    setDeletingImage(true);
    try {
      const response = await fetch(`/api/aircraft/${aircraft.id}/images`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        // Update local state to remove image
        setAircraft({ ...aircraft, image: null });
        toast({
          title: "Image Deleted",
          description: "Aircraft image has been removed.",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Delete Failed",
          description: error.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Delete image error:", error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete image.",
        variant: "destructive",
      });
    } finally {
      setDeletingImage(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!aircraft) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Aircraft not found</p>
      </div>
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/aircraft">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Aircraft</h1>
          <p className="text-muted-foreground">
            Update aircraft details and specifications
          </p>
        </div>
      </header>

      {/* Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Aircraft Information</CardTitle>
          <CardDescription>
            Modify the specifications and details for {aircraft.name}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Basic Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Aircraft Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="e.g., Gulfstream G650"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) =>
                      setFormData({ ...formData, manufacturer: e.target.value })
                    }
                    placeholder="e.g., Gulfstream"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData({ ...formData, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Availability</Label>
                  <Select
                    value={formData.availability}
                    onValueChange={(value) =>
                      setFormData({ ...formData, availability: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                    <SelectContent>
                      {availabilityOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Capacity */}
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Capacity
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Min Passengers</Label>
                  <Input
                    type="number"
                    value={formData.minPax || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        minPax: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    placeholder="e.g., 1"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Passengers</Label>
                  <Input
                    type="number"
                    value={formData.maxPax || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        maxPax: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    placeholder="e.g., 8"
                  />
                </div>
              </div>
            </div>

            {/* Performance */}
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Performance
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Range (NM)</Label>
                  <Input
                    type="number"
                    value={formData.rangeNm || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rangeNm: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    placeholder="e.g., 7000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Speed (knots)</Label>
                  <Input
                    type="number"
                    value={formData.cruiseSpeedKnots || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cruiseSpeedKnots: e.target.value
                          ? parseInt(e.target.value)
                          : null,
                      })
                    }
                    placeholder="e.g., 488"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fuel Capacity (gal)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.fuelCapacityGal || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        fuelCapacityGal: e.target.value
                          ? parseFloat(e.target.value)
                          : null,
                      })
                    }
                    placeholder="e.g., 1200"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Baggage (cu ft)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.baggageCuFt || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        baggageCuFt: e.target.value
                          ? parseFloat(e.target.value)
                          : null,
                      })
                    }
                    placeholder="e.g., 150"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Pricing
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Base Price Per Hour ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.basePricePerHour || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        basePricePerHour: e.target.value
                          ? parseFloat(e.target.value)
                          : null,
                      })
                    }
                    placeholder="e.g., 4500"
                  />
                </div>
              </div>
            </div>

            {/* Cabin Dimensions */}
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Cabin Dimensions (ft)
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
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
                    placeholder="e.g., 45.2"
                  />
                </div>
                <div className="space-y-2">
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
                    placeholder="e.g., 6.2"
                  />
                </div>
                <div className="space-y-2">
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
                    placeholder="e.g., 6.1"
                  />
                </div>
              </div>
            </div>

            {/* Exterior Dimensions */}
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Exterior Dimensions (ft)
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Length</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.exteriorLengthFt || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        exteriorLengthFt: e.target.value
                          ? parseFloat(e.target.value)
                          : null,
                      })
                    }
                    placeholder="e.g., 96.4"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Wingspan</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.exteriorWingspanFt || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        exteriorWingspanFt: e.target.value
                          ? parseFloat(e.target.value)
                          : null,
                      })
                    }
                    placeholder="e.g., 93.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Height</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={formData.exteriorHeightFt || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        exteriorHeightFt: e.target.value
                          ? parseFloat(e.target.value)
                          : null,
                      })
                    }
                    placeholder="e.g., 25.8"
                  />
                </div>
              </div>
            </div>

            {/* Image Upload */}
            <Separator />
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                Aircraft Image
              </h3>

              {/* Current Image Display */}
              {(aircraft.image || pendingImageFile) && (
                <div className="space-y-3">
                  <div className="border rounded-lg overflow-hidden bg-muted/30 relative group">
                    <NextImage
                      src={
                        pendingImageFile && imagePreviewUrl
                          ? imagePreviewUrl
                          : aircraft.image!
                      }
                      alt={aircraft.name}
                      width={600}
                      height={300}
                      className="w-full h-auto object-contain max-h-80"
                    />
                    {/* Delete Button Overlay */}
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={
                        pendingImageFile
                          ? () => {
                              if (imagePreviewUrl) {
                                URL.revokeObjectURL(imagePreviewUrl);
                              }
                              setPendingImageFile(null);
                              setImagePreviewUrl(null);
                            }
                          : handleDeleteImage
                      }
                      disabled={deletingImage}
                    >
                      {deletingImage ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {pendingImageFile
                      ? `New image: ${pendingImageFile.name} (${(pendingImageFile.size / 1024 / 1024).toFixed(2)} MB)`
                      : "Current aircraft image"}
                  </p>
                </div>
              )}

              {/* Upload Controls */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Image</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.createElement("input");
                      input.type = "file";
                      input.accept = "image/*";
                      input.onchange = (e) =>
                        handleImageUpload((e.target as HTMLInputElement).files);
                      input.click();
                    }}
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    {aircraft.image ? "Change" : "Upload"}
                  </Button>
                </div>
                {!aircraft.image && !pendingImageFile && (
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    <div>
                      No image uploaded
                      <div className="text-xs">Max size: 5MB, JPG/PNG/WebP</div>
                    </div>
                  </div>
                )}
                {pendingImageFile && (
                  <div className="text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      Ready to upload: {pendingImageFile.name}
                    </div>
                    <div className="text-xs">
                      Click "Update Aircraft" to save
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button type="button" variant="outline" asChild>
                <Link href="/dashboard/aircraft">Cancel</Link>
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                {saving ? "Saving..." : "Update Aircraft"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </section>
  );
}
