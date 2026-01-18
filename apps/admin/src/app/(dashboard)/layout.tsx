"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Plane,
  MapPin,
  Users,
  FileText,
  Calendar,
  CreditCard,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Moon,
  Sun,
  ChevronDown,
  Shield,
  Activity,
  Building2,
  User,
  MessageSquare,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  ScrollArea,
  Separator,
  Badge,
} from "@pexjet/ui";
import { cn, useToast } from "@pexjet/ui";
import { useAdminPersonalNotifications } from "@/hooks/usePusher";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
}

// Full nav items for SUPER_ADMIN
const allNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Airports", href: "/dashboard/airports", icon: MapPin },
  { title: "Aircraft", href: "/dashboard/aircraft", icon: Plane },
  { title: "Clients", href: "/dashboard/clients", icon: Users },
  { title: "Charter Quotes", href: "/dashboard/quotes", icon: FileText },
  { title: "Empty Legs", href: "/dashboard/empty-legs", icon: Calendar },
  { title: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { title: "Operators", href: "/dashboard/operators", icon: Building2 },
  { title: "Staff", href: "/dashboard/staff", icon: Shield },
  { title: "Activity Logs", href: "/dashboard/logs", icon: Activity },
  { title: "Profile", href: "/dashboard/profile", icon: User },
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];

// Limited nav items for STAFF role (no Activity Logs)
const staffNavItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Airports", href: "/dashboard/airports", icon: MapPin },
  { title: "Aircraft", href: "/dashboard/aircraft", icon: Plane },
  { title: "Clients", href: "/dashboard/clients", icon: Users },
  { title: "Charter Quotes", href: "/dashboard/quotes", icon: FileText },
  { title: "Empty Legs", href: "/dashboard/empty-legs", icon: Calendar },
  { title: "Payments", href: "/dashboard/payments", icon: CreditCard },
  { title: "Profile", href: "/dashboard/profile", icon: User },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [unseenCount, setUnseenCount] = useState(0);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const { toast } = useToast();

  // Check if user is super admin
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  // Listen for client messages directed to this specific admin
  const handleClientMessage = useCallback(
    (data: {
      bookingId: string;
      bookingType: string;
      referenceNumber: string;
      clientName: string;
      message: string;
      timestamp: string;
    }) => {
      toast({
        title: (
          <span className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            New message from {data.clientName}
          </span>
        ) as any,
        description: (
          <span>
            {data.referenceNumber}: "{data.message}"
          </span>
        ) as any,
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const path =
                data.bookingType === "charter"
                  ? `/dashboard/quotes/${data.bookingId}`
                  : `/dashboard/quotes/empty-leg/${data.bookingId}`;
              router.push(path);
            }}
          >
            View
          </Button>
        ) as any,
      });
    },
    [toast, router],
  );

  useAdminPersonalNotifications(user?.id || null, handleClientMessage);

  // Fetch unseen notification count
  const fetchUnseenCount = async () => {
    try {
      const response = await fetch("/api/notifications?countOnly=true", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUnseenCount(data.unseenCount);
      }
    } catch (error) {
      console.error("Failed to fetch unseen count:", error);
    }
  };

  // Fetch notifications
  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const response = await fetch("/api/notifications?limit=20", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.logs);
        setUnseenCount(data.unseenCount);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Mark all as seen
  const markAllAsSeen = async () => {
    try {
      const response = await fetch("/api/notifications/mark-seen", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        },
      });
      if (response.ok) {
        setUnseenCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, isSeen: true })));
      }
    } catch (error) {
      console.error("Failed to mark as seen:", error);
    }
  };

  // Helper to check if token is valid and not expired
  const isTokenValid = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const isExpired = payload.exp * 1000 < Date.now();
      return !isExpired;
    } catch {
      return false;
    }
  };

  // Clear tokens and redirect to login
  const redirectToLogin = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/login");
  };

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("accessToken");
    if (!token) {
      redirectToLogin();
      return;
    }

    // Check if token is expired or invalid
    if (!isTokenValid(token)) {
      redirectToLogin();
      return;
    }

    // Decode token to get user info
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser(payload);

      // Only fetch notifications for SUPER_ADMIN
      if (payload.role === "SUPER_ADMIN") {
        // Fetch initial unseen count
        fetchUnseenCount();

        // Poll for new notifications every 30 seconds
        // Also check token validity on each poll
        const interval = setInterval(() => {
          const currentToken = localStorage.getItem("accessToken");
          if (!currentToken || !isTokenValid(currentToken)) {
            redirectToLogin();
            return;
          }
          fetchUnseenCount();
        }, 30000);

        return () => clearInterval(interval);
      }
    } catch {
      redirectToLogin();
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    router.push("/login");
  };

  if (!user) {
    return (
      <main className="flex h-screen items-center justify-center">
        <section className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
      </main>
    );
  }

  return (
    <main className="flex h-screen overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <section
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:inset-auto",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <section className="flex h-full flex-col">
          {/* Logo - Hidden on mobile sidebar */}
          <header className="flex h-16 items-center justify-between px-4 border-b">
            <Link
              href="/dashboard"
              className="hidden lg:flex items-center gap-2"
            >
              <Image
                src="/white-gold.png"
                alt="PexJet"
                width={120}
                height={40}
                className="dark:block hidden"
              />
              <Image
                src="/black-gold.png"
                alt="PexJet"
                width={120}
                height={40}
                className="dark:hidden block"
              />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </header>

          {/* Navigation */}
          <ScrollArea className="flex-1 py-4">
            <nav className="space-y-1 px-2">
              {(user?.role === "SUPER_ADMIN" ? allNavItems : staffNavItems).map(
                (item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto bg-destructive text-destructive-foreground text-xs px-2 py-0.5">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                },
              )}
            </nav>
          </ScrollArea>

          {/* User section */}
          <footer className="border-t p-4">
            <section className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <article className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.email}</p>
                <p className="text-xs text-muted-foreground">{user.role}</p>
              </article>
            </section>
          </footer>
        </section>
      </aside>

      {/* Main content */}
      <section className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="h-16 border-b bg-card flex items-center justify-between px-4">
          <section className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold hidden sm:block">
              Admin Dashboard
            </h1>
          </section>

          <section className="flex items-center gap-2">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* Notifications - Only show for SUPER_ADMIN */}
            {user.role === "SUPER_ADMIN" && (
              <DropdownMenu
                open={notificationsOpen}
                onOpenChange={(open) => {
                  setNotificationsOpen(open);
                  if (open) fetchNotifications();
                }}
              >
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unseenCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-destructive text-destructive-foreground text-xs flex items-center justify-center">
                        {unseenCount > 99 ? "99+" : unseenCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Notifications</span>
                    {unseenCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto py-1 px-2 text-xs"
                        onClick={(e) => {
                          e.preventDefault();
                          markAllAsSeen();
                        }}
                      >
                        Mark all as read
                      </Button>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <ScrollArea className="h-[300px]">
                    {loadingNotifications ? (
                      <div className="p-4 text-center text-muted-foreground">
                        Loading...
                      </div>
                    ) : notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            "p-3 border-b last:border-0 hover:bg-accent cursor-pointer",
                            !notification.isSeen && "bg-accent/50",
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={notification.admin?.avatar} />
                              <AvatarFallback className="text-xs">
                                {notification.admin?.fullName?.charAt(0) || "S"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {notification.action.replace(/_/g, " ")}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {notification.description}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(
                                  notification.createdAt,
                                ).toLocaleString()}
                              </p>
                            </div>
                            {!notification.isSeen && (
                              <div className="h-2 w-2 bg-primary shrink-0 mt-2" />
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        No notifications
                      </div>
                    )}
                  </ScrollArea>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="justify-center">
                    <Link href="/dashboard/logs">View all activity</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      {user.email?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <p className="font-medium">{user.email}</p>
                  <p className="text-xs text-muted-foreground">{user.role}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/profile">
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </section>
        </header>

        {/* Page content */}
        <ScrollArea className="flex-1">
          <article className="p-6">{children}</article>
        </ScrollArea>
      </section>
    </main>
  );
}
