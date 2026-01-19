"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  useToast,
} from "@pexjet/ui";

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Login failed");
      }

      // Store tokens
      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);
      localStorage.setItem("operator", JSON.stringify(data.operator));

      toast({
        title: "Welcome back!",
        description: `Logged in as ${data.operator.fullName}`,
      });

      router.push("/dashboard");
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-none lg:border lg:shadow-sm">
      <CardHeader className="space-y-1">
        <div className="lg:hidden flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-gold-500 flex items-center justify-center">
            <span className="text-black font-bold">P</span>
          </div>
          <span className="font-bold text-xl">PexJet Operator</span>
        </div>
        <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
        <CardDescription>
          Enter your credentials to access your operator dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="identifier">Email or Username</Label>
            <Input
              id="identifier"
              type="text"
              placeholder="Enter your email or username"
              value={formData.identifier}
              onChange={(e) =>
                setFormData({ ...formData, identifier: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Link
              href="/forgot-password"
              className="text-sm text-gold-500 hover:text-gold-600"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full bg-gold-500 text-black hover:bg-gold-600"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Don&apos;t have an account?{" "}
            <span className="text-foreground">
              Contact PexJet to become an operator
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
