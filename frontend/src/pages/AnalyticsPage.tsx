import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { Vehicle, FuelLog, ExpenseRecord, Trip } from '../services/types';
import { Download, BarChart2, TrendingUp, DollarSign, Percent } from 'lucide-react';
import toast from 'react-hot-toast';

export const AnalyticsPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuelLogs, setFuelLogs] = useState<FuelLog[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const v = await api.getVehicles();
    const f = await api.getFuelLogs();
    const e = await api.getExpenses();
    const t = await api.getTrips();
    setVehicles(v);
    setFuelLogs(f);
    setExpenses(e);
    setTrips(t);
  };

  // Calculations for KPI summary cards
  const totalFuelLiters = fuelLogs.reduce((sum, item) => sum + item.liters, 0);
  const totalFuelCost = fuelLogs.reduce((sum, item) => sum + item.cost, 0);
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const totalFleetCost = totalFuelCost + totalExpenses;

  const totalDistance = trips
    .filter(t => t.status === 'Completed')
    .reduce((sum, t) => sum + t.distance, 0);

  // Fuel Efficiency (Distance / Fuel)
  const fuelEfficiency = totalFuelLiters > 0 
    ? (totalDistance / totalFuelLiters).toFixed(2) 
    : '0';

  // Overall Fleet Utilization (%)
  const totalOnTrip = vehicles.filter(v => v.status === 'On Trip').length;
  const fleetUtilization = vehicles.length > 0 
    ? Math.round((totalOnTrip / vehicles.length) * 100) 
    : 0;

  // CSV Exporter (Operational costs breakdown)
  const exportToCSV = () => {
    try {
      const headers = ['Vehicle ID', 'Reg Number', 'Model Name', 'Odometer', 'Fuel Cost ($)', 'Maintenance/Tolls ($)', 'Total Operational Cost ($)', 'ROI (%)'];
      const rows = vehicles.map(v => {
        const fuel = fuelLogs.filter(f => f.vehicleId === v.id).reduce((sum, curr) => sum + curr.cost, 0);
        const exp = expenses.filter(e => e.vehicleId === v.id).reduce((sum, curr) => sum + curr.amount, 0);
        const totalCost = fuel + exp;

        // Simulated ROI calculation: [Revenue - (Maintenance + Fuel)] / Acquisition Cost
        // Let's assume a dummy revenue generated for calculation (e.g. $5 per kilometer driven)
        const distanceDriven = trips
          .filter(t => t.vehicleId === v.id && t.status === 'Completed')
          .reduce((sum, curr) => sum + curr.distance, 0);
        const revenue = distanceDriven * 5;
        const roi = v.acquisitionCost > 0 
          ? (((revenue - totalCost) / v.acquisitionCost) * 100).toFixed(2)
          : '0.00';

        return [
          v.id,
          v.regNumber,
          v.name,
          v.odometer,
          fuel,
          exp,
          totalCost,
          `${roi}%`
        ];
      });

      const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `transitops_fleet_analytics_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('CSV Report Exported Successfully!');
    } catch (e: any) {
      toast.error('Error exporting CSV: ' + e.message);
    }
  };

  return (
    <div className="space-y-8 text-slate-900">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-slate-500 mt-1">Deep-dive financial reports, operational KPI margins, and exportable data sheets</p>
        </div>

        <button
          onClick={exportToCSV}
          className="flex items-center space-x-2 bg-[#eab308] hover:bg-yellow-600 text-slate-900 px-5 py-3 rounded-lg font-bold shadow-md transition transform active:scale-95"
        >
          <Download className="w-5 h-5" />
          <span>Export Analytics CSV</span>
        </button>
      </div>

      {/* Analytics KPI grids */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-4">
          <div className="p-3 rounded-lg bg-indigo-50 text-indigo-700">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fuel Efficiency</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{fuelEfficiency} km/L</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-4">
          <div className="p-3 rounded-lg bg-teal-50 text-teal-700">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fleet Utilization</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{fleetUtilization}%</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-4">
          <div className="p-3 rounded-lg bg-amber-50 text-amber-700">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Operational Cost</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">${totalFleetCost.toLocaleString()}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-4">
          <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700">
            <BarChart2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Completed Distance</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalDistance.toLocaleString()} km</h3>
          </div>
        </div>
      </div>

      {/* ROI & Fleet analytics list with detailed formula execution */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-950">Detailed Vehicle ROI Metrics Breakdown</h3>
          <p className="text-xs text-slate-500 font-semibold mt-1 uppercase">
            Formula: ROI = (Revenue - (Maintenance + Fuel)) / Acquisition Cost
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">Vehicle Asset</th>
                <th className="py-4 px-6">Acquisition Cost</th>
                <th className="py-4 px-6">Total Fuel Cost</th>
                <th className="py-4 px-6">Total Expenses</th>
                <th className="py-4 px-6">Simulated Revenue</th>
                <th className="py-4 px-6">Net Profit</th>
                <th className="py-4 px-6 text-right">Computed ROI (%)</th>
              </tr>
            </thead>
            <tbody className="text-sm font-semibold text-slate-700 divide-y divide-slate-100">
              {vehicles.map((v) => {
                const fuel = fuelLogs.filter(f => f.vehicleId === v.id).reduce((sum, curr) => sum + curr.cost, 0);
                const exp = expenses.filter(e => e.vehicleId === v.id).reduce((sum, curr) => sum + curr.amount, 0);
                const totalCost = fuel + exp;

                const distanceDriven = trips
                  .filter(t => t.vehicleId === v.id && t.status === 'Completed')
                  .reduce((sum, curr) => sum + curr.distance, 0);
                const revenue = distanceDriven * 5; // Simulating $5 revenue per driven km
                const netProfit = revenue - totalCost;
                
                const roi = v.acquisitionCost > 0 
                  ? ((netProfit / v.acquisitionCost) * 100).toFixed(2)
                  : '0.00';

                return (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition">
                    <td className="py-4 px-6">
                      <div>
                        <div className="text-slate-900 font-bold">{v.name}</div>
                        <div className="text-xs text-slate-500 font-semibold uppercase">{v.regNumber}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">${v.acquisitionCost.toLocaleString()}</td>
                    <td className="py-4 px-6 text-slate-600">${fuel.toLocaleString()}</td>
                    <td className="py-4 px-6 text-slate-600">${exp.toLocaleString()}</td>
                    <td className="py-4 px-6 text-indigo-600">${revenue.toLocaleString()}</td>
                    <td className={`py-4 px-6 ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      ${netProfit.toLocaleString()}
                    </td>
                    <td className="py-4 px-6 text-right font-black text-slate-900">
                      <span className={`px-2 py-1 rounded text-xs font-bold border ${
                        Number(roi) >= 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {roi}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
