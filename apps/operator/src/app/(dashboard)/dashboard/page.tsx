"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plane,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from "@pexjet/ui";

interface DashboardStats {
  fleetCount: number;
  activeEmptyLegs: number;
  pendingQuotes: number;
  totalEarnings: number;
  monthlyEarnings: number;
  recentBookings: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-gold-500" />
      </div>
    );
  }

  const statCards = [
    {
      title: "My Fleet",
      value: stats?.fleetCount || 0,
      description: "Aircraft in your fleet",
      icon: Plane,
      href: "/dashboard/fleet",
    },
    {
      title: "Active Empty Legs",
      value: stats?.activeEmptyLegs || 0,
      description: "Currently published deals",
      icon: Calendar,
      href: "/dashboard/empty-legs",
    },
    {
      title: "Pending Quotes",
      value: stats?.pendingQuotes || 0,
      description: "Awaiting your response",
      icon: Clock,
      href: "/dashboard/empty-legs?tab=quotes",
    },
    {
      title: "Monthly Earnings",
      value: `₦${(stats?.monthlyEarnings || 0).toLocaleString()}`,
      description: "This month's revenue",
      icon: DollarSign,
      href: "/dashboard/history",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here&apos;s an overview of your operations.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:border-gold-500/50 transition-colors cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-gold-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you can perform</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/dashboard/empty-legs/new">
              <Button className="w-full justify-between bg-gold-500 text-black hover:bg-gold-600">
                Create Empty Leg Deal
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/fleet">
              <Button variant="outline" className="w-full justify-between">
                Manage Fleet
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard/empty-legs?tab=quotes">
              <Button variant="outline" className="w-full justify-between">
                View Pending Quotes
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Latest booking requests</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.recentBookings && stats.recentBookings.length > 0 ? (
              <div className="space-y-3">
                {stats.recentBookings.slice(0, 5).map((booking: any) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {booking.referenceNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {booking.clientName}
                      </p>
                    </div>
                    <Badge
                      variant={
                        booking.status === "PENDING"
                          ? "outline"
                          : booking.status === "APPROVED"
                            ? "default"
                            : "destructive"
                      }
                    >
                      {booking.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No recent bookings</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Total Earnings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-gold-500" />
            Total Earnings
          </CardTitle>
          <CardDescription>Your lifetime earnings on PexJet</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-gold-500">
            ₦{(stats?.totalEarnings || 0).toLocaleString()}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Payments are automatically transferred to your registered bank
            account
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
