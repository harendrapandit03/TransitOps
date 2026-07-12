import type { Vehicle, Driver, Trip, MaintenanceRecord, FuelLog, ExpenseRecord } from './types';

// Let's seed initial data matching the screenshots and requirements
export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'v1',
    regNumber: 'GJ01AB4521',
    name: 'VAN-05',
    type: 'Van',
    maxLoad: 500,
    odometer: 74000,
    acquisitionCost: 620000,
    status: 'Available',
    region: 'North'
  },
  {
    id: 'v2',
    regNumber: 'GJ01AB9981',
    name: 'TRUCK-11',
    type: 'Truck',
    maxLoad: 5000,
    odometer: 182000,
    acquisitionCost: 2450000,
    status: 'On Trip',
    region: 'South'
  },
  {
    id: 'v3',
    regNumber: 'GJ01AB1120',
    name: 'MINI-03',
    type: 'Mini',
    maxLoad: 1000,
    odometer: 66000,
    acquisitionCost: 410000,
    status: 'In Shop',
    region: 'East'
  },
  {
    id: 'v4',
    regNumber: 'GJ01AB0087',
    name: 'VAN-09',
    type: 'Van',
    maxLoad: 750,
    odometer: 241900,
    acquisitionCost: 590000,
    status: 'Retired',
    region: 'West'
  }
];

export const INITIAL_DRIVERS: Driver[] = [
  {
    id: 'd1',
    name: 'Alex',
    licenseNumber: 'DL-88213',
    licenseCategory: 'LMV',
    licenseExpiry: '2028-12-31',
    contactNumber: '9876543210',
    safetyScore: 96,
    status: 'Available',
    tripCount: 45
  },
  {
    id: 'd2',
    name: 'John',
    licenseNumber: 'DL-44120',
    licenseCategory: 'HMV',
    licenseExpiry: '2025-03-15', // Expired or expiring depending on current year (let's say expired)
    contactNumber: '9822011223',
    safetyScore: 81,
    status: 'Suspended',
    tripCount: 89
  },
  {
    id: 'd3',
    name: 'Priya',
    licenseNumber: 'DL-77031',
    licenseCategory: 'LMV',
    licenseExpiry: '2027-08-15',
    contactNumber: '9911012345',
    safetyScore: 99,
    status: 'On Trip',
    tripCount: 112
  },
  {
    id: 'd4',
    name: 'Suresh',
    licenseNumber: 'DL-90045',
    licenseCategory: 'HMV',
    licenseExpiry: '2027-01-20',
    contactNumber: '9744033221',
    safetyScore: 88,
    status: 'Off Duty',
    tripCount: 56
  }
];

export const INITIAL_TRIPS: Trip[] = [
  {
    id: 't1',
    tripNumber: 'TR001',
    source: 'Warehouse A',
    destination: 'Client Site 1',
    vehicleId: 'v1',
    driverId: 'd1',
    cargoWeight: 450,
    distance: 120,
    status: 'Dispatched', // Matching 'On Trip' state visually but standard lifecycle is Dispatched
    eta: '45 min',
    createdAt: '2026-07-12T08:00:00Z'
  },
  {
    id: 't2',
    tripNumber: 'TR002',
    source: 'Warehouse B',
    destination: 'Client Site 2',
    vehicleId: 'v2',
    driverId: 'd2',
    cargoWeight: 3500,
    distance: 450,
    status: 'Completed',
    eta: '-',
    finalOdometer: 182450,
    fuelConsumed: 90,
    createdAt: '2026-07-11T09:00:00Z'
  },
  {
    id: 't3',
    tripNumber: 'TR003',
    source: 'Hub North',
    destination: 'Retail Depot',
    vehicleId: 'v3',
    driverId: 'd3',
    cargoWeight: 800,
    distance: 75,
    status: 'Dispatched',
    eta: '1h 10m',
    createdAt: '2026-07-12T09:15:00Z'
  },
  {
    id: 't4',
    tripNumber: 'TR006',
    source: 'Main Terminal',
    destination: 'Distribution Center',
    cargoWeight: 200,
    distance: 300,
    status: 'Draft',
    eta: 'Awaiting vehicle',
    createdAt: '2026-07-12T09:30:00Z'
  }
];

export const INITIAL_MAINTENANCE: MaintenanceRecord[] = [
  {
    id: 'm1',
    vehicleId: 'v3',
    description: 'Oil Change and Brake Pad replacement',
    startDate: '2026-07-11',
    cost: 15000,
    status: 'Active'
  }
];

export const INITIAL_FUEL_LOGS: FuelLog[] = [
  {
    id: 'f1',
    vehicleId: 'v1',
    liters: 45,
    cost: 4500,
    date: '2026-07-10'
  },
  {
    id: 'f2',
    vehicleId: 'v2',
    liters: 120,
    cost: 12000,
    date: '2026-07-11'
  }
];

export const INITIAL_EXPENSES: ExpenseRecord[] = [
  {
    id: 'e1',
    vehicleId: 'v1',
    amount: 350,
    category: 'Tolls',
    description: 'Highway Express Toll',
    date: '2026-07-10'
  },
  {
    id: 'e2',
    vehicleId: 'v2',
    amount: 1200,
    category: 'Tolls',
    description: 'State Border Entry Fee',
    date: '2026-07-11'
  }
];
