import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { MaintenanceRecord, Vehicle } from '../services/types';
import { Plus, Wrench, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const MaintenanceLogPage: React.FC = () => {
  const [logs, setLogs] = useState<MaintenanceRecord[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Form states
  const [vehicleId, setVehicleId] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState<number>(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const l = await api.getMaintenance();
    const v = await api.getVehicles();
    setLogs(l);
    setVehicles(v);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !description) {
      toast.error('Please specify vehicle and description.');
      return;
    }

    try {
      await api.createMaintenance({
        vehicleId,
        description,
        cost
      });
      toast.success('Maintenance record logged. Vehicle status changed to In Shop.');
      setShowModal(false);
      setDescription('');
      setCost(0);
      setVehicleId('');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleClose = async (id: string) => {
    try {
      await api.closeMaintenance(id);
      toast.success('Maintenance log closed. Vehicle status restored to Available.');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-8 text-slate-900">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Maintenance Logs</h1>
          <p className="text-slate-500 mt-1">Track vehicle repairs, maintenance intervals, and shop statuses</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-[#eab308] hover:bg-yellow-600 text-slate-900 px-5 py-3 rounded-lg font-bold shadow-md transition transform active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>New Maintenance Job</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-950">Active & Past Repair Records</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">Vehicle</th>
                <th className="py-4 px-6">Description</th>
                <th className="py-4 px-6">Start Date</th>
                <th className="py-4 px-6">End Date</th>
                <th className="py-4 px-6">Repair Cost</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm font-semibold text-slate-700 divide-y divide-slate-100">
              {logs.map((record) => {
                const vehicle = vehicles.find(v => v.id === record.vehicleId);
                return (
                  <tr key={record.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6">
                      {vehicle ? (
                        <div>
                          <div className="font-bold">{vehicle.name}</div>
                          <div className="text-xs text-slate-500">{vehicle.regNumber}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-normal">Unknown Vehicle</span>
                      )}
                    </td>
                    <td className="py-4 px-6 max-w-xs truncate" title={record.description}>
                      {record.description}
                    </td>
                    <td className="py-4 px-6">{record.startDate}</td>
                    <td className="py-4 px-6">{record.endDate || '—'}</td>
                    <td className="py-4 px-6">${record.cost.toLocaleString()}</td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold border uppercase tracking-wider ${
                        record.status === 'Active' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' : 'bg-green-50 text-green-700 border-green-200'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {record.status === 'Active' && (
                        <button
                          onClick={() => handleClose(record.id)}
                          className="inline-flex items-center space-x-1 text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded text-xs font-bold transition shadow-xs"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Close & Release</span>
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                    No registered maintenance logs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-md mx-4 rounded-xl border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-950">Add Maintenance Record</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-start space-x-2">
                <Wrench className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                <span>Logging active repairs automatically transitions vehicle status to <strong>In Shop</strong> (withdrawing it from available trip selection pools).</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Select Vehicle</label>
                <select
                  required
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-[#eab308] cursor-pointer"
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                >
                  <option value="">-- Choose fleet vehicle --</option>
                  {vehicles.filter(v => v.status !== 'Retired').map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.regNumber}) - Status: {v.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Service Description</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Regular oil changes, brake pads replacement..."
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-[#eab308]"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Estimated Cost ($)</label>
                <input
                  type="number"
                  required
                  min={0}
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-[#eab308]"
                  value={cost}
                  onChange={(e) => setCost(Number(e.target.value))}
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border-2 border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#eab308] hover:bg-yellow-600 text-slate-900 font-bold rounded-lg text-sm shadow-md transition"
                >
                  Issue Work Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
