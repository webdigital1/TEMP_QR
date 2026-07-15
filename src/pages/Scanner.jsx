import { useState, useEffect, useRef } from 'react';
import { QrCode, Camera, FlipHorizontal, Play, Square, Database, Keyboard, Plus, History, Trash2, FileSpreadsheet, FileText, Monitor, CheckCircle, AlertTriangle, CloudLightning, Focus, Inbox, Trash, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';

const SHEET_URL = "https://script.google.com/macros/s/AKfycbyqXJeBHMMiuQku_miS7C0MB07h4B9qPE3x5x20UE6vhXFKlhpt8LLKHDYIs_jJutbO/exec";
const LOCAL_STORAGE_KEY = 'qr_react_scanned_data';

export default function Scanner() {
  const navigate = useNavigate();
  const [isMirrored, setIsMirrored] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [qrDataList, setQrDataList] = useState([]);
  const [autoSync, setAutoSync] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [toast, setToast] = useState({ show: false, msg: '', icon: 'check-circle' });
  const html5QrCodeRef = useRef(null);
  const lastScannedRef = useRef({ text: '', time: 0 });
  const [showClearModal, setShowClearModal] = useState(false);
  const [recentScanId, setRecentScanId] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);

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

  const sendToGoogleSheet = (qrText, itemId) => {
    const targetUrl = `${SHEET_URL}?action=add&no=Auto&qr=${encodeURIComponent(qrText)}`;
    fetch(targetUrl, { mode: 'no-cors' }).then(() => {
      showToast(`Terkirim ke Sheet!`, "cloud-lightning");
      if (itemId) {
        setQrDataList(prev => {
          const newData = prev.map(item => item.id === itemId ? { ...item, uploaded: true } : item);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newData));
          return newData;
        });
      }
    }).catch(err => {
      console.error(err);
      showToast("Gagal kirim ke Google Sheet", "alert-triangle");
    });
  };

  const addScannedData = (text) => {
    const trimmedText = text.trim();
    if (!trimmedText) return;

    const now = Date.now();
    // Halang imbasan yang sama berturut-turut dalam masa 3 saat
    if (lastScannedRef.current.text === trimmedText && (now - lastScannedRef.current.time < 3000)) {
      showToast("Data QR sama terdeteksi!", "alert-triangle");
      if (navigator.vibrate) navigator.vibrate([100, 80, 100]);
      return;
    }
    
    lastScannedRef.current = { text: trimmedText, time: now };

    const newItemId = Date.now().toString() + Math.random().toString();
    const newItem = { id: newItemId, text: trimmedText, timestamp: new Date().toISOString(), uploaded: false };
    
    setQrDataList(prev => {
      const newData = [...prev, newItem];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });

    setRecentScanId(newItemId);
    setTimeout(() => {
      setRecentScanId(prevId => prevId === newItemId ? null : prevId);
    }, 3000);

    playSuccessSound();
    showToast("QR Berhasil Disimpan!");
    if (navigator.vibrate) navigator.vibrate(100);

    if (autoSync) {
      sendToGoogleSheet(trimmedText, newItemId);
    }
  };

  const syncAllToSheet = () => {
    if (qrDataList.length === 0) {
      showToast("Tiada data untuk dimuat naik!", "alert-triangle");
      return;
    }
    let delay = 0;
    let uploadedCount = 0;
    qrDataList.forEach((item) => {
      if (!item.uploaded) {
        uploadedCount++;
        setTimeout(() => {
          sendToGoogleSheet(item.text, item.id);
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

  const deleteSingleItem = (idToRemove, itemText, wasUploaded) => {
    setQrDataList(prev => {
      const newData = prev.filter(item => item.id !== idToRemove);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newData));
      return newData;
    });

    if (wasUploaded) {
      const targetUrl = `${SHEET_URL}?action=delete&qr=${encodeURIComponent(itemText)}`;
      fetch(targetUrl, { mode: 'no-cors' }).then(() => {
        showToast("Data turut dipadam di Sheet", "trash-2");
      }).catch(err => {
        console.error(err);
      });
    } else {
      showToast("Data lokal dipadam");
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

      <main className="p-4 space-y-4 max-w-lg mx-auto">
        {/* Bahagian Kamera - Dijadikan Floating (Fixed Kanan Atas) */}
        <section className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-slate-200 p-3 fixed top-[76px] right-4 z-40 transform transition-all overflow-hidden w-[260px]">
          <div className={`flex justify-between items-center ${isMinimized ? '' : 'mb-3'}`}>
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
              <Camera className="w-4 h-4 mr-1.5 text-indigo-500" /> Scanner
            </h2>
            <div className="flex items-center space-x-1">
              {!isMinimized && (
                <button onClick={() => setIsMirrored(!isMirrored)} className="text-[11px] bg-slate-100 px-2 py-1 rounded-full font-semibold flex items-center space-x-1" title="Mirror Camera">
                  <FlipHorizontal className="w-3.5 h-3.5 text-slate-500" />
                </button>
              )}
              <button onClick={() => setIsMinimized(!isMinimized)} className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 p-1 rounded-full transition" title={isMinimized ? "Buka Kamera" : "Tutup Kamera"}>
                {isMinimized ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
              </button>
            </div>
          </div>
          
          {!isMinimized && (
            <>
              <div className="relative rounded-xl overflow-hidden bg-slate-900 border-2 border-slate-800 shadow-inner h-[200px] w-full flex items-center justify-center">
                <div id="reader" className={`w-full h-full [&_video]:object-cover [&_video]:h-full ${isMirrored ? 'scale-x-[-1]' : ''}`}></div>
                {!isScanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-4 text-center space-y-3 z-10 bg-slate-900">
                    <Camera className="w-12 h-12 text-indigo-400" />
                    <p className="text-sm">Klik "Mula" untuk aktifkan kamera.</p>
                  </div>
                )}
              </div>

              <div className="mt-3 flex space-x-3">
                {!isScanning ? (
                  <button onClick={startScanner} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-xl font-medium flex justify-center items-center space-x-2 transition shadow-sm">
                    <Play className="w-4 h-4" /> <span className="text-sm">Mula Scan</span>
                  </button>
                ) : (
                  <button onClick={stopScanner} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-2.5 px-4 rounded-xl font-medium flex justify-center items-center space-x-2 transition shadow-sm">
                    <Square className="w-4 h-4" /> <span className="text-sm">Hentikan</span>
                  </button>
                )}
              </div>
            </>
          )}
        </section>

        {/* Bahagian Input Manual */}
        <section className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="flex items-center text-sm font-semibold text-slate-500 uppercase tracking-wider">
              <Keyboard className="w-4 h-4 mr-1.5 text-blue-500" /> Masukkan Manual
            </span>
          </div>
          <div className="flex space-x-2">
            <input 
              type="text" 
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder="Taip kod atau URL di sini..." 
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button 
              onClick={() => {
                if(manualInput.trim()){
                  addScannedData(manualInput);
                  setManualInput('');
                }
              }} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-semibold transition flex items-center justify-center shadow-sm"
            >
              <Plus className="w-5 h-5" />
            </button>
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
                  <th className="px-4 py-3 text-right w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...qrDataList].reverse().map((item, idx) => {
                  const actualIndex = qrDataList.length - 1 - idx;
                  const isRecent = recentScanId === item.id;
                  
                  return (
                    <tr 
                      key={item.id || actualIndex} 
                      className={isRecent ? "bg-emerald-100/60 animate-pulse transition-colors duration-500" : "transition-colors duration-500"}
                    >
                      <td className="px-4 py-2 font-semibold text-slate-400">{actualIndex + 1}</td>
                      <td className="px-4 py-2 break-all font-mono text-xs">
                        <div className="flex items-center space-x-2">
                          <span>{item.text}</span>
                          {item.uploaded && (
                            <span className="flex items-center text-emerald-500" title="Berjaya di-upload">
                              <CheckCircle className="w-4 h-4 animate-pulse" />
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button 
                          onClick={() => deleteSingleItem(item.id, item.text, item.uploaded)}
                          className="text-slate-300 hover:text-rose-500 p-1.5 rounded-lg transition"
                          title="Hapus"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </td>
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
