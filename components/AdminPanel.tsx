import React, { useState, useEffect } from 'react';
import { 
    LayoutDashboardIcon, FileTextIcon, UsersIcon, SettingsIcon, 
    SearchIcon, TrashIcon, CheckCircleIcon, ArrowLeftIcon, 
    GlobeIcon, LogoutIcon, LockIcon, DownloadIcon, XCircleIcon, 
    ChatBubbleIcon, SparklesIcon, SpinnerIcon, WalletIcon
} from './icons';

interface AdminPanelProps {
    onExit: () => void;
}

type View = 'dashboard' | 'trips' | 'users' | 'settings' | 'feedback';

const AdminPanel: React.FC<AdminPanelProps> = ({ onExit }) => {
    // Auth State
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [authError, setAuthError] = useState('');

    // App Data State
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [trips, setTrips] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Settings State
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [allowSignups, setAllowSignups] = useState(true);
    const [aiModel, setAiModel] = useState('gemini-2.5-flash');

    // Fetch Data
    useEffect(() => {
        if (isAuthenticated) {
            refreshData();
            // Load settings
            setMaintenanceMode(localStorage.getItem('admin_maintenance_mode') === 'true');
            setAllowSignups(localStorage.getItem('admin_allow_signup') !== 'false');
            setAiModel(localStorage.getItem('admin_ai_model') || 'gemini-2.5-flash');
        }
    }, [isAuthenticated]);

    const refreshData = () => {
        const fetchedTrips: any[] = [];
        
        // 1. Load users
        const storedUsersList = JSON.parse(localStorage.getItem('admin_users') || '[]');
        
        // 2. Scan localStorage for all user trips
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('savedTrips_')) {
                const email = key.replace('savedTrips_', '');
                try {
                    const userTrips = JSON.parse(localStorage.getItem(key) || '[]');
                    userTrips.forEach((t: any, index: number) => {
                        fetchedTrips.push({
                            id: `TR-${email.substring(0, 3).toUpperCase()}-${index + 100}`,
                            destination: t.details.destination,
                            user: email,
                            date: t.details.startDate,
                            cost: t.itinerary.total_estimated_cost || 0,
                            status: new Date(t.details.startDate) < new Date() ? 'Completed' : 'Upcoming'
                        });
                    });
                } catch (e) {
                    console.error("Error parsing trip", e);
                }
            }
        }

        // 3. Load Feedbacks
        const storedFeedbacks = JSON.parse(localStorage.getItem('admin_feedback') || '[]');
        
        setTrips(fetchedTrips);
        setUsers(storedUsersList);
        setFeedbacks(storedFeedbacks);
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Secure admin access password
        if (password === '56784321@') {
            setIsAuthenticated(true);
            setAuthError('');
        } else {
            setAuthError('Invalid password. Access denied.');
        }
    };

    const handleDeleteTrip = (id: string, userEmail: string) => {
        if (confirm('Permanently delete this trip record?')) {
            const key = `savedTrips_${userEmail}`;
            try {
                const userTrips = JSON.parse(localStorage.getItem(key) || '[]');
                const tripToDelete = trips.find(t => t.id === id);
                if (tripToDelete) {
                    const updatedTrips = userTrips.filter((t: any) => 
                        !(t.details.destination === tripToDelete.destination && t.details.startDate === tripToDelete.date)
                    );
                    localStorage.setItem(key, JSON.stringify(updatedTrips));
                    refreshData();
                }
            } catch (e) {
                console.error(e);
            }
        }
    };

    const handleDeleteUser = (email: string) => {
        if (confirm(`Remove ${email} and all their associated data?`)) {
            const storedUsers = JSON.parse(localStorage.getItem('admin_users') || '[]');
            localStorage.setItem('admin_users', JSON.stringify(storedUsers.filter((u: any) => u.email !== email)));
            localStorage.removeItem(`savedTrips_${email}`);
            localStorage.removeItem(`userPrefs_${email}`);
            localStorage.removeItem(`userProfile_${email}`);
            refreshData();
        }
    };

    const handleDeleteFeedback = (id: string) => {
        if (confirm('Delete this feedback message?')) {
            const updated = feedbacks.filter(f => f.id !== id);
            localStorage.setItem('admin_feedback', JSON.stringify(updated));
            refreshData();
        }
    };

    const handleExportData = () => {
        const data: any = {};
        for(let i=0; i<localStorage.length; i++) {
            const key = localStorage.key(i);
            if(key) data[key] = localStorage.getItem(key);
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `globetrekker_full_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleResetSystem = () => {
        if(confirm("DANGER: This will wipe ALL data from the browser storage. Continue?")) {
            localStorage.clear();
            window.location.reload();
        }
    };

    const toggleMaintenance = () => {
        const newVal = !maintenanceMode;
        setMaintenanceMode(newVal);
        localStorage.setItem('admin_maintenance_mode', String(newVal));
    };

    const toggleSignups = () => {
        const newVal = !allowSignups;
        setAllowSignups(newVal);
        localStorage.setItem('admin_allow_signup', String(newVal));
    };

    const totalRevenue = trips.reduce((sum, t) => sum + t.cost, 0);

    const filteredTrips = trips.filter(t => 
        t.destination.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredUsers = users.filter(u => 
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredFeedback = feedbacks.filter(f => 
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.message.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden p-8">
                    <div className="text-center mb-8">
                        <div className="w-20 h-20 bg-cyan-600/20 border border-cyan-500/30 rounded-full flex items-center justify-center mx-auto mb-4 text-cyan-400">
                            <LockIcon className="h-10 w-10" />
                        </div>
                        <h2 className="text-3xl font-bold text-white font-serif">Admin Portal</h2>
                        <p className="text-slate-400 text-sm mt-2">Authentication required for system access.</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest ml-1">Secure Password</label>
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-4 rounded-xl border border-slate-700 bg-slate-800 text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all placeholder-slate-500"
                                placeholder="••••••••••••"
                                autoFocus
                            />
                        </div>
                        {authError && (
                            <div className="p-3 bg-red-900/30 border border-red-500/30 text-red-400 text-sm rounded-xl text-center font-medium animate-fade-in">
                                {authError}
                            </div>
                        )}
                        <button type="submit" className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl shadow-lg transition-all transform active:scale-95 text-lg">
                            Authenticate
                        </button>
                    </form>
                    <button onClick={onExit} className="mt-8 text-slate-500 hover:text-slate-300 text-sm font-medium flex items-center justify-center gap-2 w-full transition-colors">
                        <ArrowLeftIcon className="h-4 w-4" /> Return to Website
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] flex text-slate-100 font-sans transition-all">
            {/* Sidebar */}
            <aside className="w-72 bg-[#0f172a] border-r border-slate-800 flex-shrink-0 flex flex-col h-screen sticky top-0">
                <div className="p-8 border-b border-slate-800/50">
                    <div className="flex items-center gap-3 text-cyan-400">
                        <GlobeIcon className="h-8 w-8" />
                        <span className="text-2xl font-bold font-serif tracking-tight text-white">GlobeTrekker</span>
                    </div>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-500 mt-2">Administration Suite</p>
                </div>
                
                <nav className="flex-1 p-6 space-y-2">
                    {[
                        { id: 'dashboard', label: 'Overview', icon: LayoutDashboardIcon },
                        { id: 'trips', label: 'Manage Tracks', icon: FileTextIcon },
                        { id: 'users', label: 'User Directory', icon: UsersIcon },
                        { id: 'feedback', label: 'Feedbacks', icon: ChatBubbleIcon },
                        { id: 'settings', label: 'System Settings', icon: SettingsIcon }
                    ].map(btn => (
                        <button 
                            key={btn.id} 
                            onClick={() => setCurrentView(btn.id as View)} 
                            className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl transition-all ${
                                currentView === btn.id 
                                ? 'bg-cyan-600/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]' 
                                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                            }`}
                        >
                            <btn.icon className={`h-5 w-5 ${currentView === btn.id ? 'text-cyan-400' : 'text-slate-500'}`} />
                            <span className="font-semibold text-sm">{btn.label}</span>
                        </button>
                    ))}
                </nav>

                <div className="p-6 border-t border-slate-800/50">
                    <button onClick={onExit} className="w-full flex items-center justify-center gap-3 px-5 py-4 bg-slate-800/50 hover:bg-red-900/20 text-slate-400 hover:text-red-400 border border-slate-700/50 rounded-xl transition-all font-bold text-sm">
                        <LogoutIcon className="h-5 w-5" /> 
                        Logout Session
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto h-screen relative bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
                <header className="flex justify-between items-center px-12 py-10 sticky top-0 z-10 bg-slate-950/80 backdrop-blur-md">
                    <h1 className="text-5xl font-extrabold text-white font-serif tracking-tight">
                        {currentView === 'settings' ? 'Settings' : currentView.charAt(0).toUpperCase() + currentView.slice(1)}
                    </h1>
                    <div className="flex items-center gap-6 bg-slate-900/50 p-2 pr-6 rounded-full border border-slate-800">
                        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-2xl shadow-xl border-4 border-slate-800 ring-2 ring-cyan-500/20">A</div>
                        <div className="text-left">
                            <p className="text-sm font-bold text-white">System Admin</p>
                            <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">Master User</p>
                        </div>
                    </div>
                </header>

                <div className="px-12 pb-20 max-w-[1400px] mx-auto animate-fade-in">
                    {/* View Switching Logic */}
                    {currentView === 'dashboard' && (
                        <div className="space-y-10">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                {[
                                    { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: WalletIcon, color: 'text-green-400', bg: 'bg-green-500/10' },
                                    { label: 'Planned Trips', value: trips.length, icon: FileTextIcon, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                                    { label: 'Registered Users', value: users.length, icon: UsersIcon, color: 'text-purple-400', bg: 'bg-purple-500/10' },
                                    { label: 'User Feedbacks', value: feedbacks.length, icon: ChatBubbleIcon, color: 'text-orange-400', bg: 'bg-orange-500/10' }
                                ].map((card, i) => (
                                    <div key={i} className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 flex flex-col justify-between hover:border-slate-700 transition-all hover:-translate-y-1 group">
                                        <div className={`w-14 h-14 ${card.bg} rounded-2xl flex items-center justify-center ${card.color} mb-6 transition-transform group-hover:scale-110`}>
                                            <card.icon className="h-7 w-7" />
                                        </div>
                                        <div>
                                            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-1">{card.label}</p>
                                            <p className="text-4xl font-extrabold text-white">{card.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
                                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                        <SparklesIcon className="h-5 w-5 text-cyan-400" /> Recent Trips
                                    </h3>
                                    <div className="space-y-4">
                                        {trips.slice(0, 5).map(t => (
                                            <div key={t.id} className="flex items-center justify-between p-4 bg-slate-800/30 rounded-2xl border border-slate-700/30">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center font-bold text-xs">{t.destination.charAt(0)}</div>
                                                    <div>
                                                        <p className="font-bold text-sm text-white">{t.destination}</p>
                                                        <p className="text-[10px] text-slate-500">{t.user}</p>
                                                    </div>
                                                </div>
                                                <p className="font-bold text-cyan-400">₹{t.cost.toLocaleString()}</p>
                                            </div>
                                        ))}
                                        {trips.length === 0 && <p className="text-center text-slate-600 py-10 italic">No trip data yet.</p>}
                                    </div>
                                </div>
                                <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8">
                                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                        <ChatBubbleIcon className="h-5 w-5 text-orange-400" /> Latest Feedbacks
                                    </h3>
                                    <div className="space-y-4">
                                        {feedbacks.slice(0, 3).map(f => (
                                            <div key={f.id} className="p-5 bg-slate-800/30 rounded-2xl border border-slate-700/30">
                                                <div className="flex justify-between items-start mb-2">
                                                    <p className="font-bold text-white text-sm">{f.name}</p>
                                                    <p className="text-[10px] text-slate-500 font-medium">{f.date}</p>
                                                </div>
                                                <p className="text-xs text-slate-400 line-clamp-2 italic leading-relaxed">"{f.message}"</p>
                                            </div>
                                        ))}
                                        {feedbacks.length === 0 && <p className="text-center text-slate-600 py-10 italic">No feedback messages yet.</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentView === 'trips' && (
                        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
                                <h2 className="text-2xl font-bold font-serif">Trip Management</h2>
                                <div className="relative">
                                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                    <input 
                                        type="text" 
                                        placeholder="Search by destination or user..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-12 pr-6 py-3 bg-slate-800/50 border border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all w-80"
                                    />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-800/30 text-slate-500 uppercase text-[10px] font-bold tracking-widest">
                                        <tr>
                                            <th className="px-8 py-5">ID</th>
                                            <th className="px-8 py-5">Destination</th>
                                            <th className="px-8 py-5">Traveler</th>
                                            <th className="px-8 py-5">Cost</th>
                                            <th className="px-8 py-5">Status</th>
                                            <th className="px-8 py-5 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/50">
                                        {filteredTrips.map(trip => (
                                            <tr key={trip.id} className="hover:bg-slate-800/30 transition-colors group">
                                                <td className="px-8 py-6 font-mono text-[10px] text-slate-500">{trip.id}</td>
                                                <td className="px-8 py-6 font-bold text-white">{trip.destination}</td>
                                                <td className="px-8 py-6 text-slate-400 text-sm">{trip.user}</td>
                                                <td className="px-8 py-6 font-bold text-cyan-400">₹{trip.cost.toLocaleString()}</td>
                                                <td className="px-8 py-6">
                                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter ${trip.status === 'Completed' ? 'bg-slate-800 text-slate-500' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                                                        {trip.status}
                                                    </span>
                                                </td>
                                                <td className="px-8 py-6 text-right">
                                                    <button onClick={() => handleDeleteTrip(trip.id, trip.user)} className="p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                                                        <TrashIcon className="h-5 w-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {currentView === 'users' && (
                        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                            <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
                                <h2 className="text-2xl font-bold font-serif">User Directory</h2>
                                <div className="relative">
                                    <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                    <input 
                                        type="text" 
                                        placeholder="Filter users..." 
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-12 pr-6 py-3 bg-slate-800/50 border border-slate-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 transition-all w-80"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-8">
                                {filteredUsers.map(user => (
                                    <div key={user.email} className="bg-slate-800/30 border border-slate-700/50 rounded-2xl p-6 flex items-center justify-between group hover:border-slate-600 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-gradient-to-br from-slate-700 to-slate-800 rounded-2xl flex items-center justify-center font-bold text-slate-300">
                                                {user.email.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white text-sm truncate max-w-[150px]">{user.email}</p>
                                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Joined {user.joined}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDeleteUser(user.email)} className="text-red-400 hover:text-red-300 p-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <XCircleIcon className="h-6 w-6" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentView === 'feedback' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-bold font-serif mb-4 px-2">Global Feedbacks</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {filteredFeedback.map(f => (
                                    <div key={f.id} className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 relative group hover:border-orange-500/20 transition-all">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-400 border border-orange-500/20">
                                                    <ChatBubbleIcon className="h-6 w-6" />
                                                </div>
                                                <div>
                                                    <p className="font-extrabold text-white text-lg">{f.name}</p>
                                                    <p className="text-xs text-slate-500 font-medium">{f.email}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDeleteFeedback(f.id)} className="p-3 text-slate-600 hover:text-red-400 transition-colors">
                                                <TrashIcon className="h-5 w-5" />
                                            </button>
                                        </div>
                                        <p className="text-slate-300 leading-relaxed italic text-sm border-l-4 border-slate-800 pl-6 py-2">
                                            "{f.message}"
                                        </p>
                                        <p className="text-right text-[10px] font-bold text-slate-600 uppercase tracking-widest mt-6">{f.date}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {currentView === 'settings' && (
                        <div className="space-y-12">
                            <h2 className="text-3xl font-bold font-serif mb-8 border-b border-slate-800 pb-4">System Settings</h2>
                            
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                                {/* Data Management */}
                                <div className="bg-slate-900/60 p-10 rounded-[2.5rem] border border-slate-800 h-full flex flex-col shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-10 opacity-5">
                                        <FileTextIcon className="h-32 w-32" />
                                    </div>
                                    <div className="flex items-center gap-5 mb-8">
                                        <div className="p-4 bg-cyan-600/10 border border-cyan-500/30 rounded-3xl text-cyan-400">
                                            <FileTextIcon className="h-8 w-8" />
                                        </div>
                                        <h3 className="text-3xl font-bold text-white font-serif">Data Management</h3>
                                    </div>
                                    <p className="text-slate-400 mb-12 text-lg leading-relaxed max-w-md">
                                        Export all system data including user profiles, trips, bookings, and feedback for backup purposes.
                                    </p>
                                    <button onClick={handleExportData} className="w-full mt-auto flex items-center justify-center gap-3 px-8 py-5 bg-slate-800 hover:bg-slate-700 text-white rounded-[1.5rem] transition-all font-bold text-xl shadow-lg border border-slate-700">
                                        <DownloadIcon className="h-6 w-6" /> Export All Data (JSON)
                                    </button>
                                </div>

                                {/* Configuration */}
                                <div className="bg-slate-900/60 p-10 rounded-[2.5rem] border border-slate-800 h-full shadow-2xl relative overflow-hidden">
                                    <div className="flex items-center gap-5 mb-10">
                                        <div className="p-4 bg-purple-600/10 border border-purple-500/30 rounded-3xl text-purple-400">
                                            <SettingsIcon className="h-8 w-8" />
                                        </div>
                                        <h3 className="text-3xl font-bold text-white font-serif">Configuration</h3>
                                    </div>
                                    <div className="space-y-12">
                                        <div className="flex items-center justify-between group">
                                            <div>
                                                <p className="text-xl font-bold text-white mb-1">Maintenance Mode</p>
                                                <p className="text-slate-500 text-sm font-medium">Disable new trip generation globally</p>
                                            </div>
                                            <button 
                                                onClick={toggleMaintenance} 
                                                className={`w-20 h-10 rounded-full p-1.5 transition-all duration-500 ${maintenanceMode ? 'bg-cyan-600 shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'bg-slate-800'}`}
                                            >
                                                <div className={`w-7 h-7 bg-white rounded-full shadow-xl transform transition-transform duration-500 ${maintenanceMode ? 'translate-x-10' : 'translate-x-0'}`} />
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between group">
                                            <div>
                                                <p className="text-xl font-bold text-white mb-1">Allow Registrations</p>
                                                <p className="text-slate-500 text-sm font-medium">Enable or disable new user signups</p>
                                            </div>
                                            <button 
                                                onClick={toggleSignups} 
                                                className={`w-20 h-10 rounded-full p-1.5 transition-all duration-500 ${allowSignups ? 'bg-cyan-600 shadow-[0_0_20px_rgba(6,182,212,0.4)]' : 'bg-slate-800'}`}
                                            >
                                                <div className={`w-7 h-7 bg-white rounded-full shadow-xl transform transition-transform duration-500 ${allowSignups ? 'translate-x-10' : 'translate-x-0'}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* AI & API Config */}
                                <div className="bg-slate-900/60 p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden xl:col-span-2">
                                    <div className="flex items-center gap-5 mb-10">
                                        <div className="p-4 bg-orange-600/10 border border-orange-500/30 rounded-3xl text-orange-400">
                                            <SparklesIcon className="h-8 w-8" />
                                        </div>
                                        <h3 className="text-3xl font-bold text-white font-serif">AI Configuration</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-3 tracking-[0.2em] ml-1">Current Active Model</label>
                                            <select 
                                                value={aiModel} 
                                                onChange={(e) => {
                                                    setAiModel(e.target.value);
                                                    localStorage.setItem('admin_ai_model', e.target.value);
                                                }}
                                                className="w-full px-6 py-4 bg-slate-800 border border-slate-700 rounded-2xl text-white font-bold focus:ring-2 focus:ring-cyan-500 outline-none appearance-none cursor-pointer"
                                            >
                                                <option value="gemini-3-flash-preview">Gemini 3 Flash (Latest)</option>
                                                <option value="gemini-3-pro-preview">Gemini 3 Pro (High Reasoning)</option>
                                                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Legacy)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-500 uppercase mb-3 tracking-[0.2em] ml-1">AI Response Safety</label>
                                            <div className="flex gap-4">
                                                {['Strict', 'Moderate', 'Disabled'].map(opt => (
                                                    <button key={opt} className={`flex-1 py-4 rounded-2xl border font-bold text-sm transition-all ${opt === 'Moderate' ? 'bg-cyan-600/10 border-cyan-500/50 text-cyan-400' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300'}`}>
                                                        {opt}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-10 p-6 bg-slate-800/40 rounded-3xl border border-slate-700/50">
                                        <div className="flex items-center gap-4 text-cyan-400">
                                            <CheckCircleIcon className="h-6 w-6" />
                                            <p className="text-sm font-bold">API Connection Live • Latency: 420ms</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Danger Zone */}
                            <div className="bg-red-950/20 border border-red-500/30 p-12 rounded-[2.5rem] relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                    <XCircleIcon className="h-40 w-40 text-red-500" />
                                </div>
                                <div className="flex items-center gap-5 mb-8 text-red-500">
                                    <XCircleIcon className="h-10 w-10" />
                                    <h3 className="text-4xl font-extrabold font-serif">Danger Zone</h3>
                                </div>
                                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-10">
                                    <p className="text-red-300/80 max-w-3xl font-medium leading-relaxed text-xl">
                                        This action will permanently delete all data from the local storage, effectively resetting the entire application state for this browser. This cannot be undone.
                                    </p>
                                    <button onClick={handleResetSystem} className="px-12 py-6 bg-red-600 hover:bg-red-500 text-white rounded-[1.5rem] font-black shadow-[0_15px_35px_-10px_rgba(220,38,38,0.5)] transition-all transform active:scale-95 whitespace-nowrap text-xl">
                                        Factory Reset System
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminPanel;