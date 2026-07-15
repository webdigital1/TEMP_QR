import { useState, useEffect, useRef } from 'react';
import { QrCode, Camera, FlipHorizontal, Play, Square, Database, Keyboard, Plus, History, Trash2, FileSpreadsheet, FileText, Monitor, CheckCircle, AlertTriangle, CloudLightning, Focus, Inbox, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';

const SHEET_URL = "https://script.google.com/macros/s/AKfycbyWMRVjxxFRAm2X4Zq7-mNvRd34-tC9skre5lUQLA7dofFerXKAFa2l3EWPcYak1hVL/exec";
const LOCAL_STORAGE_KEY = 'qr_react_scanned_data';

export default function Scanner() {
  const navigate = useNavigate();
  const [isMirrored, setIsMirrored] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [qrDataList, setQrDataList] = useState([]);
  const [autoSync, setAutoSync] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [toast, setToast] = useState({ show: false, msg: '', icon: 'check-circle' });
  const html5QrCodeRef = useRef(null);
  const [showClearModal, setShowClearModal] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
      try {
        setQrDataList(JSON.parse(savedData));
      } catch (e) {
        console.error(e);
      }
    }
    const savedSync = localStorage.getItem('qr_react_autosync');
    if (savedSync) setAutoSync(JSON.parse(savedSync));
  }, []);

  const saveToStorage = (data) => {
    setQrDataList(data);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  };

  const showToast = (msg, icon = 'check-circle') => {
    setToast({ show: true, msg, icon });
    setTimeout(() => setToast({ show: false, msg: '', icon: 'check-circle' }), 3000);
  };

  const playSuccessSound = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) { /* ignore */ }
  };

  const sendToGoogleSheet = (number, qrText, itemIndex, currentDataList) => {
    const targetUrl = `${SHEET_URL}?action=add&no=${encodeURIComponent(number)}&qr=${encodeURIComponent(qrText)}`;
    fetch(targetUrl, { mode: 'no-cors' }).then(() => {
      showToast(`Terkirim ke Sheet!`, "cloud-lightning");
      if (itemIndex !== undefined) {
        const newData = [...currentDataList];
        if (newData[itemIndex]) {
          newData[itemIndex].uploaded = true;
          saveToStorage(newData);
        }
      }
    }).catch(err => {
      console.error(err);
      showToast("Gagal kirim ke Google Sheet", "alert-triangle");
    });
  };

  const addScannedData = (text) => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    setQrDataList(prev => {
      if (prev.length > 0 && prev[prev.length - 1].text === trimmedText) {
        showToast("Data QR sama terdeteksi!", "alert-triangle");
        if (navigator.vibrate) navigator.vibrate([100, 80, 100]);
        return prev;
      }

      const newItem = { text: trimmedText, timestamp: new Date().toISOString(), uploaded: false };
      const newData = [...prev, newItem];
      
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newData));
      playSuccessSound();
      showToast("QR Berhasil Disimpan!");
      if (navigator.vibrate) navigator.vibrate(100);

      if (autoSync) {
        sendToGoogleSheet(newData.length, trimmedText, newData.length - 1, newData);
      }
      return newData;
    });
  };

  const syncAllToSheet = () => {
    if (qrDataList.length === 0) {
      showToast("Tiada data untuk dimuat naik!", "alert-triangle");
      return;
    }
    let delay = 0;
    let uploadedCount = 0;
    qrDataList.forEach((item, index) => {
      if (!item.uploaded) {
        uploadedCount++;
        setTimeout(() => {
          sendToGoogleSheet(index + 1, item.text, index, qrDataList);
        }, delay);
        delay += 400;
      }
    });
    if (uploadedCount === 0) {
      showToast("Semua data sudah ada di Sheet!", "check-circle");
    } else {
      showToast(`Memulai upload ${uploadedCount} data...`, "cloud-lightning");
    }
  };

  const startScanner = () => {
    setIsScanning(true);
    html5QrCodeRef.current = new Html5Qrcode("reader");
    html5QrCodeRef.current.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        addScannedData(decodedText);
      },
      () => {}
    ).catch(err => {
      console.error(err);
      showToast("Kamera tidak ditemui/dibenarkan", "alert-triangle");
      setIsScanning(false);
    });
  };

  const stopScanner = () => {
    if (html5QrCodeRef.current) {
      html5QrCodeRef.current.stop().then(() => {
        html5QrCodeRef.current.clear();
        setIsScanning(false);
      }).catch(console.error);
    }
  };

  return (
    <div className="bg-slate-50 text-slate-800 font-sans min-h-screen pb-8">
      <header className="bg-indigo-600 text-white shadow-md sticky top-0 z-50 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <QrCode className="w-6 h-6" />
          <h1 className="text-lg font-bold tracking-tight">QR Scanner</h1>
        </div>
        <button onClick={() => navigate('/desktop')} className="bg-indigo-500 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center transition shadow-sm border border-indigo-400">
          <Monitor className="w-4 h-4 mr-1.5" />
          Desktop
        </button>
      </header>

      <main className="p-4 max-w-md mx-auto space-y-5">
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 overflow-hidden">
          <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center">
              <Camera className="w-4 h-4 mr-1.5 text-indigo-500" /> Kamera Scanner
            </h2>
            <button onClick={() => setIsMirrored(!isMirrored)} className="text-[11px] bg-slate-100 px-2.5 py-1 rounded-full font-semibold flex items-center space-x-1">
              <FlipHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span>Mirror: <span className={isMirrored ? "text-indigo-600 font-bold" : "text-slate-500 font-bold"}>{isMirrored ? 'ON' : 'OFF'}</span></span>
            </button>
          </div>
          
          <div className="relative bg-slate-900 rounded-xl overflow-hidden aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-300">
            <div id="reader" className={`w-full h-full ${isMirrored ? 'scale-x-[-1]' : ''}`}></div>
            {!isScanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-4 text-center space-y-3 z-10 bg-slate-900">
                <Camera className="w-12 h-12 text-indigo-400" />
                <p className="text-sm">Klik "Mula" untuk aktifkan kamera.</p>
              </div>
            )}
          </div>

          <div className="mt-4 flex space-x-3">
            {!isScanning ? (
              <button onClick={startScanner} className="flex-1 bg-indigo-600 text-white py-3 px-4 rounded-xl font-medium flex justify-center space-x-2">
                <Play className="w-4 h-4" /> <span>Mula Scan</span>
              </button>
            ) : (
              <button onClick={stopScanner} className="flex-1 bg-rose-500 text-white py-3 px-4 rounded-xl font-medium flex justify-center space-x-2">
                <Square className="w-4 h-4" /> <span>Hentikan</span>
              </button>
            )}
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="flex items-center text-sm font-semibold text-slate-500 uppercase tracking-wider">
              <Database className="w-4 h-4 mr-1.5 text-emerald-500" /> Google Sheet Sync
            </span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-600">Auto-Kirim Setiap Scan</span>
              <input type="checkbox" checked={autoSync} onChange={(e) => {
                setAutoSync(e.target.checked);
                localStorage.setItem('qr_react_autosync', e.target.checked);
              }} className="w-5 h-5 accent-emerald-500" />
            </div>
            <button onClick={syncAllToSheet} className="w-full bg-emerald-600 text-white py-3 rounded-xl text-xs font-semibold flex justify-center space-x-2">
              <CloudLightning className="w-4 h-4" /> <span>Upload Semua Data Lokal</span>
            </button>
          </div>
        </section>

        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider flex items-center">
              <History className="w-4 h-4 mr-1.5 text-indigo-500" /> Tersimpan ({qrDataList.length})
            </h2>
            <button onClick={() => setShowClearModal(true)} className="text-rose-500 text-xs font-semibold flex items-center space-x-1 p-1">
              <Trash2 className="w-3.5 h-3.5" /> <span>Hapus</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-xl max-h-60 overflow-y-auto">
            <table className="min-w-full divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-slate-500 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left w-12">No.</th>
                  <th className="px-4 py-3 text-left">Hasil QR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...qrDataList].reverse().map((item, idx) => {
                  const actualIndex = qrDataList.length - 1 - idx;
                  return (
                    <tr key={actualIndex}>
                      <td className="px-4 py-2 font-semibold text-slate-400">{actualIndex + 1}</td>
                      <td className="px-4 py-2 break-all font-mono text-xs">{item.text}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Toast Notification */}
      <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-5 py-3 rounded-full text-sm font-medium shadow-xl flex items-center space-x-2.5 transition-all duration-300 z-50 ${toast.show ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <CheckCircle className="w-4 h-4 text-emerald-400" />
        <span>{toast.msg}</span>
      </div>

      {/* Modal Clear */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 space-y-4 shadow-2xl max-w-sm w-full">
            <h3 className="text-lg font-bold">Hapus Semua Data?</h3>
            <p className="text-sm text-slate-500">Tindakan ini tidak bisa dibatalkan.</p>
            <div className="flex space-x-3">
              <button onClick={() => setShowClearModal(false)} className="flex-1 py-2 bg-slate-100 rounded-xl font-medium">Batal</button>
              <button onClick={() => { setQrDataList([]); localStorage.setItem(LOCAL_STORAGE_KEY, "[]"); setShowClearModal(false); }} className="flex-1 py-2 bg-rose-500 text-white rounded-xl font-medium">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
