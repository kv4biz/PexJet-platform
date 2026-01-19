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
  ConfirmDialog,
} from "@pexjet/ui";
import {
  Search,
  Plus,
  Trash2,
  Building2,
  RefreshCw,
  Mail,
  Phone,
  X,
  Loader2,
  Save,
  Eye,
  EyeOff,
  Globe,
  MapPin,
} from "lucide-react";

interface Operator {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  website: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  status: string;
  createdAt: string;
  _count?: {
    fleets: number;
  };
}

const emptyForm = {
  companyName: "",
  contactName: "",
  email: "",
  phone: "",
  password: "",
  website: "",
  address: "",
  city: "",
  country: "",
};

export default function OperatorsPage() {
  const { toast } = useToast();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(
    null,
  );
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [operatorToDelete, setOperatorToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchOperators();
  }, [page, searchQuery]);

  const fetchOperators = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/operators?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOperators(data.operators);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch operators:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/operators/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Operator Deleted",
          description: "The operator has been removed.",
        });
        setSelectedOperator(null);
        fetchOperators();
      } else {
        const error = await response.json();
        toast({
          title: "Delete Failed",
          description: error.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Delete failed:", error);
      toast({
        title: "Delete Failed",
        description: "An error occurred while deleting.",
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
      const response = await fetch("/api/operators", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        toast({
          title: "Operator Added",
          description: "The new operator has been created.",
        });
        setShowForm(false);
        setFormData(emptyForm);
        fetchOperators();
      } else {
        const error = await response.json();
        toast({
          title: "Save Failed",
          description: error.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Save failed:", error);
      toast({
        title: "Save Failed",
        description: "An error occurred while saving.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <article>
          <h1 className="text-3xl font-bold">Operators</h1>
          <p className="text-muted-foreground">Manage aircraft operators</p>
        </article>
        <section className="flex gap-2">
          <Button variant="outline" onClick={fetchOperators} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            variant="gold"
            onClick={() => {
              setShowForm(true);
              setSelectedOperator(null);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Operator
          </Button>
        </section>
      </header>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <section className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by company name, contact, or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </section>
        </CardContent>
      </Card>

      {/* Main Content - Table and Detail/Form Panel */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operators Table */}
        <Card
          className={
            selectedOperator || showForm ? "lg:col-span-2" : "lg:col-span-3"
          }
        >
          <CardHeader>
            <CardTitle>Operator List</CardTitle>
            <CardDescription>
              {operators.length > 0
                ? `Showing ${operators.length} operators`
                : "No operators found"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <section className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <section key={i} className="h-16 bg-muted animate-pulse" />
                ))}
              </section>
            ) : operators.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {operators.map((operator) => (
                      <TableRow
                        key={operator.id}
                        className={`cursor-pointer hover:bg-accent ${selectedOperator?.id === operator.id ? "bg-accent" : ""}`}
                        onClick={() => {
                          setSelectedOperator(operator);
                          setShowForm(false);
                        }}
                      >
                        <TableCell>
                          <article>
                            <p className="font-medium">
                              {operator.companyName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {operator._count?.fleets || 0} aircraft
                            </p>
                          </article>
                        </TableCell>
                        <TableCell>
                          <article>
                            <p className="text-sm">{operator.contactName}</p>
                            <p className="text-xs text-muted-foreground">
                              {operator.email}
                            </p>
                          </article>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              operator.status === "ACTIVE"
                                ? "success"
                                : "secondary"
                            }
                          >
                            {operator.status}
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
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  No operators found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? "Try a different search term"
                    : "Add your first operator"}
                </p>
                {!searchQuery && (
                  <Button variant="gold" onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Operator
                  </Button>
                )}
              </section>
            )}
          </CardContent>
        </Card>

        {/* Detail Panel */}
        {selectedOperator && !showForm && (
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg">
                  {selectedOperator.companyName}
                </CardTitle>
                <CardDescription>
                  {selectedOperator._count?.fleets || 0} aircraft in fleet
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedOperator(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <article>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Contact Person
                </p>
                <p className="font-medium">{selectedOperator.contactName}</p>
              </article>

              <Separator />

              <article>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Email
                </p>
                <a
                  href={`mailto:${selectedOperator.email}`}
                  className="font-medium hover:underline flex items-center gap-1"
                >
                  <Mail className="h-3 w-3" />
                  {selectedOperator.email}
                </a>
              </article>

              <article>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Phone
                </p>
                <a
                  href={`tel:${selectedOperator.phone}`}
                  className="font-medium hover:underline flex items-center gap-1"
                >
                  <Phone className="h-3 w-3" />
                  {selectedOperator.phone}
                </a>
              </article>

              {selectedOperator.website && (
                <article>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Website
                  </p>
                  <a
                    href={selectedOperator.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:underline flex items-center gap-1"
                  >
                    <Globe className="h-3 w-3" />
                    {selectedOperator.website}
                  </a>
                </article>
              )}

              <Separator />

              {(selectedOperator.address ||
                selectedOperator.city ||
                selectedOperator.country) && (
                <article>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Location
                  </p>
                  <div className="flex items-start gap-1">
                    <MapPin className="h-3 w-3 mt-1" />
                    <div>
                      {selectedOperator.address && (
                        <p>{selectedOperator.address}</p>
                      )}
                      <p>
                        {[selectedOperator.city, selectedOperator.country]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </div>
                  </div>
                </article>
              )}

              <article>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Status
                </p>
                <Badge
                  variant={
                    selectedOperator.status === "ACTIVE"
                      ? "success"
                      : "secondary"
                  }
                  className="mt-1"
                >
                  {selectedOperator.status}
                </Badge>
              </article>

              <article>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Joined
                </p>
                <p className="font-medium">
                  {new Date(selectedOperator.createdAt).toLocaleDateString()}
                </p>
              </article>

              {/* Delete Button */}
              <section className="pt-4">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    setOperatorToDelete(selectedOperator.id);
                    setDeleteDialogOpen(true);
                  }}
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
                      Delete Operator
                    </>
                  )}
                </Button>
              </section>
            </CardContent>
          </Card>
        )}

        {/* Add Operator Form */}
        {showForm && (
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg">Add Operator</CardTitle>
                <CardDescription>Create new operator account</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowForm(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <fieldset className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    placeholder="ABC Aviation"
                    required
                  />
                </fieldset>

                <fieldset className="space-y-2">
                  <Label htmlFor="contactName">Contact Person *</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) =>
                      setFormData({ ...formData, contactName: e.target.value })
                    }
                    placeholder="John Doe"
                    required
                  />
                </fieldset>

                <fieldset className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="contact@operator.com"
                    required
                  />
                </fieldset>

                <fieldset className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="+234..."
                    required
                  />
                </fieldset>

                <fieldset className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder="Min 8 characters"
                      required
                      minLength={8}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </fieldset>

                <Separator />
                <p className="text-xs text-muted-foreground">
                  Optional Information
                </p>

                <fieldset className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) =>
                      setFormData({ ...formData, website: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </fieldset>

                <fieldset className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="123 Aviation Way"
                  />
                </fieldset>

                <section className="grid grid-cols-2 gap-2">
                  <fieldset className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      placeholder="Lagos"
                    />
                  </fieldset>
                  <fieldset className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) =>
                        setFormData({ ...formData, country: e.target.value })
                      }
                      placeholder="Nigeria"
                    />
                  </fieldset>
                </section>

                <Button
                  type="submit"
                  variant="gold"
                  className="w-full"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Create Operator
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Delete Operator Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Operator"
        description="Are you sure you want to delete this operator? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={() => {
          if (operatorToDelete) {
            handleDelete(operatorToDelete);
          }
          setDeleteDialogOpen(false);
          setOperatorToDelete(null);
        }}
      />
    </section>
  );
}
