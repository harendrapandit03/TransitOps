import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Vehicle, Trip, Driver } from '../services/types';
import { 
  Truck, 
  CheckCircle2, 
  Wrench, 
  Navigation, 
  Clock, 
  Users, 
  TrendingUp,
  Search,
  SlidersHorizontal
} from 'lucide-react';
import toast from 'react-hot-toast';

export const DashboardPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  
  // Filters
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [regionFilter, setRegionFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const v = await api.getVehicles();
      const t = await api.getTrips();
      const d = await api.getDrivers();
      setVehicles(v);
      setTrips(t);
      setDrivers(d);
    } catch (e: any) {
      toast.error('Error loading dashboard data: ' + e.message);
    }
  };

  // KPI Calculations
  const filteredVehicles = vehicles.filter(v => {
    const matchType = vehicleTypeFilter === 'All' || v.type.toLowerCase() === vehicleTypeFilter.toLowerCase();
    const matchStatus = statusFilter === 'All' || v.status.toLowerCase() === statusFilter.toLowerCase();
    const matchRegion = regionFilter === 'All' || v.region?.toLowerCase() === regionFilter.toLowerCase();
    const matchSearch = v.name.toLowerCase().includes(searchQuery.toLowerCase()) || v.regNumber.toLowerCase().includes(searchQuery.toLowerCase());
    return matchType && matchStatus && matchRegion && matchSearch;
  });

  const activeVehicles = filteredVehicles.length;
  const availableVehicles = filteredVehicles.filter(v => v.status === 'Available').length;
  const inMaintenance = filteredVehicles.filter(v => v.status === 'In Shop').length;
  
  const activeTripsCount = trips.filter(t => t.status === 'Dispatched').length;
  const pendingTripsCount = trips.filter(t => t.status === 'Draft').length;
  const driversOnDuty = drivers.filter(d => d.status === 'On Trip' || d.status === 'Available').length;
  
  // Fleet Utilization: (On Trip Vehicles / Total Active Vehicles) * 100
  const onTripVehiclesCount = filteredVehicles.filter(v => v.status === 'On Trip').length;
  const fleetUtilization = filteredVehicles.length > 0 
    ? Math.round((onTripVehiclesCount / filteredVehicles.length) * 100) 
    : 0;

  // Render Trip Status badge helper
  const getTripStatusClass = (status: Trip['status']) => {
    switch (status) {
      case 'Draft': return 'bg-slate-100 text-slate-700 border-slate-300';
      case 'Dispatched': return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'Completed': return 'bg-green-100 text-green-700 border-green-300';
      case 'Cancelled': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-8 text-slate-900">
      {/* Page Title & Search */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-slate-500 mt-1">Real-time metrics and overall fleet operations</p>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full md:w-80">
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border-2 border-slate-200 focus:outline-none focus:border-[#eab308] text-sm text-slate-900 bg-white shadow-sm"
            placeholder="Search vehicles by name/reg..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-3 top-3" />
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 text-slate-700 font-semibold text-sm">
          <SlidersHorizontal className="w-4 h-4" />
          <span>Quick Filters</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Vehicle Type</label>
            <select
              value={vehicleTypeFilter}
              onChange={(e) => setVehicleTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-[#eab308]"
            >
              <option value="All">All Types</option>
              <option value="Van">Van</option>
              <option value="Truck">Truck</option>
              <option value="Mini">Mini</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Vehicle Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-[#eab308]"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="In Shop">In Shop</option>
              <option value="Retired">Retired</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Region</label>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-[#eab308]"
            >
              <option value="All">All Regions</option>
              <option value="North">North</option>
              <option value="South">South</option>
              <option value="East">East</option>
              <option value="West">West</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid (Matching the specific list requested in 3.2 Dashboard) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Active Vehicles */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-4 text-slate-900">
          <div className="p-3 rounded-lg bg-slate-100 text-slate-700">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Vehicles</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{activeVehicles}</h3>
          </div>
        </div>

        {/* Available Vehicles */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-4 text-slate-900">
          <div className="p-3 rounded-lg bg-green-50 text-green-700">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Available Vehicles</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{availableVehicles}</h3>
          </div>
        </div>

        {/* Vehicles in Maintenance */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-4 text-slate-900">
          <div className="p-3 rounded-lg bg-amber-50 text-amber-700">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">In Maintenance</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{inMaintenance}</h3>
          </div>
        </div>

        {/* Active Trips */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-4 text-slate-900">
          <div className="p-3 rounded-lg bg-blue-50 text-blue-700">
            <Navigation className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Trips</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{activeTripsCount}</h3>
          </div>
        </div>

        {/* Pending Trips */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-4 text-slate-900">
          <div className="p-3 rounded-lg bg-indigo-50 text-indigo-700">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Trips</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{pendingTripsCount}</h3>
          </div>
        </div>

        {/* Drivers On Duty */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-4 text-slate-900">
          <div className="p-3 rounded-lg bg-teal-50 text-teal-700">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Drivers On Duty</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{driversOnDuty}</h3>
          </div>
        </div>

        {/* Fleet Utilization (%) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-4 col-span-2 text-slate-900">
          <div className="p-3 rounded-lg bg-yellow-50 text-[#ca8a04]">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fleet Utilization (%)</p>
            <div className="flex items-center space-x-4 mt-1">
              <h3 className="text-2xl font-black text-slate-900">{fleetUtilization}%</h3>
              <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#eab308] h-full rounded-full transition-all duration-500" 
                  style={{ width: `${fleetUtilization}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Sections: Recent Trips & Status Bar Progress (matches Sketch exactly) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Recent Trips list (matches TR001, TR002 format) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-slate-900">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Trips & Dispatch Status</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold text-slate-500 uppercase">
                  <th className="py-3">Trip</th>
                  <th className="py-3">Vehicle</th>
                  <th className="py-3">Driver</th>
                  <th className="py-3">Status</th>
                  <th className="py-3">ETA</th>
                </tr>
              </thead>
              <tbody className="text-sm font-semibold text-slate-700 divide-y divide-slate-50">
                {trips.slice(0, 6).map((trip) => {
                  const vehicle = vehicles.find(v => v.id === trip.vehicleId);
                  const driver = drivers.find(d => d.id === trip.driverId);
                  return (
                    <tr key={trip.id} className="hover:bg-slate-50/50 transition duration-150">
                      <td className="py-3 text-slate-900 font-bold">{trip.tripNumber}</td>
                      <td className="py-3">{vehicle ? vehicle.name : '—'}</td>
                      <td className="py-3">{driver ? driver.name : '—'}</td>
                      <td className="py-3">
                        <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider border ${getTripStatusClass(trip.status)}`}>
                          {trip.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-500 text-xs">{trip.eta || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Vehicle Status visual breakdown (matches Sketch visual bars) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6 text-slate-900">
          <h3 className="text-lg font-bold text-slate-900">Vehicle Status Summary</h3>
          <p className="text-xs text-slate-500 -mt-4">Proportion of vehicles by current status</p>

          <div className="space-y-4">
            {/* Available */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm font-semibold">
                <span className="flex items-center space-x-2 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                  <span>Available</span>
                </span>
                <span className="text-slate-500">
                  {vehicles.filter(v => v.status === 'Available').length} vehicles
                </span>
              </div>
              <div className="bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-green-500 h-full rounded-full transition-all"
                  style={{ width: `${vehicles.length ? (vehicles.filter(v => v.status === 'Available').length / vehicles.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* On Trip */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm font-semibold">
                <span className="flex items-center space-x-2 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span>On Trip</span>
                </span>
                <span className="text-slate-500">
                  {vehicles.filter(v => v.status === 'On Trip').length} vehicles
                </span>
              </div>
              <div className="bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-500 h-full rounded-full transition-all"
                  style={{ width: `${vehicles.length ? (vehicles.filter(v => v.status === 'On Trip').length / vehicles.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* In Shop */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm font-semibold">
                <span className="flex items-center space-x-2 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  <span>In Shop</span>
                </span>
                <span className="text-slate-500">
                  {vehicles.filter(v => v.status === 'In Shop').length} vehicles
                </span>
              </div>
              <div className="bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-amber-500 h-full rounded-full transition-all"
                  style={{ width: `${vehicles.length ? (vehicles.filter(v => v.status === 'In Shop').length / vehicles.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Retired */}
            <div className="space-y-1">
              <div className="flex justify-between text-sm font-semibold">
                <span className="flex items-center space-x-2 text-slate-700">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                  <span>Retired</span>
                </span>
                <span className="text-slate-500">
                  {vehicles.filter(v => v.status === 'Retired').length} vehicles
                </span>
              </div>
              <div className="bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="bg-red-500 h-full rounded-full transition-all"
                  style={{ width: `${vehicles.length ? (vehicles.filter(v => v.status === 'Retired').length / vehicles.length) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
