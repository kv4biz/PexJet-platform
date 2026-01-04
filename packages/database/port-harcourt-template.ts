// PORT HARCOURT AIRPORT DATA TEMPLATE
// Fill in the correct information for each field below

const portHarcourtData = {
  // ===== REQUIRED FIELDS =====
  ident: "DNPO", // Airport identifier (unique)
  type: "medium_airport", // Airport type: large_airport | medium_airport | small_airport | heliport | seaplane_base | closed | balloonport
  name: "Port Harcourt International Airport", // Full airport name
  latitude: 4.8442, // Latitude in decimal degrees
  longitude: 7.0086, // Longitude in decimal degrees
  elevationFt: 78, // Elevation in feet (can be null)
  continent: "AF", // Continent code (AF = Africa)
  countryCode: "NG", // ISO country code (NG = Nigeria)
  regionCode: "NG-RI", // ISO region code (NG-RI = Rivers State)

  // ===== OPTIONAL FIELDS =====
  municipality: "Port Harcourt", // City name (can be null)
  scheduledService: true, // Has scheduled passenger service (true/false)

  // Airport Codes (can be null if not available)
  icaoCode: "DNPO", // ICAO 4-letter code
  iataCode: "PHC", // IATA 3-letter code
  gpsCode: null, // GPS code (usually null)
  localCode: null, // Local airport code (usually null)

  // Additional Information (all optional, can be null)
  homeLink: null, // Airport website URL
  wikipediaLink: "https://en.wikipedia.org/wiki/Port_Harcourt_Airport",
  keywords: "Port Harcourt, Omagwa, Rivers State, Nigeria", // Search keywords
};

// ===== VERIFICATION CHECKLIST =====
// Please confirm these details are correct:

console.log("=== PORT HARCOURT AIRPORT DATA VERIFICATION ===");
console.log("1. Basic Info:");
console.log(`   - Airport Ident: ${portHarcourtData.ident}`);
console.log(`   - Full Name: ${portHarcourtData.name}`);
console.log(`   - Type: ${portHarcourtData.type}`);
console.log(`   - City: ${portHarcourtData.municipality}`);

console.log("\n2. Location:");
console.log(`   - Country: ${portHarcourtData.countryCode} (Nigeria)`);
console.log(`   - State: ${portHarcourtData.regionCode} (Rivers State)`);
console.log(
  `   - Coordinates: ${portHarcourtData.latitude}°N, ${portHarcourtData.longitude}°E`,
);
console.log(`   - Elevation: ${portHarcourtData.elevationFt} feet`);

console.log("\n3. Airport Codes:");
console.log(`   - IATA Code: ${portHarcourtData.iataCode}`);
console.log(`   - ICAO Code: ${portHarcourtData.icaoCode}`);

console.log("\n4. Operations:");
console.log(`   - Scheduled Service: ${portHarcourtData.scheduledService}`);
console.log(`   - Continent: ${portHarcourtData.continent}`);

console.log("\n=== PLEASE CONFIRM ===");
console.log("✅ Are all these details correct?");
console.log("✅ Is the airport type correct (medium_airport)?");
console.log("✅ Are the coordinates accurate?");
console.log("✅ Are the IATA/ICAO codes correct?");

export { portHarcourtData };
