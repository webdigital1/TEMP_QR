import { useState, useEffect } from 'react';
import { QrCode, Smartphone, Monitor } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(5);
  const [isAutoRedirecting, setIsAutoRedirecting] = useState(true);

  useEffect(() => {
    if (!isAutoRedirecting) return;

    if (countdown <= 0) {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobileDevice) {
        navigate('/scan');
      } else {
        navigate('/desktop');
      }
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, isAutoRedirecting, navigate]);

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col items-center justify-center p-4 font-sans text-slate-800">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-8 space-y-8 text-center relative overflow-hidden">
        {/* Dekorasi Latar */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-500 rounded-full blur-3xl opacity-20 pointer-events-none"></div>

        <div className="space-y-3 relative z-10">
          <div className="bg-indigo-100 w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
            <QrCode className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Selamat Datang</h1>
          <p className="text-slate-500 text-sm">Sila pilih paparan yang ingin anda gunakan (Versi React).</p>
        </div>

        <div className="space-y-4 relative z-10">
          {/* Pilihan Mobile */}
          <button 
            onClick={() => navigate('/scan')}
            className="group block w-full bg-slate-50 hover:bg-indigo-50 border-2 border-slate-100 hover:border-indigo-200 rounded-2xl p-4 transition-all duration-200 text-left"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-white p-3 rounded-xl shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 group-hover:text-indigo-900">Pengimbas QR (Mobile)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Buka kamera untuk scan kod QR</p>
              </div>
            </div>
          </button>

          {/* Pilihan Desktop */}
          <button 
            onClick={() => navigate('/desktop')}
            className="group block w-full bg-slate-50 hover:bg-emerald-50 border-2 border-slate-100 hover:border-emerald-200 rounded-2xl p-4 transition-all duration-200 text-left"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-white p-3 rounded-xl shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Monitor className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800 group-hover:text-emerald-900">Dashboard (Desktop)</h3>
                <p className="text-xs text-slate-500 mt-0.5">Lihat jadual data & analitik dari Sheet</p>
              </div>
            </div>
          </button>
        </div>

        {/* Script Auto Detect Opsional */}
        <div className="pt-4 border-t border-slate-100 relative z-10">
          {isAutoRedirecting ? (
            <>
              <p className="text-xs text-slate-400">
                Mengesan peranti secara automatik dalam <span className="font-bold text-indigo-500">{countdown}</span> saat...
              </p>
              <button 
                onClick={() => setIsAutoRedirecting(false)} 
                className="mt-2 text-[11px] text-rose-500 hover:text-rose-600 font-semibold px-3 py-1 bg-rose-50 rounded-full transition"
              >
                Batal Auto-Beralih
              </button>
            </>
          ) : (
            <p className="text-xs text-slate-400">Auto-beralih telah dibatalkan.</p>
          )}
        </div>
      </div>
    </div>
  );
}
