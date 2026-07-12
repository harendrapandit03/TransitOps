import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Driver } from '../services/types';
import { Plus, Search, Mail, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';

export const DriverManagementPage: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editDriver, setEditDriver] = useState<Driver | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [licenseCategory, setLicenseCategory] = useState<'LMV' | 'HMV'>('LMV');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [safetyScore, setSafetyScore] = useState<number>(100);
  const [status, setStatus] = useState<Driver['status']>('Available');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    const list = await api.getDrivers();
    setDrivers(list);
  };

  const openAddModal = () => {
    setEditDriver(null);
    setName('');
    setLicenseNumber('');
    setLicenseCategory('LMV');
    setLicenseExpiry('');
    setContactNumber('');
    setSafetyScore(100);
    setStatus('Available');
    setShowModal(true);
  };

  const openEditModal = (driver: Driver) => {
    setEditDriver(driver);
    setName(driver.name);
    setLicenseNumber(driver.licenseNumber);
    setLicenseCategory(driver.licenseCategory);
    setLicenseExpiry(driver.licenseExpiry);
    setContactNumber(driver.contactNumber);
    setSafetyScore(driver.safetyScore);
    setStatus(driver.status);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !licenseNumber || !licenseExpiry || !contactNumber) {
      toast.error('All fields are mandatory.');
      return;
    }

    try {
      if (editDriver) {
        await api.updateDriver({
          ...editDriver,
          name,
          licenseNumber,
          licenseCategory,
          licenseExpiry,
          contactNumber,
          safetyScore,
          status
        });
        toast.success('Driver profile successfully updated!');
      } else {
        await api.addDriver({
          name,
          licenseNumber,
          licenseCategory,
          licenseExpiry,
          contactNumber,
          safetyScore,
          status
        });
        toast.success('Driver registered successfully!');
      }
      setShowModal(false);
      loadDrivers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleDriverStatus = async (driver: Driver, newStatus: Driver['status']) => {
    try {
      await api.updateDriver({
        ...driver,
        status: newStatus
      });
      toast.success(`Driver status changed to ${newStatus}`);
      loadDrivers();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleSendReminder = (driver: Driver) => {
    toast.success(`Expiry reminder sent to ${driver.name} (${driver.contactNumber})!`);
  };

  const isExpired = (expiryStr: string) => {
    return new Date(expiryStr) < new Date();
  };

  const filteredDrivers = drivers.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    d.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 text-slate-900">
      {/* Title & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Driver & Safety Profiles</h1>
          <p className="text-slate-500 mt-1">Monitor license validation, compliance statuses, and driver safety scoring</p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center space-x-2 bg-[#eab308] hover:bg-yellow-600 text-slate-900 px-5 py-3 rounded-lg font-bold shadow-md transition transform active:scale-95"
        >
          <Plus className="w-5 h-5" />
          <span>Add Driver</span>
        </button>
      </div>

      {/* Compliance Info banner */}
      <div className="p-4 bg-red-50 border-2 border-dashed border-red-200 rounded-lg flex items-start space-x-3 text-red-800 text-sm">
        <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">Business Safety Mandate:</strong> Drivers with expired licenses or <span className="underline decoration-wavy">Suspended</span> status are strictly locked out and prohibited from dispatch selection.
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 rounded-lg border-2 border-slate-200 focus:outline-none focus:border-[#eab308] text-sm text-slate-900 bg-slate-50"
            placeholder="Search drivers by name or DL number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>
      </div>

      {/* Main Table List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">Driver</th>
                <th className="py-4 px-6">License No.</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Expiry Date</th>
                <th className="py-4 px-6">Contact Number</th>
                <th className="py-4 px-6 text-center">Trips Completed</th>
                <th className="py-4 px-6">Safety Score</th>
                <th className="py-4 px-6">Current Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm font-semibold text-slate-700 divide-y divide-slate-100">
              {filteredDrivers.map((driver) => {
                const expired = isExpired(driver.licenseExpiry);
                return (
                  <tr key={driver.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6 text-slate-900 font-bold flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs uppercase">
                        {driver.name.substring(0, 2)}
                      </div>
                      <span>{driver.name}</span>
                    </td>
                    <td className="py-4 px-6">{driver.licenseNumber}</td>
                    <td className="py-4 px-6">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-xs font-bold">
                        {driver.licenseCategory}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <span>{driver.licenseExpiry}</span>
                        {expired ? (
                          <span className="text-red-600 bg-red-50 px-1.5 py-0.5 border border-red-100 rounded text-[10px] font-bold uppercase animate-pulse">
                            EXPIRED
                          </span>
                        ) : (
                          <span className="text-green-600 bg-green-50 px-1.5 py-0.5 border border-green-100 rounded text-[10px] font-bold">
                            VALID
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6">{driver.contactNumber}</td>
                    <td className="py-4 px-6 text-center">{driver.tripCount}</td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <span className={`font-bold ${
                          driver.safetyScore >= 90 ? 'text-green-600' :
                          driver.safetyScore >= 80 ? 'text-amber-600' : 'text-red-600'
                        }`}>{driver.safetyScore}%</span>
                        <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              driver.safetyScore >= 90 ? 'bg-green-500' :
                              driver.safetyScore >= 80 ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${driver.safetyScore}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-block px-2.5 py-1 rounded text-xs font-bold border uppercase tracking-wider ${
                        driver.status === 'Available' ? 'bg-green-50 text-green-700 border-green-200' :
                        driver.status === 'On Trip' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        driver.status === 'Off Duty' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                        'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {driver.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right space-y-1 md:space-y-0">
                      <div className="flex flex-col md:flex-row items-end md:items-center justify-end gap-1.5">
                        {/* Quick state toggles */}
                        <div className="flex items-center space-x-1 border border-slate-200 rounded p-1 bg-slate-50">
                          <button
                            onClick={() => toggleDriverStatus(driver, 'Available')}
                            className={`p-1 rounded text-[10px] font-bold uppercase transition ${
                              driver.status === 'Available' ? 'bg-green-600 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-200'
                            }`}
                            title="Set Available"
                          >
                            Avail
                          </button>
                          <button
                            onClick={() => toggleDriverStatus(driver, 'Off Duty')}
                            className={`p-1 rounded text-[10px] font-bold uppercase transition ${
                              driver.status === 'Off Duty' ? 'bg-slate-600 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-200'
                            }`}
                            title="Set Off Duty"
                          >
                            Off
                          </button>
                          <button
                            onClick={() => toggleDriverStatus(driver, 'Suspended')}
                            className={`p-1 rounded text-[10px] font-bold uppercase transition ${
                              driver.status === 'Suspended' ? 'bg-red-600 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-200'
                            }`}
                            title="Set Suspended"
                          >
                            Susp
                          </button>
                        </div>

                        <button
                          onClick={() => openEditModal(driver)}
                          className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded transition text-[11px] font-bold"
                        >
                          Edit
                        </button>

                        {expired && (
                          <button
                            onClick={() => handleSendReminder(driver)}
                            className="text-[#ca8a04] hover:text-yellow-900 bg-yellow-50 hover:bg-yellow-100 p-1.5 rounded transition"
                            title="Send Expiry Reminder"
                          >
                            <Mail className="w-3.5 h-3.5" />
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

      {/* Driver Form Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg mx-4 rounded-xl border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-950">
                {editDriver ? 'Update Driver Profile' : 'Register New Transit Driver'}
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
                    Driver Full Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#eab308] bg-slate-50"
                    placeholder="e.g. Alex"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Driving License Number
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#eab308] bg-slate-50 uppercase"
                    placeholder="e.g. DL-88213"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    License Category
                  </label>
                  <select
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#eab308] bg-slate-50 cursor-pointer"
                    value={licenseCategory}
                    onChange={(e) => setLicenseCategory(e.target.value as 'LMV' | 'HMV')}
                  >
                    <option value="LMV">Light Motor Vehicle (LMV)</option>
                    <option value="HMV">Heavy Motor Vehicle (HMV)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    License Expiry Date
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#eab308] bg-slate-50"
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#eab308] bg-slate-50"
                    placeholder="e.g. 9876543210"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Safety Compliance Score (0-100)
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#eab308] bg-slate-50"
                    value={safetyScore}
                    onChange={(e) => setSafetyScore(Number(e.target.value))}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Duty Status
                  </label>
                  <select
                    className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm focus:outline-none focus:border-[#eab308] bg-slate-50 cursor-pointer"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Driver['status'])}
                  >
                    <option value="Available">Available</option>
                    <option value="On Trip">On Trip</option>
                    <option value="Off Duty">Off Duty</option>
                    <option value="Suspended">Suspended</option>
                  </select>
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
                  className="px-5 py-2 bg-[#eab308] hover:bg-yellow-600 text-slate-900 font-bold rounded-lg text-sm shadow-md transition"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
