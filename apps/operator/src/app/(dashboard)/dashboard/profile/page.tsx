"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  User,
  Mail,
  Phone,
  Building2,
  CreditCard,
  Loader2,
  Camera,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
  Avatar,
  AvatarFallback,
  AvatarImage,
  useToast,
} from "@pexjet/ui";

interface OperatorProfile {
  id: string;
  email: string;
  username: string;
  fullName: string;
  phone: string;
  avatar: string | null;
  bankName: string;
  bankAccountNumber: string;
  bankAccountName: string;
  commissionPercent: number;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<OperatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    phone: "",
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await fetch("/api/profile", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProfile(data.operator);
        setFormData({
          fullName: data.operator.fullName,
          username: data.operator.username,
          phone: data.operator.phone,
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      const data = await response.json();
      setProfile(data.operator);
      localStorage.setItem("operator", JSON.stringify(data.operator));

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load profile</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">Manage your account information</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={profile.avatar || undefined} />
                  <AvatarFallback className="bg-gold-500/10 text-gold-500 text-2xl">
                    {getInitials(profile.fullName)}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="icon"
                  variant="outline"
                  className="absolute bottom-0 right-0 h-8 w-8"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <h2 className="mt-4 text-xl font-semibold">{profile.fullName}</h2>
              <p className="text-sm text-muted-foreground">
                @{profile.username}
              </p>
              <p className="text-xs text-gold-500 mt-1">Operator</p>
            </div>

            <div className="mt-6 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span>{profile.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{profile.phone}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Edit Profile</CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number (WhatsApp)</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={profile.email} disabled />
                <p className="text-xs text-muted-foreground">
                  Contact PexJet to change your email address
                </p>
              </div>

              <Button
                type="submit"
                disabled={saving}
                className="bg-gold-500 text-black hover:bg-gold-600"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Bank Details */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gold-500" />
              Bank Details
            </CardTitle>
            <CardDescription>
              Your registered bank account for receiving payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <Label className="text-muted-foreground">Bank Name</Label>
                <p className="font-medium">{profile.bankName}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Account Number</Label>
                <p className="font-medium">{profile.bankAccountNumber}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-muted-foreground">Account Name</Label>
                <p className="font-medium">{profile.bankAccountName}</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              To update your bank details, please contact PexJet support.
            </p>
          </CardContent>
        </Card>

        {/* Commission Info */}
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gold-500" />
              Commission Structure
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted">
              <div>
                <p className="font-medium">Your Commission Rate</p>
                <p className="text-sm text-muted-foreground">
                  PexJet retains this percentage from each booking
                </p>
              </div>
              <div className="text-2xl font-bold text-gold-500">
                {profile.commissionPercent}%
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              This means you receive {100 - profile.commissionPercent}% of each
              booking payment directly to your bank account.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
