// Seed data generation utilities

const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];
const streets = ["Main St", "Oak Ave", "Maple Dr", "Cedar Ln", "Pine Rd", "Elm St", "Washington Blvd", "Park Ave", "Lake Dr", "River Rd"];
const citiesWithCoords = [
  { city: "Boston", state: "MA", lat: 42.3601, lng: -71.0589 },
  { city: "New York", state: "NY", lat: 40.7128, lng: -74.0060 },
  { city: "Chicago", state: "IL", lat: 41.8781, lng: -87.6298 },
  { city: "Seattle", state: "WA", lat: 47.6062, lng: -122.3321 },
  { city: "Austin", state: "TX", lat: 30.2672, lng: -97.7431 },
  { city: "Denver", state: "CO", lat: 39.7392, lng: -104.9903 },
  { city: "Portland", state: "OR", lat: 45.5152, lng: -122.6784 },
  { city: "Miami", state: "FL", lat: 25.7617, lng: -80.1918 },
  { city: "Atlanta", state: "GA", lat: 33.7490, lng: -84.3880 },
  { city: "Phoenix", state: "AZ", lat: 33.4484, lng: -112.0740 }
];

const propertyTypes = ["residential", "commercial", "industrial"] as const;

const propertyImages = [
  "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&auto=format&fit=crop"
];
const occupations = ["Engineer", "Teacher", "Nurse", "Sales Manager", "Software Developer", "Accountant", "Designer", "Consultant"];
const maintenanceCategories = ["plumbing", "electrical", "hvac", "general"] as const;
const maintenanceDescriptions = {
  plumbing: ["Leaky faucet in kitchen", "Clogged bathroom drain", "Water heater not working", "Low water pressure"],
  electrical: ["Light switch not working", "Outlet not functioning", "Breaker keeps tripping", "Flickering lights"],
  hvac: ["AC not cooling properly", "Heater making noise", "Thermostat malfunction", "Filter needs replacement"],
  general: ["Paint touch-up needed", "Carpet stain", "Blinds broken", "Lock needs adjustment"]
};

const random = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const generateRandomProperty = () => {
  const location = random(citiesWithCoords);
  const propertyType = random(propertyTypes);
  // Add small random offset to coordinates for variety (±0.05 degrees ~ ±5.5km)
  const latOffset = (Math.random() - 0.5) * 0.1;
  const lngOffset = (Math.random() - 0.5) * 0.1;
  
  return {
    address: `${randomInt(100, 9999)} ${random(streets)}`,
    city: location.city,
    state: location.state,
    zip_code: String(randomInt(10000, 99999)),
    type: propertyType as "residential" | "commercial" | "industrial",
    status: random(["active", "inactive", "maintenance"] as const) as "active" | "inactive" | "maintenance",
    description: `${randomInt(1, 20)} unit ${propertyType} property`,
    latitude: location.lat + latOffset,
    longitude: location.lng + lngOffset,
    image_url: random(propertyImages)
  };
};

export const generateRandomTenant = () => {
  const firstName = random(firstNames);
  const lastName = random(lastNames);
  return {
    full_name: `${firstName} ${lastName}`,
    email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@email.com`,
    phone: `(${randomInt(200, 999)}) ${randomInt(100, 999)}-${randomInt(1000, 9999)}`,
    occupation: random(occupations),
    annual_income: randomInt(30000, 120000),
    credit_score: randomInt(600, 850),
    emergency_contact_name: `${random(firstNames)} ${random(lastNames)}`,
    emergency_contact_phone: `(${randomInt(200, 999)}) ${randomInt(100, 999)}-${randomInt(1000, 9999)}`
  };
};

export const generateRandomMaintenance = (unitId: string) => {
  const category = random(maintenanceCategories) as "plumbing" | "electrical" | "hvac" | "general";
  return {
    unit_id: unitId,
    category,
    description: random(maintenanceDescriptions[category]),
    priority: randomInt(1, 4),
    status: random(["open", "assigned", "in_progress", "resolved"] as const) as "open" | "assigned" | "in_progress" | "resolved",
    estimated_cost: randomInt(50, 1000)
  };
};

export const generateRandomLease = (unitId: string, tenantId: string) => {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - randomInt(0, 12));
  const endDate = new Date(startDate);
  endDate.setFullYear(endDate.getFullYear() + randomInt(1, 2));
  
  return {
    unit_id: unitId,
    tenant_id: tenantId,
    start_date: startDate.toISOString().split('T')[0],
    end_date: endDate.toISOString().split('T')[0],
    monthly_rent: randomInt(800, 3500),
    deposit: randomInt(1000, 5000),
    status: random(["draft", "active"] as const) as "draft" | "active"
  };
};