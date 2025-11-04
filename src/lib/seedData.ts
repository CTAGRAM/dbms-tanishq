// Seed data generation utilities

const firstNames = ["James", "Mary", "John", "Patricia", "Robert", "Jennifer", "Michael", "Linda", "William", "Elizabeth"];
const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez"];
const streets = ["Main St", "Oak Ave", "Maple Dr", "Cedar Ln", "Pine Rd", "Elm St", "Washington Blvd", "Park Ave", "Lake Dr", "River Rd"];
const cities = ["Boston", "New York", "Chicago", "Seattle", "Austin", "Denver", "Portland", "Miami", "Atlanta", "Phoenix"];
const states = ["MA", "NY", "IL", "WA", "TX", "CO", "OR", "FL", "GA", "AZ"];
const propertyTypes = ["residential", "commercial", "industrial"] as const;
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

export const generateRandomProperty = () => ({
  address: `${randomInt(100, 9999)} ${random(streets)}`,
  city: random(cities),
  state: random(states),
  zip_code: String(randomInt(10000, 99999)),
  type: random(propertyTypes) as "residential" | "commercial" | "industrial",
  status: random(["active", "inactive", "maintenance"] as const) as "active" | "inactive" | "maintenance",
  description: `${randomInt(1, 20)} unit ${random(propertyTypes)} property`
});

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