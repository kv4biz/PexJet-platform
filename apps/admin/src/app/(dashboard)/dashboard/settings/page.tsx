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
  usdToNgnRate: number;
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
  bankSortCode?: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    usdToNgnRate: 1650,
    paymentWindowHours: 3,
    dealDeadlineMinutes: 30,
    minimumBookingNoticeHours: 24,
    defaultOperatorCommission: 10,
    supportEmail: "",
    supportPhone: "",
    bankName: "",
    bankAccountName: "",
    bankAccountNumber: "",
    bankSortCode: "",
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

      {/* Currency Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Currency Settings</CardTitle>
          <CardDescription>
            Configure exchange rates for currency conversion
          </CardDescription>
        </CardHeader>
        <CardContent>
          <fieldset className="grid gap-2">
            <Label htmlFor="usdToNgn">USD to NGN Exchange Rate</Label>
            <Input
              id="usdToNgn"
              type="number"
              step="0.01"
              value={settings.usdToNgnRate}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  usdToNgnRate: parseFloat(e.target.value) || 0,
                })
              }
            />
            <p className="text-sm text-muted-foreground">
              Current rate: 1 USD = {settings.usdToNgnRate.toLocaleString()} NGN
            </p>
          </fieldset>
        </CardContent>
      </Card>

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
              <Label htmlFor="bankSortCode">Sort Code</Label>
              <Input
                id="bankSortCode"
                value={settings.bankSortCode || ""}
                onChange={(e) =>
                  setSettings({ ...settings, bankSortCode: e.target.value })
                }
                placeholder="e.g. 011"
              />
            </fieldset>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
