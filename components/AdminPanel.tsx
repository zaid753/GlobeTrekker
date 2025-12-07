
import React, { useState, useEffect } from 'react';
import { LayoutDashboardIcon, FileTextIcon, UsersIcon, SettingsIcon, SearchIcon, TrashIcon, EditIcon, CheckCircleIcon, ArrowLeftIcon, GlobeIcon, LogoutIcon, LockIcon, DownloadIcon, XCircleIcon, ChatBubbleIcon } from './icons';
import { getAllBookings } from '../services/bookingService';

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
    const [bookings, setBookings] = useState<any[]>([]);
    const [feedbacks, setFeedbacks] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Settings State
    const [maintenanceMode, setMaintenanceMode] = useState(false);
    const [allowSignups, setAllowSignups] = useState(true);

    // Fetch Data from Local Storage (Simulating Database)
    useEffect(() => {
        if (isAuthenticated) {
            refreshData();
            // Load settings
            setMaintenanceMode(localStorage.getItem('admin_maintenance_mode') === 'true');
            setAllowSignups(localStorage.getItem('admin_allow_signup') !== 'false');
        }
    }, [isAuthenticated]);

    const refreshData = () => {
        const fetchedTrips: any[] = [];
        const fetchedUsers: any[] = [];
        const uniqueEmails = new Set<string>();

        // Scan Local Storage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;

            if (key.startsWith('savedTrips_')) {
                const email = key.replace('savedTrips_', '');
                uniqueEmails.add(email);
                try {
                    const userTrips = JSON.parse(localStorage.getItem(key) || '[]');
                    userTrips.forEach((t: any, index: number) => {
                        fetchedTrips.push({
                            id: `TR-${email.substring(0, 3).toUpperCase()}-${index + 100}`,
                            destination: t.details.destination,
                            user: email,
                            date: t.details.startDate,
                            cost: t.itinerary.total_estimated_cost,
                            status: new Date(t.details.startDate) < new Date() ? 'Completed' : 'Upcoming'
                        });
                    });
                } catch (e) {
                    console.error("Error parsing trip", e);
                }
            } else if (key.startsWith('userPrefs_')) {
                const email = key.replace('userPrefs_', '');
                uniqueEmails.add(email);
            }
        }

        // Construct User Objects
        uniqueEmails.forEach(email => {
            fetchedUsers.push({
                id: `USR-${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
                name: email.split('@')[0],
                email: email,
                role: 'User',
                joined: '2024' // Placeholder as we don't store join date
            });
        });

        // Load Feedbacks
        try {
            const storedFeedbacks = JSON.parse(localStorage.getItem('admin_feedback') || '[]');
            setFeedbacks(storedFeedbacks);
        } catch (e) {
            console.error("Error parsing feedback", e);
            setFeedbacks([]);
        }

        setTrips(fetchedTrips);
        setUsers(fetchedUsers);
        setBookings(getAllBookings());
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Username check removed as requested, only checking password
        if (password === '56784321@') {
            setIsAuthenticated(true);
            setAuthError('');
        } else {
            setAuthError('Invalid password. Access denied.');
        }
    };

    const handleDeleteTrip = (id: string, userEmail: string) => {
        if (confirm('Are you sure you want to delete this trip record? This affects the user\'s saved data.')) {
            // Update UI
            setTrips(trips.filter(t => t.id !== id));
            
            // Update Local Storage
            const key = `savedTrips_${userEmail}`;
            try {
                const userTrips = JSON.parse(localStorage.getItem(key) || '[]');
                const tripToDelete = trips.find(t => t.id === id);
                if (tripToDelete) {
                    const updatedTrips = userTrips.filter((t: any) => 
                        !(t.details.destination === tripToDelete.destination && t.details.startDate === tripToDelete.date)
                    );
                    localStorage.setItem(key, JSON.stringify(updatedTrips));
                }
            } catch (e) {
                console.error("Error deleting from storage", e);
            }
        }
    };

    const handleDeleteUser = (email: string) => {
        if (confirm('Are you sure you want to remove this user? This will clear their preferences and trips.')) {
            setUsers(users.filter(u => u.email !== email));
            // Clear storage
            localStorage.removeItem(`savedTrips_${email}`);
            localStorage.removeItem(`userPrefs_${email}`);
            // Also remove trips from UI
            setTrips(trips.filter(t => t.user !== email));
        }
    };

    const handleDeleteFeedback = (id: string) => {
        if (confirm('Are you sure you want to delete this message?')) {
            const updatedFeedbacks = feedbacks.filter(f => f.id !== id);
            setFeedbacks(updatedFeedbacks);
            localStorage.setItem('admin_feedback', JSON.stringify(updatedFeedbacks));
        }
    };

    const handleClearAllFeedback = () => {
        if (confirm('Are you sure you want to delete ALL feedback messages? This cannot be undone.')) {
            setFeedbacks([]);
            localStorage.removeItem('admin_feedback');
        }
    };

    // Settings Handlers
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
        a.download = `globetrekker_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleResetSystem = () => {
        if(confirm("DANGER: This action is irreversible. It will wipe ALL user data, trips, bookings, and settings. Are you absolutely sure?")) {
            if(confirm("Please confirm again: DELETE ALL DATA?")) {
                localStorage.clear();
                window.location.reload();
            }
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

    const filteredTrips = trips.filter(t => 
        t.destination.toLowerCase().includes(searchQuery.toLowerCase()) || 
        t.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredUsers = users.filter(u => 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredFeedback = feedbacks.filter(f => 
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.message.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // --- Login Screen ---
    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                    <div className="p-8">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-cyan-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                                <LockIcon className="h-8 w-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Admin Access</h2>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Restricted area. Please enter admin password.</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-2">Password</label>
                                <input 
                                    type="password" 
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500 outline-none transition-all"
                                    placeholder="Enter admin password"
                                    autoFocus
                                />
                            </div>

                            {authError && (
                                <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-sm rounded-lg text-center font-medium">
                                    {authError}
                                </div>
                            )}

                            <button 
                                type="submit" 
                                className="w-full py-3 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg shadow-lg hover:shadow-xl transition-all transform active:scale-95"
                            >
                                Login to Dashboard
                            </button>
                        </form>
                        
                        <div className="mt-6 text-center">
                            <button onClick={onExit} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm font-medium flex items-center justify-center gap-2 w-full">
                                <ArrowLeftIcon className="h-4 w-4" /> Return to Site
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // --- Helper Render Functions ---

    const renderDashboard = () => {
        const totalRevenue = bookings.reduce((sum, b) => sum + (b.details?.cost || 0), 0);
        
        return (
            <div className="space-y-6 animate-fade-in">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Dashboard Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Estimated Revenue</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">₹{totalRevenue.toLocaleString()}</p>
                            </div>
                            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                                <span className="text-xl font-bold">₹</span>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <span>From {bookings.length} confirmed bookings</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Trips Planned</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{trips.length}</p>
                            </div>
                            <div className="p-3 bg-cyan-100 dark:bg-cyan-900/30 rounded-lg text-cyan-600 dark:text-cyan-400">
                                <FileTextIcon className="h-6 w-6" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <span>Across {users.length} active users</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Active Users</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{users.length}</p>
                            </div>
                            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
                                <UsersIcon className="h-6 w-6" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <span>Based on stored data</span>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Feedback Msgs</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{feedbacks.length}</p>
                            </div>
                            <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                                <ChatBubbleIcon className="h-6 w-6" />
                            </div>
                        </div>
                        <div className="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <span>Pending review</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">Recent Bookings</h3>
                    <div className="space-y-4">
                        {bookings.slice(0, 5).map((booking, i) => (
                            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">{booking.details?.type} Booking</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{booking.details?.activityName}</p>
                                    </div>
                                </div>
                                <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{booking.bookingId}</span>
                            </div>
                        ))}
                        {bookings.length === 0 && <p className="text-gray-500 italic">No bookings found.</p>}
                    </div>
                </div>
            </div>
        );
    };

    const renderTrips = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">All Tracked Trips</h2>
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search trips..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-medium">
                            <tr>
                                <th className="px-6 py-4">Trip ID</th>
                                <th className="px-6 py-4">Destination</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Est. Cost</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredTrips.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        No trips found.
                                    </td>
                                </tr>
                            ) : (
                                filteredTrips.map(trip => (
                                    <tr key={trip.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs">{trip.id}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{trip.destination}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{trip.user}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{trip.date}</td>
                                        <td className="px-6 py-4 text-gray-900 dark:text-white">₹{trip.cost.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                trip.status === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                                'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                            }`}>
                                                {trip.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                                            <button onClick={() => handleDeleteTrip(trip.id, trip.user)} className="p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-red-500 dark:text-red-400" title="Delete Trip">
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderUsers = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">User Registry</h2>
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input 
                        type="text" 
                        placeholder="Search users..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-medium">
                            <tr>
                                <th className="px-6 py-4">User ID</th>
                                <th className="px-6 py-4">Name</th>
                                <th className="px-6 py-4">Email</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        No users found.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map(user => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs">{user.id}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center text-xs">
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            {user.name}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{user.email}</td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => handleDeleteUser(user.email)} className="text-red-500 hover:text-red-700 dark:hover:text-red-300 font-medium text-xs">
                                                Remove User
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderFeedback = () => (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">User Feedback</h2>
                <div className="flex gap-4">
                    <div className="relative">
                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search messages..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>
                    {feedbacks.length > 0 && (
                        <button 
                            onClick={handleClearAllFeedback}
                            className="px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 rounded-lg text-sm font-bold flex items-center gap-2"
                        >
                            <TrashIcon className="h-4 w-4" /> Clear All
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-medium">
                            <tr>
                                <th className="px-6 py-4 w-32">Date</th>
                                <th className="px-6 py-4 w-40">Name</th>
                                <th className="px-6 py-4 w-48">Email</th>
                                <th className="px-6 py-4">Message</th>
                                <th className="px-6 py-4 text-right w-20">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredFeedback.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                        No feedback messages found.
                                    </td>
                                </tr>
                            ) : (
                                filteredFeedback.map(item => (
                                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">
                                            {item.date}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                            {item.name}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 truncate max-w-xs">
                                            <a href={`mailto:${item.email}`} className="hover:text-cyan-600 dark:hover:text-cyan-400">{item.email}</a>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                            <p className="line-clamp-2" title={item.message}>{item.message}</p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button 
                                                onClick={() => handleDeleteFeedback(item.id)} 
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                                title="Delete Message"
                                            >
                                                <TrashIcon className="h-4 w-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );

    const renderSettings = () => (
        <div className="space-y-8 animate-fade-in">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">System Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Data Management */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-full">
                    <div className="flex items-center gap-3 mb-4 text-cyan-600 dark:text-cyan-400">
                        <FileTextIcon className="h-6 w-6" />
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Data Management</h3>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 h-10">Export all system data including user profiles, trips, bookings, and feedback for backup purposes.</p>
                    <button 
                        onClick={handleExportData}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors font-medium"
                    >
                        <DownloadIcon className="h-5 w-5" /> Export All Data (JSON)
                    </button>
                </div>

                {/* System Controls */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 h-full">
                    <div className="flex items-center gap-3 mb-4 text-purple-600 dark:text-purple-400">
                        <SettingsIcon className="h-6 w-6" />
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Configuration</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-800 dark:text-white">Maintenance Mode</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Disable new trip generation</p>
                            </div>
                            <button 
                                onClick={toggleMaintenance}
                                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${maintenanceMode ? 'bg-cyan-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${maintenanceMode ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-800 dark:text-white">Allow Registrations</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">New user signups</p>
                            </div>
                            <button 
                                onClick={toggleSignups}
                                className={`w-12 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out ${allowSignups ? 'bg-cyan-600' : 'bg-gray-300 dark:bg-gray-600'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${allowSignups ? 'translate-x-6' : 'translate-x-0'}`} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-xl border border-red-100 dark:border-red-900/30">
                <div className="flex items-center gap-3 mb-4 text-red-600 dark:text-red-400">
                    <XCircleIcon className="h-6 w-6" />
                    <h3 className="text-lg font-bold">Danger Zone</h3>
                </div>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <p className="text-sm text-red-800 dark:text-red-300 max-w-lg">
                        This action will permanently delete all data from the local storage, effectively resetting the entire application state for this browser.
                    </p>
                    <button 
                        onClick={handleResetSystem}
                        className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold shadow-sm transition-colors whitespace-nowrap"
                    >
                        Factory Reset System
                    </button>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex transition-colors duration-300 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex-shrink-0 flex flex-col h-screen sticky top-0">
                <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
                        <GlobeIcon className="h-6 w-6" />
                        <span className="text-xl font-bold font-serif text-gray-800 dark:text-gray-100">Admin</span>
                    </div>
                </div>
                
                <nav className="flex-1 p-4 space-y-2">
                    <button 
                        onClick={() => setCurrentView('dashboard')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'dashboard' ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 font-bold shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                        <LayoutDashboardIcon className="h-5 w-5" /> Dashboard
                    </button>
                    <button 
                        onClick={() => setCurrentView('trips')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'trips' ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 font-bold shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                        <FileTextIcon className="h-5 w-5" /> Manage Tracks
                    </button>
                    <button 
                        onClick={() => setCurrentView('users')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'users' ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 font-bold shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                        <UsersIcon className="h-5 w-5" /> Users
                    </button>
                    <button 
                        onClick={() => setCurrentView('feedback')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'feedback' ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 font-bold shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                        <ChatBubbleIcon className="h-5 w-5" /> Feedback
                    </button>
                    <button 
                        onClick={() => setCurrentView('settings')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentView === 'settings' ? 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 font-bold shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                        <SettingsIcon className="h-5 w-5" /> Settings
                    </button>
                </nav>

                <div className="p-4 border-t border-gray-100 dark:border-gray-800">
                    <button onClick={onExit} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors font-medium">
                        <LogoutIcon className="h-5 w-5" /> Exit Panel
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-8 overflow-y-auto h-screen">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white capitalize">{currentView === 'trips' ? 'Track Data' : currentView}</h1>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-bold text-gray-900 dark:text-white">Admin User</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">admin@globetrekker.ai</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-cyan-600 flex items-center justify-center text-white font-bold">A</div>
                    </div>
                </header>

                {currentView === 'dashboard' && renderDashboard()}
                {currentView === 'trips' && renderTrips()}
                {currentView === 'users' && renderUsers()}
                {currentView === 'feedback' && renderFeedback()}
                {currentView === 'settings' && renderSettings()}
            </main>
        </div>
    );
};

export default AdminPanel;
