
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, Wallet, Fuel, BarChart3, Settings, 
  Cpu, Smartphone, Layers, AlertCircle, 
  ChevronLeft, ChevronRight, LogOut, RotateCcw,
  Target, TrendingUp, CheckCircle2, Trash2, Plus, HeartOff, User
} from 'lucide-react';

const API_URL = "https://script.google.com/macros/s/AKfycbygAwOcqosMpmUokaaZZVrgPRRt__AZO8jVqW4koRAg4VB7fwPvrgOGC8OPSf2UEyLPxQ/exec";
const SYSTEM_KEY = 'stc_pro_v14_system';
const AUTH_KEY = 'stc_pro_v14_auth_user';
const LABELS: Record<string, string> = { 
  jawwy: 'شريحة جوّي', 
  sawa: 'شريحة سوا', 
  multi: 'عميل متعددة', 
  issue: 'لم يتم الاكمال' 
};

const App = () => {
  // الحالة الابتدائية الآمنة
  const initialDb = { 
    tx: [], 
    stock: { jawwy: 0, sawa: 0, multi: 0 }, 
    damaged: { jawwy: 0, sawa: 0, multi: 0 }, 
    stockLog: [], 
    fuelLog: [], 
    settings: { weeklyTarget: 3000 } 
  };

  const [system, setSystem] = useState<any>({
    users: [{ 
      id: 'talal-admin', username: 'talal', password: '00966', role: 'admin', name: 'طلال المندوب',
      db: initialDb
    }]
  });

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeView, setActiveView] = useState('home');
  const [isSyncing, setIsSyncing] = useState(false);
  const [curDate, setCurDate] = useState(new Date());
  const [modalType, setModalType] = useState<string | null>(null);
  const [tempSim, setTempSim] = useState<string | null>(null);
  const [loginForm, setLoginForm] = useState({ user: '', pass: '' });

  useEffect(() => {
    const local = localStorage.getItem(SYSTEM_KEY);
    let currentSystem = system;
    if (local) {
        try { 
          const parsed = JSON.parse(local);
          if (parsed && parsed.users) {
            setSystem(parsed);
            currentSystem = parsed;
          }
        } catch(e) { console.error("Load error:", e); }
    }
    
    const auth = localStorage.getItem(AUTH_KEY);
    if (auth) {
      const user = currentSystem.users.find((u: any) => u.id === auth);
      if (user) setCurrentUser(user);
    }
    sync();
  }, []);

  const sync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      if (data?.users) {
        setSystem(data);
        localStorage.setItem(SYSTEM_KEY, JSON.stringify(data));
        const auth = localStorage.getItem(AUTH_KEY);
        if (auth) {
          const u = data.users.find((u: any) => u.id === auth);
          if(u) setCurrentUser(u);
        }
      }
    } catch (e) { console.warn("Offline Mode"); }
    finally { setIsSyncing(false); }
  };

  const updateDb = (updater: (db: any) => any) => {
    if (!currentUser) return;
    const currentDb = currentUser.db || initialDb;
    const nextDb = updater(currentDb);
    const nextUsers = system.users.map((u: any) => u.id === currentUser.id ? { ...u, db: nextDb } : u);
    const nextSystem = { ...system, users: nextUsers };
    
    setSystem(nextSystem);
    setCurrentUser({ ...currentUser, db: nextDb });
    localStorage.setItem(SYSTEM_KEY, JSON.stringify(nextSystem));
    
    fetch(API_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(nextSystem) }).catch(() => {});
  };

  const handleSale = (amt: number, sims: number) => {
    if (!tempSim) return;
    updateDb(db => ({
      ...db,
      tx: [{ id: Date.now(), date: curDate.toISOString(), type: tempSim, amt, sims }, ...(db.tx || [])],
      stock: { ...db.stock, [tempSim]: tempSim !== 'issue' ? (db.stock[tempSim] || 0) - sims : 0 }
    }));
    setModalType(null);
    setTempSim(null);
  };

  const db = currentUser?.db || initialDb;
  
  const dayTx = useMemo(() => {
    if (!db?.tx) return [];
    return db.tx.filter((t: any) => new Date(t.date).toDateString() === curDate.toDateString());
  }, [db, curDate]);
  
  const dayTotal = useMemo(() => dayTx.reduce((s: number, t: any) => s + (Number(t.amt) || 0), 0), [dayTx]);

  const targetMetrics = useMemo(() => {
    const d = new Date(curDate);
    const sun = new Date(d.setDate(d.getDate() - d.getDay())); 
    sun.setHours(0,0,0,0);
    const sales = (db.tx || []).filter((t: any) => new Date(t.date) >= sun).reduce((s: number,t: any) => s + (Number(t.amt) || 0), 0);
    const target = Number(db.settings?.weeklyTarget) || 3000;
    return { sales, target, percent: Math.min(100, Math.round((sales/target)*100)) };
  }, [db, curDate]);

  if (!currentUser) return (
    <div className="min-h-screen bg-[#F8F9FE] flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-[3rem] p-10 shadow-2xl text-center border border-zinc-100">
        <div className="bg-stc-purple p-6 rounded-3xl w-20 h-20 flex items-center justify-center mx-auto mb-8 shadow-xl">
          <img src="https://www.stc.com.sa/content/dam/stc/footer-icons/stc-badge-purple.svg" className="brightness-0 invert h-10" alt="STC" />
        </div>
        <h1 className="text-xl font-black text-stc-purple mb-8 uppercase tracking-tight">دخول المندوب</h1>
        <div className="space-y-4">
          <input type="text" placeholder="اسم المستخدم" className="w-full bg-zinc-50 p-4 rounded-2xl text-center font-bold outline-none" onChange={e=>setLoginForm({...loginForm, user:e.target.value})} />
          <input type="password" placeholder="كلمة المرور" className="w-full bg-zinc-50 p-4 rounded-2xl text-center font-bold outline-none" onChange={e=>setLoginForm({...loginForm, pass:e.target.value})} />
          <button onClick={() => {
            const u = system.users.find((x: any) => x.username === loginForm.user && x.password === loginForm.pass);
            if (u) { setCurrentUser(u); localStorage.setItem(AUTH_KEY, u.id); }
            else alert('بيانات غير صحيحة');
          }} className="w-full bg-stc-purple text-white py-4 rounded-2xl font-black shadow-lg">دخول</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FE] pb-32">
      <header className="bg-stc-purple pt-12 pb-10 px-6 rounded-b-[3rem] shadow-xl sticky top-0 z-50 text-white">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-xl text-white"><User size={18}/></div>
            <div className="text-right">
              <span className="block text-[10px] opacity-60 font-bold">المندوب</span>
              <span className="block font-black text-xs leading-none">{String(currentUser.name)}</span>
            </div>
          </div>
          <button onClick={sync} className={`p-2 bg-white/10 rounded-xl ${isSyncing ? 'animate-spin' : ''}`}><RotateCcw size={18}/></button>
        </div>
        <div className="flex justify-center items-center gap-4 bg-black/10 p-2 rounded-2xl backdrop-blur-md">
          <button onClick={() => setCurDate(d => new Date(d.setDate(d.getDate() - 1)))}><ChevronRight size={20}/></button>
          <div className="text-center min-w-[100px]">
            <span className="block font-black text-lg">{curDate.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}</span>
          </div>
          <button onClick={() => setCurDate(d => new Date(d.setDate(d.getDate() + 1)))}><ChevronLeft size={20}/></button>
        </div>
      </header>

      <main className="p-6 space-y-6 max-w-lg mx-auto">
        {activeView === 'home' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="مبيعات اليوم" value={`${dayTotal} ﷼`} icon={<TrendingUp size={18}/>} color="purple" />
              <StatCard label="الطلبات" value={String(dayTx.length)} icon={<CheckCircle2 size={18}/>} color="emerald" />
            </div>

            <div className="bg-gradient-to-br from-stc-purple to-stc-dark p-6 rounded-[2rem] text-white shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <h3 className="text-[10px] font-black opacity-60 mb-2 tracking-widest uppercase">الهدف الأسبوعي</h3>
                    <div className="flex justify-between items-end mb-4">
                        <span className="text-3xl font-black">{String(targetMetrics.sales)} <small className="text-xs opacity-40">/ {String(targetMetrics.target)}</small></span>
                        <span className="text-xl font-black">{String(targetMetrics.percent)}%</span>
                    </div>
                    <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 transition-all duration-700" style={{ width: `${targetMetrics.percent}%` }} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <ActionBtn label="جوّي" icon={<Cpu className="text-orange-500" />} stock={db?.stock?.jawwy} onClick={() => { setTempSim('jawwy'); setModalType('price'); }} />
              <ActionBtn label="سوا" icon={<Smartphone className="text-stc-purple" />} stock={db?.stock?.sawa} onClick={() => { setTempSim('sawa'); setModalType('price'); }} />
              <ActionBtn label="متعددة" icon={<Layers className="text-amber-500" />} stock={db?.stock?.multi} onClick={() => { setTempSim('multi'); setModalType('multi'); }} />
              <ActionBtn label="تعثر" icon={<AlertCircle className="text-zinc-400" />} onClick={() => { if(confirm('تسجيل تعثر؟')){ setTempSim('issue'); handleSale(10, 0); } }} />
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-zinc-400 px-2 uppercase text-right">آخر العمليات</h4>
              {dayTx.map((t: any) => (
                <div key={t.id} className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm border border-zinc-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-50 rounded-xl"><SimIcon type={t.type} size={16}/></div>
                    <div className="text-right">
                      <span className="block font-black text-xs">{String(LABELS[t.type] || t.type)}</span>
                      <span className="text-[9px] font-bold text-zinc-300">{new Date(t.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-black text-stc-purple">{String(t.amt)} ﷼</span>
                    <button onClick={() => updateDb(d => ({ 
                      ...d, 
                      tx: d.tx.filter((x: any) => x.id !== t.id), 
                      stock: { ...d.stock, [t.type]: t.type !== 'issue' ? (d.stock[t.type] || 0) + (t.sims || 0) : 0 } 
                    }))} className="text-zinc-200"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        {activeView === 'inv' && <InventoryView db={db} updateDb={updateDb} />}
        {activeView === 'fuel' && <FuelView db={db} updateDb={updateDb} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white p-4 pb-8 border-t border-zinc-100 grid grid-cols-5 gap-2 shadow-2xl z-50">
        <NavIcon icon={<Home size={20}/>} active={activeView === 'home'} onClick={()=>setActiveView('home')} />
        <NavIcon icon={<Wallet size={20}/>} active={activeView === 'inv'} onClick={()=>setActiveView('inv')} />
        <NavIcon icon={<Fuel size={20}/>} active={activeView === 'fuel'} onClick={()=>setActiveView('fuel')} />
        <NavIcon icon={<BarChart3 size={20}/>} active={activeView === 'rep'} onClick={()=>setActiveView('rep')} />
        <NavIcon icon={<Settings size={20}/>} active={activeView === 'settings'} onClick={()=>setActiveView('settings')} />
      </nav>

      {modalType === 'price' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-end" onClick={()=>setModalType(null)}>
          <div className="w-full bg-white rounded-t-[2.5rem] p-8 pb-12" onClick={e=>e.stopPropagation()}>
            <h3 className="text-lg font-black mb-6 text-right text-stc-purple">اختر السعر حسب الوقت ⏱️</h3>
            <div className="space-y-3">
              {(tempSim === 'jawwy' ? [30, 25, 20] : [28, 24, 20]).map((p, i) => (
                <button key={p} onClick={() => handleSale(p, 1)} className="w-full bg-zinc-50 p-5 rounded-2xl flex justify-between items-center active:bg-stc-purple active:text-white transition-colors">
                  <span className="font-black text-sm">{['ساعتين فأقل', '2-3 ساعات', 'أكثر من 3 ساعات'][i]}</span>
                  <span className="bg-stc-purple text-white px-3 py-1 rounded-lg font-black">{String(p)} ﷼</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {modalType === 'multi' && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-end" onClick={()=>setModalType(null)}>
          <div className="w-full bg-white rounded-t-[2.5rem] p-8 pb-12" onClick={e=>e.stopPropagation()}>
            <h3 className="text-lg font-black mb-6 text-right text-stc-purple">كم عدد الشرائح؟</h3>
            <div className="grid grid-cols-4 gap-3">
                {[1,2,3,4,5,6,7,8].map(n => (
                    <button key={n} onClick={() => { setModalType('price'); }} className="bg-zinc-50 p-5 rounded-xl font-black text-lg active:bg-stc-purple active:text-white">{String(n)}</button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => {
  const colorMap: any = { purple: "bg-purple-50 text-purple-600", emerald: "bg-emerald-50 text-emerald-600" };
  return (
    <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-50 flex items-center justify-between">
      <div className={`p-2 rounded-xl ${colorMap[color] || 'bg-zinc-50 text-zinc-600'}`}>{icon}</div>
      <div className="text-left">
        <span className="text-[9px] font-black text-zinc-300 block uppercase">{String(label)}</span>
        <span className="text-lg font-black text-zinc-800 leading-none">{String(value)}</span>
      </div>
    </div>
  );
};

const ActionBtn = ({ label, icon, stock, onClick }: any) => (
  <button onClick={onClick} className="bg-white p-5 rounded-[2rem] text-center border border-zinc-50 shadow-sm relative active:scale-95 transition-transform">
    {stock !== undefined && <span className={`absolute top-3 left-3 text-[8px] font-black px-1.5 rounded-full ${stock <= 2 ? 'bg-red-500 text-white' : 'bg-zinc-100 text-zinc-400'}`}>{String(stock)}</span>}
    <div className="flex justify-center mb-2">{icon}</div>
    <span className="font-black text-[11px] text-zinc-700">{String(label)}</span>
  </button>
);

const NavIcon = ({ icon, active, onClick }: any) => (
  <button onClick={onClick} className={`flex justify-center p-3 rounded-xl transition-all ${active ? 'bg-stc-purple text-white shadow-lg shadow-stc-purple/20' : 'text-zinc-400'}`}>{icon}</button>
);

const SimIcon = ({ type, size }: any) => {
  if (type === 'jawwy') return <Cpu size={size} className="text-orange-500" />;
  if (type === 'sawa') return <Smartphone size={size} className="text-stc-purple" />;
  if (type === 'multi') return <Layers size={size} className="text-amber-500" />;
  return <AlertCircle size={size} className="text-zinc-400" />;
};

const InventoryView = ({ db, updateDb }: any) => (
  <div className="space-y-4 text-right animate-in fade-in duration-300">
    <h2 className="text-lg font-black text-stc-purple">المخزون الحالي</h2>
    <div className="grid grid-cols-2 gap-3">
      {Object.entries(db?.stock || {}).map(([k, v]) => (
        <div key={k} className="bg-white p-5 rounded-2xl text-center shadow-sm border border-zinc-50">
          <span className="block text-2xl font-black text-stc-purple mb-1">{String(v)}</span>
          <span className="text-[9px] font-bold text-zinc-300 uppercase">{String(LABELS[k] || k)}</span>
        </div>
      ))}
    </div>
    <button onClick={() => {
        const type = prompt('النوع؟ (jawwy, sawa, multi)');
        const qty = prompt('الكمية؟');
        if(type && qty) updateDb((d: any) => ({ ...d, stock: { ...d.stock, [type]: (d.stock[type] || 0) + parseInt(qty) } }));
    }} className="w-full bg-emerald-50 text-emerald-600 p-4 rounded-xl font-black text-xs">إضافة مخزون +</button>
  </div>
);

const FuelView = ({ db, updateDb }: any) => (
    <div className="space-y-4 animate-in fade-in duration-300 text-right">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-zinc-100">
            <h3 className="text-stc-purple font-black mb-4 text-sm">تسجيل وقود</h3>
            <input type="number" placeholder="المبلغ (﷼)" className="w-full bg-zinc-50 p-4 rounded-xl font-bold outline-none mb-3 text-center" id="f-amt" />
            <button onClick={() => {
                const input = document.getElementById('f-amt') as HTMLInputElement;
                if(input?.value) {
                    updateDb((d: any) => ({
                        ...d,
                        fuelLog: [{ id: Date.now(), date: new Date().toISOString(), amount: parseFloat(input.value) }, ...(d.fuelLog || [])]
                    }));
                    input.value = '';
                }
            }} className="w-full bg-stc-purple text-white py-4 rounded-xl font-black text-xs">حفظ السجل</button>
        </div>
    </div>
);

export default App;
