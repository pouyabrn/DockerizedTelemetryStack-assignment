import { useState, useEffect } from 'react';
import axios from 'axios';
import { Menu, X, Server, Database, Activity, Clock, Cpu, HardDrive } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

export default function ModernAdmin() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState(null);
  const [systemInfo, setSystemInfo] = useState(null);
  const [recentRows, setRecentRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [selectedView, setSelectedView] = useState('rows'); // 'rows' or 'stats'

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, rowsRes, systemRes] = await Promise.all([
        axios.get('http://localhost:3000/api/stats'),
        axios.get('http://localhost:3000/api/telemetry/recent?limit=200'),
        axios.get('http://localhost:3000/api/system')
      ]);
      setStats(statsRes.data.data);
      setRecentRows(rowsRes.data.data);
      setSystemInfo(systemRes.data.data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const StatCard = ({ icon: Icon, title, value, subtitle, color = 'text-white' }) => (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-lg border border-slate-700">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-slate-700/50 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <div className="text-xs text-gray-400">{title}</div>
          <div className={`text-xl font-bold ${color}`}>{value}</div>
          {subtitle && <div className="text-xs text-gray-500 mt-0.5">{subtitle}</div>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-slate-900 border-r border-slate-800 transition-all duration-300 overflow-hidden`}>
        <div className="p-4">
          <h2 className="text-xl font-bold text-white mb-6">Admin Panel</h2>
          
          <nav className="space-y-2">
            <button
              onClick={() => setSelectedView('rows')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                selectedView === 'rows' 
                  ? 'bg-red-600 text-white' 
                  : 'text-gray-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Database className="h-5 w-5" />
              <span>Database Rows</span>
            </button>
            
            <button
              onClick={() => setSelectedView('stats')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                selectedView === 'stats' 
                  ? 'bg-red-600 text-white' 
                  : 'text-gray-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Activity className="h-5 w-5" />
              <span>Statistics</span>
            </button>
          </nav>

          {/* System Info in Sidebar */}
          {systemInfo && (
            <div className="mt-8 space-y-3">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">System Info</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <Server className="h-4 w-4 text-green-500" />
                  <span className="truncate">{systemInfo.hostname}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Cpu className="h-4 w-4 text-blue-500" />
                  <span>{systemInfo.cpus} CPUs</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <HardDrive className="h-4 w-4 text-purple-500" />
                  <span>{systemInfo.totalMemory}</span>
                </div>
                {systemInfo.ipAddresses?.map((ip, idx) => (
                  <div key={idx} className="text-gray-400 text-xs">
                    <span className="text-gray-500">{ip.interface}:</span> {ip.address}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 border-b border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-gray-400"
              >
                {sidebarOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  {selectedView === 'rows' ? 'Database Explorer' : 'Performance Analytics'}
                </h1>
                {lastRefresh && (
                  <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
                    <Clock className="h-4 w-4" />
                    Last updated: {lastRefresh.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Refreshing...
                </>
              ) : (
                <>
                  <Activity className="h-4 w-4" />
                  Refresh Data
                </>
              )}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-6">
          {selectedView === 'stats' && stats && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={Database}
                  title="Total Records"
                  value={stats.total_records.toLocaleString()}
                  subtitle="All telemetry data"
                  color="text-green-400"
                />
                <StatCard
                  icon={Activity}
                  title="Avg Speed"
                  value={`${stats.averages.speed} km/h`}
                  subtitle={`Max: ${stats.averages.max_speed}`}
                  color="text-blue-400"
                />
                <StatCard
                  icon={Server}
                  title="Database Size"
                  value={stats.database_size}
                  subtitle={`Table: ${stats.table_size}`}
                  color="text-purple-400"
                />
                <StatCard
                  icon={Clock}
                  title="Active Vehicles"
                  value={stats.vehicle_counts.length}
                  subtitle="Tracked units"
                  color="text-orange-400"
                />
              </div>

              {/* Vehicle Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Vehicle Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {stats.vehicle_counts.map(vehicle => {
                      const percentage = (vehicle.count / stats.total_records * 100).toFixed(1);
                      return (
                        <div key={vehicle.vehicle_id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-white font-semibold">{vehicle.vehicle_id}</span>
                            <span className="text-gray-400">{vehicle.count.toLocaleString()} ({percentage}%)</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${percentage}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {selectedView === 'rows' && (
            <Card className="bg-slate-900/50">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Latest Database Entries</CardTitle>
                  <div className="text-sm text-gray-400">{recentRows.length} rows</div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-800">
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">ID</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Vehicle</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Speed</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">RPM</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Temp</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Fuel</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Position</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Status</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentRows.map((row, idx) => (
                        <tr 
                          key={row.id} 
                          className={`border-b border-slate-800 hover:bg-slate-800/50 transition-colors ${
                            idx % 2 === 0 ? 'bg-slate-900/30' : ''
                          }`}
                        >
                          <td className="py-3 px-4 text-gray-400">{row.id}</td>
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-white">{row.vehicle_id}</span>
                          </td>
                          <td className="py-3 px-4 text-green-400 font-semibold">
                            {parseFloat(row.speed).toFixed(1)} km/h
                          </td>
                          <td className="py-3 px-4 text-blue-400">{row.engine_rpm}</td>
                          <td className="py-3 px-4 text-orange-400">{parseFloat(row.temperature).toFixed(1)}°C</td>
                          <td className="py-3 px-4 text-yellow-400">{parseFloat(row.fuel_level).toFixed(0)}%</td>
                          <td className="py-3 px-4 text-gray-500 font-mono text-xs">
                            {parseFloat(row.longitude).toFixed(1)}, {parseFloat(row.latitude).toFixed(1)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                              row.status === 'running' 
                                ? 'bg-green-900/50 text-green-300 border border-green-700' 
                                : 'bg-gray-800 text-gray-400'
                            }`}>
                              {row.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-500 text-xs">
                            {new Date(row.created_at).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-900 border-t border-slate-800 p-4">
          <div className="flex justify-between items-center text-sm text-gray-400">
            <a href="/" className="hover:text-white transition-colors">← Back to Dashboard</a>
            {systemInfo && (
              <div className="flex items-center gap-4">
                <span>{systemInfo.platform} • {systemInfo.architecture}</span>
                <span>Node {systemInfo.nodeVersion}</span>
                <span>Uptime: {systemInfo.uptime}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

