"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  useToast,
} from "@pexjet/ui";
import { ArrowLeft, User, Phone, Mail, Loader2 } from "lucide-react";

export default function NewClientPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    fullName: "",
    email: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.phone) {
      toast({
        title: "Error",
        description: "Phone number is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Client created successfully",
        });
        router.push("/dashboard/clients");
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create client",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to create client:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/clients">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <article>
          <h1 className="text-3xl font-bold">Add New Client</h1>
          <p className="text-muted-foreground">
            Manually add a client to the system
          </p>
        </article>
      </header>

      <form onSubmit={handleSubmit}>
        <section className="grid gap-6 lg:grid-cols-3">
          {/* Main Form */}
          <section className="lg:col-span-2 space-y-6">
            {/* Client Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-[#D4AF37]" />
                  Client Information
                </CardTitle>
                <CardDescription>
                  Enter the client&apos;s contact details
                </CardDescription>
              </CardHeader>
              <CardContent>
                <section className="space-y-4">
                  <article className="space-y-2">
                    <Label htmlFor="phone">WhatsApp Phone Number *</Label>
                    <section className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        placeholder="e.g., +2348012345678"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        className="pl-10"
                      />
                    </section>
                    <p className="text-xs text-muted-foreground">
                      Include country code (e.g., +234 for Nigeria)
                    </p>
                  </article>

                  <article className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <section className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        placeholder="e.g., John Doe"
                        value={formData.fullName}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            fullName: e.target.value,
                          }))
                        }
                        className="pl-10"
                      />
                    </section>
                  </article>

                  <article className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <section className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="e.g., john@example.com"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="pl-10"
                      />
                    </section>
                  </article>
                </section>
              </CardContent>
            </Card>
          </section>

          {/* Summary Sidebar */}
          <section className="space-y-6">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Client Summary</CardTitle>
                <CardDescription>Review before adding</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Phone */}
                <article className="space-y-1">
                  <p className="text-sm text-muted-foreground">Phone</p>
                  {formData.phone ? (
                    <p className="font-medium">{formData.phone}</p>
                  ) : (
                    <p className="text-muted-foreground">Not entered</p>
                  )}
                </article>

                <Separator />

                {/* Name */}
                <article className="space-y-1">
                  <p className="text-sm text-muted-foreground">Name</p>
                  {formData.fullName ? (
                    <p className="font-medium">{formData.fullName}</p>
                  ) : (
                    <p className="text-muted-foreground">Not entered</p>
                  )}
                </article>

                <Separator />

                {/* Email */}
                <article className="space-y-1">
                  <p className="text-sm text-muted-foreground">Email</p>
                  {formData.email ? (
                    <p className="font-medium">{formData.email}</p>
                  ) : (
                    <p className="text-muted-foreground">Not entered</p>
                  )}
                </article>

                <Separator />

                {/* Actions */}
                <section className="space-y-2 pt-4">
                  <Button
                    type="submit"
                    variant="gold"
                    className="w-full"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Add Client"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.back()}
                  >
                    Cancel
                  </Button>
                </section>
              </CardContent>
            </Card>
          </section>
        </section>
      </form>
    </section>
  );
}
