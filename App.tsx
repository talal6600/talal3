
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Home, Wallet, Fuel, BarChart3, Settings, 
  Cpu, Smartphone, Layers, AlertCircle, 
  ChevronLeft, ChevronRight, LogOut, RotateCcw,
  Target, TrendingUp, CheckCircle2, Trash2, User
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
        if (parsed && Array.isArray(parsed.users)) {
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
      if (data && Array.isArray(data.users)) {
        setSystem(data);
        localStorage.setItem(SYSTEM_KEY, JSON.stringify(data));
        const auth = localStorage.getItem(AUTH_KEY);
        if (auth) {
          const u = data.users.find((u: any) => u.id === auth);
          if(u) setCurrentUser(u);
        }
      }
    } catch (e) { console.warn("Offline Mode active"); }
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
    if (!db || !Array.isArray(db.tx)) return [];
    const dateStr = curDate.toDateString();
    return db.tx.filter((t: any) => new Date(t.date).toDateString() === dateStr);
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
          <input type="text" placeholder="اسم المستخدم" className="w-full bg-zinc-50 p-4 rounded-2xl text-center font-bold outline-none border border-transparent focus:border-stc-purple/20 transition-all" onChange={e=>setLoginForm({...loginForm, user:e.target.value})} />
          <input type="password" placeholder="كلمة المرور" className="w-full bg-zinc-50 p-4 rounded-2xl text-center font-bold outline-none border border-transparent focus:border-stc-purple/20 transition-all" onChange={e=>setLoginForm({...loginForm, pass:e.target.value})} />
          <button onClick={() => {
            const u = system.users.find((x: any) => x.username === loginForm.user && x.password === loginForm.pass);
            if (u) { setCurrentUser(u); localStorage.setItem(AUTH_KEY, u.id); }
            else alert('بيانات غير صحيحة');
          }} className="w-full bg-stc-purple text-white py-4 rounded-2xl font-black shadow-lg active:scale-95 transition-all">دخول</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FE] pb-32">
      <header className="bg-stc-purple pt-12 pb-10 px-6 rounded-b-[3rem] shadow-xl sticky top-0 z-50 text-white">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3 text-right">
            <div className="bg-white/20 p-2 rounded-xl text-white"><User size={18}/></div>
            <div>
              <span className="block text-[10px] opacity-60 font-bold uppercase tracking-tighter leading-none mb-1">المندوب المتصل</span>
              <span className="block font-black text-sm leading-none">{String(currentUser.name || 'غير معروف')}</span>
            </div>
          </div>
          <button onClick={sync} className={`p-2 bg-white/10 rounded-xl transition-all active:scale-90 ${isSyncing ? 'animate-spin' : ''}`}><RotateCcw size={18}/></button>
        </div>
        <div className="flex justify-center items-center gap-4 bg-black/10 p-2 rounded-2xl backdrop-blur-md">
          <button className="p-1 active:scale-90 transition-all" onClick={() => setCurDate(d => new Date(d.setDate(d.getDate() - 1)))}><ChevronRight size={20}/></button>
          <div className="text-center min-w-[110px]">
            <span className="block font-black text-lg">{curDate.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
          </div>
          <button className="p-1 active:scale-90 transition-all" onClick={() => setCurDate(d => new Date(d.setDate(d.getDate() + 1)))}><ChevronLeft size={20}/></button>
        </div>
      </header>

      <main className="p-6 space-y-6 max-w-lg mx-auto">
        {activeView === 'home' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="مبيعات اليوم" value={`${String(dayTotal)} ﷼`} icon={<TrendingUp size={18}/>} color="purple" />
              <StatCard label="إجمالي الطلبات" value={String(dayTx.length)} icon={<CheckCircle2 size={18}/>} color="emerald" />
            </div>

            <div className="bg-gradient-to-br from-stc-purple to-stc-dark p-6 rounded-[2rem] text-white shadow-lg relative overflow-hidden text-right">
                <div className="relative z-10">
                    <h3 className="text-[10px] font-black opacity-60 mb-2 tracking-widest uppercase">مؤشر الهدف الأسبوعي</h3>
                    <div className="flex justify-between items-end mb-4 flex-row-reverse">
                        <span className="text-3xl font-black">{String(targetMetrics.sales)} <small className="text-xs opacity-40">/ {String(targetMetrics.target)}</small></span>
                        <span className="text-xl font-black">{String(targetMetrics.percent)}%</span>
                    </div>
                    <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400 transition-all duration-700" style={{ width: `${String(targetMetrics.percent)}%` }} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <ActionBtn label="جوّي" icon={<Cpu className="text-orange-500" />} stock={db?.stock?.jawwy} onClick={() => { setTempSim('jawwy'); setModalType('price'); }} />
              <ActionBtn label="سوا" icon={<Smartphone className="text-stc-purple" />} stock={db?.stock?.sawa} onClick={() => { setTempSim('sawa'); setModalType('price'); }} />
              <ActionBtn label="متعددة" icon={<Layers className="text-amber-500" />} stock={db?.stock?.multi} onClick={() => { setTempSim('multi'); setModalType('multi'); }} />
              <ActionBtn label="تعثر التوصيل" icon={<AlertCircle className="text-zinc-400" />} onClick={() => { if(confirm('تسجيل تعثر؟')){ setTempSim('issue'); handleSale(10, 0); } }} />
            </div>

            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-zinc-400 px-2 uppercase text-right tracking-widest">آخر العمليات اليوم</h4>
              {dayTx.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-3xl border border-dashed border-zinc-200 text-zinc-300 font-bold text-sm">لا يوجد مبيعات مسجلة اليوم</div>
              ) : (
                dayTx.map((t: any) => (
                  <div key={t.id} className="bg-white p-4 rounded-2xl flex justify-between items-center shadow-sm border border-zinc-100 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex items-center gap-3 flex-row-reverse text-right">
                      <div className="p-2 bg-zinc-50 rounded-xl"><SimIcon type={t.type} size={16}/></div>
                      <div>
                        <span className="block font-black text-xs">{String(LABELS[t.type] || t.type)}</span>
                        <span className="text-[9px] font-bold text-zinc-300">{new Date(t.date).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-stc-purple">{String(t.amt)} ﷼</span>
                      <button onClick={() => {
                        if(confirm('حذف هذه العملية؟')) {
                          updateDb(d => ({ 
                            ...d, 
                            tx: d.tx.filter((x: any) => x.id !== t.id), 
                            stock: { ...d.stock, [t.type]: t.type !== 'issue' ? (d.stock[t.type] || 0) + (t.sims || 0) : 0 } 
                          }));
                        }
                      }} className="text-zinc-200 hover:text-red-400 transition-colors p-1"><Trash2 size={16}/></button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
        {activeView === 'inv' && <InventoryView db={db} updateDb={updateDb} />}
        {activeView === 'fuel' && <FuelView db={db} updateDb={updateDb} />}
        {activeView === 'settings' && (
          <div className="text-center space-y-6">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-zinc-50">
               <User className="mx-auto text-stc-purple mb-4" size={48} />
               <h3 className="font-black text-lg">{String(currentUser.name)}</h3>
               <p className="text-xs font-bold text-zinc-400">@{String(currentUser.username)}</p>
               <button onClick={() => {
                 if(confirm('هل تريد تسجيل الخروج؟')) {
                   localStorage.removeItem(AUTH_KEY);
                   window.location.reload();
                 }
               }} className="mt-6 flex items-center gap-2 mx-auto text-red-500 font-black text-sm">
                 <LogOut size={16} /> خروج من الحساب
               </button>
            </div>
            <div className="text-[10px] text-zinc-300 font-bold uppercase tracking-widest">مستر مندوب Pro - v14.0.1</div>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl p-4 pb-8 border-t border-zinc-100 grid grid-cols-5 gap-2 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] z-50">
        <NavIcon icon={<Home size={20}/>} active={activeView === 'home'} onClick={()=>setActiveView('home')} />
        <NavIcon icon={<Wallet size={20}/>} active={activeView === 'inv'} onClick={()=>setActiveView('inv')} />
        <NavIcon icon={<Fuel size={20}/>} active={activeView === 'fuel'} onClick={()=>setActiveView('fuel')} />
        <NavIcon icon={<BarChart3 size={20}/>} active={activeView === 'rep'} onClick={()=>setActiveView('rep')} />
        <NavIcon icon={<Settings size={20}/>} active={activeView === 'settings'} onClick={()=>setActiveView('settings')} />
      </nav>

      {modalType === 'price' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end animate-in fade-in duration-300" onClick={()=>setModalType(null)}>
          <div className="w-full bg-white rounded-t-[2.5rem] p-8 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-500" onClick={e=>e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-zinc-200 rounded-full mx-auto mb-6"></div>
            <h3 className="text-lg font-black mb-6 text-right text-stc-purple">اختر السعر حسب الوقت المستغرق ⏱️</h3>
            <div className="space-y-3">
              {(tempSim === 'jawwy' ? [30, 25, 20] : [28, 24, 20]).map((p, i) => (
                <button key={p} onClick={() => handleSale(p, 1)} className="w-full bg-zinc-50 p-5 rounded-2xl flex justify-between items-center active:bg-stc-purple active:text-white transition-all transform active:scale-98">
                  <span className="bg-stc-purple text-white px-4 py-2 rounded-xl font-black text-sm">{String(p)} ﷼</span>
                  <span className="font-black text-sm text-zinc-700">{['ساعتين فأقل', '2-3 ساعات', 'أكثر من 3 ساعات'][i]}</span>
                </button>
              ))}
            </div>
            <button onClick={()=>setModalType(null)} className="w-full mt-6 py-4 font-black text-zinc-400 text-sm">إلغاء</button>
          </div>
        </div>
      )}

      {modalType === 'multi' && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-end animate-in fade-in duration-300" onClick={()=>setModalType(null)}>
          <div className="w-full bg-white rounded-t-[2.5rem] p-8 pb-12 shadow-2xl animate-in slide-in-from-bottom duration-500" onClick={e=>e.stopPropagation()}>
            <div className="w-12 h-1.5 bg-zinc-200 rounded-full mx-auto mb-6"></div>
            <h3 className="text-lg font-black mb-6 text-right text-stc-purple">تحديد عدد الشرائح المباعة</h3>
            <div className="grid grid-cols-4 gap-3">
                {[1,2,3,4,5,6,7,8].map(n => (
                    <button key={n} onClick={() => { setModalType('price'); }} className="bg-zinc-50 p-6 rounded-2xl font-black text-lg active:bg-stc-purple active:text-white transform active:scale-95 transition-all text-zinc-700">{String(n)}</button>
                ))}
            </div>
            <button onClick={()=>setModalType(null)} className="w-full mt-8 py-4 font-black text-zinc-400 text-sm">رجوع</button>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: any) => {
  const colorMap: any = { purple: "bg-purple-50 text-purple-600", emerald: "bg-emerald-50 text-emerald-600" };
  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-zinc-50 flex items-center justify-between flex-row-reverse text-right">
      <div className={`p-2.5 rounded-2xl ${colorMap[color] || 'bg-zinc-50 text-zinc-600'}`}>{icon}</div>
      <div>
        <span className="text-[9px] font-black text-zinc-300 block uppercase tracking-tighter mb-0.5">{String(label)}</span>
        <span className="text-lg font-black text-zinc-800 leading-none">{String(value)}</span>
      </div>
    </div>
  );
};

const ActionBtn = ({ label, icon, stock, onClick }: any) => (
  <button onClick={onClick} className="bg-white p-6 rounded-[2.5rem] text-center border border-zinc-100 shadow-sm relative active:scale-95 transition-all group overflow-hidden">
    <div className="absolute inset-0 bg-zinc-50 opacity-0 group-active:opacity-100 transition-opacity"></div>
    {stock !== undefined && (
      <span className={`absolute top-4 left-4 text-[9px] font-black px-2 py-0.5 rounded-full z-10 ${Number(stock) <= 2 ? 'bg-red-500 text-white shadow-lg shadow-red-200' : 'bg-zinc-100 text-zinc-400'}`}>
        {String(stock)}
      </span>
    )}
    <div className="flex justify-center mb-3 relative z-10">{icon}</div>
    <span className="font-black text-xs text-zinc-700 relative z-10">{String(label)}</span>
  </button>
);

const NavIcon = ({ icon, active, onClick }: any) => (
  <button onClick={onClick} className={`flex justify-center p-4 rounded-2xl transition-all ${active ? 'bg-stc-purple text-white shadow-xl shadow-stc-purple/30 scale-110' : 'text-zinc-300 hover:text-zinc-500'}`}>{icon}</button>
);

const SimIcon = ({ type, size }: any) => {
  if (type === 'jawwy') return <Cpu size={size} className="text-orange-500" />;
  if (type === 'sawa') return <Smartphone size={size} className="text-stc-purple" />;
  if (type === 'multi') return <Layers size={size} className="text-amber-500" />;
  return <AlertCircle size={size} className="text-zinc-400" />;
};

const InventoryView = ({ db, updateDb }: any) => (
  <div className="space-y-6 text-right animate-in fade-in slide-in-from-top-2 duration-300">
    <h2 className="text-xl font-black text-stc-purple mr-2">إدارة المخزون</h2>
    <div className="grid grid-cols-2 gap-4">
      {Object.entries(db?.stock || {}).map(([k, v]) => (
        <div key={k} className="bg-white p-6 rounded-[2.5rem] text-center shadow-sm border border-zinc-100 relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-1 h-full bg-stc-purple opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <span className="block text-3xl font-black text-stc-purple mb-1">{String(v)}</span>
          <span className="text-[10px] font-black text-zinc-300 uppercase tracking-widest">{String(LABELS[k] || k)}</span>
        </div>
      ))}
    </div>
    <div className="bg-white p-6 rounded-3xl border border-zinc-100 space-y-4">
       <h4 className="text-xs font-black text-zinc-400 mr-1">تحديث يدوي سريع</h4>
       <div className="grid grid-cols-1 gap-2">
         <button onClick={() => {
            const type = prompt('النوع؟ (jawwy, sawa, multi)');
            const qty = prompt('الكمية المضافة؟');
            if(type && qty && !isNaN(Number(qty))) {
              updateDb((d: any) => ({ 
                ...d, 
                stock: { ...d.stock, [type]: (Number(d.stock[type]) || 0) + parseInt(qty) },
                stockLog: [{ date: new Date().toISOString(), type, qty: parseInt(qty), action: 'add' }, ...(d.stockLog || [])]
              }));
              alert('تم تحديث المخزون بنجاح');
            }
         }} className="w-full bg-stc-purple text-white p-5 rounded-2xl font-black text-sm shadow-lg shadow-stc-purple/20 active:scale-95 transition-all">إضافة شحنة جديدة +</button>
       </div>
    </div>
  </div>
);

const FuelView = ({ db, updateDb }: any) => (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300 text-right">
        <h2 className="text-xl font-black text-stc-purple mr-2">مصاريف الوقود</h2>
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-zinc-100">
            <div className="bg-emerald-50 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6">
               <Fuel className="text-emerald-500" size={32} />
            </div>
            <h3 className="text-zinc-800 font-black mb-6 text-center">تسجيل فاتورة جديدة</h3>
            <div className="space-y-4">
              <input type="number" placeholder="أدخل المبلغ (﷼)" className="w-full bg-zinc-50 p-5 rounded-2xl font-black outline-none border border-transparent focus:border-stc-purple/20 text-center text-xl" id="f-amt-view" />
              <button onClick={() => {
                  const input = document.getElementById('f-amt-view') as HTMLInputElement;
                  if(input?.value && !isNaN(Number(input.value))) {
                      updateDb((d: any) => ({
                          ...d,
                          fuelLog: [{ id: Date.now(), date: new Date().toISOString(), amount: parseFloat(input.value) }, ...(d.fuelLog || [])]
                      }));
                      input.value = '';
                      alert('تم حفظ المصروفات');
                  } else {
                    alert('يرجى إدخال مبلغ صحيح');
                  }
              }} className="w-full bg-emerald-500 text-white py-5 rounded-2xl font-black text-sm shadow-lg shadow-emerald-200 active:scale-95 transition-all">تأكيد الحفظ</button>
            </div>
        </div>
        
        <div className="space-y-3">
          <h4 className="text-[10px] font-black text-zinc-400 px-2 uppercase text-right tracking-widest">السجل الأخير</h4>
          {(db.fuelLog || []).slice(0, 5).map((f: any) => (
             <div key={f.id} className="bg-white p-4 rounded-2xl flex justify-between items-center border border-zinc-50">
                <span className="font-black text-emerald-600">{String(f.amount)} ﷼</span>
                <span className="text-[10px] font-bold text-zinc-400">{new Date(f.date).toLocaleDateString('ar-SA')}</span>
             </div>
          ))}
        </div>
    </div>
);

export default App;