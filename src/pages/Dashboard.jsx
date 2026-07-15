import { useState, useEffect } from 'react';
import { Monitor, Smartphone, RefreshCw, FolderOpen, Search, Download, Copy, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SHEET_URL = "https://script.google.com/macros/s/AKfycbyqXJeBHMMiuQku_miS7C0MB07h4B9qPE3x5x20UE6vhXFKlhpt8LLKHDYIs_jJutbO/exec";

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  const fetchData = (silent = false) => {
    if (!silent) setLoading(true);
    fetch(`${SHEET_URL}?action=read`)
      .then(res => res.json())
      .then(fetchedData => {
        setData(fetchedData);
        if (!silent) setLoading(false);
      })
      .catch(err => {
        console.error(err);
        if (!silent) setLoading(false);
      });
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh setiap 2 saat (silent mode)
    const intervalId = setInterval(() => {
      fetchData(true);
    }, 2000);
    
    return () => clearInterval(intervalId);
  }, []);

  const filteredData = data.filter((row, index) => {
    if (index === 0) return false; // Abaikan header
    if (!row[0] && !row[1] && !row[2]) return false;
    
    const searchLower = searchQuery.toLowerCase();
    const qrResult = String(row[1] || "").toLowerCase();
    const dateStr = String(row[2] || "").toLowerCase();
    
    return qrResult.includes(searchLower) || dateStr.includes(searchLower);
  });

  return (
    <div className="bg-slate-50 text-slate-800 font-sans min-h-screen">
      <nav className="bg-indigo-600 text-white shadow-md px-6 py-4 flex flex-wrap items-center justify-between sticky top-0 z-50 gap-4">
        <div className="flex items-center space-x-3">
          <Monitor className="w-7 h-7" />
          <h1 className="text-xl md:text-2xl font-bold tracking-tight">QR Data Dashboard</h1>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate('/scan')}
            className="bg-indigo-800 hover:bg-indigo-900 text-white px-4 py-2 rounded-lg font-semibold text-sm transition flex items-center space-x-2 shadow-sm border border-indigo-700"
          >
            <Smartphone className="w-4 h-4" />
            <span className="hidden sm:inline">Mod Kamera</span>
          </button>
          <div className="text-sm bg-indigo-500 px-3 py-1.5 rounded-full font-medium hidden md:flex items-center space-x-2">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></span>
            <span>Live dari Sheet</span>
          </div>
          <button 
            onClick={fetchData}
            disabled={loading}
            className="bg-white text-indigo-600 hover:bg-slate-100 px-4 py-2 rounded-lg font-semibold text-sm transition flex items-center space-x-2 shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{loading ? 'Memuatkan...' : 'Muat Ulang'}</span>
          </button>
        </div>
      </nav>

      <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex items-center space-x-4">
            <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
              <FolderOpen className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Jumlah Data Keseluruhan</p>
              <h3 className="text-3xl font-bold text-slate-900">
                {data.length > 0 ? data.length - 1 : 0}
              </h3>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col justify-center">
            <p className="text-sm font-medium text-slate-500 mb-2">Cari Data</p>
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari berdasarkan QR atau tarikh..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
          </div>
        </div>

        <section className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm w-[92%] sm:w-full mx-auto">
          <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center bg-white">
            <h2 className="text-base font-semibold text-gray-800">Senarai Imbasan</h2>
            <a href={SHEET_URL.replace("/exec", "")} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center space-x-1 transition">
              <span className="hidden sm:inline">Buka Google Sheet</span>
              <Download className="w-4 h-4" />
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50 hidden md:table-header-group border-b border-gray-200">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">No</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hasil QR Code</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-56">Tarikh & Masa</th>
                </tr>
              </thead>
              <tbody className="bg-gray-50 md:bg-white grid grid-cols-2 sm:grid-cols-3 md:grid-cols-none gap-3 p-3 md:p-0 md:gap-0 md:table-row-group divide-none md:divide-y md:divide-gray-100">
                {filteredData.length > 0 ? (
                  filteredData.map((row, idx) => (
                    <tr key={idx} className="bg-white hover:bg-gray-50 transition-colors border border-gray-200 md:border-none rounded-lg md:rounded-none shadow-sm md:shadow-none flex flex-col md:table-row p-3 md:p-0">
                      <td className="px-0 md:px-4 py-1 md:py-3 text-sm text-gray-500 flex justify-between items-center md:table-cell border-b border-gray-100 md:border-none mb-2 md:mb-0 pb-2 md:pb-0">
                        <span className="md:hidden text-[10px] font-bold text-gray-400 uppercase tracking-wider">No</span>
                        <span className="font-semibold md:font-normal">{row[0]}</span>
                      </td>
                      <td className="px-0 md:px-4 py-1 md:py-3 text-sm text-gray-800 font-mono flex flex-col md:table-cell flex-1">
                        <span className="md:hidden text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Hasil QR Code</span>
                        <div className="flex items-center justify-between group">
                          <span className="break-all pr-2">{row[1]}</span>
                          <button 
                            onClick={() => {
                              navigator.clipboard.writeText(row[1] || "");
                              setCopiedId(idx);
                              setTimeout(() => setCopiedId(null), 2000);
                            }}
                            className="opacity-100 md:opacity-0 group-hover:opacity-100 focus:opacity-100 text-gray-400 hover:text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-all ml-2 md:ml-0"
                            title="Salin QR"
                          >
                            {copiedId === idx ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                      <td className="px-0 md:px-4 py-1 md:py-3 text-xs md:text-sm text-gray-400 md:text-gray-500 hidden md:table-cell">
                        {row[2]}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-slate-500">
                      {loading ? 'Memuatkan data...' : 'Tiada data dijumpai.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
