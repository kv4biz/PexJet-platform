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
} from "@pexjet/ui";
import {
  Search,
  Activity,
  RefreshCw,
  Filter,
  CheckCheck,
  X,
  Clock,
  User,
  Globe,
  FileText,
} from "lucide-react";

interface ActivityLog {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  description: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: any;
  createdAt: string;
  isSeen?: boolean;
  admin: {
    id: string;
    fullName: string;
    email: string;
    avatar: string | null;
  } | null;
}

export default function LogsPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [page, searchQuery, actionFilter]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
        ...(searchQuery && { search: searchQuery }),
        ...(actionFilter !== "all" && { action: actionFilter }),
      });

      const response = await fetch(`/api/logs?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data.logs);
        setTotalPages(data.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAllRead(true);
      const response = await fetch("/api/notifications/mark-seen", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });

      if (response.ok) {
        setLogs((prev) => prev.map((log) => ({ ...log, isSeen: true })));
        toast({
          title: "Marked as read",
          description: "All activity logs have been marked as read.",
        });
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark logs as read.",
        variant: "destructive",
      });
    } finally {
      setMarkingAllRead(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes("CREATE") || action.includes("LOGIN")) return "success";
    if (action.includes("UPDATE")) return "warning";
    if (action.includes("DELETE") || action.includes("REJECT"))
      return "destructive";
    return "secondary";
  };

  return (
    <section className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <article>
          <h1 className="text-3xl font-bold">Activity Logs</h1>
          <p className="text-muted-foreground">
            View system activity and audit trail
          </p>
        </article>
        <section className="flex gap-2">
          <Button
            variant="outline"
            onClick={markAllAsRead}
            disabled={markingAllRead}
          >
            <CheckCheck
              className={`h-4 w-4 mr-2 ${markingAllRead ? "animate-pulse" : ""}`}
            />
            Mark All as Read
          </Button>
          <Button variant="outline" onClick={fetchLogs} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </section>
      </header>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <section className="flex flex-col sm:flex-row gap-4">
            <section className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by description, entity, or admin..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </section>
            <Select
              value={actionFilter}
              onValueChange={(value) => {
                setActionFilter(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="LOGIN">Login</SelectItem>
                <SelectItem value="LOGOUT">Logout</SelectItem>
                <SelectItem value="CREATE">Create</SelectItem>
                <SelectItem value="UPDATE">Update</SelectItem>
                <SelectItem value="DELETE">Delete</SelectItem>
                <SelectItem value="APPROVE">Approve</SelectItem>
                <SelectItem value="REJECT">Reject</SelectItem>
              </SelectContent>
            </Select>
          </section>
        </CardContent>
      </Card>

      {/* Main Content - Table and Detail Panel */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Logs Table */}
        <Card className={selectedLog ? "lg:col-span-2" : "lg:col-span-3"}>
          <CardHeader>
            <CardTitle>Activity History</CardTitle>
            <CardDescription>
              {logs.length > 0
                ? `Showing ${logs.length} log entries`
                : "No logs found"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <section className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <section key={i} className="h-12 bg-muted animate-pulse" />
                ))}
              </section>
            ) : logs.length > 0 ? (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Timestamp</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Admin</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {logs.map((log) => (
                      <TableRow
                        key={log.id}
                        className={`cursor-pointer hover:bg-accent ${selectedLog?.id === log.id ? "bg-accent" : ""} ${!log.isSeen ? "bg-accent/30" : ""}`}
                        onClick={() => setSelectedLog(log)}
                      >
                        <TableCell className="text-muted-foreground whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={getActionColor(log.action) as any}>
                            {log.action.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate">
                          {log.description}
                        </TableCell>
                        <TableCell>
                          {log.admin ? log.admin.fullName : "System"}
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
                <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No logs found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || actionFilter !== "all"
                    ? "Try different filters"
                    : "Activity logs will appear here"}
                </p>
              </section>
            )}
          </CardContent>
        </Card>

        {/* Log Detail Panel */}
        {selectedLog && (
          <Card className="lg:col-span-1">
            <CardHeader className="flex flex-row items-start justify-between space-y-0">
              <div>
                <CardTitle className="text-lg">Log Details</CardTitle>
                <CardDescription>Activity information</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedLog(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Action */}
              <article>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Action
                </p>
                <Badge
                  variant={getActionColor(selectedLog.action) as any}
                  className="mt-1"
                >
                  {selectedLog.action.replace(/_/g, " ")}
                </Badge>
              </article>

              <Separator />

              {/* Description */}
              <article>
                <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  Description
                </p>
                <p className="font-medium mt-1">{selectedLog.description}</p>
              </article>

              <Separator />

              {/* Timestamp */}
              <article>
                <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Timestamp
                </p>
                <p className="font-medium mt-1">
                  {new Date(selectedLog.createdAt).toLocaleString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </p>
              </article>

              <Separator />

              {/* Admin */}
              <article>
                <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <User className="h-3 w-3" />
                  Performed By
                </p>
                {selectedLog.admin ? (
                  <div className="mt-1">
                    <p className="font-medium">{selectedLog.admin.fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedLog.admin.email}
                    </p>
                  </div>
                ) : (
                  <p className="font-medium mt-1">System</p>
                )}
              </article>

              <Separator />

              {/* Target */}
              <article>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Target Entity
                </p>
                <p className="font-medium mt-1">
                  {selectedLog.targetType || "System"}
                </p>
                {selectedLog.targetId && (
                  <p className="text-xs text-muted-foreground font-mono">
                    {selectedLog.targetId}
                  </p>
                )}
              </article>

              <Separator />

              {/* IP Address */}
              <article>
                <p className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  IP Address
                </p>
                <p className="font-mono text-sm mt-1">
                  {selectedLog.ipAddress || "Unknown"}
                </p>
              </article>

              {/* Metadata */}
              {selectedLog.metadata &&
                Object.keys(selectedLog.metadata).length > 0 && (
                  <>
                    <Separator />
                    <article>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">
                        Additional Data
                      </p>
                      <pre className="text-xs bg-muted p-2 mt-1 overflow-auto max-h-32">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </article>
                  </>
                )}
            </CardContent>
          </Card>
        )}
      </section>
    </section>
  );
}
