import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-black relative">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-black/95 to-gold-900/20" />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold-500 flex items-center justify-center">
                <span className="text-black font-bold text-xl">P</span>
              </div>
              <span className="text-white text-2xl font-bold">PexJet</span>
            </div>
            <p className="text-gold-500 text-sm mt-1">Operator Portal</p>
          </div>

          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Manage Your Fleet,
              <br />
              <span className="text-gold-500">Maximize Your Revenue</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-md">
              Create empty leg deals, manage bookings, and grow your aviation
              business with PexJet&apos;s operator platform.
            </p>
          </div>

          <div className="flex items-center gap-8 text-sm text-gray-500">
            <span>Fleet Management</span>
            <span className="w-1 h-1 bg-gold-500" />
            <span>Empty Leg Deals</span>
            <span className="w-1 h-1 bg-gold-500" />
            <span>Payment Tracking</span>
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
