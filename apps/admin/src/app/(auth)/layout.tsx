import Image from "next/image";
import { Toaster } from "@pexjet/ui";

const features = [
  {
    title: 'Comprehensive Fleet Management',
    description: 'Control every aspect of your aircraft inventory'
  },
  {
    title: 'Real-time Booking Management',
    description: 'Track and manage all flight bookings instantly'
  },
  {
    title: 'Client Relationship Tools',
    description: 'Build lasting relationships with your clientele'
  }
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen flex">
      {/* Left side - Premium Branding */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden"
        style={{ backgroundColor: '#0C0C0C' }}
      >
        {/* Background Image with Blur and Overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('/jet.jpg')`,
            filter: 'blur(2px)',
          }}
        />
        <div 
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(12, 12, 12, 0.85) 0%, rgba(12, 12, 12, 0.7) 100%)'
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-20 text-white">
          <div className="max-w-xl">
            {/* Logo */}
            <figure className="mb-8">
              <Image
                src="/white-gold.png"
                alt="PexJet Logo"
                width={180}
                height={72}
                priority
              />
            </figure>

            {/* Headline */}
            <h1 className="text-white mb-6" style={{ fontSize: '3rem', lineHeight: '1.2' }}>
              Premium Aviation
              <br />
              Management System
            </h1>

            {/* Supporting Text */}
            <p className="text-slate-300 mb-12" style={{ fontSize: '1.125rem', lineHeight: '1.7' }}>
              Manage your luxury private jet charter platform with precision and efficiency.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex gap-4">
                  <div 
                    className="w-2 h-2 mt-2 shrink-0"
                    style={{ backgroundColor: '#D4AF37' }}
                  />
                  <div>
                    <h3 className="text-white mb-1" style={{ fontSize: '1.125rem' }}>
                      {feature.title}
                    </h3>
                    <p className="text-slate-400" style={{ fontSize: '0.9375rem' }}>
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Auth Form */}
      <section className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
        <article className="w-full max-w-md">{children}</article>
      </section>
      
      <Toaster />
    </main>
  );
}
