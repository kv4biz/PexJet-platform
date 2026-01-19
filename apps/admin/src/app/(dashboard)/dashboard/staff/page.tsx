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
  Avatar,
  AvatarFallback,
  AvatarImage,
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
  Shield,
  RefreshCw,
  Mail,
  Phone,
  X,
  Loader2,
  Save,
  Eye,
  EyeOff,
  Pencil,
  MapPin,
} from "lucide-react";

interface Admin {
  id: string;
  email: string;
  username: string;
  fullName: string;
  phone: string;
  role: string;
  status: string;
  avatar: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

const getEmptyForm = () => ({
  email: "",
  username: "",
  fullName: "",
  phone: "",
  role: "STAFF",
  password: "",
  address: "",
});

export default function StaffPage() {
  const { toast } = useToast();
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(getEmptyForm());
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchAdmins();
  }, [page, searchQuery]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/admins?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAdmins(data.admins);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch admins:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      setDeleting(true);
      const response = await fetch(`/api/admins/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        toast({
          title: "Staff Deleted",
          description: "The staff member has been removed.",
        });
        setSelectedAdmin(null);
        fetchAdmins();
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
      const url =
        isEditing && selectedAdmin
          ? `/api/admins/${selectedAdmin.id}`
          : "/api/admins";
      const method = isEditing ? "PUT" : "POST";

      // For updates, only send password if it's not empty
      const payload = isEditing
        ? { ...formData, ...(formData.password ? {} : { password: undefined }) }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast({
          title: isEditing ? "Staff Updated" : "Staff Added",
          description: isEditing
            ? "Changes saved successfully."
            : "The new staff member has been created.",
        });
        setShowForm(false);
        setIsEditing(false);
        setFormData(getEmptyForm());
        setSelectedAdmin(null);
        fetchAdmins();
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
          <h1 className="text-3xl font-bold">Staff Management</h1>
          <p className="text-muted-foreground">Manage admin users and staff</p>
        </article>
        <section className="flex gap-2">
          <Button variant="outline" onClick={fetchAdmins} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            variant="gold"
            onClick={() => {
              setShowForm(true);
              setSelectedAdmin(null);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Staff
          </Button>
        </section>
      </header>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <section className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or username..."
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
        {/* Staff Table */}
        <Card
          className={
            selectedAdmin || showForm ? "lg:col-span-2" : "lg:col-span-3"
          }
        >
          <CardHeader>
            <CardTitle>Admin Users</CardTitle>
            <CardDescription>
              {admins.length > 0
                ? `Showing ${admins.length} staff members`
                : "No staff found"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <section className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <section key={i} className="h-16 bg-muted animate-pulse" />
                ))}
              </section>
            ) : admins.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {admins.map((admin) => (
                      <TableRow
                        key={admin.id}
                        className={`cursor-pointer hover:bg-accent ${selectedAdmin?.id === admin.id ? "bg-accent" : ""}`}
                        onClick={() => {
                          setSelectedAdmin(admin);
                          setShowForm(false);
                        }}
                      >
                        <TableCell>
                          <section className="flex items-center gap-3">
                            <Avatar>
                              <AvatarImage src={admin.avatar || undefined} />
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {admin.fullName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <article>
                              <p className="font-medium">{admin.fullName}</p>
                              <p className="text-sm text-muted-foreground">
                                @{admin.username}
                              </p>
                            </article>
                          </section>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              admin.role === "SUPER_ADMIN"
                                ? "gold"
                                : "secondary"
                            }
                          >
                            {admin.role.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              admin.status === "ONLINE"
                                ? "success"
                                : "secondary"
                            }
                          >
                            {admin.status}
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
                <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No staff found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? "Try a different search term"
                    : "Add your first staff member"}
                </p>
                {!searchQuery && (
                  <Button variant="gold" onClick={() => setShowForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Staff
                  </Button>
                )}
              </section>
            )}
          </CardContent>
        </Card>

        {/* Detail Panel */}
        {selectedAdmin && !showForm && !isEditing && (
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg">
                  {selectedAdmin.fullName}
                </CardTitle>
                <CardDescription>@{selectedAdmin.username}</CardDescription>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    setFormData({
                      email: selectedAdmin.email,
                      username: selectedAdmin.username,
                      fullName: selectedAdmin.fullName,
                      phone: selectedAdmin.phone,
                      role: selectedAdmin.role,
                      password: "",
                      address: selectedAdmin.address || "",
                    });
                    setIsEditing(true);
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedAdmin(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <section className="flex justify-center">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={selectedAdmin.avatar || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {selectedAdmin.fullName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
              </section>

              <Separator />

              <article>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Email
                </p>
                <a
                  href={`mailto:${selectedAdmin.email}`}
                  className="font-medium hover:underline flex items-center gap-1"
                >
                  <Mail className="h-3 w-3" />
                  {selectedAdmin.email}
                </a>
              </article>

              <article>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Phone
                </p>
                <a
                  href={`tel:${selectedAdmin.phone}`}
                  className="font-medium hover:underline flex items-center gap-1"
                >
                  <Phone className="h-3 w-3" />
                  {selectedAdmin.phone}
                </a>
              </article>

              <Separator />

              <article className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Role
                  </p>
                  <Badge
                    variant={
                      selectedAdmin.role === "SUPER_ADMIN"
                        ? "gold"
                        : "secondary"
                    }
                    className="mt-1"
                  >
                    {selectedAdmin.role.replace("_", " ")}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Status
                  </p>
                  <Badge
                    variant={
                      selectedAdmin.status === "ONLINE"
                        ? "success"
                        : "secondary"
                    }
                    className="mt-1"
                  >
                    {selectedAdmin.status}
                  </Badge>
                </div>
              </article>

              <Separator />

              <article>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Joined
                </p>
                <p className="font-medium">
                  {new Date(selectedAdmin.createdAt).toLocaleDateString()}
                </p>
              </article>

              {selectedAdmin.address && (
                <article>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">
                    Address
                  </p>
                  <p className="font-medium flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {selectedAdmin.address}
                  </p>
                </article>
              )}

              {/* Delete Button */}
              <section className="pt-4">
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    setAdminToDelete(selectedAdmin.id);
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
                      Delete Staff
                    </>
                  )}
                </Button>
              </section>
            </CardContent>
          </Card>
        )}

        {/* Edit Staff Panel */}
        {selectedAdmin && isEditing && (
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg">Edit Staff</CardTitle>
                <CardDescription>{selectedAdmin.fullName}</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsEditing(false);
                  setFormData(getEmptyForm());
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-4">
                <fieldset className="space-y-2">
                  <Label htmlFor="edit-fullName">Full Name *</Label>
                  <Input
                    id="edit-fullName"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    required
                  />
                </fieldset>

                <fieldset className="space-y-2">
                  <Label htmlFor="edit-phone">Phone (WhatsApp) *</Label>
                  <Input
                    id="edit-phone"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    required
                  />
                </fieldset>

                <fieldset className="space-y-2">
                  <Label htmlFor="edit-address">Address</Label>
                  <Input
                    id="edit-address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Optional"
                  />
                </fieldset>

                <fieldset className="space-y-2">
                  <Label htmlFor="edit-role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STAFF">Staff</SelectItem>
                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </fieldset>

                <fieldset className="space-y-2">
                  <Label htmlFor="edit-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="edit-password"
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      placeholder="Leave blank to keep current"
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
                  <p className="text-xs text-muted-foreground">
                    Min 8 characters if changing
                  </p>
                </fieldset>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(getEmptyForm());
                    }}
                  >
                    Cancel
                  </Button>
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
                        Update
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Add Staff Form */}
        {showForm && !isEditing && (
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <div>
                <CardTitle className="text-lg">Add Staff</CardTitle>
                <CardDescription>Create new admin user</CardDescription>
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
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    placeholder="John Doe"
                    required
                  />
                </fieldset>

                <fieldset className="space-y-2">
                  <Label htmlFor="username">Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) =>
                      setFormData({ ...formData, username: e.target.value })
                    }
                    placeholder="johndoe"
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
                    placeholder="john@example.com"
                    required
                  />
                </fieldset>

                <fieldset className="space-y-2">
                  <Label htmlFor="phone">Phone (WhatsApp) *</Label>
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
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Optional"
                  />
                </fieldset>

                <fieldset className="space-y-2">
                  <Label htmlFor="role">Role *</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) =>
                      setFormData({ ...formData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="STAFF">Staff</SelectItem>
                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
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
                      Create Staff
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </section>

      {/* Delete Staff Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Staff Member"
        description="Are you sure you want to delete this staff member? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={() => {
          if (adminToDelete) {
            handleDelete(adminToDelete);
          }
          setDeleteDialogOpen(false);
          setAdminToDelete(null);
        }}
      />
    </section>
  );
}
