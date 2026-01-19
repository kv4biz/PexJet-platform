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
  Label,
  Separator,
} from "@pexjet/ui";
import { Save, Loader2 } from "lucide-react";

interface Settings {
  paymentWindowHours: number;
  dealDeadlineMinutes: number;
  minimumBookingNoticeHours: number;
  defaultOperatorCommission: number;
  supportEmail: string;
  supportPhone: string;
  // Bank details for Super Admin
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankCode?: string;
  // Company information
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  // Social media links
  facebookUrl?: string;
  instagramUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  // WhatsApp for proof of payment
  proofOfPaymentWhatsApp?: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    paymentWindowHours: 3,
    dealDeadlineMinutes: 30,
    minimumBookingNoticeHours: 24,
    defaultOperatorCommission: 10,
    supportEmail: "",
    supportPhone: "",
    bankName: "",
    bankAccountName: "",
    bankAccountNumber: "",
    bankCode: "",
    companyName: "",
    companyEmail: "",
    companyPhone: "",
    companyAddress: "",
    facebookUrl: "",
    instagramUrl: "",
    linkedinUrl: "",
    twitterUrl: "",
    proofOfPaymentWhatsApp: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetchSettings();
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error("Failed to fetch user:", error);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/settings", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Failed to fetch settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert("Settings saved successfully");
      } else {
        const error = await response.json();
        alert(`Failed to save: ${error.error}`);
      }
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <section className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure platform settings</p>
        </header>
        <Card>
          <CardContent className="pt-6">
            <section className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <section key={i} className="h-12 bg-muted animate-pulse" />
              ))}
            </section>
          </CardContent>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <article>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Configure platform settings</p>
        </article>
        <Button variant="gold" onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </header>

      
      {/* Payment Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Settings</CardTitle>
          <CardDescription>
            Configure payment windows and deadlines
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <fieldset className="grid gap-2">
            <Label htmlFor="paymentWindow">Payment Window (hours)</Label>
            <Input
              id="paymentWindow"
              type="number"
              value={settings.paymentWindowHours}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  paymentWindowHours: parseInt(e.target.value) || 0,
                })
              }
            />
            <p className="text-sm text-muted-foreground">
              Time allowed for clients to complete payment after quote approval
            </p>
          </fieldset>

          <fieldset className="grid gap-2">
            <Label htmlFor="dealDeadline">Deal Deadline (minutes)</Label>
            <Input
              id="dealDeadline"
              type="number"
              value={settings.dealDeadlineMinutes}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  dealDeadlineMinutes: parseInt(e.target.value) || 0,
                })
              }
            />
            <p className="text-sm text-muted-foreground">
              Time limit for empty leg deal reservations
            </p>
          </fieldset>

          <fieldset className="grid gap-2">
            <Label htmlFor="bookingNotice">
              Minimum Booking Notice (hours)
            </Label>
            <Input
              id="bookingNotice"
              type="number"
              value={settings.minimumBookingNoticeHours}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  minimumBookingNoticeHours: parseInt(e.target.value) || 0,
                })
              }
            />
            <p className="text-sm text-muted-foreground">
              Minimum advance notice required for bookings
            </p>
          </fieldset>
        </CardContent>
      </Card>

      {/* Commission Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Commission Settings</CardTitle>
          <CardDescription>Configure operator commission rates</CardDescription>
        </CardHeader>
        <CardContent>
          <fieldset className="grid gap-2">
            <Label htmlFor="commission">Default Operator Commission (%)</Label>
            <Input
              id="commission"
              type="number"
              value={settings.defaultOperatorCommission}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  defaultOperatorCommission: parseInt(e.target.value) || 0,
                })
              }
            />
            <p className="text-sm text-muted-foreground">
              Default commission percentage for new operators
            </p>
          </fieldset>
        </CardContent>
      </Card>

      {/* Support Contact */}
      <Card>
        <CardHeader>
          <CardTitle>Support Contact</CardTitle>
          <CardDescription>
            Contact information displayed to clients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <fieldset className="grid gap-2">
            <Label htmlFor="supportEmail">Support Email</Label>
            <Input
              id="supportEmail"
              type="email"
              value={settings.supportEmail}
              onChange={(e) =>
                setSettings({ ...settings, supportEmail: e.target.value })
              }
            />
          </fieldset>

          <fieldset className="grid gap-2">
            <Label htmlFor="supportPhone">Support Phone</Label>
            <Input
              id="supportPhone"
              type="tel"
              value={settings.supportPhone}
              onChange={(e) =>
                setSettings({ ...settings, supportPhone: e.target.value })
              }
            />
          </fieldset>
        </CardContent>
      </Card>

      {/* Bank Details - Super Admin Only */}
      {user?.role === "SUPER_ADMIN" && (
        <Card>
          <CardHeader>
            <CardTitle>Bank Details</CardTitle>
            <CardDescription>
              Configure bank account information for payment processing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <fieldset className="grid gap-2">
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                value={settings.bankName || ""}
                onChange={(e) =>
                  setSettings({ ...settings, bankName: e.target.value })
                }
                placeholder="e.g. First Bank of Nigeria"
              />
            </fieldset>

            <fieldset className="grid gap-2">
              <Label htmlFor="bankAccountName">Account Name</Label>
              <Input
                id="bankAccountName"
                value={settings.bankAccountName || ""}
                onChange={(e) =>
                  setSettings({ ...settings, bankAccountName: e.target.value })
                }
                placeholder="e.g. PexJet Aviation Services"
              />
            </fieldset>

            <fieldset className="grid gap-2">
              <Label htmlFor="bankAccountNumber">Account Number</Label>
              <Input
                id="bankAccountNumber"
                value={settings.bankAccountNumber || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    bankAccountNumber: e.target.value,
                  })
                }
                placeholder="e.g. 1234567890"
              />
            </fieldset>

            <fieldset className="grid gap-2">
              <Label htmlFor="bankCode">Bank Code/Sort Code</Label>
              <Input
                id="bankCode"
                value={settings.bankCode || ""}
                onChange={(e) =>
                  setSettings({ ...settings, bankCode: e.target.value })
                }
                placeholder="e.g. 011"
              />
            </fieldset>
          </CardContent>
        </Card>
      )}

      {/* Company Information */}
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
          <CardDescription>
            Configure company details displayed across the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <fieldset className="grid gap-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={settings.companyName || ""}
              onChange={(e) =>
                setSettings({ ...settings, companyName: e.target.value })
              }
              placeholder="e.g. PexJet Aviation Services"
            />
          </fieldset>

          <fieldset className="grid gap-2">
            <Label htmlFor="companyEmail">Company Email</Label>
            <Input
              id="companyEmail"
              type="email"
              value={settings.companyEmail || ""}
              onChange={(e) =>
                setSettings({ ...settings, companyEmail: e.target.value })
              }
              placeholder="e.g. info@pexjet.com"
            />
          </fieldset>

          <fieldset className="grid gap-2">
            <Label htmlFor="companyPhone">Company Phone</Label>
            <Input
              id="companyPhone"
              type="tel"
              value={settings.companyPhone || ""}
              onChange={(e) =>
                setSettings({ ...settings, companyPhone: e.target.value })
              }
              placeholder="e.g. +2348000000000"
            />
          </fieldset>

          <fieldset className="grid gap-2">
            <Label htmlFor="companyAddress">Company Address</Label>
            <Input
              id="companyAddress"
              value={settings.companyAddress || ""}
              onChange={(e) =>
                setSettings({ ...settings, companyAddress: e.target.value })
              }
              placeholder="e.g. 123 Aviation Street, Lagos, Nigeria"
            />
          </fieldset>
        </CardContent>
      </Card>

      {/* Social Media Links */}
      <Card>
        <CardHeader>
          <CardTitle>Social Media Links</CardTitle>
          <CardDescription>
            Configure social media profiles for the platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <fieldset className="grid gap-2">
            <Label htmlFor="facebookUrl">Facebook URL</Label>
            <Input
              id="facebookUrl"
              type="url"
              value={settings.facebookUrl || ""}
              onChange={(e) =>
                setSettings({ ...settings, facebookUrl: e.target.value })
              }
              placeholder="https://facebook.com/pexjet"
            />
          </fieldset>

          <fieldset className="grid gap-2">
            <Label htmlFor="instagramUrl">Instagram URL</Label>
            <Input
              id="instagramUrl"
              type="url"
              value={settings.instagramUrl || ""}
              onChange={(e) =>
                setSettings({ ...settings, instagramUrl: e.target.value })
              }
              placeholder="https://instagram.com/pexjet"
            />
          </fieldset>

          <fieldset className="grid gap-2">
            <Label htmlFor="twitterUrl">Twitter URL</Label>
            <Input
              id="twitterUrl"
              type="url"
              value={settings.twitterUrl || ""}
              onChange={(e) =>
                setSettings({ ...settings, twitterUrl: e.target.value })
              }
              placeholder="https://twitter.com/pexjet"
            />
          </fieldset>

          <fieldset className="grid gap-2">
            <Label htmlFor="linkedinUrl">LinkedIn URL</Label>
            <Input
              id="linkedinUrl"
              type="url"
              value={settings.linkedinUrl || ""}
              onChange={(e) =>
                setSettings({ ...settings, linkedinUrl: e.target.value })
              }
              placeholder="https://linkedin.com/company/pexjet"
            />
          </fieldset>
        </CardContent>
      </Card>

      {/* WhatsApp Settings */}
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Settings</CardTitle>
          <CardDescription>
            Configure WhatsApp number for payment proof notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <fieldset className="grid gap-2">
            <Label htmlFor="proofOfPaymentWhatsApp">Payment Proof WhatsApp</Label>
            <Input
              id="proofOfPaymentWhatsApp"
              type="tel"
              value={settings.proofOfPaymentWhatsApp || ""}
              onChange={(e) =>
                setSettings({ ...settings, proofOfPaymentWhatsApp: e.target.value })
              }
              placeholder="e.g. +2348000000000"
            />
            <p className="text-sm text-muted-foreground">
              WhatsApp number where customers should send payment receipts
            </p>
          </fieldset>
        </CardContent>
      </Card>
    </section>
  );
}
