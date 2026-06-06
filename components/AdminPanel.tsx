import React, { useState, useEffect, useRef } from 'react';
import { 
    LayoutDashboardIcon, FileTextIcon, UsersIcon, SettingsIcon, 
    SearchIcon, TrashIcon, CheckCircleIcon, ArrowLeftIcon, 
    GlobeIcon, LogoutIcon, LockIcon, DownloadIcon, XCircleIcon, 
    ChatBubbleIcon, SparklesIcon, SpinnerIcon, WalletIcon, SendIcon, UndoIcon
} from './icons';
import ConfirmationModal from './ConfirmationModal';

interface AdminPanelProps {
    onExit: () => void;
}

type View = 'dashboard' | 'trips' | 'users' | 'settings' | 'feedback';

const AdminPanel: React.FC<AdminPanelProps> = ({ onExit }) => {
    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState('');

    // Navigation state for smooth transitions
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [isTransitioning, setIsTransitioning] = useState(false);

    // App Data State
    const [trips, setTrips] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [replyText, setReplyText] = useState('');
    
    // Management Modals
    const [deleteTarget, setDeleteTarget] = useState<{ type: 'user' | 'trip' | 'feedback', id: string, extra?: any } | null>(null);

    // Settings State (Real-time synced)
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [allowSignups, setAllowSignups] = useState(true);
    const [aiModel, setAiModel] = useState('gemini-2.5-flash');

    // Fix: Added missing toggleMaintenance function for Admin Panel
    const toggleMaintenance = () => {
        const newVal = !maintenanceMode;
        setMaintenanceMode(newVal);
        localStorage.setItem('admin_maintenance_mode', String(newVal));
    };

    // Fix: Added missing toggleSignups function for Admin Panel
    const toggleSignups = () => {
        const newVal = !allowSignups;
        setAllowSignups(newVal);
        localStorage.setItem('admin_allow_signup', String(newVal));
    };
    
    // API Keys
    const [geminiApiKey, setGeminiApiKey] = useState('');
    const [weatherApiKey, setWeatherApiKey] = useState('');
    const [mapsApiKey, setMapsApiKey] = useState('');
    const [isSavingKeys, setIsSavingKeys] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success'>('idle');

    // Smooth View Switching
    const handleViewChange = (newView: View) => {
        if (newView === currentView) return;
        setIsTransitioning(true);
        setTimeout(() => {
            setCurrentView(newView);
            setIsTransitioning(false);
        }, 200);
    };

    // Load Persistent Data
    const refreshData = () => {
        // Load Users
        const storedUsers = JSON.parse(localStorage.getItem('admin_users') || '[]');
        setUsers(storedUsers);

        // Load Feedbacks
        const storedFeedbacks = JSON.parse(localStorage.getItem('admin_feedback') || '[]');
        setFeedbacks(storedFeedbacks);

        // Load Trips from all users
        const allTrips: any[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('savedTrips_')) {
                const email = key.replace('savedTrips_', '');
                try {
                    const userTrips = JSON.parse(localStorage.getItem(key) || '[]');
                    userTrips.forEach((t: any, index: number) => {
                        allTrips.push({
                            internalId: `${key}_${index}`,
                            originalKey: key,
                            originalIndex: index,
                            destination: t.details.destination,
                            user: email,
                            date: t.details.startDate,
                            cost: t.itinerary.total_estimated_cost || 0,
                            title: t.itinerary.trip_title
                        });
                    });
                } catch (e) { console.error("Corrupt trip data found", key); }
            }
        }
        setTrips(allTrips);
    };

    useEffect(() => {
        if (isAuthenticated) {
            refreshData();
            setMaintenanceMode(localStorage.getItem('admin_maintenance_mode') === 'true');
            setAllowSignups(localStorage.getItem('admin_allow_signup') !== 'false');
            setAiModel(localStorage.getItem('admin_ai_model') || 'gemini-2.5-flash');
            setGeminiApiKey(localStorage.getItem('admin_gemini_key') || '••••••••••••••••••••••••');
            setWeatherApiKey(localStorage.getItem('admin_weather_key') || '••••••••••••••••');
            setMapsApiKey(localStorage.getItem('admin_maps_key') || '••••••••••••••••');
        }
    }, [isAuthenticated]);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === '56784321@') {
            setIsAuthenticated(true);
            setAuthError('');
        } else {
            setAuthError('Access Denied. Check credentials.');
        }
    };

    // Management Actions
    const performDelete = () => {
        if (!deleteTarget) return;

        if (deleteTarget.type === 'feedback') {
            const updated = feedbacks.filter(f => f.id !== deleteTarget.id);
            localStorage.setItem('admin_feedback', JSON.stringify(updated));
            setFeedbacks(updated);
        } else if (deleteTarget.type === 'user') {
            const updated = users.filter(u => u.email !== deleteTarget.id);
            localStorage.setItem('admin_users', JSON.stringify(updated));
            // Also clean their trip storage if needed (optional aggressive cleanup)
            // localStorage.removeItem(`savedTrips_${deleteTarget.id}`);
            setUsers(updated);
        } else if (deleteTarget.type === 'trip') {
            const { originalKey, originalIndex } = deleteTarget.extra;
            try {
                const userTrips = JSON.parse(localStorage.getItem(originalKey) || '[]');
                userTrips.splice(originalIndex, 1);
                localStorage.setItem(originalKey, JSON.stringify(userTrips));
                refreshData(); // Re-sync the massive trip list
            } catch (e) { console.error("Delete failed", e); }
        }

        setDeleteTarget(null);
    };

    const handleReply = (id: string) => {
        const updated = feedbacks.map(f => {
            if (f.id === id) {
                return { ...f, adminReply: replyText, replyDate: new Date().toLocaleString() };
            }
            return f;
        });
        localStorage.setItem('admin_feedback', JSON.stringify(updated));
        setFeedbacks(updated);
        setReplyingTo(null);
        setReplyText('');
    };

    const handleSaveAPIKeys = () => {
        setIsSavingKeys(true);
        setTimeout(() => {
            localStorage.setItem('admin_gemini_key', geminiApiKey);
            localStorage.setItem('admin_weather_key', weatherApiKey);
            localStorage.setItem('admin_maps_key', mapsApiKey);
            setIsSavingKeys(false);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }, 800);
    };

    // Filters
    const filteredFeedbacks = feedbacks.filter(f => 
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        f.message.toLowerCase().includes(searchQuery.toLowerCase())
    );
    const filteredUsers = users.filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const filteredTrips = trips.filter(t => t.destination.toLowerCase().includes(searchQuery.toLowerCase()) || t.user.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-[2rem] shadow-2xl w-full max-w-md p-10 animate-fade-in">
                    <div className="text-center mb-10">
                        <div className="w-20 h-20 bg-cyan-500/10 border border-cyan-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 text-cyan-400">
                            <LockIcon className="h-10 w-10" />
                        </div>
                        <h2 className="text-3xl font-black text-white font-serif tracking-tight">Admin Vault</h2>
                        <p className="text-slate-400 text-sm mt-2 opacity-70">Elevated privileges required.</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-4 rounded-2xl border border-slate-700 bg-slate-800 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder-slate-500 font-mono"
                            placeholder="••••••••"
                            autoFocus
                        />
                        {authError && <div className="p-4 bg-red-900/20 border border-red-500/20 text-red-400 text-xs rounded-xl text-center font-bold uppercase tracking-wider">{authError}</div>}
                        <button type="submit" className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-95 text-sm uppercase tracking-widest">Authorize Access</button>
                    </form>
                    <button onClick={onExit} className="mt-8 text-slate-500 hover:text-slate-300 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 w-full transition-colors">
                        <ArrowLeftIcon className="h-3 w-3" /> Back to Application
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] flex text-slate-100 font-sans selection:bg-cyan-500/30 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 bg-[#0f172a] border-r border-slate-800 flex-shrink-0 flex flex-col h-screen sticky top-0 z-20">
                <div className="p-10 border-b border-slate-800/50">
                    <div className="flex items-center gap-3 text-cyan-400">
                        <GlobeIcon className="h-8 w-8" />
                        <span className="text-2xl font-black font-serif text-white tracking-tighter">GlobeTrekker</span>
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.3em] font-black text-slate-500 mt-3 opacity-60">Control Center</p>
                </div>
                <nav className="flex-1 p-6 space-y-2">
                    {[
                        { id: 'dashboard', label: 'Overview', icon: LayoutDashboardIcon },
                        { id: 'trips', label: 'Manage Itineraries', icon: FileTextIcon },
                        { id: 'users', label: 'Registered Users', icon: UsersIcon },
                        { id: 'feedback', label: 'User Feedback', icon: ChatBubbleIcon },
                        { id: 'settings', label: 'Global Settings', icon: SettingsIcon }
                    ].map(btn => (
                        <button 
                            key={btn.id} 
                            onClick={() => handleViewChange(btn.id as View)} 
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 group ${
                                currentView === btn.id 
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_20px_rgba(6,182,212,0.1)]' 
                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                            }`}
                        >
                            <btn.icon className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${currentView === btn.id ? 'text-cyan-400' : 'text-slate-500'}`} />
                            <span className="font-bold text-sm">{btn.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-8 border-t border-slate-800/50">
                    <button onClick={onExit} className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-slate-800/30 hover:bg-red-950/20 text-slate-500 hover:text-red-400 border border-slate-800/50 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest">
                        <LogoutIcon className="h-4 w-4" /> End Session
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 h-screen overflow-y-auto bg-[#020617] relative scroll-smooth">
                <header className="flex justify-between items-center px-12 py-12 sticky top-0 z-10 bg-[#020617]/80 backdrop-blur-xl border-b border-slate-800/30">
                    <h1 className="text-4xl font-black text-white font-serif capitalize tracking-tight">{currentView}</h1>
                    <div className="flex items-center gap-4 bg-slate-900/30 p-2 pr-6 rounded-full border border-slate-800 shadow-inner">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-black shadow-lg">A</div>
                        <div className="flex flex-col">
                            <span className="text-xs font-black text-white">Master Admin</span>
                            <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-tighter">Live Status</span>
                        </div>
                    </div>
                </header>

                <div className={`px-12 pb-24 mt-12 transition-all duration-300 ${isTransitioning ? 'opacity-0 translate-y-4 scale-95' : 'opacity-100 translate-y-0 scale-100'}`}>
                    
                    {/* View: Dashboard */}
                    {currentView === 'dashboard' && (
                        <div className="space-y-12 animate-slide-up">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <StatCard label="Platform Value" value={`₹${trips.reduce((s,t)=>s+t.cost,0).toLocaleString()}`} icon={WalletIcon} color="text-green-400" bg="bg-green-500/10" />
                                <StatCard label="Total Trips" value={trips.length} icon={FileTextIcon} color="text-cyan-400" bg="bg-cyan-500/10" />
                                <StatCard label="User Base" value={users.length} icon={UsersIcon} color="text-purple-400" bg="bg-purple-500/10" />
                                <StatCard label="Feedbacks" value={feedbacks.length} icon={ChatBubbleIcon} color="text-orange-400" bg="bg-orange-500/10" />
                            </div>
                            
                            <div className="bg-slate-900/20 rounded-[3rem] border border-slate-800/50 p-10 shadow-2xl">
                                <h3 className="text-xl font-bold font-serif mb-8 text-slate-400 uppercase tracking-widest text-center">Recent Platform Journeys</h3>
                                <div className="space-y-4">
                                    {trips.slice(-5).reverse().map(t => (
                                        <div key={t.internalId} className="flex items-center justify-between p-6 bg-slate-900/40 rounded-3xl border border-slate-800/50 hover:bg-slate-800/50 transition-all group">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400 transition-transform group-hover:scale-110">
                                                    <GlobeIcon className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-lg text-white">{t.destination}</p>
                                                    <p className="text-xs text-slate-500 font-medium">{t.user} • {t.date}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-black text-cyan-500 text-sm">₹{t.cost.toLocaleString()}</p>
                                                <p className="text-[10px] text-slate-600 font-bold uppercase">Estimated Cost</p>
                                            </div>
                                        </div>
                                    ))}
                                    {trips.length === 0 && <p className="text-center py-10 text-slate-600 italic">No trips generated yet.</p>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* View: Trips Management */}
                    {currentView === 'trips' && (
                        <div className="space-y-10 animate-slide-up">
                            <div className="flex items-center justify-between bg-slate-900/20 p-8 rounded-[2rem] border border-slate-800/50">
                                <div>
                                    <h2 className="text-2xl font-black font-serif text-white">Itinerary Repository</h2>
                                    <p className="text-slate-500 text-sm mt-1">Full index of all AI-generated travel plans across the platform.</p>
                                </div>
                                <div className="relative w-80">
                                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                    <input type="text" placeholder="Filter by user or city..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-cyan-500/30 outline-none transition-all" />
                                </div>
                            </div>
                            
                            <div className="bg-slate-900/20 rounded-[2.5rem] border border-slate-800/50 overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-800/40 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                                        <tr>
                                            <th className="px-8 py-6">User / Owner</th>
                                            <th className="px-8 py-6">Destination</th>
                                            <th className="px-8 py-6">Start Date</th>
                                            <th className="px-8 py-6">Budget</th>
                                            <th className="px-8 py-6 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {filteredTrips.map(t => (
                                            <tr key={t.internalId} className="hover:bg-slate-800/20 transition-colors group">
                                                <td className="px-8 py-6 font-bold text-sm text-slate-300">{t.user}</td>
                                                <td className="px-8 py-6">
                                                    <p className="font-black text-white">{t.destination}</p>
                                                    <p className="text-[10px] text-slate-500">{t.title}</p>
                                                </td>
                                                <td className="px-8 py-6 text-sm text-slate-400">{t.date}</td>
                                                <td className="px-8 py-6 text-cyan-500 font-black">₹{t.cost.toLocaleString()}</td>
                                                <td className="px-8 py-6 text-right">
                                                    <button onClick={() => setDeleteTarget({ type: 'trip', id: t.internalId, extra: t })} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredTrips.length === 0 && <div className="py-20 text-center text-slate-600 font-bold">No matching itineraries found.</div>}
                            </div>
                        </div>
                    )}

                    {/* View: Users Management */}
                    {currentView === 'users' && (
                        <div className="space-y-10 animate-slide-up">
                            <div className="flex items-center justify-between bg-slate-900/20 p-8 rounded-[2rem] border border-slate-800/50">
                                <div>
                                    <h2 className="text-2xl font-black font-serif text-white">Registered Travelers</h2>
                                    <p className="text-slate-500 text-sm mt-1">Management for accounts registered on GlobeTrekker.</p>
                                </div>
                                <div className="relative w-80">
                                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                    <input type="text" placeholder="Find user by email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-cyan-500/30 outline-none transition-all" />
                                </div>
                            </div>
                            
                            <div className="bg-slate-900/20 rounded-[2.5rem] border border-slate-800/50 overflow-hidden">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-slate-800/40 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                                        <tr>
                                            <th className="px-8 py-6">Status</th>
                                            <th className="px-8 py-6">Email Address</th>
                                            <th className="px-8 py-6">Joined</th>
                                            <th className="px-8 py-6">User ID</th>
                                            <th className="px-8 py-6 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {filteredUsers.map(u => (
                                            <tr key={u.email} className="hover:bg-slate-800/20 transition-colors">
                                                <td className="px-8 py-6">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
                                                </td>
                                                <td className="px-8 py-6 font-black text-white">{u.email}</td>
                                                <td className="px-8 py-6 text-sm text-slate-400">{u.joined}</td>
                                                <td className="px-8 py-6 font-mono text-[10px] text-slate-500">{u.id}</td>
                                                <td className="px-8 py-6 text-right">
                                                    <button onClick={() => setDeleteTarget({ type: 'user', id: u.email })} className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                                                        <TrashIcon className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {filteredUsers.length === 0 && <div className="py-20 text-center text-slate-600 font-bold">No matching users in directory.</div>}
                            </div>
                        </div>
                    )}

                    {/* View: Feedback */}
                    {currentView === 'feedback' && (
                        <div className="space-y-10 animate-slide-up">
                            <div className="flex items-center justify-between bg-slate-900/20 p-8 rounded-[2rem] border border-slate-800/50">
                                <div>
                                    <h2 className="text-2xl font-black font-serif text-white">Voice of Customer</h2>
                                    <p className="text-slate-500 text-sm mt-1">Customer insights and platform feedback loop.</p>
                                </div>
                                <div className="relative w-80">
                                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                    <input type="text" placeholder="Search insights..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-12 pr-6 py-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-sm focus:ring-2 focus:ring-cyan-500/30 outline-none transition-all" />
                                </div>
                            </div>

                            <div className="grid gap-6">
                                {filteredFeedbacks.map(f => (
                                    <div key={f.id} className="bg-slate-900/30 border border-slate-800 rounded-[2.5rem] p-10 hover:border-slate-700 transition-all group">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-[1.5rem] flex items-center justify-center font-black text-2xl text-cyan-400 border border-slate-700/50 group-hover:scale-110 transition-transform">
                                                    {f.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-xl text-white tracking-tight">{f.name}</p>
                                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{f.email} • {f.date}</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => setDeleteTarget({ type: 'feedback', id: f.id })} className="w-10 h-10 rounded-full flex items-center justify-center bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg"><TrashIcon className="h-4 w-4" /></button>
                                                {!f.adminReply && replyingTo !== f.id && (
                                                    <button onClick={() => setReplyingTo(f.id)} className="px-6 py-2 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500 hover:text-white rounded-2xl text-xs font-black uppercase tracking-widest transition-all shadow-lg">Reply</button>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <p className="text-slate-300 text-lg font-medium leading-relaxed italic border-l-4 border-slate-800 pl-6 py-2">"{f.message}"</p>
                                        
                                        {f.adminReply && (
                                            <div className="mt-8 p-8 bg-cyan-500/5 rounded-[2rem] border border-cyan-500/10 animate-fade-in">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white"><SparklesIcon className="h-4 w-4" /></div>
                                                    <p className="text-[10px] uppercase font-black text-cyan-400 tracking-[0.2em]">Official Response • {f.replyDate}</p>
                                                </div>
                                                <p className="text-base text-slate-200 leading-relaxed font-medium">{f.adminReply}</p>
                                            </div>
                                        )}

                                        {replyingTo === f.id && (
                                            <div className="mt-8 space-y-4 animate-slide-up">
                                                <textarea 
                                                    value={replyText} 
                                                    onChange={e => setReplyText(e.target.value)}
                                                    placeholder="Compose response..."
                                                    className="w-full bg-slate-800/80 border-2 border-slate-700/50 rounded-3xl p-6 text-base text-white focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 outline-none h-40 resize-none transition-all"
                                                />
                                                <div className="flex justify-end gap-4">
                                                    <button onClick={() => { setReplyingTo(null); setReplyText(''); }} className="px-8 py-3 text-sm font-black text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-colors">Discard</button>
                                                    <button onClick={() => handleReply(f.id)} disabled={!replyText.trim()} className="px-10 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl text-sm font-black uppercase tracking-widest shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center gap-2">
                                                        <SendIcon className="h-4 w-4" /> Send Response
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {filteredFeedbacks.length === 0 && <div className="py-20 text-center text-slate-600 font-bold">No feedback entries recorded.</div>}
                            </div>
                        </div>
                    )}

                    {/* View: Settings */}
                    {currentView === 'settings' && (
                        <div className="space-y-12 animate-slide-up">
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                                {/* Global Toggles */}
                                <div className="bg-slate-900/20 p-12 rounded-[3rem] border border-slate-800/50 space-y-10 shadow-inner">
                                    <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
                                        <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400">
                                            <SettingsIcon className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-2xl font-black font-serif text-white tracking-tight">Ecosystem Controls</h3>
                                    </div>
                                    <div className="space-y-8">
                                        <SettingToggle label="Maintenance Mode" desc="Suspend all trip generations for scheduled system maintenance" active={maintenanceMode} onToggle={toggleMaintenance} />
                                        <SettingToggle label="Public Registrations" desc="Allow or restrict new user accounts on the platform" active={allowSignups} onToggle={toggleSignups} />
                                    </div>
                                </div>

                                {/* AI Config */}
                                <div className="bg-slate-900/20 p-12 rounded-[3rem] border border-slate-800/50 space-y-10 shadow-inner">
                                    <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
                                        <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-400">
                                            <SparklesIcon className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-2xl font-black font-serif text-white tracking-tight">AI Engine Logic</h3>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-4">Select Target Model</label>
                                        <div className="grid gap-3">
                                            {[
                                                { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash', desc: 'Standard stability & high rate limits' },
                                                { id: 'gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro', desc: 'Deep reasoning performance' },
                                                { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', desc: 'Fast, lower rate limit' },
                                            ].map(m => (
                                                <button 
                                                    key={m.id}
                                                    onClick={() => { setAiModel(m.id); localStorage.setItem('admin_ai_model', m.id); }}
                                                    className={`p-6 rounded-[1.5rem] border text-left transition-all group ${aiModel === m.id ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-slate-800/30 border-slate-800 hover:border-slate-700'}`}
                                                >
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className={`font-black text-base ${aiModel === m.id ? 'text-cyan-400' : 'text-slate-300'}`}>{m.label}</span>
                                                        {aiModel === m.id && <CheckCircleIcon className="h-5 w-5 text-cyan-500" />}
                                                    </div>
                                                    <p className="text-xs text-slate-500 font-medium">{m.desc}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* API Key Management */}
                                <div className="bg-slate-900/20 p-12 rounded-[3rem] border border-slate-800/50 xl:col-span-2 space-y-10 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                                    <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
                                        <div className="w-12 h-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center text-cyan-400">
                                            <LockIcon className="h-6 w-6" />
                                        </div>
                                        <h3 className="text-2xl font-black font-serif text-white tracking-tight">Service Integrations</h3>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Gemini AI API Key</label>
                                            <input type="password" value={geminiApiKey} onChange={e => setGeminiApiKey(e.target.value)} className="w-full bg-slate-800 border-2 border-slate-700/50 rounded-2xl px-5 py-4 text-white font-mono text-sm focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 outline-none transition-all" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">OpenWeather API Key</label>
                                            <input type="password" value={weatherApiKey} onChange={e => setWeatherApiKey(e.target.value)} className="w-full bg-slate-800 border-2 border-slate-700/50 rounded-2xl px-5 py-4 text-white font-mono text-sm focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 outline-none transition-all" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Google Maps API Key</label>
                                            <input type="password" value={mapsApiKey} onChange={e => setMapsApiKey(e.target.value)} className="w-full bg-slate-800 border-2 border-slate-700/50 rounded-2xl px-5 py-4 text-white font-mono text-sm focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500/50 outline-none transition-all" />
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 mt-4 border-t border-slate-800">
                                        <div className="p-5 bg-blue-500/5 border border-blue-500/10 rounded-2xl text-blue-400 text-xs flex gap-4 items-center max-w-2xl">
                                            <InfoIcon className="h-5 w-5 flex-shrink-0" />
                                            <p className="font-medium leading-relaxed">Keys updated here take effect platform-wide. Ensure billing is active on GCP and OpenWeather for seamless generation.</p>
                                        </div>
                                        <button onClick={handleSaveAPIKeys} disabled={isSavingKeys} className={`px-12 py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center gap-3 min-w-[240px] justify-center ${saveStatus === 'success' ? 'bg-green-500 text-white' : 'bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50'}`}>
                                            {isSavingKeys ? <SpinnerIcon className="animate-spin h-5 w-5" /> : saveStatus === 'success' ? <><CheckCircleIcon className="h-5 w-5" /> Applied</> : <><DownloadIcon className="h-5 w-5" /> Save Changes</>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <ConfirmationModal
                isOpen={!!deleteTarget}
                title={`Delete ${deleteTarget?.type}`}
                message={`Are you sure you want to permanently remove this ${deleteTarget?.type}? This action persists to storage and cannot be undone.`}
                confirmLabel="Confirm Deletion"
                onConfirm={performDelete}
                onCancel={() => setDeleteTarget(null)}
                isDestructive={true}
            />
        </div>
    );
};

const StatCard = ({ label, value, icon: Icon, color, bg }: any) => (
    <div className="bg-slate-900/30 border border-slate-800 rounded-[2rem] p-10 hover:border-slate-700 transition-all group shadow-xl hover:-translate-y-2 duration-500">
        <div className={`w-16 h-16 ${bg} rounded-[1.5rem] flex items-center justify-center ${color} mb-8 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-transform`}>
            <Icon className="h-8 w-8" />
        </div>
        <p className="text-slate-500 font-black uppercase tracking-[0.2em] text-[10px] mb-3 opacity-60">{label}</p>
        <p className="text-4xl font-black text-white tracking-tighter">{value}</p>
    </div>
);

const SettingToggle = ({ label, desc, active, onToggle }: any) => (
    <div className="flex items-center justify-between group bg-slate-900/40 p-6 rounded-3xl border border-slate-800/50 hover:bg-slate-800/50 transition-all">
        <div className="max-w-[70%]">
            <p className="font-black text-white text-lg tracking-tight mb-1">{label}</p>
            <p className="text-slate-500 text-xs font-medium leading-relaxed">{desc}</p>
        </div>
        <button onClick={onToggle} className={`w-16 h-9 rounded-full p-1.5 transition-all duration-500 flex items-center shadow-inner ${active ? 'bg-cyan-600' : 'bg-slate-700'}`}>
            <div className={`w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-500 transform ${active ? 'translate-x-7 rotate-12' : 'translate-x-0'}`} />
        </button>
    </div>
);

const InfoIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
);

export default AdminPanel;
