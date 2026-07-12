// Central state data types representing the TransitOps platform structures

export type UserRole = 'Fleet Manager' | 'Dispatcher' | 'Safety Officer' | 'Financial Analyst';

export interface User {
  email: string;
  name: string;
  role: UserRole;
  avatar: string;
}

export type VehicleStatus = 'Available' | 'On Trip' | 'In Shop' | 'Retired';

export interface Vehicle {
  id: string;
  regNumber: string; // unique
  name: string;      // Name/Model
  type: string;      // Van, Truck, Mini, etc.
  maxLoad: number;   // Maximum Load Capacity in kg
  odometer: number;  // in km
  acquisitionCost: number; // in local currency
  status: VehicleStatus;
  region?: string;
}

export type DriverStatus = 'Available' | 'On Trip' | 'Off Duty' | 'Suspended';

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  licenseCategory: 'LMV' | 'HMV';
  licenseExpiry: string; // YYYY-MM-DD
  contactNumber: string;
  safetyScore: number;  // out of 100 or as %
  status: DriverStatus;
  tripCount: number;
}

export type TripStatus = 'Draft' | 'Dispatched' | 'Completed' | 'Cancelled';

export interface Trip {
  id: string;
  tripNumber: string; // unique display ID (e.g., TR001)
  source: string;
  destination: string;
  vehicleId?: string; // selected vehicle
  driverId?: string;  // selected driver
  cargoWeight: number; // in kg
  distance: number;    // planned distance in km
  status: TripStatus;
  eta?: string;
  finalOdometer?: number;
  fuelConsumed?: number; // in Liters
  createdAt: string;
}

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  description: string;
  startDate: string;
  endDate?: string;
  cost: number;
  status: 'Active' | 'Closed';
}

export interface FuelLog {
  id: string;
  vehicleId: string;
  liters: number;
  cost: number;
  date: string;
}

export interface ExpenseRecord {
  id: string;
  vehicleId: string;
  amount: number;
  category: 'Tolls' | 'Maintenance' | 'Permit' | 'Other';
  description: string;
  date: string;
}
