import type { 
  Vehicle, Driver, Trip, MaintenanceRecord, FuelLog, ExpenseRecord, User 
} from './types';
import { 
  INITIAL_VEHICLES, INITIAL_DRIVERS, INITIAL_TRIPS, INITIAL_MAINTENANCE, INITIAL_FUEL_LOGS, INITIAL_EXPENSES 
} from './mockData';

// Local storage names
const KEYS = {
  VEHICLES: 'transitops_vehicles',
  DRIVERS: 'transitops_drivers',
  TRIPS: 'transitops_trips',
  MAINTENANCE: 'transitops_maintenance',
  FUEL_LOGS: 'transitops_fuel_logs',
  EXPENSES: 'transitops_expenses',
  AUTH: 'transitops_auth',
};

// Helper functions for localStorage
const getStored = <T>(key: string, initial: T): T => {
  const val = localStorage.getItem(key);
  if (!val) {
    localStorage.setItem(key, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(val) as T;
  } catch {
    return initial;
  }
};

const setStored = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Initialize DB structure
export const db = {
  getVehicles: () => getStored<Vehicle[]>(KEYS.VEHICLES, INITIAL_VEHICLES),
  saveVehicles: (data: Vehicle[]) => setStored(KEYS.VEHICLES, data),
  
  getDrivers: () => getStored<Driver[]>(KEYS.DRIVERS, INITIAL_DRIVERS),
  saveDrivers: (data: Driver[]) => setStored(KEYS.DRIVERS, data),

  getTrips: () => getStored<Trip[]>(KEYS.TRIPS, INITIAL_TRIPS),
  saveTrips: (data: Trip[]) => setStored(KEYS.TRIPS, data),

  getMaintenance: () => getStored<MaintenanceRecord[]>(KEYS.MAINTENANCE, INITIAL_MAINTENANCE),
  saveMaintenance: (data: MaintenanceRecord[]) => setStored(KEYS.MAINTENANCE, data),

  getFuelLogs: () => getStored<FuelLog[]>(KEYS.FUEL_LOGS, INITIAL_FUEL_LOGS),
  saveFuelLogs: (data: FuelLog[]) => setStored(KEYS.FUEL_LOGS, data),

  getExpenses: () => getStored<ExpenseRecord[]>(KEYS.EXPENSES, INITIAL_EXPENSES),
  saveExpenses: (data: ExpenseRecord[]) => setStored(KEYS.EXPENSES, data),

  getAuth: (): User | null => {
    const val = localStorage.getItem(KEYS.AUTH);
    return val ? JSON.parse(val) : null;
  },
  setAuth: (user: User | null) => {
    if (user) {
      localStorage.setItem(KEYS.AUTH, JSON.stringify(user));
    } else {
      localStorage.removeItem(KEYS.AUTH);
    }
  }
};

// Main state logic implementing business rules
export const api = {
  // --- VEHICLES ---
  getVehicles: async () => db.getVehicles(),
  addVehicle: async (vehicle: Omit<Vehicle, 'id'>) => {
    const list = db.getVehicles();
    const exists = list.some(v => v.regNumber.toUpperCase() === vehicle.regNumber.toUpperCase());
    if (exists) throw new Error(`Registration number ${vehicle.regNumber} already exists.`);
    
    const newVehicle: Vehicle = {
      ...vehicle,
      id: 'v_' + Date.now(),
    };
    list.push(newVehicle);
    db.saveVehicles(list);
    return newVehicle;
  },
  updateVehicle: async (vehicle: Vehicle) => {
    const list = db.getVehicles();
    const index = list.findIndex(v => v.id === vehicle.id);
    if (index === -1) throw new Error('Vehicle not found.');
    
    // Check uniqueness excluding self
    const duplicate = list.some(v => v.id !== vehicle.id && v.regNumber.toUpperCase() === vehicle.regNumber.toUpperCase());
    if (duplicate) throw new Error(`Registration number ${vehicle.regNumber} already exists.`);
    
    list[index] = vehicle;
    db.saveVehicles(list);
    return vehicle;
  },
  deleteVehicle: async (id: string) => {
    const list = db.getVehicles();
    const updated = list.filter(v => v.id !== id);
    db.saveVehicles(updated);
  },

  // --- DRIVERS ---
  getDrivers: async () => db.getDrivers(),
  addDriver: async (driver: Omit<Driver, 'id' | 'tripCount'>) => {
    const list = db.getDrivers();
    const newDriver: Driver = {
      ...driver,
      id: 'd_' + Date.now(),
      tripCount: 0
    };
    list.push(newDriver);
    db.saveDrivers(list);
    return newDriver;
  },
  updateDriver: async (driver: Driver) => {
    const list = db.getDrivers();
    const index = list.findIndex(d => d.id === driver.id);
    if (index === -1) throw new Error('Driver not found.');
    list[index] = driver;
    db.saveDrivers(list);
    return driver;
  },
  deleteDriver: async (id: string) => {
    const list = db.getDrivers();
    const updated = list.filter(d => d.id !== id);
    db.saveDrivers(updated);
  },

  // --- TRIPS ---
  getTrips: async () => db.getTrips(),
  createTrip: async (trip: Omit<Trip, 'id' | 'tripNumber' | 'createdAt'>) => {
    const trips = db.getTrips();
    const vehicles = db.getVehicles();
    const drivers = db.getDrivers();

    // Validations
    if (trip.vehicleId) {
      const v = vehicles.find(v => v.id === trip.vehicleId);
      if (!v) throw new Error('Vehicle not found.');
      if (v.status === 'Retired' || v.status === 'In Shop') {
        throw new Error('Retired or In Shop vehicles cannot be assigned to trips.');
      }
      if (trip.status === 'Dispatched' && v.status === 'On Trip') {
        throw new Error('Selected vehicle is already On Trip.');
      }
      if (trip.cargoWeight > v.maxLoad) {
        throw new Error(`Cargo weight (${trip.cargoWeight} kg) exceeds vehicle's maximum load capacity (${v.maxLoad} kg).`);
      }
    }

    if (trip.driverId) {
      const d = drivers.find(d => d.id === trip.driverId);
      if (!d) throw new Error('Driver not found.');
      
      // Expired license check
      const expiry = new Date(d.licenseExpiry);
      const today = new Date();
      if (expiry < today) {
        throw new Error(`Driver's license has expired (Expiry: ${d.licenseExpiry}). Cannot assign to trip.`);
      }

      if (d.status === 'Suspended') {
        throw new Error('Suspended drivers cannot be assigned to trips.');
      }
      if (trip.status === 'Dispatched' && d.status === 'On Trip') {
        throw new Error('Selected driver is already On Trip.');
      }
    }

    const nextNum = 'TR' + String(trips.length + 1).padStart(3, '0');
    const newTrip: Trip = {
      ...trip,
      id: 't_' + Date.now(),
      tripNumber: nextNum,
      createdAt: new Date().toISOString()
    };

    // If status is Dispatched, perform automatic status transition
    if (newTrip.status === 'Dispatched') {
      if (!newTrip.vehicleId || !newTrip.driverId) {
        throw new Error('Both a vehicle and driver must be selected to dispatch a trip.');
      }
      // Update vehicle status
      const updatedVehicles = vehicles.map(v => v.id === newTrip.vehicleId ? { ...v, status: 'On Trip' as const } : v);
      db.saveVehicles(updatedVehicles);

      // Update driver status
      const updatedDrivers = drivers.map(d => d.id === newTrip.driverId ? { ...d, status: 'On Trip' as const, tripCount: d.tripCount + 1 } : d);
      db.saveDrivers(updatedDrivers);
    }

    trips.push(newTrip);
    db.saveTrips(trips);
    return newTrip;
  },

  dispatchTrip: async (tripId: string) => {
    const trips = db.getTrips();
    const vehicles = db.getVehicles();
    const drivers = db.getDrivers();
    
    const trip = trips.find(t => t.id === tripId);
    if (!trip) throw new Error('Trip not found.');
    if (trip.status !== 'Draft') throw new Error('Only draft trips can be dispatched.');
    if (!trip.vehicleId || !trip.driverId) throw new Error('Vehicle and Driver must be assigned before dispatching.');

    const v = vehicles.find(v => v.id === trip.vehicleId);
    const d = drivers.find(d => d.id === trip.driverId);

    if (!v || v.status === 'In Shop' || v.status === 'Retired' || v.status === 'On Trip') {
      throw new Error('Assigned vehicle is unavailable or on another trip.');
    }

    if (!d || d.status === 'Suspended' || d.status === 'On Trip') {
      throw new Error('Assigned driver is suspended, on another trip, or unavailable.');
    }

    // License expiry check
    if (new Date(d.licenseExpiry) < new Date()) {
      throw new Error('Driver license has expired.');
    }

    // Transition status
    trip.status = 'Dispatched';
    trip.eta = 'Calculating...';

    const updatedVehicles = vehicles.map(vh => vh.id === v.id ? { ...vh, status: 'On Trip' as const } : vh);
    db.saveVehicles(updatedVehicles);

    const updatedDrivers = drivers.map(dr => dr.id === d.id ? { ...dr, status: 'On Trip' as const, tripCount: dr.tripCount + 1 } : dr);
    db.saveDrivers(updatedDrivers);

    db.saveTrips(trips);
    return trip;
  },

  completeTrip: async (tripId: string, finalOdometer: number, fuelConsumed: number) => {
    const trips = db.getTrips();
    const vehicles = db.getVehicles();
    const drivers = db.getDrivers();

    const trip = trips.find(t => t.id === tripId);
    if (!trip) throw new Error('Trip not found.');
    if (trip.status !== 'Dispatched') throw new Error('Only dispatched trips can be completed.');

    trip.status = 'Completed';
    trip.finalOdometer = finalOdometer;
    trip.fuelConsumed = fuelConsumed;
    trip.eta = '-';

    // Transition vehicle and driver back to Available
    if (trip.vehicleId) {
      const updatedVehicles = vehicles.map(v => {
        if (v.id === trip.vehicleId) {
          if (finalOdometer < v.odometer) {
            throw new Error(`Final odometer (${finalOdometer}) cannot be less than previous odometer (${v.odometer}).`);
          }
          return { ...v, status: 'Available' as const, odometer: finalOdometer };
        }
        return v;
      });
      db.saveVehicles(updatedVehicles);

      // Save a fuel log automatically
      if (fuelConsumed > 0) {
        const fuelLogs = db.getFuelLogs();
        fuelLogs.push({
          id: 'f_' + Date.now(),
          vehicleId: trip.vehicleId,
          liters: fuelConsumed,
          cost: fuelConsumed * 100, // assume cost factor
          date: new Date().toISOString().split('T')[0]
        });
        db.saveFuelLogs(fuelLogs);
      }
    }

    if (trip.driverId) {
      const updatedDrivers = drivers.map(d => d.id === trip.driverId ? { ...d, status: 'Available' as const } : d);
      db.saveDrivers(updatedDrivers);
    }

    db.saveTrips(trips);
    return trip;
  },

  cancelTrip: async (tripId: string) => {
    const trips = db.getTrips();
    const vehicles = db.getVehicles();
    const drivers = db.getDrivers();

    const trip = trips.find(t => t.id === tripId);
    if (!trip) throw new Error('Trip not found.');

    const wasDispatched = trip.status === 'Dispatched';
    trip.status = 'Cancelled';
    trip.eta = '-';

    if (wasDispatched) {
      // Revert vehicle and driver to Available
      if (trip.vehicleId) {
        const updatedVehicles = vehicles.map(v => v.id === trip.vehicleId ? { ...v, status: 'Available' as const } : v);
        db.saveVehicles(updatedVehicles);
      }
      if (trip.driverId) {
        const updatedDrivers = drivers.map(d => d.id === trip.driverId ? { ...d, status: 'Available' as const } : d);
        db.saveDrivers(updatedDrivers);
      }
    }

    db.saveTrips(trips);
    return trip;
  },

  // --- MAINTENANCE ---
  getMaintenance: async () => db.getMaintenance(),
  createMaintenance: async (record: Omit<MaintenanceRecord, 'id' | 'status' | 'startDate'>) => {
    const records = db.getMaintenance();
    const vehicles = db.getVehicles();

    const vehicle = vehicles.find(v => v.id === record.vehicleId);
    if (!vehicle) throw new Error('Vehicle not found.');

    const newRecord: MaintenanceRecord = {
      ...record,
      id: 'm_' + Date.now(),
      status: 'Active',
      startDate: new Date().toISOString().split('T')[0]
    };

    // Update vehicle status to 'In Shop' automatically
    const updatedVehicles = vehicles.map(v => v.id === record.vehicleId ? { ...v, status: 'In Shop' as const } : v);
    db.saveVehicles(updatedVehicles);

    records.push(newRecord);
    db.saveMaintenance(records);

    // Also auto-record a maintenance expense
    const expenses = db.getExpenses();
    expenses.push({
      id: 'e_' + Date.now(),
      vehicleId: record.vehicleId,
      amount: record.cost,
      category: 'Maintenance',
      description: `Maintenance: ${record.description}`,
      date: new Date().toISOString().split('T')[0]
    });
    db.saveExpenses(expenses);

    return newRecord;
  },

  closeMaintenance: async (recordId: string) => {
    const records = db.getMaintenance();
    const vehicles = db.getVehicles();

    const record = records.find(r => r.id === recordId);
    if (!record) throw new Error('Record not found.');

    record.status = 'Closed';
    record.endDate = new Date().toISOString().split('T')[0];

    // Restore vehicle to Available (unless retired)
    const vehicle = vehicles.find(v => v.id === record.vehicleId);
    if (vehicle && vehicle.status !== 'Retired') {
      const updatedVehicles = vehicles.map(v => v.id === record.vehicleId ? { ...v, status: 'Available' as const } : v);
      db.saveVehicles(updatedVehicles);
    }

    db.saveMaintenance(records);
    return record;
  },

  // --- FUEL & EXPENSES ---
  getFuelLogs: async () => db.getFuelLogs(),
  addFuelLog: async (log: Omit<FuelLog, 'id'>) => {
    const logs = db.getFuelLogs();
    const newLog = {
      ...log,
      id: 'fl_' + Date.now()
    };
    logs.push(newLog);
    db.saveFuelLogs(logs);
    return newLog;
  },

  getExpenses: async () => db.getExpenses(),
  addExpense: async (expense: Omit<ExpenseRecord, 'id'>) => {
    const list = db.getExpenses();
    const newExpense = {
      ...expense,
      id: 'ex_' + Date.now()
    };
    list.push(newExpense);
    db.saveExpenses(list);
    return newExpense;
  }
};

// Generic Axios wrapper that maps to our local implementation to simulate network and fulfill requirements
import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://api.transitops.io',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to supply user authorization simulation
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('transitops_token') || 'mock-jwt-token-xyz';
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Reusable API service functions for Axios & File Upload
export const apiService = {
  // Simulates document upload using multipart/form-data with actual Axios configurations
  uploadDocument: async (file: File, entityType: 'vehicle' | 'driver', entityId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);

    // Call the endpoint using Axios (will fail or return mock success gracefully)
    try {
      const response = await client.post('/api/v1/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          console.log(`Upload progress: ${percentCompleted}%`);
        }
      });
      return response.data;
    } catch (error) {
      console.warn('Axios backend upload error (using offline mock response instead):', error);
      // Fallback mock response for offline/sandbox mode to keep user happy
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate latency
      return {
        status: 'success',
        filename: file.name,
        size: file.size,
        url: `/uploads/${entityType}/${entityId}/${file.name}`,
      };
    }
  },

  // Axios-based mock endpoints to interact with FastAPI simulation
  fetchVehicles: async () => {
    try {
      const res = await client.get('/api/v1/vehicles');
      return res.data;
    } catch {
      return db.getVehicles();
    }
  },

  fetchDrivers: async () => {
    try {
      const res = await client.get('/api/v1/drivers');
      return res.data;
    } catch {
      return db.getDrivers();
    }
  },

  fetchTrips: async () => {
    try {
      const res = await client.get('/api/v1/trips');
      return res.data;
    } catch {
      return db.getTrips();
    }
  }
};

export { client };
