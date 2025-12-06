"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@pexjet/ui";
import {
  Plane,
  Users,
  FileText,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Calendar,
  BarChart3,
  Shield,
} from "lucide-react";

interface DashboardStats {
  totalQuotes: number;
  pendingQuotes: number;
  totalClients: number;
  totalRevenue: number;
  totalAircraft: number;
  activeEmptyLegs: number;
  recentQuotes: any[];
  recentPayments: any[];
  monthlyApprovals: { month: string; count: number }[];
  staffMembers?: {
    id: string;
    fullName: string;
    email: string;
    role: string;
    status: string;
    avatar: string | null;
  }[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Get user role from token
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserRole(payload.role);
      } catch {}
    }
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Quotes",
      value: stats?.totalQuotes || 0,
      description: `${stats?.pendingQuotes || 0} pending`,
      icon: FileText,
      trend: 12,
      trendUp: true,
    },
    {
      title: "Total Clients",
      value: stats?.totalClients || 0,
      description: "Registered clients",
      icon: Users,
      trend: 8,
      trendUp: true,
    },
    {
      title: "Revenue (NGN)",
      value: `₦${(stats?.totalRevenue || 0).toLocaleString()}`,
      description: "Total revenue",
      icon: CreditCard,
      trend: 15,
      trendUp: true,
    },
    {
      title: "Active Empty Legs",
      value: stats?.activeEmptyLegs || 0,
      description: "Available deals",
      icon: Calendar,
      trend: 5,
      trendUp: false,
    },
  ];

  if (loading) {
    return (
      <section className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back to PexJet Admin</p>
        </header>
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <section className="h-4 w-24 bg-muted animate-pulse" />
                <section className="h-8 w-8 bg-muted animate-pulse" />
              </CardHeader>
              <CardContent>
                <section className="h-8 w-20 bg-muted animate-pulse mb-2" />
                <section className="h-3 w-32 bg-muted animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </section>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back to PexJet Admin</p>
      </header>

      {/* Stats Grid */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
              <section className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">
                  {stat.description}
                </span>
                <Badge
                  variant={stat.trendUp ? "success" : "destructive"}
                  className="text-xs"
                >
                  {stat.trendUp ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {stat.trend}%
                </Badge>
              </section>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* Recent Activity */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Recent Quotes */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Quotes</CardTitle>
            <CardDescription>Latest charter quote requests</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentQuotes && stats.recentQuotes.length > 0 ? (
              <ul className="space-y-4">
                {stats.recentQuotes.map((quote: any, index: number) => (
                  <li
                    key={index}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <article className="space-y-1">
                      <p className="font-medium">{quote.referenceNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {quote.clientName}
                      </p>
                    </article>
                    <Badge
                      variant={
                        quote.status === "PENDING"
                          ? "warning"
                          : quote.status === "APPROVED"
                            ? "success"
                            : "secondary"
                      }
                    >
                      {quote.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <section className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent quotes</p>
              </section>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Payments</CardTitle>
            <CardDescription>Latest payment transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentPayments && stats.recentPayments.length > 0 ? (
              <ul className="space-y-4">
                {stats.recentPayments.map((payment: any, index: number) => (
                  <li
                    key={index}
                    className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                  >
                    <article className="space-y-1">
                      <p className="font-medium">
                        ₦{payment.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {payment.referenceNumber}
                      </p>
                    </article>
                    <Badge variant="success">{payment.status}</Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <section className="text-center py-8 text-muted-foreground">
                <CreditCard className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent payments</p>
              </section>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Monthly Approvals Chart + Quick Actions OR Staff List for STAFF role */}
      <section className="grid gap-6 lg:grid-cols-2">
        {userRole === "STAFF" ? (
          /* Staff Members List - for STAFF role */
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Team Members
              </CardTitle>
              <CardDescription>
                Staff members in your organization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.staffMembers && stats.staffMembers.length > 0 ? (
                <section className="space-y-3">
                  {stats.staffMembers.map((member) => (
                    <section
                      key={member.id}
                      className="flex items-center gap-3 p-2 hover:bg-accent"
                    >
                      <Avatar>
                        <AvatarImage src={member.avatar || undefined} />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {member.fullName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <article className="flex-1">
                        <p className="font-medium text-sm">{member.fullName}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.email}
                        </p>
                      </article>
                      <Badge
                        variant={
                          member.status === "ONLINE" ? "success" : "secondary"
                        }
                        className="text-xs"
                      >
                        {member.status}
                      </Badge>
                    </section>
                  ))}
                </section>
              ) : (
                <section className="flex items-center justify-center h-48 text-muted-foreground">
                  <p>No team members found</p>
                </section>
              )}
            </CardContent>
          </Card>
        ) : (
          /* Monthly Approved Flights Chart - for SUPER_ADMIN */
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Monthly Approved Flights
              </CardTitle>
              <CardDescription>
                Flight approvals over the last months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyApprovalsChart data={stats?.monthlyApprovals || []} />
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <section className="grid gap-3">
              <a
                href="/dashboard/quotes"
                className="flex items-center gap-3 p-3 border hover:bg-accent transition-colors"
              >
                <FileText className="h-6 w-6 text-primary" />
                <article>
                  <p className="font-medium text-sm">View Quotes</p>
                  <p className="text-xs text-muted-foreground">
                    Manage charter requests
                  </p>
                </article>
              </a>
              <a
                href="/dashboard/aircraft"
                className="flex items-center gap-3 p-3 border hover:bg-accent transition-colors"
              >
                <Plane className="h-6 w-6 text-primary" />
                <article>
                  <p className="font-medium text-sm">Add Aircraft</p>
                  <p className="text-xs text-muted-foreground">
                    Register new aircraft
                  </p>
                </article>
              </a>
              <a
                href="/dashboard/empty-legs"
                className="flex items-center gap-3 p-3 border hover:bg-accent transition-colors"
              >
                <Calendar className="h-6 w-6 text-primary" />
                <article>
                  <p className="font-medium text-sm">Empty Legs</p>
                  <p className="text-xs text-muted-foreground">
                    Manage available deals
                  </p>
                </article>
              </a>
              <a
                href="/dashboard/clients"
                className="flex items-center gap-3 p-3 border hover:bg-accent transition-colors"
              >
                <Users className="h-6 w-6 text-primary" />
                <article>
                  <p className="font-medium text-sm">Clients</p>
                  <p className="text-xs text-muted-foreground">
                    View client database
                  </p>
                </article>
              </a>
            </section>
          </CardContent>
        </Card>
      </section>
    </section>
  );
}

// Monthly Approvals Bar Chart Component
function MonthlyApprovalsChart({
  data,
}: {
  data: { month: string; count: number }[];
}) {
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };
    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Show 6 months on small screens, 12 on large
  const monthsToShow = isLargeScreen ? 12 : 6;
  const chartData = data.slice(-monthsToShow);

  // Calculate max for scaling
  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  if (chartData.length === 0) {
    return (
      <section className="flex items-center justify-center h-48 text-muted-foreground">
        <p>No approval data available</p>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      {/* Bar Chart */}
      <section className="flex items-end gap-1 sm:gap-2 h-48">
        {chartData.map((item, index) => {
          const height = (item.count / maxCount) * 100;
          return (
            <section
              key={index}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <span className="text-xs font-medium">{item.count}</span>
              <section
                className="w-full bg-primary transition-all duration-300 hover:bg-primary/80"
                style={{ height: `${Math.max(height, 4)}%` }}
                title={`${item.month}: ${item.count} approvals`}
              />
              <span className="text-xs text-muted-foreground truncate w-full text-center">
                {item.month.substring(0, 3)}
              </span>
            </section>
          );
        })}
      </section>

      {/* Legend */}
      <section className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <section className="h-3 w-3 bg-primary" />
        <span>Approved Flights</span>
      </section>
    </section>
  );
}
