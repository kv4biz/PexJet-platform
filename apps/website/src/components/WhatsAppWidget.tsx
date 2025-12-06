"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button, Card, CardContent, CardHeader } from "@pexjet/ui";
import { whatsappData } from "@/data";

export default function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false);

  const handleWhatsAppClick = () => {
    const encodedMessage = encodeURIComponent(whatsappData.defaultMessage);
    const whatsappUrl = `https://wa.me/${whatsappData.phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {/* Main Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-12 w-12 flex justify-center rounded-full text-white items-center bg-green-500 hover:bg-[#D4AF37] shadow-lg transition-all duration-300"
      >
        {isOpen ? (
          <X className="h-7 w-7" />
        ) : (
          <MessageCircle className="h-7 w-7" />
        )}
      </button>

      {/* Chat Card */}
      {isOpen && (
        <Card className="absolute bottom-16 left-0 w-80 shadow-xl border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-green-100 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-black">{whatsappData.title}</h3>
                <p className="text-sm text-gray-500">{whatsappData.subtitle}</p>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              {whatsappData.description}
            </p>

            <Button
              onClick={handleWhatsAppClick}
              className="w-full bg-green-500 hover:bg-[#D4AF37] text-white"
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              {whatsappData.buttonText}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
