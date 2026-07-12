import React, { useState, useEffect } from 'react';
import { api, apiService } from '../services/api';
import type { Vehicle } from '../services/types';
import { Plus, Search, Filter, AlertTriangle, Upload, FileText } from 'lucide-react';
import toast from 'react-hot-toast';

export const VehicleRegistryPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);

  // Form Fields
  const [regNumber, setRegNumber] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('Van');
  const [maxLoad, setMaxLoad] = useState<number>(1000);
  const [odometer, setOdometer] = useState<number>(0);
  const [acquisitionCost, setAcquisitionCost] = useState<number>(0);
  const [status, setStatus] = useState<Vehicle['status']>('Available');
  const [region, setRegion] = useState('North');

  // File Upload fields (multipart/form-data support)
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Filters & Search
  const [searchReg, setSearchReg] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    const list = await api.getVehicles();
    setVehicles(list);
  };

  const openAddModal = () => {
    setEditVehicle(null);
    setRegNumber('');
    setName('');
    setType('Van');
    setMaxLoad(1000);
    setOdometer(0);
    setAcquisitionCost(0);
    setStatus('Available');
    setRegion('North');
    setUploadFile(null);
    setShowModal(true);
  };

  const openEditModal = (vehicle: Vehicle) => {
    setEditVehicle(vehicle);
    setRegNumber(vehicle.regNumber);
    setName(vehicle.name);
    setType(vehicle.type);
    setMaxLoad(vehicle.maxLoad);
    setOdometer(vehicle.odometer);
    setAcquisitionCost(vehicle.acquisitionCost);
    setStatus(vehicle.status);
    setRegion(vehicle.region || 'North');
    setUploadFile(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNumber || !name) {
      toast.error('Please enter registration number and name/model.');
      return;
    }

    try {
      let savedVehicle: Vehicle;
      if (editVehicle) {
        savedVehicle = await api.updateVehicle({
          ...editVehicle,
          regNumber,
          name,
          type,
          maxLoad,
          odometer,
          acquisitionCost,
          status,
          region
        });
        toast.success('Vehicle successfully updated!');
      } else {
        savedVehicle = await api.addVehicle({
          regNumber,
          name,
          type,
          maxLoad,
          odometer,
          acquisitionCost,
          status,
          region
        });
        toast.success('Vehicle successfully registered!');
      }

      // Handle File Upload if selected
      if (uploadFile && savedVehicle.id) {
        setUploading(true);
        try {
          const res = await apiService.uploadDocument(uploadFile, 'vehicle', savedVehicle.id);
          toast.success(`Uploaded ${res.filename} successfully via Axios Multipart!`);
        } catch (uploadErr: any) {
          toast.error('File upload failed: ' + uploadErr.message);
        } finally {
          setUploading(false);
        }
      }

      setShowModal(false);
      loadVehicles();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this vehicle registration?')) {
      await api.deleteVehicle(id);
      toast.success('Vehicle removed successfully.');
      loadVehicles();
    }
  };

  // Filter and Search logic
  const filteredVehicles = vehicles.filter(v => {
    const matchSearch = v.regNumber.toLowerCase().includes(searchReg.toLowerCase()) || v.name.toLowerCase().includes(searchReg.toLowerCase());
    const matchType = typeFilter === 'All' || v.type === typeFilter;
    const matchStatus = statusFilter === 'All' || v.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  return (
    <div className="space-y-8">
      {/* Title & Add Vehicle */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Vehicle Registry</h1>
          <p className="text-slate-500 mt-1">Manage transport fleet assets, load limits, and life-cycle statuses</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 bg-[#eab308] hover:bg-yellow-600 text-slate-900 px-5 py-3 rounded-lg font-bold shadow-md transition transform active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Add Vehicle</span>
        </button>
      </div>

      {/* Rules Notice */}
      <div className="p-4 bg-orange-50 border-2 border-dashed border-orange-200 rounded-lg flex items-start space-x-3 text-orange-800 text-sm">
        <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">Business Rule Check:</strong> Registration numbers must be unique. Retired or In Shop vehicles are automatically filtered out from Trip dispatching menus.
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none md:w-64">
            <input
              type="text"
              placeholder="Search registration or name..."
              value={searchReg}
              onChange={(e) => setSearchReg(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border-2 border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-[#eab308]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 border-2 border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-[#eab308]"
            >
              <option value="All">All Types</option>
              <option value="Van">Van</option>
              <option value="Truck">Truck</option>
              <option value="Mini">Mini</option>
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border-2 border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none focus:border-[#eab308]"
            >
              <option value="All">All Statuses</option>
              <option value="Available">Available</option>
              <option value="On Trip">On Trip</option>
              <option value="In Shop">In Shop</option>
              <option value="Retired">Retired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">Reg. No. (Unique)</th>
                <th className="py-4 px-6">Name/Model</th>
                <th className="py-4 px-6">Type</th>
                <th className="py-4 px-6">Max Capacity</th>
                <th className="py-4 px-6">Odometer (km)</th>
                <th className="py-4 px-6">Acq. Cost</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm font-semibold text-slate-700 divide-y divide-slate-100">
              {filteredVehicles.map((vehicle) => (
                <tr key={vehicle.id} className="hover:bg-slate-50/50 transition">
                  <td className="py-4 px-6 text-slate-900 font-bold">{vehicle.regNumber}</td>
                  <td className="py-4 px-6">{vehicle.name}</td>
                  <td className="py-4 px-6">
                    <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold uppercase">
                      {vehicle.type}
                    </span>
                  </td>
                  <td className="py-4 px-6">{vehicle.maxLoad.toLocaleString()} kg</td>
                  <td className="py-4 px-6">{vehicle.odometer.toLocaleString()}</td>
                  <td className="py-4 px-6">${vehicle.acquisitionCost.toLocaleString()}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                      vehicle.status === 'Available' ? 'bg-green-50 text-green-700 border-green-200' :
                      vehicle.status === 'On Trip' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      vehicle.status === 'In Shop' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                      'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {vehicle.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right space-x-2">
                    <button
                      onClick={() => openEditModal(vehicle)}
                      className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1.5 rounded transition text-xs font-bold"
                    >
                      Edit / Upload Document
                    </button>
                    <button
                      onClick={() => handleDelete(vehicle.id)}
                      className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded transition text-xs font-bold"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {filteredVehicles.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 font-medium">
                    No registered vehicles found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal with File Upload integration */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg mx-4 rounded-xl border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-950">
                {editVehicle ? 'Modify Vehicle Registry' : 'Register New Fleet Vehicle'}
              </h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Registration Number (Unique)
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#eab308] bg-slate-50 uppercase"
                    placeholder="e.g. GJ01AB4521"
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Vehicle Model/Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#eab308] bg-slate-50"
                    placeholder="e.g. VAN-05"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Vehicle Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#eab308] bg-slate-50 cursor-pointer"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="Van">Van</option>
                    <option value="Truck">Truck</option>
                    <option value="Mini">Mini</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Max Load Capacity (kg)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#eab308] bg-slate-50"
                    value={maxLoad}
                    onChange={(e) => setMaxLoad(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Odometer (km)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#eab308] bg-slate-50"
                    value={odometer}
                    onChange={(e) => setOdometer(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Acquisition Cost ($)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#eab308] bg-slate-50"
                    value={acquisitionCost}
                    onChange={(e) => setAcquisitionCost(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Region / Hub
                  </label>
                  <select
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#eab308] bg-slate-50 cursor-pointer"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                  >
                    <option value="North">North</option>
                    <option value="South">South</option>
                    <option value="East">East</option>
                    <option value="West">West</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Lifecycle Status
                  </label>
                  <select
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#eab308] bg-slate-50 cursor-pointer font-semibold text-slate-800"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Vehicle['status'])}
                  >
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="In Shop">In Shop</option>
                    <option value="Retired">Retired</option>
                  </select>
                </div>

                {/* File Upload Section (multipart/form-data) */}
                <div className="col-span-2 border-2 border-dashed border-slate-200 rounded-lg p-4 bg-slate-50 space-y-2">
                  <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Vehicle Document Management (Multipart/form-data support)
                  </span>
                  <div className="flex items-center space-x-3">
                    <label className="flex items-center space-x-2 bg-white px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer transition">
                      <Upload className="w-4 h-4 text-slate-500" />
                      <span>Select Certificate File</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setUploadFile(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                    {uploadFile ? (
                      <div className="flex items-center space-x-1.5 text-xs text-green-700 font-bold bg-green-50 border border-green-100 px-2.5 py-1 rounded-md">
                        <FileText className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate max-w-[180px]">{uploadFile.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">No document attached.</span>
                    )}
                  </div>
                  {uploading && (
                    <div className="text-[11px] text-blue-600 font-bold animate-pulse">
                      Uploading multipart payload via Axios, please wait...
                    </div>
                  )}
                </div>
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
                  disabled={uploading}
                  className="px-5 py-2 bg-[#eab308] hover:bg-yellow-600 text-slate-900 font-bold rounded-lg text-sm shadow-md transition disabled:bg-slate-300"
                >
                  Save Registry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
