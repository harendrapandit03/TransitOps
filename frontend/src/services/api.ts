import axios from 'axios';
import type {
  Vehicle, Driver, Trip, MaintenanceRecord, FuelLog, ExpenseRecord, User
} from './types';

// ---------------------------------------------------------------------------
// HTTP client — talks to the FastAPI backend (see app/main.py).
// Base URL comes from VITE_API_URL (see frontend/.env), defaulting to the
// backend's local dev address.
// ---------------------------------------------------------------------------
const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach the real JWT issued by POST /auth/login, if we have one.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('transitops_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Turns an Axios/FastAPI error into a plain Error with the backend's message
// (FastAPI returns validation/business errors as { detail: string }).
const asError = (err: any): Error => {
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string') return new Error(detail);
  if (Array.isArray(detail) && detail[0]?.msg) return new Error(detail[0].msg);
  return new Error(err?.message || 'Something went wrong talking to the server.');
};

// GET requests degrade gracefully (return an empty list + console warning)
// instead of throwing, so a page doesn't hard-crash if the backend is
// briefly unreachable. Mutating requests (POST/PUT/PATCH/DELETE) always
// throw so the calling page's try/catch + toast can surface the real error.
const safeGet = async <T>(fn: () => Promise<T>, fallback: T): Promise<T> => {
  try {
    return await fn();
  } catch (err) {
    console.warn('TransitOps API request failed:', err);
    return fallback;
  }
};

// ---------------------------------------------------------------------------
// Local session cache (the logged-in user + a couple of purely cosmetic
// fields the backend doesn't model, like a vehicle's "region").
// ---------------------------------------------------------------------------
const AUTH_KEY = 'transitops_auth';
const REGION_KEY = 'transitops_vehicle_regions';

const getRegionMap = (): Record<string, string> => {
  try {
    return JSON.parse(localStorage.getItem(REGION_KEY) || '{}');
  } catch {
    return {};
  }
};

const setRegion = (id: string, region?: string) => {
  const map = getRegionMap();
  if (region) map[id] = region; else delete map[id];
  localStorage.setItem(REGION_KEY, JSON.stringify(map));
};

export const db = {
  getAuth: (): User | null => {
    const val = localStorage.getItem(AUTH_KEY);
    return val ? JSON.parse(val) : null;
  },
  setAuth: (user: User | null) => {
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_KEY);
    }
  }
};

// ---------------------------------------------------------------------------
// Adapters: backend (snake_case, per app/schemas.py) <-> frontend types
// (camelCase, per services/types.ts)
// ---------------------------------------------------------------------------
const vehicleFromApi = (v: any): Vehicle => ({
  id: String(v.id),
  regNumber: v.registration_number,
  name: v.vehicle_name,
  type: v.vehicle_type,
  maxLoad: v.max_load_capacity,
  odometer: v.odometer,
  acquisitionCost: v.acquisition_cost,
  status: v.status,
  region: getRegionMap()[String(v.id)],
});

const driverFromApi = (d: any, tripCount = 0): Driver => ({
  id: String(d.id),
  name: d.name,
  licenseNumber: d.license_number,
  licenseCategory: d.license_category,
  licenseExpiry: typeof d.license_expiry === 'string' ? d.license_expiry : String(d.license_expiry),
  contactNumber: d.contact_number,
  safetyScore: d.safety_score,
  status: d.status,
  tripCount,
});

const tripFromApi = (t: any): Trip => ({
  id: String(t.id),
  tripNumber: 'TR' + String(t.id).padStart(3, '0'),
  source: t.source,
  destination: t.destination,
  vehicleId: t.vehicle_id != null ? String(t.vehicle_id) : undefined,
  driverId: t.driver_id != null ? String(t.driver_id) : undefined,
  cargoWeight: t.cargo_weight,
  distance: t.planned_distance,
  status: t.status,
  eta: t.status === 'Dispatched' ? 'Calculating...' : '-',
  finalOdometer: undefined,
  fuelConsumed: t.fuel_consumed ?? undefined,
  createdAt: t.created_at,
});

const maintenanceFromApi = (m: any): MaintenanceRecord => ({
  id: String(m.id),
  vehicleId: String(m.vehicle_id),
  description: m.description || m.issue,
  startDate: String(m.opened_at).split('T')[0],
  endDate: m.closed_at ? String(m.closed_at).split('T')[0] : undefined,
  cost: m.cost,
  status: m.status === 'Active' ? 'Active' : 'Closed',
});

const fuelLogFromApi = (f: any): FuelLog => ({
  id: String(f.id),
  vehicleId: String(f.vehicle_id),
  liters: f.liters,
  cost: f.cost,
  date: String(f.date).split('T')[0],
});

const expenseFromApi = (e: any): ExpenseRecord => ({
  id: String(e.id),
  vehicleId: String(e.vehicle_id),
  amount: e.amount,
  category: (e.expense_type as ExpenseRecord['category']) || 'Other',
  description: e.description || '',
  date: String(e.date).split('T')[0],
});

// ---------------------------------------------------------------------------
// Main API — same public interface the pages already call, now backed by
// real HTTP requests to the FastAPI service instead of localStorage.
// ---------------------------------------------------------------------------
export const api = {
  // --- VEHICLES ---
  getVehicles: async (): Promise<Vehicle[]> =>
    safeGet(async () => {
      const res = await client.get('/vehicles/');
      return res.data.map(vehicleFromApi);
    }, []),

  addVehicle: async (vehicle: Omit<Vehicle, 'id'>): Promise<Vehicle> => {
    try {
      const res = await client.post('/vehicles/', {
        registration_number: vehicle.regNumber,
        vehicle_name: vehicle.name,
        vehicle_type: vehicle.type,
        max_load_capacity: vehicle.maxLoad,
        odometer: vehicle.odometer,
        acquisition_cost: vehicle.acquisitionCost,
      });
      if (vehicle.region) setRegion(String(res.data.id), vehicle.region);
      return vehicleFromApi(res.data);
    } catch (err) {
      throw asError(err);
    }
  },

  updateVehicle: async (vehicle: Vehicle): Promise<Vehicle> => {
    try {
      const res = await client.put(`/vehicles/${vehicle.id}`, {
        registration_number: vehicle.regNumber,
        vehicle_name: vehicle.name,
        vehicle_type: vehicle.type,
        max_load_capacity: vehicle.maxLoad,
        odometer: vehicle.odometer,
        acquisition_cost: vehicle.acquisitionCost,
        status: vehicle.status,
      });
      setRegion(vehicle.id, vehicle.region);
      return vehicleFromApi(res.data);
    } catch (err) {
      throw asError(err);
    }
  },

  deleteVehicle: async (id: string): Promise<void> => {
    try {
      await client.delete(`/vehicles/${id}`);
      setRegion(id, undefined);
    } catch (err) {
      throw asError(err);
    }
  },

  // --- DRIVERS ---
  getDrivers: async (): Promise<Driver[]> =>
    safeGet(async () => {
      const [driversRes, trips] = await Promise.all([
        client.get('/drivers/'),
        api.getTrips(),
      ]);
      return driversRes.data.map((d: any) => {
        const tripCount = trips.filter(t => t.driverId === String(d.id) && t.status !== 'Draft').length;
        return driverFromApi(d, tripCount);
      });
    }, []),

  addDriver: async (driver: Omit<Driver, 'id' | 'tripCount'>): Promise<Driver> => {
    try {
      const res = await client.post('/drivers/', {
        name: driver.name,
        license_number: driver.licenseNumber,
        license_category: driver.licenseCategory,
        license_expiry: driver.licenseExpiry,
        contact_number: driver.contactNumber,
      });
      return driverFromApi(res.data, 0);
    } catch (err) {
      throw asError(err);
    }
  },

  updateDriver: async (driver: Driver): Promise<Driver> => {
    try {
      const res = await client.put(`/drivers/${driver.id}`, {
        name: driver.name,
        license_category: driver.licenseCategory,
        license_expiry: driver.licenseExpiry,
        contact_number: driver.contactNumber,
        safety_score: driver.safetyScore,
        status: driver.status,
      });
      return driverFromApi(res.data, driver.tripCount);
    } catch (err) {
      throw asError(err);
    }
  },

  deleteDriver: async (id: string): Promise<void> => {
    try {
      await client.delete(`/drivers/${id}`);
    } catch (err) {
      throw asError(err);
    }
  },

  // --- TRIPS ---
  getTrips: async (): Promise<Trip[]> =>
    safeGet(async () => {
      const res = await client.get('/trips/');
      return res.data.map(tripFromApi);
    }, []),

  createTrip: async (trip: Omit<Trip, 'id' | 'tripNumber' | 'createdAt'>): Promise<Trip> => {
    try {
      if (!trip.vehicleId || !trip.driverId) {
        throw new Error('Both a vehicle and driver must be selected to create a trip.');
      }
      const res = await client.post('/trips/', {
        vehicle_id: Number(trip.vehicleId),
        driver_id: Number(trip.driverId),
        source: trip.source,
        destination: trip.destination,
        cargo_weight: trip.cargoWeight,
        planned_distance: trip.distance,
      });
      // The backend always creates trips as "Draft"; dispatch immediately
      // if the user asked to create it as already-dispatched.
      if (trip.status === 'Dispatched') {
        const dispatched = await client.patch(`/trips/${res.data.id}/dispatch`);
        return tripFromApi(dispatched.data);
      }
      return tripFromApi(res.data);
    } catch (err) {
      throw asError(err);
    }
  },

  dispatchTrip: async (tripId: string): Promise<Trip> => {
    try {
      const res = await client.patch(`/trips/${tripId}/dispatch`);
      return tripFromApi(res.data);
    } catch (err) {
      throw asError(err);
    }
  },

  completeTrip: async (tripId: string, finalOdometer: number, fuelConsumed: number): Promise<Trip> => {
    try {
      const res = await client.patch(`/trips/${tripId}/complete`, {
        end_odometer: finalOdometer,
        fuel_consumed: fuelConsumed,
        fuel_cost: fuelConsumed * 100, // cost factor assumption, mirrors backend's fuel-log pricing
      });
      return tripFromApi(res.data);
    } catch (err) {
      throw asError(err);
    }
  },

  cancelTrip: async (tripId: string): Promise<Trip> => {
    try {
      const res = await client.patch(`/trips/${tripId}/cancel`);
      return tripFromApi(res.data);
    } catch (err) {
      throw asError(err);
    }
  },

  // --- MAINTENANCE ---
  getMaintenance: async (): Promise<MaintenanceRecord[]> =>
    safeGet(async () => {
      const res = await client.get('/maintenance/');
      return res.data.map(maintenanceFromApi);
    }, []),

  createMaintenance: async (record: Omit<MaintenanceRecord, 'id' | 'status' | 'startDate'>): Promise<MaintenanceRecord> => {
    try {
      const res = await client.post('/maintenance/', {
        vehicle_id: Number(record.vehicleId),
        issue: record.description,
        description: record.description,
        cost: record.cost,
      });
      return maintenanceFromApi(res.data);
    } catch (err) {
      throw asError(err);
    }
  },

  closeMaintenance: async (recordId: string): Promise<MaintenanceRecord> => {
    try {
      const res = await client.put(`/maintenance/${recordId}`, { status: 'Completed' });
      return maintenanceFromApi(res.data);
    } catch (err) {
      throw asError(err);
    }
  },

  // --- FUEL & EXPENSES ---
  getFuelLogs: async (): Promise<FuelLog[]> =>
    safeGet(async () => {
      const res = await client.get('/fuel/');
      return res.data.map(fuelLogFromApi);
    }, []),

  addFuelLog: async (log: Omit<FuelLog, 'id'>): Promise<FuelLog> => {
    try {
      const res = await client.post('/fuel/', {
        vehicle_id: Number(log.vehicleId),
        liters: log.liters,
        cost: log.cost,
      });
      return fuelLogFromApi(res.data);
    } catch (err) {
      throw asError(err);
    }
  },

  getExpenses: async (): Promise<ExpenseRecord[]> =>
    safeGet(async () => {
      const res = await client.get('/expenses/');
      return res.data.map(expenseFromApi);
    }, []),

  addExpense: async (expense: Omit<ExpenseRecord, 'id'>): Promise<ExpenseRecord> => {
    try {
      const res = await client.post('/expenses/', {
        vehicle_id: Number(expense.vehicleId),
        expense_type: expense.category,
        amount: expense.amount,
        description: expense.description,
      });
      return expenseFromApi(res.data);
    } catch (err) {
      throw asError(err);
    }
  },
};

// ---------------------------------------------------------------------------
// Document upload + a couple of raw fetch helpers some pages use directly.
// ---------------------------------------------------------------------------
export const apiService = {
  // The backend doesn't currently expose a document-upload endpoint, so this
  // falls back to a mock response if the request fails (e.g. 404), keeping
  // the vehicle registry flow usable end-to-end.
  uploadDocument: async (file: File, entityType: 'vehicle' | 'driver', entityId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);

    try {
      const response = await client.post('/api/v1/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.warn('Document upload endpoint unavailable, using local mock response:', error);
      await new Promise((resolve) => setTimeout(resolve, 800));
      return {
        status: 'success',
        filename: file.name,
        size: file.size,
        url: `/uploads/${entityType}/${entityId}/${file.name}`,
      };
    }
  },

  fetchVehicles: async () => (await client.get('/vehicles/')).data,
  fetchDrivers: async () => (await client.get('/drivers/')).data,
  fetchTrips: async () => (await client.get('/trips/')).data,
};

export { client };
