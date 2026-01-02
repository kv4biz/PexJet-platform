"use client";

import { useState, useEffect } from "react";
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
  Badge,
  Separator,
} from "@pexjet/ui";
import { Save, X, Loader2, Plane, Upload, ImageIcon } from "lucide-react";

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

interface AircraftFormProps {
  aircraft?: Aircraft | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

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

const getEmptyForm = () => ({
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

export default function AircraftForm({
  aircraft,
  isOpen,
  onClose,
  onSuccess,
}: AircraftFormProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState(getEmptyForm());
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null);

  const isEditing = !!aircraft;

  useEffect(() => {
    if (aircraft) {
      setFormData({
        name: aircraft.name,
        manufacturer: aircraft.manufacturer,
        category: aircraft.category,
        availability: aircraft.availability,
        minPax: aircraft.minPax,
        maxPax: aircraft.maxPax,
        baggageCuFt: aircraft.baggageCuFt,
        rangeNm: aircraft.rangeNm,
        cruiseSpeedKnots: aircraft.cruiseSpeedKnots,
        fuelCapacityGal: aircraft.fuelCapacityGal,
        cabinLengthFt: aircraft.cabinLengthFt,
        cabinWidthFt: aircraft.cabinWidthFt,
        cabinHeightFt: aircraft.cabinHeightFt,
        exteriorLengthFt: aircraft.exteriorLengthFt,
        exteriorWingspanFt: aircraft.exteriorWingspanFt,
        exteriorHeightFt: aircraft.exteriorHeightFt,
        basePricePerHour: aircraft.basePricePerHour,
      });
    } else {
      setFormData(getEmptyForm());
    }
  }, [aircraft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const url =
        isEditing && aircraft
          ? `/api/aircraft/${aircraft.id}`
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

        // Upload pending image if any
        if (pendingImageFile && savedAircraft.id) {
          await uploadImage(savedAircraft.id, pendingImageFile);
        }

        toast({
          title: isEditing ? "Aircraft Updated" : "Aircraft Added",
          description: isEditing
            ? "Changes saved successfully."
            : "New aircraft added to fleet.",
        });

        setFormData(getEmptyForm());
        setPendingImageFile(null);
        onSuccess();
        onClose();
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

  const uploadImage = async (aircraftId: string, file: File) => {
    const formData = new FormData();
    formData.append("image", file);

    await fetch(`/api/aircraft/${aircraftId}/images`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
      body: formData,
    });
  };

  const handleImageUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    setPendingImageFile(file);
  };

  if (!isOpen) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-lg">
            {isEditing ? "Edit Aircraft" : "Add New Aircraft"}
          </CardTitle>
          <CardDescription>
            {isEditing
              ? "Update aircraft details and specifications"
              : "Fill in the details to add a new aircraft to the fleet"}
          </CardDescription>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
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
                      minPax: e.target.value ? parseInt(e.target.value) : null,
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
                      maxPax: e.target.value ? parseInt(e.target.value) : null,
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
                      rangeNm: e.target.value ? parseInt(e.target.value) : null,
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
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Upload className="h-3 w-3 mr-1" />
                  )}
                  {isEditing && aircraft?.image ? "Change" : "Upload"}
                </Button>
              </div>
              {pendingImageFile && (
                <div className="text-sm text-muted-foreground">
                  Selected: {pendingImageFile.name}
                </div>
              )}
              {isEditing && aircraft?.image && !pendingImageFile && (
                <div className="text-sm text-muted-foreground">
                  Current image uploaded
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {isEditing ? "Update Aircraft" : "Add Aircraft"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
