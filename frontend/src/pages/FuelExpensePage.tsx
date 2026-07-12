import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { FuelLog, ExpenseRecord, Vehicle } from '../services/types';
import { Plus, Fuel, DollarSign, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

export const FuelExpensePage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  
  const [showFuelModal, setShowFuelModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  // Form states
  const [fuelVehicleId, setFuelVehicleId] = useState('');
  const [liters, setLiters] = useState<number>(0);
  const [fuelCost, setFuelCost] = useState<number>(0);

  const [expenseVehicleId, setExpenseVehicleId] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState<'Tolls' | 'Maintenance' | 'Permit' | 'Other'>('Tolls');
  const [description, setDescription] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const v = await api.getVehicles();
    const f = await api.getFuelLogs();
    const e = await api.getExpenses();
    setVehicles(v);
    setFuelLogs(f);
    setExpenses(e);
  };

  const handleAddFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fuelVehicleId || liters <= 0 || fuelCost <= 0) {
      toast.error('All fields must be positive values.');
      return;
    }

    try {
      await api.addFuelLog({
        vehicleId: fuelVehicleId,
        liters,
        cost: fuelCost,
        date: new Date().toISOString().split('T')[0]
      });
      toast.success('Fuel log added successfully!');
      setShowFuelModal(false);
      setLiters(0);
      setFuelCost(0);
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseVehicleId || amount <= 0 || !description) {
      toast.error('Please enter valid details.');
      return;
    }

    try {
      await api.addExpense({
        vehicleId: expenseVehicleId,
        amount,
        category,
        description,
        date: new Date().toISOString().split('T')[0]
      });
      toast.success('Expense recorded!');
      setShowExpenseModal(false);
      setAmount(0);
      setDescription('');
      loadData();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  // Compute operational cost per vehicle helper
  const getOperationalCost = (vehicleId: string) => {
    const vehicleFuel = fuelLogs.filter(f => f.vehicleId === vehicleId).reduce((sum, current) => sum + current.cost, 0);
    const vehicleExpenses = expenses.filter(e => e.vehicleId === vehicleId).reduce((sum, current) => sum + current.amount, 0);
    return vehicleFuel + vehicleExpenses;
  };

  return (
    <div className="space-y-8 text-slate-900">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Fuel & Expense Logging</h1>
          <p className="text-slate-500 mt-1">Track operational expenditures, toll receipts, and fuel usage</p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFuelModal(true)}
            className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-bold shadow-md transition"
          >
            <Fuel className="w-4.5 h-4.5" />
            <span>Log Fuel</span>
          </button>
          <button
            onClick={() => setShowExpenseModal(true)}
            className="flex items-center space-x-2 bg-[#eab308] hover:bg-yellow-600 text-slate-900 px-4 py-2.5 rounded-lg font-bold shadow-md transition"
          >
            <Plus className="w-4.5 h-4.5" />
            <span>Add Toll / Expense</span>
          </button>
        </div>
      </div>

      {/* Grid summarizing Operational Cost computed per vehicle */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-lg font-bold text-slate-950 mb-4 flex items-center space-x-2">
          <Wallet className="w-5 h-5 text-[#ca8a04]" />
          <span>Real-time Operational Cost (Fuel + Maintenance + Tolls) Per Vehicle</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {vehicles.map(v => {
            const cost = getOperationalCost(v.id);
            return (
              <div key={v.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{v.name}</h4>
                  <p className="text-xs text-slate-500 font-semibold uppercase">{v.regNumber}</p>
                </div>
                <div className="mt-4">
                  <span className="text-xs text-slate-400 font-bold uppercase">Total Cost</span>
                  <p className="text-xl font-black text-slate-900">${cost.toLocaleString()}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lists of Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Fuel Logs Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-950">Fuel Consumption Records</h3>
            <Fuel className="w-5 h-5 text-indigo-500" />
          </div>
          <div className="overflow-y-auto max-h-96">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Liters Consumed</th>
                  <th className="py-3 px-4">Cost Logging</th>
                  <th className="py-3 px-4">Log Date</th>
                </tr>
              </thead>
              <tbody className="text-xs font-semibold text-slate-700 divide-y divide-slate-100">
                {fuelLogs.map((f, i) => {
                  const vehicle = vehicles.find(v => v.id === f.vehicleId);
                  return (
                    <tr key={f.id || i} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">{vehicle ? vehicle.name : 'Unknown'}</td>
                      <td className="py-3 px-4 font-bold">{f.liters} L</td>
                      <td className="py-3 px-4 text-emerald-600 font-black">${f.cost}</td>
                      <td className="py-3 px-4 text-slate-500">{f.date}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tolls & Expenses Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <h3 className="font-bold text-slate-950">Logged Expenses & Tolls</h3>
            <DollarSign className="w-5 h-5 text-[#ca8a04]" />
          </div>
          <div className="overflow-y-auto max-h-96">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Vehicle</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Description</th>
                </tr>
              </thead>
              <tbody className="text-xs font-semibold text-slate-700 divide-y divide-slate-100">
                {expenses.map((e, idx) => {
                  const vehicle = vehicles.find(v => v.id === e.vehicleId);
                  return (
                    <tr key={e.id || idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">{vehicle ? vehicle.name : 'Unknown'}</td>
                      <td className="py-3 px-4">
                        <span className="px-1.5 py-0.5 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded font-bold uppercase text-[10px]">
                          {e.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-red-600 font-black">${e.amount}</td>
                      <td className="py-3 px-4 max-w-xs truncate" title={e.description}>{e.description}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Fuel Log Modal */}
      {showFuelModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm mx-4 rounded-xl border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-950">Add Fuel Log</h3>
              <button onClick={() => setShowFuelModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleAddFuel} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Vehicle</label>
                <select
                  required
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none"
                  value={fuelVehicleId}
                  onChange={(e) => setFuelVehicleId(e.target.value)}
                >
                  <option value="">-- Choose vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.regNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Volume (Liters)</label>
                <input
                  type="number"
                  required
                  min={1}
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none"
                  value={liters}
                  onChange={(e) => setLiters(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Total Cost ($)</label>
                <input
                  type="number"
                  required
                  min={1}
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none"
                  value={fuelCost}
                  onChange={(e) => setFuelCost(Number(e.target.value))}
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFuelModal(false)}
                  className="px-4 py-2 border-2 border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-sm shadow-md transition"
                >
                  Log Fuel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm mx-4 rounded-xl border border-slate-200 shadow-2xl overflow-hidden text-slate-900">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-950">Record Tolls / Expense</h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>

            <form onSubmit={handleAddExpense} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Vehicle</label>
                <select
                  required
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none"
                  value={expenseVehicleId}
                  onChange={(e) => setExpenseVehicleId(e.target.value)}
                >
                  <option value="">-- Choose vehicle --</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.regNumber})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Expense Category</label>
                <select
                  required
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                >
                  <option value="Tolls">Tolls</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Permit">Permit</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Amount ($)</label>
                <input
                  type="number"
                  required
                  min={1}
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Detailed Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. state line crossing toll, tire change"
                  className="w-full px-3 py-2 border-2 border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-none"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-4 py-2 border-2 border-slate-200 hover:bg-slate-50 rounded-lg text-sm font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#eab308] hover:bg-yellow-600 text-slate-900 font-bold rounded-lg text-sm shadow-md transition"
                >
                  Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
