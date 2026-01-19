"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Plane,
  Plus,
  Trash2,
  Loader2,
  Users,
  Gauge,
  MapPin,
  ImageIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  ScrollArea,
  useToast,
} from "@pexjet/ui";

interface Aircraft {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  category: string;
  passengerCapacityMin: number;
  passengerCapacityMax: number;
  rangeNm: number;
  cruiseSpeedKnots: number;
  thumbnailImage: string | null;
}

interface FleetAircraft extends Aircraft {
  fleetId: string;
}

export default function FleetPage() {
  const { toast } = useToast();
  const [fleet, setFleet] = useState<FleetAircraft[]>([]);
  const [availableAircraft, setAvailableAircraft] = useState<Aircraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingAircraft, setAddingAircraft] = useState<string | null>(null);
  const [removingAircraft, setRemovingAircraft] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const MAX_FLEET_SIZE = 10;

  useEffect(() => {
    fetchFleet();
    fetchAvailableAircraft();
  }, []);

  const fetchFleet = async () => {
    try {
      const response = await fetch("/api/fleet", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setFleet(data.fleet);
      }
    } catch (error) {
      console.error("Failed to fetch fleet:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableAircraft = async () => {
    try {
      const response = await fetch("/api/aircraft", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableAircraft(data.aircraft);
      }
    } catch (error) {
      console.error("Failed to fetch aircraft:", error);
    }
  };

  const handleAddToFleet = async (aircraftId: string) => {
    if (fleet.length >= MAX_FLEET_SIZE) {
      toast({
        title: "Fleet Limit Reached",
        description: `You can only have up to ${MAX_FLEET_SIZE} aircraft in your fleet`,
        variant: "destructive",
      });
      return;
    }

    setAddingAircraft(aircraftId);

    try {
      const response = await fetch("/api/fleet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify({ aircraftId }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to add aircraft");
      }

      toast({
        title: "Aircraft Added",
        description: "Aircraft has been added to your fleet",
      });

      fetchFleet();
      setDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setAddingAircraft(null);
    }
  };

  const handleRemoveFromFleet = async (fleetId: string) => {
    setRemovingAircraft(fleetId);

    try {
      const response = await fetch(`/api/fleet/${fleetId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove aircraft");
      }

      toast({
        title: "Aircraft Removed",
        description: "Aircraft has been removed from your fleet",
      });

      setFleet(fleet.filter((a) => a.fleetId !== fleetId));
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setRemovingAircraft(null);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      LIGHT_JET: "bg-blue-500/10 text-blue-500",
      MIDSIZE_JET: "bg-green-500/10 text-green-500",
      SUPER_MIDSIZE_JET: "bg-purple-500/10 text-purple-500",
      HEAVY_JET: "bg-orange-500/10 text-orange-500",
      ULTRA_LONG_RANGE: "bg-red-500/10 text-red-500",
      TURBOPROP: "bg-cyan-500/10 text-cyan-500",
    };
    return colors[category] || "bg-gray-500/10 text-gray-500";
  };

  const formatCategory = (category: string) => {
    return category.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  // Filter out aircraft already in fleet
  const availableToAdd = availableAircraft.filter(
    (a) => !fleet.some((f) => f.id === a.id),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Fleet</h1>
          <p className="text-muted-foreground">
            Manage your aircraft fleet ({fleet.length}/{MAX_FLEET_SIZE})
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-gold-500 text-black hover:bg-gold-600"
              disabled={fleet.length >= MAX_FLEET_SIZE}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Aircraft
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Add Aircraft to Fleet</DialogTitle>
              <DialogDescription>
                Select an aircraft to add to your fleet. You can have up to{" "}
                {MAX_FLEET_SIZE} aircraft.
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[60vh] pr-4">
              <div className="grid gap-4">
                {availableToAdd.length > 0 ? (
                  availableToAdd.map((aircraft) => (
                    <Card key={aircraft.id} className="overflow-hidden">
                      <div className="flex">
                        <div className="w-32 h-24 bg-muted flex items-center justify-center">
                          {aircraft.thumbnailImage ? (
                            <Image
                              src={aircraft.thumbnailImage}
                              alt={aircraft.name}
                              width={128}
                              height={96}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <Plane className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold">{aircraft.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {aircraft.manufacturer} {aircraft.model}
                              </p>
                              <Badge
                                className={`mt-1 ${getCategoryColor(aircraft.category)}`}
                              >
                                {formatCategory(aircraft.category)}
                              </Badge>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleAddToFleet(aircraft.id)}
                              disabled={addingAircraft === aircraft.id}
                              className="bg-gold-500 text-black hover:bg-gold-600"
                            >
                              {addingAircraft === aircraft.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <Plus className="h-4 w-4 mr-1" />
                                  Add
                                </>
                              )}
                            </Button>
                          </div>
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {aircraft.passengerCapacityMin}-
                              {aircraft.passengerCapacityMax} pax
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {aircraft.rangeNm.toLocaleString()} nm
                            </span>
                            <span className="flex items-center gap-1">
                              <Gauge className="h-3 w-3" />
                              {aircraft.cruiseSpeedKnots} kts
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Plane className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No more aircraft available to add</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {/* Fleet Grid */}
      {fleet.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {fleet.map((aircraft) => (
            <Card key={aircraft.fleetId} className="overflow-hidden">
              <div className="aspect-video bg-muted relative">
                {aircraft.thumbnailImage ? (
                  <Image
                    src={aircraft.thumbnailImage}
                    alt={aircraft.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{aircraft.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {aircraft.manufacturer} {aircraft.model}
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remove Aircraft</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to remove {aircraft.name} from
                          your fleet? This will not affect any active empty leg
                          deals.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            handleRemoveFromFleet(aircraft.fleetId)
                          }
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {removingAircraft === aircraft.fleetId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Remove"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                <Badge
                  className={`mt-2 ${getCategoryColor(aircraft.category)}`}
                >
                  {formatCategory(aircraft.category)}
                </Badge>

                <div className="grid grid-cols-3 gap-2 mt-4 text-xs">
                  <div className="text-center p-2 bg-muted">
                    <Users className="h-4 w-4 mx-auto mb-1 text-gold-500" />
                    <span className="text-muted-foreground">
                      {aircraft.passengerCapacityMax} pax
                    </span>
                  </div>
                  <div className="text-center p-2 bg-muted">
                    <MapPin className="h-4 w-4 mx-auto mb-1 text-gold-500" />
                    <span className="text-muted-foreground">
                      {(aircraft.rangeNm / 1000).toFixed(1)}k nm
                    </span>
                  </div>
                  <div className="text-center p-2 bg-muted">
                    <Gauge className="h-4 w-4 mx-auto mb-1 text-gold-500" />
                    <span className="text-muted-foreground">
                      {aircraft.cruiseSpeedKnots} kts
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Plane className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Aircraft in Fleet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Add aircraft to your fleet to start creating empty leg deals
            </p>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-gold-500 text-black hover:bg-gold-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Aircraft
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
