import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Trip, Vehicle, Driver } from '../services/types';
import { Plus, Navigation, AlertCircle, Check, X, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export const TripManagementPage: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);

  // Form Fields for trip creation
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [cargoWeight, setCargoWeight] = useState<number>(0);
  const [distance, setDistance] = useState<number>(0);
  const [tripStatus, setTripStatus] = useState<'Draft' | 'Dispatched'>('Draft');

  // Complete Trip inputs
  const [finalOdometer, setFinalOdometer] = useState<number>(0);
  const [fuelConsumed, setFuelConsumed] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const t = await api.getTrips();
      const v = await api.getVehicles();
      const d = await api.getDrivers();
      setTrips(t);
      setVehicles(v);
      setDrivers(d);
    } catch (err: any) {
      toast.error('Error fetching data: ' + err.message);
    }
  };

  const openCreateModal = () => {
    setSource('');
    setDestination('');
    setVehicleId('');
    setDriverId('');
    setCargoWeight(0);
    setDistance(0);
    setTripStatus('Draft');
    setShowCreateModal(true);
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!source || !destination) {
      toast.error('Please specify source and destination.');
      return;
    }

    try {
      await api.createTrip({
        source,
        destination,
        vehicleId: vehicleId || undefined,
        driverId: driverId || undefined,
        cargoWeight,
        distance,
        status: tripStatus
      });
      toast.success(tripStatus === 'Dispatched' ? 'Trip Dispatched and assets updated!' : 'Draft trip created!');
      setShowCreateModal(false);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDispatch = async (tripId: string) => {
    try {
      await api.dispatchTrip(tripId);
      toast.success('Trip successfully dispatched!');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCancel = async (tripId: string) => {
    if (window.confirm('Are you sure you want to cancel this trip? assigned resources will revert to Available.')) {
      try {
        await api.cancelTrip(tripId);
        toast.success('Trip cancelled successfully.');
        loadData();
      } catch (err: any) {
        toast.error(err.message);
      }
    }
  };

  const openCompleteModal = (trip: Trip) => {
    const vehicle = vehicles.find(v => v.id === trip.vehicleId);
    setSelectedTripId(trip.id);
    setFinalOdometer(vehicle ? vehicle.odometer + trip.distance : 0);
    setFuelConsumed(Math.round(trip.distance * 0.25)); // Estimate fuel
    setShowCompleteModal(true);
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTripId) return;

    try {
      await api.completeTrip(selectedTripId, finalOdometer, fuelConsumed);
      toast.success('Trip Completed successfully! Vehicles & Driver status are now Available.');
      setShowCompleteModal(false);
      setSelectedTripId(null);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Dispatch lists for forms
  // Only select non-retired, non-in-shop vehicles
  const dispatchableVehicles = vehicles.filter(v => v.status === 'Available');
  
  // Only select drivers with non-expired license and non-suspended status
  const today = new Date();
  const dispatchableDrivers = drivers.filter(d => {
    const validLicense = new Date(d.licenseExpiry) >= today;
    const active = d.status === 'Available';
    return validLicense && active;
  });

  return (
    <div className="space-y-8 text-slate-900">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Trip Dispatch & Management</h1>
          <p className="text-slate-500 mt-1">Deploy deliveries, enforce loading capacities, and monitor dispatch cycles</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center space-x-2 bg-[#eab308] hover:bg-yellow-600 text-slate-900 px-5 py-3 rounded-lg font-bold shadow-md transition transform active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>New Dispatch Trip</span>
        </button>
      </div>

      {/* Rules Notice */}
      <div className="p-4 bg-yellow-50 border-2 border-dashed border-yellow-200 rounded-lg flex items-start space-x-3 text-slate-800 text-sm">
        <AlertCircle className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Operational Safety & Business Rules Enforcement:</p>
          <ul className="list-disc list-inside space-y-1 text-xs text-slate-600">
            <li>Retired or In-Shop vehicles are strictly hidden from Dispatch selections.</li>
            <li>Suspended or Expired-license drivers are strictly hidden from Dispatch selections.</li>
            <li>Dispatching a trip automatically transitions both Vehicle & Driver status to <strong className="text-blue-700">On Trip</strong>.</li>
            <li>Completing a trip automatically returns both Vehicle & Driver status to <strong className="text-green-700">Available</strong>, updates vehicle odometer, and saves a fuel log.</li>
          </ul>
        </div>
      </div>

      {/* Trip Cards / Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-950">Active & Logged Trips</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">Trip ID</th>
                <th className="py-4 px-6">Route</th>
                <th className="py-4 px-6">Assigned Vehicle</th>
                <th className="py-4 px-6">Assigned Driver</th>
                <th className="py-4 px-6">Cargo Weight</th>
                <th className="py-4 px-6">Distance</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm font-semibold text-slate-700 divide-y divide-slate-100">
              {trips.map((trip) => {
                const vehicle = vehicles.find(v => v.id === trip.vehicleId);
                const driver = drivers.find(d => d.id === trip.driverId);
                return (
                  <tr key={trip.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6 text-slate-900 font-bold">{trip.tripNumber}</td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="text-slate-900 font-bold">{trip.destination}</div>
                        <div className="text-xs text-slate-500">From: {trip.source}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {vehicle ? (
                        <div>
                          <div className="font-bold">{vehicle.name}</div>
                          <div className="text-xs text-slate-500">{vehicle.regNumber}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic font-normal">No Vehicle Assigned</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      {driver ? (
                        <div>
                          <div className="font-bold">{driver.name}</div>
                          <div className="text-xs text-slate-500">DL: {driver.licenseNumber}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic font-normal">No Driver Assigned</span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div>
                        <div>{trip.cargoWeight} kg</div>
                        {vehicle && trip.cargoWeight > vehicle.maxLoad && (
                          <span className="text-xs text-red-600 font-bold">EXCEEDS CAPACITY!</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">{trip.distance} km</td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold border uppercase tracking-wider ${
                        trip.status === 'Draft' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                        trip.status === 'Dispatched' ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse' :
                        trip.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {trip.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {trip.status === 'Draft' && (
                          <button
                            onClick={() => handleDispatch(trip.id)}
                            className="flex items-center space-x-1 text-white bg-blue-600 hover:bg-blue-700 px-2.5 py-1.5 rounded text-xs font-bold transition shadow-xs"
                          >
                            <Navigation className="w-3 h-3" />
                            <span>Dispatch</span>
                          </button>
                        )}

                        {trip.status === 'Dispatched' && (
                          <button
                            onClick={() => openCompleteModal(trip)}
                            className="flex items-center space-x-1 text-white bg-green-600 hover:bg-green-700 px-2.5 py-1.5 rounded text-xs font-bold transition shadow-xs"
                          >
                            <Check className="w-3 h-3" />
                            <span>Complete</span>
                          </button>
                        )}

                        {(trip.status === 'Draft' || trip.status === 'Dispatched') && (
                          <button
                            onClick={() => handleCancel(trip.id)}
                            className="flex items-center space-x-1 text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded text-xs font-bold transition"
                          >
                            <X className="w-3 h-3" />
                            <span>Cancel</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg mx-4 rounded-xl border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-950">Create New Dispatch Trip</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateTrip} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Source / Hub Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Warehouse A"
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-[#eab308]"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Destination Location</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Client Site 1"
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-[#eab308]"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Available Vehicle</label>
                  <select
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-[#eab308] cursor-pointer text-slate-800 font-semibold"
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                  >
                    <option value="">-- No vehicle (Keep Draft) --</option>
                    {dispatchableVehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name} ({v.regNumber}) - Max {v.maxLoad} kg
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Active Driver</label>
                  <select
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-[#eab308] cursor-pointer text-slate-800 font-semibold"
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                  >
                    <option value="">-- No driver (Keep Draft) --</option>
                    {dispatchableDrivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.licenseCategory}) - Safety: {d.safetyScore}%
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cargo Weight (kg)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-[#eab308]"
                    value={cargoWeight}
                    onChange={(e) => setCargoWeight(Number(e.target.value))}
                  />
                  {vehicleId && (vehicles.find(v => v.id === vehicleId)?.maxLoad || 0) < cargoWeight && (
                    <span className="text-[10px] text-red-600 font-bold">
                      ⚠️ EXCEEDS selected vehicle max capacity of {vehicles.find(v => v.id === vehicleId)?.maxLoad} kg!
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Planned Distance (km)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-[#eab308]"
                    value={distance}
                    onChange={(e) => setDistance(Number(e.target.value))}
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Initial Dispatch Action</label>
                  <select
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-[#eab308] cursor-pointer text-slate-800 font-semibold"
                    value={tripStatus}
                    onChange={(e) => setTripStatus(e.target.value as 'Draft' | 'Dispatched')}
                  >
                    <option value="Draft">Draft (Save & Hold)</option>
                    <option value="Dispatched">Dispatch Immediately (Set On Trip)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border-2 border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#eab308] hover:bg-yellow-600 text-slate-900 font-bold rounded-lg text-sm shadow-md transition"
                >
                  Log Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Trip Modal */}
      {showCompleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md mx-4 rounded-xl border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-950">Complete Trip & Log Fuel</h3>
              <button onClick={() => { setShowCompleteModal(false); setSelectedTripId(null); }} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="p-6 space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800 flex items-start space-x-2">
                <ShieldAlert className="w-4.5 h-4.5 text-blue-600 shrink-0 mt-0.5" />
                <span>Entering final odometer and fuel levels automatically unlocks the vehicle/driver back to <strong>Available</strong>.</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Final Vehicle Odometer (km)</label>
                <input
                  type="number"
                  required
                  min={1}
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-[#eab308]"
                  value={finalOdometer}
                  onChange={(e) => setFinalOdometer(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Fuel Consumed (Liters)</label>
                <input
                  type="number"
                  required
                  min={1}
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-[#eab308]"
                  value={fuelConsumed}
                  onChange={(e) => setFuelConsumed(Number(e.target.value))}
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => { setShowCompleteModal(false); setSelectedTripId(null); }}
                  className="px-4 py-2 border-2 border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm shadow-md transition"
                >
                  Complete & Release
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
