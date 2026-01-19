import React from "react";
import { Shield, Armchair, Lock, Globe, Clock, Star } from "lucide-react";
import { charterPageData } from "../../data";

const iconMap = {
  Shield,
  Armchair,
  Lock,
  Globe,
  Clock,
  Star,
};

export function CharterBenefits() {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl lg:text-5xl mb-4">
            {charterPageData.charterBenefit.title}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience the ultimate in private aviation with unmatched service,
            safety, and luxury
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
          {charterPageData.charterBenefit.benefits.map((benefit, index) => {
            const IconComponent = iconMap[benefit.icon as keyof typeof iconMap];
            return (
              <div key={index} className="p-2">
                <div className="w-16 h-16 flex items-center justify-center mb-2">
                  <IconComponent className="w-8 h-8" />
                </div>
                <h3 className="text-2xl">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {benefit.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Experience Images */}
        <div className="grid md:grid-cols-2 gap-6 mt-16">
          <div className="overflow-hidden h-80 lg:h-96">
            <img
              src="https://images.unsplash.com/photo-1744974256547-cb87dd8aa126?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBqZXQlMjBpbnRlcmlvciUyMGNhYmlufGVufDF8fHx8MTc2MzU5MzE4MXww&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Luxury Jet Interior"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
          <div className="overflow-hidden h-80 lg:h-96">
            <img
              src="https://images.unsplash.com/photo-1724013258380-0fb6d0176348?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcml2YXRlJTIwYXZpYXRpb24lMjBzYWZldHl8ZW58MXx8fHwxNzYzNTkzMTgxfDA&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Private Aviation Experience"
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
