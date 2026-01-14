// ============================================================================
// PEXJET WEBSITE - CENTRALIZED DATA FILE
// All website content is managed here for easy updates
// ============================================================================

// ============================================================================
// NAVBAR DATA
// ============================================================================
export const navbarData = {
  logoWhite: "/white-gold.png",
  logoBlack: "/black-gold.png",

  navItems: [
    {
      label: "Home",
      href: "/",
    },
    {
      label: "Charter",
      href: "/charter",
    },
    {
      label: "Empty Legs",
      href: "/empty-legs",
    },
    {
      label: "Aircraft Management",
      href: "/aircraft-management",
    },
    {
      label: "About",
      dropdown: [
        { label: "Our Company", href: "/about/our-company" },
        {
          label: "Asset Acquisition & Financing",
          href: "/about/asset-acquisition-and-financing",
        },
      ],
    },
    {
      label: "Services",
      href: "/services",
    },
    {
      label: "Contact",
      href: "/contact",
    },
  ],

  currencySwitcher: {
    default: "USD",
    items: [
      { code: "USD", symbol: "$" },
      { code: "NGN", symbol: "₦" },
    ],
  },

  ctaButton: {
    text: "Get a Quote",
    href: "/quote",
  },
};

// ============================================================================
// FOOTER DATA
// ============================================================================
export const footerData = {
  logo: "/white.png",
  description:
    "Simple, reliable private jet services for your comfort and convenience.",

  contactInfo: {
    address: {
      line1:
        "H8GG+Q7X, Dominion Hangar Murtala Mohammed International Airport,",
      line2: "Lagos, Nigeria",
    },
    phone: "+234 818 211 3089, +234 911 110 1123",
    email: "charter@pexjet.com",
  },

  links: {
    Company: [
      { label: "About Us", href: "/about/our-company" },
      { label: "Aircraft Management", href: "/aircraft-management" },
      {
        label: "Acquisition & Financing",
        href: "/about/asset-acquisition-and-financing",
      },
    ],
    Resources: [
      { label: "Charter Flights", href: "/charter" },
      { label: "Book Empty Legs", href: "/empty-legs" },
      { label: "Our Services", href: "/services" },
      { label: "Contact Us", href: "/contact" },
    ],
  },

  socialMedia: [
    { platform: "Facebook", href: "#" },
    { platform: "Twitter", href: "#" },
    { platform: "Instagram", href: "#" },
    { platform: "LinkedIn", href: "#" },
  ],

  copyright: "© 2025 PERSPECTIVE EXECUTIVE JETS LIMITED. All rights reserved.",
};

// ============================================================================
// HOME PAGE DATA
// ============================================================================
export const homePageData = {
  hero: {
    imageURL:
      "https://res.cloudinary.com/dikzx4eyh/image/upload/v1764999560/pixverse-i2i-ori-64796108-2ae1-4d13-85b0-d91c984eea00_tbj9ss.jpg",
    title: {
      line1: "Perspective Executive Jets",
      line2: "Private aviation made simple.",
    },
  },
  emptyLegDeals: {
    title: "Empty Leg Deals",
    subtitle:
      "Take advantage of our discounted one-way flights and save up to 50% on private jet travel.",
  },
  fleetPreview: {
    title: "Aircraft Management",
    image:
      "https://images.unsplash.com/photo-1636189395447-0b8c1390b869?w=1920&q=80",
    description:
      "Professional aircraft management services. We handle operations, maintenance, crew, and compliance—so you can focus on flying.",
    buttonText: "Learn More",
    buttonLink: "/aircraft-management",
  },

  partnerLogos: {
    title: "members of",
    logos: [
      {
        name: "NBAA",
        image:
          "https://res.cloudinary.com/dikzx4eyh/image/upload/v1767715840/nbaa_cdvkq2.jpg",
      },
      {
        name: "Wyvern",
        image:
          "http://api.wyvern.systems/api/company/status/verify/ea25adfde8cd18f34ea8ae08afd8/12060/d6680f44e3bac/1/1431351db88618",
      },
    ],
  },

  membership: {
    logo: "/white-gold.png",
    image:
      "https://res.cloudinary.com/dikzx4eyh/image/upload/v1765961087/PEXJETPHOTP_cvom2s.jpg",
    badge: "EXCLUSIVE",
    description:
      "Get priority booking, better rates, and a more personal flying experience.",
  },

  testimonials: {
    title: "What Our Clients Say",
    subtitle:
      "Trusted by executives, entrepreneurs, and discerning travelers across Africa.",
    items: [
      {
        quote:
          "PexJet transformed our business travel. The convenience and luxury are unmatched.",
        author: "Adebayo Johnson",
        role: "CEO, TechCorp Nigeria",
        avatar:
          "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100",
      },
      {
        quote:
          "Exceptional service from booking to landing. They handle everything perfectly.",
        author: "Chioma Okafor",
        role: "Managing Director, Okafor Holdings",
        avatar:
          "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=100",
      },
      {
        quote:
          "The empty leg deals are incredible value. We've saved significantly on our travels.",
        author: "Emmanuel Nwachukwu",
        role: "Founder, NW Investments",
        avatar:
          "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=100",
      },
    ],
  },
};

// ============================================================================
// WHATSAPP WIDGET DATA
// ============================================================================
export const whatsappData = {
  phoneNumber: "+2348182113089",
  defaultMessage:
    "Hello! I would like to get more information about PexJet services.",
  title: "WhatsApp Support",
  subtitle: "Online now",
  description: "Need help? Chat with us on WhatsApp for quick assistance.",
  buttonText: "Start Conversation",
};

// ============================================================================
// CHARTER PAGE DATA
// ============================================================================
export const charterPageData = {
  hero: {
    backgroundImage:
      "https://res.cloudinary.com/dikzx4eyh/image/upload/v1765007837/d25f5436662_r8tmqc.jpg",
  },
  // Multi-step form data
  form: {
    title: "Charter Flights",
    tripTypes: [
      { value: "ONE_WAY", label: "One Way" },
      { value: "ROUND_TRIP", label: "Round Trip" },
      { value: "MULTI_LEG", label: "Multi-Leg" },
    ],
    steps: [
      {
        number: 1,
        title: "Select Aircraft",
        description: "Choose your preferred aircraft",
      },
      {
        number: 2,
        title: "Contact Details",
        description: "Provide your contact information",
      },
      {
        number: 3,
        title: "Review & Submit",
        description: "Review and submit your request",
      },
    ],
    aircraftSelection: {
      title: "Select Your Preferred Aircraft",
      subtitle:
        "Choose up to 5 aircraft for comparison. We'll provide you with the best options.",
      maxSelection: 5,
      categories: {
        local: {
          title: "Local & Regional Jets",
          description: "Perfect for domestic and regional flights",
        },
        international: {
          title: "International & Long-Range Jets",
          description: "Ideal for intercontinental and long-haul flights",
        },
      },
    },
    contactForm: {
      title: "Contact Information",
      subtitle: "Please provide your details so we can contact you",
      fields: {
        firstName: { label: "First Name", placeholder: "John", required: true },
        lastName: { label: "Last Name", placeholder: "Doe", required: true },
        email: {
          label: "Email",
          placeholder: "john@example.com",
          required: true,
        },
        phone: {
          label: "Phone (WhatsApp)",
          placeholder: "+234 800 000 0000",
          required: true,
        },
        company: {
          label: "Company",
          placeholder: "Your company (optional)",
          required: false,
        },
        notes: {
          label: "Additional Notes",
          placeholder: "Any special requirements or notes...",
          required: false,
        },
      },
    },
    review: {
      title: "Review Your Charter Request",
      subtitle: "Please review all details before submitting",
      sections: {
        flightDetails: "Flight Details",
        selectedAircraft: "Selected Aircraft",
        contactInfo: "Contact Information",
      },
    },
    success: {
      title: "Request Submitted!",
      description:
        "Your charter request has been received. Our team will contact you within 24 hours.",
      buttonText: "I Understand & Close",
      disclaimer:
        "By closing this window, you acknowledge you have read and understood the terms above.",
    },
  },
  charterBenefit: {
    title: "Why Fly with PexJet",
    subtitle: "Simple, safe, and comfortable private travel.",
    benefits: [
      {
        icon: "Shield",
        title: "Safety",
        description:
          "Regular maintenance and certified crews for every flight.",
      },
      {
        icon: "Armchair",
        title: "Comfort",
        description:
          "Relax in clean, modern interiors made for comfort and focus.",
      },
      {
        icon: "Lock",
        title: "Privacy",
        description: "No lines, no crowds—your trip is fully private.",
      },
      {
        icon: "Globe",
        title: "Anywhere",
        description: "Fly to 5,000+ airports, including private terminals.",
      },
      {
        icon: "Clock",
        title: "24/7 Support",
        description: "Our team is always available to assist you.",
      },
      {
        icon: "Star",
        title: "Premium Service",
        description:
          "Enjoy custom catering, transfers, and smooth coordination.",
      },
    ],
  },

  charterFAQ: {
    title: "Frequently Asked Questions",
    faq: [
      {
        question: "How does private jet chartering work?",
        answer:
          "Simply submit your flight details through our form, select from available aircraft options, and our team will coordinate all aspects of your journey including crew, catering, ground transportation, and any special requests. We handle everything from takeoff to landing.",
      },
      {
        question: "What determines charter pricing?",
        answer:
          "Charter pricing is based on several factors including aircraft type, flight distance, flight time, airport fees, crew costs, fuel prices, and any additional services requested. We provide transparent pricing with no hidden fees, and you'll receive a detailed quote before confirming your charter.",
      },
      {
        question: "What are the luggage rules?",
        answer:
          "Luggage capacity varies by aircraft. Generally, light jets accommodate 4-6 bags, mid-size jets 6-10 bags, and heavy jets 10-14 bags. We accommodate special items like golf clubs, skis, or oversized luggage with advance notice. There are no strict weight limits like commercial airlines.",
      },
      {
        question: "How are flight times estimated?",
        answer:
          "Flight times are calculated based on aircraft cruising speed, route distance, prevailing winds, and required air traffic routing. Our estimates include taxi time but may vary by ±15-20 minutes depending on weather and air traffic conditions. We always provide real-time updates.",
      },
      {
        question: "What are the passenger limits?",
        answer:
          "Each aircraft has specific passenger capacity ranging from 4 seats in very light jets to 16+ in ultra-long-range aircraft. The listed capacity is the maximum, but fewer passengers often means more space and comfort. We can recommend the optimal aircraft for your group size.",
      },
      {
        question: "Can I book multi-leg charters?",
        answer:
          "Yes! Multi-leg charters are ideal for business trips with multiple destinations or complex itineraries. You can visit several cities in one trip with the aircraft waiting for you at each location. This is often more economical than booking separate one-way flights.",
      },
      {
        question: "How far in advance should I book?",
        answer:
          "While we can accommodate last-minute requests (even same-day), we recommend booking at least 4-6 hours in advance for domestic flights and 12-24 hours for international flights to ensure aircraft availability and proper flight planning.",
      },
      {
        question: "What airports can you fly to?",
        answer:
          "We have access to over 5,000 airports worldwide, including small regional airports and private FBOs (Fixed Base Operators) that commercial airlines cannot reach. This flexibility allows you to land closer to your final destination, saving valuable ground travel time.",
      },
      {
        question: "Are pets allowed on charter flights?",
        answer:
          "Absolutely! Unlike commercial airlines, your pets can fly comfortably in the cabin with you. We welcome all pets and can arrange special accommodations. Please inform us in advance so we can prepare the aircraft accordingly.",
      },
      {
        question: "What happens if weather affects my flight?",
        answer:
          "Safety is our top priority. If weather conditions are unsafe, our experienced pilots and operations team will recommend alternative routing, delays, or rescheduling. We monitor weather continuously and provide real-time updates. Charter flexibility allows us to adjust departure times to avoid weather systems.",
      },
    ],
  },
  disclaimer: `
**IMPORTANT CHARTER AGREEMENT TERMS & DISCLAIMER**


**Pricing & Availability**
All charter pricing is estimated and subject to final confirmation based on real-time aircraft availability, fuel costs, airport fees, and routing requirements. The prices displayed are base charter costs and do not include additional fees such as international handling charges, landing fees, overnight crew expenses, catering, ground transportation, or de-icing (where applicable). A formal quote will be provided before contract execution.


**Aircraft Availability**
While we make every effort to provide the aircraft type you select, operational circumstances may require substitution with a comparable or superior aircraft. All substitutions maintain equivalent or better safety standards, seating capacity, and amenities. PexJet reserves the right to assign aircraft based on availability and operational efficiency.


**Flight Operations & Safety**
All flights are conducted in accordance with local and international aviation regulations. Flight schedules are subject to air traffic control clearances, weather conditions, crew duty time limitations, and technical airworthiness requirements. The Pilot-in-Command has final authority regarding flight safety and may delay, divert, or cancel flights if conditions are deemed unsafe.


**Weather & Force Majeure**
PexJet is not liable for delays, cancellations, or itinerary changes caused by weather, air traffic control restrictions, runway closures, natural disasters, political unrest, or other events beyond our control. While we will make reasonable efforts to minimize disruptions, safety takes absolute precedence.


**Passenger Responsibilities**
Passengers must possess valid travel documents (passports, visas, health certificates) for all destinations. PexJet is not responsible for denied entry or deportation due to improper documentation. All passengers must comply with customs and immigration regulations. Prohibited items and dangerous goods are strictly forbidden.


**Payment Terms**
Charter services require payment in accordance with the terms specified in your contract. Typical terms include a deposit upon booking and full payment 72 hours before departure. Cancellation fees apply as outlined in the charter agreement.


**Liability Limitations**
PexJet's liability is limited to the terms specified in the charter contract and applicable aviation insurance policies. We strongly recommend passengers obtain comprehensive travel insurance covering trip cancellation, medical emergencies, and personal belongings.


**Contact Method**
Your preferred contact method (WhatsApp, Email, or Phone) will be used for all communications regarding your charter. Please ensure the contact information provided is accurate and monitored regularly. Time-sensitive information will be communicated through your preferred channel.


By submitting this charter request, you acknowledge that you have read, understood, and agree to these terms and conditions. A formal charter contract will be provided for your review and signature before flight operations commence.


For questions or clarifications, please contact our charter operations team at charter@pexjet.com or +1 (555) 123-4567.
`,
};

// ============================================================================
// EMPTY LEGS PAGE DATA
// ============================================================================
export const emptyLegsPageData = {
  hero: {
    backgroundImage:
      "https://res.cloudinary.com/dikzx4eyh/image/upload/v1765007837/d25f5436662_r8tmqc.jpg",
  },
  // What Are Empty Leg Flights section
  whatAreEmptyLegs: {
    title: "What Are Empty Leg Flights?",
    benefits: [
      {
        icon: "DollarSign",
        title: "Massive Savings",
        description: "Save up to 75% on private jet flights.",
      },
      {
        icon: "Clock4",
        title: "Flexible Travel",
        description: "Perfect for flexible schedules.",
      },
      {
        icon: "Shield",
        title: "Premium Experience",
        description: "Same luxury as regular charters.",
      },
    ],
    howItWorks: {
      title: "How It Works",
      steps: [
        "Jets reposition for next charter",
        "Seats offered at discount instead of flying empty",
        "You get luxury travel at commercial prices",
      ],
    },
  },
  // Get Empty Leg Alerts section
  alerts: {
    title: "Get Empty Leg Alerts",
    description:
      "Receive weekly updates on the best empty leg deals via WhatsApp",
    subscriptionOptions: [
      { value: "all", label: "All Empty Leg Deals" },
      { value: "cities", label: "Specific Cities" },
      { value: "routes", label: "Specific Flight Routes" },
    ],
    citiesPlaceholder: "e.g. Lagos, Abuja, Port Harcourt",
    routeFromPlaceholder: "e.g. Lagos",
    routeToPlaceholder: "e.g. Abuja",
    phonePlaceholder: "+234...",
    buttonText: "Subscribe to Alerts",
    disclaimer: "You can unsubscribe at any time",
  },
  faq: [
    {
      question: "What is an empty leg flight?",
      answer:
        "An empty leg flight occurs when a private jet needs to reposition from one location to another without passengers. Instead of flying empty, operators offer these flights at significantly discounted rates—typically 50-75% off regular charter prices.",
    },
    {
      question: "Why are empty leg flights so cheap?",
      answer:
        "The aircraft needs to fly regardless, so operators prefer to recover some costs rather than fly completely empty. You benefit from the same luxury experience at a fraction of the price because the flight is already scheduled.",
    },
    {
      question: "Can I change the departure time or destination?",
      answer:
        "Empty leg flights have fixed routes and schedules since they're based on existing charter commitments. The departure time may have some flexibility (usually within a few hours), but the route cannot be changed. This is why they're offered at such discounted rates.",
    },
    {
      question: "What happens if the original charter is cancelled?",
      answer:
        "If the original charter that created the empty leg is cancelled, your empty leg flight may also be cancelled. We'll notify you immediately and work to find an alternative or provide a full refund. This is a rare occurrence but something to be aware of.",
    },
    {
      question: "How far in advance should I book an empty leg?",
      answer:
        "Empty legs are typically available 1-7 days before the flight. We recommend booking as soon as you find a suitable route, as these deals go quickly. Sign up for our alerts to be notified of new empty leg opportunities.",
    },
    {
      question: "Is the service the same as a regular charter?",
      answer:
        "Absolutely! You receive the same premium experience—professional crew, luxury aircraft, catering options, and VIP service. The only difference is the fixed route and schedule, which is why the price is so much lower.",
    },
  ],
  disclaimer: `
**EMPTY LEG CHARTER TERMS & CONDITIONS**


**Availability & Pricing**
Empty leg flights are subject to aircraft repositioning requirements and may be cancelled or rescheduled by the operator. All prices are significantly discounted from standard charter rates but are subject to final confirmation. The aircraft operator reserves the right to cancel empty leg flights up to 24 hours before departure.


**Booking Confirmation**
Empty leg bookings require immediate confirmation and full payment to secure. These flights cannot be held pending confirmation. Once payment is processed, the booking is final and subject to the operator's cancellation policy.


**Flight Schedule Changes**
Empty leg schedules are determined by the aircraft's operational requirements and may change with little notice. While we strive to maintain published schedules, flight times and dates are subject to change based on the operator's needs.


**Cancellation Policy**
Empty leg flights are non-refundable once confirmed. In the event of operator cancellation, you will receive a full refund or the option to rebook on an alternative empty leg flight.


**Passenger Responsibilities**
Passengers must be flexible with travel arrangements and understand that empty legs operate on the aircraft's schedule. All passengers must have valid travel documents and comply with standard aviation security procedures.


**Contact Timeframe**
Our team will contact you within 24-48 hours to confirm your empty leg booking and provide final details. Please ensure your contact information is accurate and monitor your provided communication channels.


By submitting this request, you acknowledge and accept these empty leg specific terms and conditions.
`,
};

// ============================================================================
// ABOUT - OUR COMPANY PAGE DATA
// ============================================================================
export const aboutCompanyPageData = {
  hero: {
    title: "Perspective Executive Jets Limited",
    subtitle:
      "A private aviation company providing safe and efficient air services in Nigeria and beyond.",
    backgroundImage:
      "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2574",
  },

  mission: {
    label: "What We Do",
    title: "Safe and Reliable Private Air Travel",
    paragraphs: [
      "Perspective Executive Jets Limited started out as Perspective Transport and Logistics Limited, bringing over 20 years of expertise in private jet aviation to the table.",
      "We're on a mission to be the most reliable and trusted private jet operator in Nigeria and Africa. Safety, reliability, comfort, and smooth travel are at the heart of what we do for every client, whether for business or personal needs.",
      "We're known for trust, integrity, and excellence that's how we fly.",
    ],
    image:
      "https://images.unsplash.com/photo-1583416750470-965b2707b355?q=80&w=2574",
    cta: {
      text: "Contact Us",
      href: "/contact",
    },
  },
  stats: [
    { value: "500+", label: "Aircraft Network" },
    { value: "20+", label: "Years of Experiences" },
    { value: "10K+", label: "Flights Completed" },
    { value: "50+", label: "Countries" },
  ],

  values: {
    title: "Our Core Values",
    subtitle: "The principles that guide our service.",
    items: [
      {
        icon: "Shield",
        title: "Safety",
        description:
          "We uphold the highest safety standards to ensure every flight is secure and dependable.",
      },
      {
        icon: "Users",
        title: "Trust",
        description:
          "We earn trust through transparency, reliability, and consistent service delivery.",
      },
      {
        icon: "Award",
        title: "Integrity",
        description:
          "We act with honesty, accountability, and professionalism in everything we do.",
      },
      {
        icon: "Star",
        title: "Excellence",
        description:
          "We pursue excellence by delivering premium service and exceptional travel experiences.",
      },
    ],
  },
};

// ============================================================================
// ABOUT - ASSET ACQUISITION & FINANCING PAGE DATA
// ============================================================================
export const aboutAssetPageData = {
  hero: {
    title: "Asset Acquisition & Financing",
    subtitle:
      "Connecting Institutions to Affordable DFI-Backed Financing — With a Strong Focus on Aviation",
    backgroundImage:
      "https://images.unsplash.com/photo-1474302770737-173ee21bab63?q=80&w=2574",
  },

  intro: {
    title: "Strategic Advisory for High-Value Asset Acquisition",
    paragraphs: [
      "ISEL Development Partners provides strategic advisory support for organizations seeking to acquire high-value, mission-critical assets. Our role is to guide institutions toward Development Finance Institutions (DFIs) and other global lenders that offer affordable, long-tenor, and development-aligned financing options.",
      "Our expertise ensures that clients secure the right assets—at the right price—with financing structures optimized for sustainability and long-term value.",
    ],
    image:
      "https://res.cloudinary.com/dikzx4eyh/image/upload/v1764999560/pixverse-i2i-ori-64796108-2ae1-4d13-85b0-d91c984eea00_tbj9ss.jpg",
  },

  aviation: {
    title: "Aviation Asset Acquisition — Our Core Specialty",
    image:
      "https://res.cloudinary.com/dikzx4eyh/image/upload/v1765954562/handshake_rrwnvc.png",
    description:
      "We help airlines, governments, and private operators acquire and finance aviation assets through competitive DFI-linked and international financing sources.",
    items: [
      "Private and Commercial aircraft",
      "Regional jets and domestic fleet aircraft",
      "Cargo aircraft and passenger-to-freighter conversions",
      "Helicopters (oil & gas, medevac, security)",
      "Ground Support Equipment (GSE) and aviation infrastructure assets",
    ],
    services:
      "We provide fleet planning, OEM engagement, technical due diligence, pricing negotiation, and financing structuring.",
  },

  financing: {
    title: "Access to Affordable Development Finance",
    description:
      "We help clients access financing options from DFIs and global institutional partners, including:",
    items: [
      {
        icon: "Banknote",
        title: "Concessional & Blended Finance",
        description:
          "Access below-market rates through development-focused funding structures.",
      },
      {
        icon: "FileCheck",
        title: "Export Credit Agency (ECA) Financing",
        description:
          "Leverage government-backed export credit for competitive terms.",
      },
      {
        icon: "Building2",
        title: "Operating & Finance Leases",
        description:
          "Flexible leasing structures tailored to your operational needs.",
      },
      {
        icon: "Clock",
        title: "Long-Tenor DFI Debt",
        description:
          "Extended repayment periods aligned with asset lifecycles.",
      },
      {
        icon: "Shield",
        title: "Credit Guarantees",
        description:
          "Risk-sharing facilities to enhance bankability of projects.",
      },
      {
        icon: "Handshake",
        title: "Risk-Sharing Facilities",
        description:
          "Collaborative structures with DFIs to mitigate investment risk.",
      },
    ],
    note: "Our role is to ensure projects and asset acquisitions are properly structured, compliant, and bankable, enabling DFIs to deploy capital with confidence.",
  },

  beyondAviation: {
    title: "Beyond Aviation",
    description:
      "We also guide institutions toward DFI-supported financing for:",
    items: [
      "Renewable energy & power equipment",
      "Industrial and manufacturing machinery",
      "Medical and diagnostic equipment",
      "Transport fleets & logistics assets",
      "Digital and ICT infrastructure",
      "Agribusiness and processing equipment",
    ],
  },

  whyChooseUs: {
    title: "Why Institutions Choose ISEL",
    items: [
      {
        icon: "Link",
        title: "Direct DFI Linkage",
        description:
          "Direct linkage to global DFIs and concessional financing options.",
      },
      {
        icon: "Plane",
        title: "Aviation Expertise",
        description:
          "Strong aviation and infrastructure procurement expertise.",
      },
      {
        icon: "ClipboardCheck",
        title: "Full Due Diligence",
        description:
          "Full financial, technical, and regulatory due diligence support.",
      },
      {
        icon: "CheckCircle",
        title: "End-to-End Advisory",
        description:
          "Transparent, compliant, end-to-end acquisition and financing advisory.",
      },
    ],
  },

  cta: {
    title: "Ready to Acquire Your Next Asset?",
    description:
      "Let our experts connect you with the right financing partners. Schedule a consultation today.",
    button: {
      text: "Schedule Consultation",
      href: "/contact?type=acquisition",
    },
  },
};

// ============================================================================
// CONTACT PAGE DATA
// ============================================================================
export const contactPageData = {
  hero: {
    title: "Private Aviation Concierge",
    subtitle: "Your journey starts with a simple conversation",
    backgroundImage:
      "https://res.cloudinary.com/dikzx4eyh/image/upload/v1765010565/private-jet-scaled_emkpzi.jpg",
  },

  mainHeading: {
    title: "Get in Touch",
    description:
      "Our dedicated team is available 24/7 to assist you with all your private aviation needs.",
  },

  contactInfo: [
    {
      icon: "Phone",
      title: "Phone",
      phones: [
        { details: ["+234 818 211 3089"], href: "tel:+2348182113089" },
        { details: ["+234 911 110 1123"], href: "tel:+2349111101123" },
      ],
    },
    {
      icon: "Mail",
      title: "Email",
      details: ["charter@pexjet.com"],
      href: "mailto:charter@pexjet.com",
    },
    {
      icon: "MapPin",
      title: "Office",
      details: [
        "H8GG+Q7X, Dominion HangarMuritala Mohammed International Airport",
        "Lagos, Nigeria",
      ],
      href: null,
    },
    {
      icon: "Clock",
      title: "Availability",
      details: ["24/7 Concierge Service"],
      href: null,
    },
  ],

  whatsapp: {
    title: "WhatsApp",
    description: "Get instant assistance",
    buttonText: "Chat on WhatsApp",
    phoneNumber: "+2348182113089",
    defaultMessage:
      "Hello! I would like to get more information about PexJet services.",
  },

  socialMedia: [
    { platform: "Facebook", href: "https://facebook.com/pexjet" },
    { platform: "Twitter", href: "https://twitter.com/pexjet" },
    { platform: "Instagram", href: "https://instagram.com/pexjet" },
    { platform: "LinkedIn", href: "https://linkedin.com/company/pexjet" },
  ],

  map: {
    embedUrl:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3963.5606957364707!2d3.3231743759861705!3d6.576991122537391!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x103b91bddcfb8299%3A0x3365b12bdf981b14!2sPerspective%20Executive%20Jets!5e0!3m2!1sen!2sng!4v1765007056123!5m2!1sen!2sng",
    title: "Office Location",
  },
};

// ============================================================================
// QUOTE PAGE DATA
// ============================================================================
export const quotePageData = {
  hero: {
    title: "Request a Quote",
    subtitle:
      "Tell us about your travel plans and we'll provide you with a personalized quote within 24 hours.",
  },

  form: {
    title: "Flight Details",
    flightTypes: [
      { value: "ONE_WAY", label: "One Way" },
      { value: "ROUND_TRIP", label: "Round Trip" },
      { value: "MULTI_LEG", label: "Multi-Leg" },
    ],
    passengerOptions: [
      { value: "1-4", label: "1-4 Passengers" },
      { value: "5-8", label: "5-8 Passengers" },
      { value: "9-14", label: "9-14 Passengers" },
      { value: "15+", label: "15+ Passengers" },
    ],
    submitButton: "Submit Quote Request",
  },

  success: {
    title: "Thank You!",
    description:
      "Your quote request has been submitted successfully. Our team will review your requirements and contact you within 24 hours.",
    buttons: {
      home: "Return Home",
      emptyLegs: "Browse Empty Legs",
    },
  },

  contactAlternative: "Prefer to speak with us directly? Call",
};

// ============================================================================
// SERVICES PAGE DATA
// ============================================================================
export const servicesData = {
  hero: {
    title: "Our Services",
    subtitle: "Comprehensive private aviation solutions tailored to your needs",
    image:
      "https://res.cloudinary.com/dikzx4eyh/image/upload/v1765010199/2peopleandplane_m8gggj.jpg",
  },

  services: [
    {
      id: "charter",
      title: "Private Jet Charter",
      description:
        "Enjoy a truly personalized flying experience with our private jet charter service. Whether you're traveling for business or leisure, you can fly on your own schedule with complete privacy and comfort. We give you access to over 5,000 airports worldwide and handle everything for you—catering, ground transport, and more—so your trip is smooth from start to finish.",
      image:
        "https://images.unsplash.com/photo-1569629743817-70d8db6c323b?q=80&w=2574",
    },
    {
      id: "empty-leg",
      title: "Empty Leg Flights",
      description:
        "Save big on private jet travel with our empty leg flights. These are one-way trips offered at heavily discounted prices when an aircraft needs to return or move to another location. You enjoy the same luxury experience but at up to 75% less—perfect if your travel dates are flexible.",
      image:
        "https://res.cloudinary.com/dikzx4eyh/image/upload/v1765010657/empty_leg_xltqs3.png",
    },
    {
      id: "asset-acquisition",
      title: "Asset Acquisition & Financing",
      description:
        "We help institutions acquire and finance aviation assets with ease. Through our network of DFIs and international lenders, you get access to affordable long-term financing options. Whether it's private jets, commercial aircraft, helicopters, or ground equipment, we guide you to secure the right assets with the best financing structure.",
      image:
        "https://res.cloudinary.com/dikzx4eyh/image/upload/v1765954562/handshake_rrwnvc.png",
    },
  ],

  whyChooseUs: {
    title: "Why Choose PexJet?",
    subtitle: "Dependable service. Smooth travel. Peace of mind.",
    reasons: [
      "24/7 support for all your travel needs",
      "Access to a wide range of trusted aircraft",
      "Clear pricing with no hidden fees",
      "Strong safety standards and certified operators",
      "Flexible booking options",
      "Personalized catering and onboard comforts",
      "Global reach",
      "Experienced aviation advisors",
      "Full ground transport coordination",
    ],
  },
};

// ============================================================================
// AIRCRAFT PAGE DATA
// ============================================================================
export const aircraftPageData = {
  hero: {
    title: "Our Fleet",
    subtitle:
      "Explore our diverse collection of premium aircraft available for charter",
    backgroundImage:
      "https://res.cloudinary.com/dikzx4eyh/image/upload/v1765007837/d25f5436662_r8tmqc.jpg",
  },
  loading: {
    text: "Loading aircraft...",
  },
  emptyState: {
    title: "No Aircraft Available",
    description: "Please check back later for our fleet updates.",
    cta: {
      text: "Contact Us",
      href: "/contact",
    },
  },
  badges: {
    local: "Local Flights",
    international: "International",
  },
  specifications: {
    title: "Technical Specifications",
  },
  gallery: {
    title: "Aircraft Gallery",
    exteriorLabel: "Exterior Images",
    interiorLabel: "Interior Images",
  },
  cta: {
    text: "Request a Quote",
    href: "/charter",
  },
};

// ============================================================================
// AIRCRAFT MANAGEMENT PAGE DATA
// ============================================================================
export const aircraftManagementPageData = {
  hero: {
    headline: "You Own the Jet.",
    subheadline: "PEXJET Manages Everything Else.",
    description:
      "As a jet owner, your time and peace of mind are invaluable. With PEXJET Aircraft Management, you enjoy all the advantages of ownership without the operational complexity. We handle every detail with precision and discretion, from daily operations to long-term asset protection. From flight operations and crew management to maintenance, regulatory compliance, and financial reporting, PEXJET ensures your aircraft is operated safely, efficiently, and cost effectively. Whether your jet flies frequently or occasionally, our management solutions are tailored to your lifestyle maximizing value while eliminating hassle.",
    cta: "Contact Us Today",
    image:
      "https://res.cloudinary.com/dikzx4eyh/image/upload/v1767366534/jetnobg_n4o1hk.png",
  },

  about: {
    headline: "What Is Aircraft Management?",
    description:
      "PEXJET Aircraft Management is a complete operational solution designed for private jet owners who want effortless ownership. We take full responsibility for the day to day management of your aircraft, ensuring it remains airworthy, compliant, and ready to fly at all times. You retain full ownership and unrestricted access to your jet, while PEXJET operates it to the highest international standards behind the scenes and without disruption.",
  },

  services: {
    headline: "Our Aircraft Management Services",
    items: [
      {
        title: "Flight Operations & Scheduling",
        description:
          "We plan, coordinate, and dispatch every flight with accuracy and flexibility, aligning perfectly with your schedule—whether domestic or international.",
        image:
          "https://res.cloudinary.com/dikzx4eyh/image/upload/v1767370661/flightoperation_p9hqki.webp",
      },
      {
        title: "Crew Management",
        description:
          "PEXJET recruits, trains, and manages highly experienced flight crew, delivering exceptional safety, professionalism, and onboard service on every journey.",
        image:
          "https://res.cloudinary.com/dikzx4eyh/image/upload/v1767370772/CrewManagemen_jajrnk.png",
      },
      {
        title: "Maintenance & Airworthiness",
        description:
          "Your aircraft is maintained to the highest standards through proactive inspections, regulatory compliance, and real-time maintenance oversight.",
        image:
          "https://res.cloudinary.com/dikzx4eyh/image/upload/v1767370772/Maintenance_Airworthiness_lppc8p.png",
      },
      {
        title: "Budgeting & Financial Oversight",
        description:
          "We provide clear monthly reporting, expense tracking, and cost controls—giving you full transparency and protecting your investment.",
        image:
          "https://res.cloudinary.com/dikzx4eyh/image/upload/v1767371312/FinancialOversight_wr4dwf.webp",
      },
      {
        title: "Regulatory Compliance & Insurance",
        description:
          "PEXJET ensures your aircraft meets all local and international aviation regulations, with appropriate insurance coverage and documentation in place at all times.",
        image:
          "https://res.cloudinary.com/dikzx4eyh/image/upload/v1767371317/RegulatoryCompliance_Insuranc_npgg7d.jpg",
      },
      {
        title: "Trip Support & Concierge Services",
        description:
          "From flight planning and permits to catering, ground handling, and transportation, we manage every detail so your experience remains seamless.",
        image:
          "https://res.cloudinary.com/dikzx4eyh/image/upload/v1767371423/Trip_Support_Concierge_Services_ed6uxr.jpg",
      },
    ],
  },
};

// ============================================================================
// SEO DATA
// ============================================================================
export const seoData = {
  siteName: "PexJet",
  siteUrl: "https://pexjet.com",
  defaultTitle:
    "PexJet – Nigeria's Premier Private Jet Charter & Empty Leg Flights",
  defaultDescription:
    "Experience luxury private aviation with PexJet. Book private jet charters, discover exclusive empty leg deals with up to 75% savings, and travel across Africa and beyond in comfort and style.",
  keywords: [
    "private jet charter Nigeria",
    "private jet hire Lagos",
    "empty leg flights Africa",
    "luxury private aviation",
    "business jet charter",
    "private plane rental Nigeria",
    "executive jet services",
    "affordable private jet",
    "last minute private jet deals",
    "PexJet",
  ],

  // Favicon and logos (Cloudinary)
  favicon:
    "https://res.cloudinary.com/dikzx4eyh/image/upload/v1765973101/X_xvfnbc.png",
  logo: "https://res.cloudinary.com/dikzx4eyh/image/upload/v1764942221/black-gold_1_k94z9u.png",

  // Social Media / Open Graph
  openGraph: {
    type: "website",
    locale: "en_US",
    image:
      "https://res.cloudinary.com/dikzx4eyh/image/upload/v1764998923/pixverse-i2i-ori-9076e189-b32b-46cc-8701-506838512428_lkeyv0.png",
    imageWidth: 1200,
    imageHeight: 630,
  },

  // Twitter Card
  twitter: {
    card: "summary_large_image",
    site: "@pexjet",
    creator: "@pexjet",
  },

  pages: {
    home: {
      title: "PexJet – Private Jet Charter Nigeria",
      description:
        "Nigeria's leading private jet charter company. Book luxury flights, find empty leg deals with up to 75% off, and experience premium aviation services.",
    },
    charter: {
      title: "Private Jet Charter Services",
      description:
        "Charter a private jet anywhere in the world. Flexible schedules, dedicated service, and access to 500+ aircraft. Request a quote in minutes.",
    },
    emptyLegs: {
      title: "Empty Leg Flights – Save Up to 75%",
      description:
        "Discover exclusive empty leg flight deals across Africa and beyond. Fly private at a fraction of the cost with PexJet's discounted repositioning flights.",
    },
    aircraft: {
      title: "Our Aircraft Fleet",
      description:
        "Browse our diverse fleet of private jets – from light jets to heavy long-range aircraft. Find the perfect aircraft for your journey.",
    },
    aircraftManagement: {
      title: "Aircraft Management Services",
      description:
        "Professional aircraft management services. We handle operations, maintenance, crew, and compliance—so you can focus on flying.",
    },
    services: {
      title: "Private Aviation Services",
      description:
        "Comprehensive private aviation solutions including jet charter, empty leg flights, aircraft management, and acquisition services.",
    },
    aboutCompany: {
      title: "About PexJet – 20+ Years of Excellence",
      description:
        "Discover PexJet's story – over 20 years of safe, reliable private aviation in Nigeria and Africa. Trust, integrity, and excellence in every flight.",
    },
    aboutAsset: {
      title: "Aircraft Acquisition & Financing",
      description:
        "Expert aircraft acquisition, sales, and financing solutions. Let PexJet guide your aviation investment with industry expertise.",
    },
    contact: {
      title: "Contact PexJet",
      description:
        "Get in touch with PexJet for private jet bookings, quotes, or enquiries. Our team is available 24/7 to assist you.",
    },
  },
};
