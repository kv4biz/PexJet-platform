"use client";

import { useState } from "react";
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
  useToast,
} from "@pexjet/ui";
import { Loader2, ArrowLeft, CheckCircle, Eye, EyeOff } from "lucide-react";

export default function ForgotPasswordPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"email" | "otp" | "reset" | "success">("email");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send OTP");
      }

      toast({
        title: "OTP Sent",
        description: "A verification code has been sent to your WhatsApp.",
      });
      setStep("otp");
    } catch (err: any) {
      toast({
        title: "Failed to send OTP",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, otp: formData.otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid OTP");
      }

      toast({
        title: "OTP Verified",
        description: "You can now set your new password.",
      });
      setStep("reset");
    } catch (err: any) {
      toast({
        title: "Verification failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          otp: formData.otp,
          newPassword: formData.newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      toast({
        title: "Password Reset Successful",
        description: "You can now login with your new password.",
      });
      setStep("success");
    } catch (err: any) {
      toast({
        title: "Reset failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (step === "success") {
    return (
      <Card>
        <CardContent className="pt-6">
          <section className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h2 className="text-xl font-semibold">Password Reset Successful</h2>
            <p className="text-muted-foreground">
              Your password has been reset successfully. You can now login with
              your new password.
            </p>
            <Button variant="gold" asChild className="w-full">
              <Link href="/login">Back to Login</Link>
            </Button>
          </section>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">
          {step === "email" && "Forgot Password"}
          {step === "otp" && "Verify OTP"}
          {step === "reset" && "Reset Password"}
        </CardTitle>
        <CardDescription>
          {step === "email" &&
            "Enter your email to receive a verification code via WhatsApp"}
          {step === "otp" && "Enter the OTP sent to your WhatsApp"}
          {step === "reset" && "Enter your new password"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === "email" && (
          <form onSubmit={handleRequestOTP} className="space-y-4">
            <fieldset className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@pexjet.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
                disabled={isLoading}
              />
            </fieldset>

            <Button
              type="submit"
              variant="gold"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                "Send OTP"
              )}
            </Button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <fieldset className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit OTP"
                value={formData.otp}
                onChange={(e) =>
                  setFormData({ ...formData, otp: e.target.value })
                }
                maxLength={6}
                required
                disabled={isLoading}
              />
            </fieldset>

            <Button
              type="submit"
              variant="gold"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify OTP"
              )}
            </Button>
          </form>
        )}

        {step === "reset" && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <fieldset className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <section className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Enter new password"
                  value={formData.newPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, newPassword: e.target.value })
                  }
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowNewPassword((v) => !v)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </section>
            </fieldset>

            <fieldset className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <section className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm new password"
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  required
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </section>
            </fieldset>

            <Button
              type="submit"
              variant="gold"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </Button>
          </form>
        )}

        <section className="mt-4 text-center">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-primary inline-flex items-center"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Link>
        </section>
      </CardContent>
    </Card>
  );
}
