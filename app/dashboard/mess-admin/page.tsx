'use client';

import { useState, useEffect, useRef } from 'react';
import { useUserData } from '@nhost/react';
import { 
  PlusCircle, 
  Trash, 
  Save, 
  Search, 
  Calendar, 
  Utensils, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Image as ImageIcon,
  Camera,
  X,
  Plus,
  RefreshCcw,
  LayoutGrid,
  ChevronRight,
  ClipboardList,
  Edit2,
  Trophy,
  History,
  TrendingUp,
  Settings,
  ChevronDown,
  Clock,
  ThumbsUp,
  Users,
  Eye,
  Download,
  Star,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useTickets, TicketStatus } from '@/lib/ticket-context';
import { GlassModal } from '@/components/ui/glass-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMemo } from 'react';

// --- Types ---
interface MenuItem {
  name: string;
  image_url?: string;
}

interface MealEntry {
  id?: string;
  day: string;
  meal_type: string;
  items: string;
  items_json: MenuItem[];
  image_url?: string;
  updated_at?: string;
}

interface MealRating {
  id: string;
  day: string;
  meal_type: string;
  rating: number;
  feedback?: string;
  created_at: string;
  user: {
    displayName: string;
    email: string;
  };
}

interface MessRequest {
  id: string;
  student_name: string;
  student_email: string;
  day: string;
  meal_type: string;
  current_item: string;
  suggested_item: string;
  status: string;
  created_at: string;
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'snacks', 'dinner'];

const MessAdminPage = () => {
    const user = useUserData();
    const [messMenu, setMessMenu] = useState<MealEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(DAYS[new Date().getDay()]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState<'menu' | 'reviews' | 'requests' | 'complaints' | 'analytics'>('menu');
    
    // --- NEXUS Ticket System ---
    const { tickets, updateTicketStatus, setDeadline } = useTickets();
    const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
    const [deadlineValue, setDeadlineValue] = useState<string>('');
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    
    // --- Custom Deadline Modal State ---
    const [isDeadlineModalOpen, setIsDeadlineModalOpen] = useState(false);
    const [deadlineComplaint, setDeadlineComplaint] = useState<any>(null);
    const [localDeadlineValue, setLocalDeadlineValue] = useState<string>('');

    
    // Detailed Data State
    const [ratings, setRatings] = useState<MealRating[]>([]);
    const [requests, setRequests] = useState<MessRequest[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);

    // Derived State
    const messComplaints = useMemo(() => {
        return (tickets || []).filter(t => 
            t.department === 'Mess' || 
            t.department === 'hostel-mess' ||
            t.subject?.toLowerCase().includes('mess') ||
            t.description?.toLowerCase().includes('mess') ||
            t.department?.toLowerCase().includes('mess')
        );
    }, [tickets]);
    
    // --- Toast System ---
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // --- Add New Menu State ---
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newDay, setNewDay] = useState(DAYS[0]);
    const [selectedNewMealType, setSelectedNewMealType] = useState('breakfast');
    const [newMealBuffer, setNewMealBuffer] = useState<Record<string, MenuItem[]>>({
        breakfast: [],
        lunch: [],
        snacks: [],
        dinner: []
    });
    const [isSaving, setIsSaving] = useState(false);

    // --- Bulk Add State ---
    const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
    const [bulkInput, setBulkInput] = useState('');

    // --- Individual Item Modal State ---
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MenuItem>({ name: '', image_url: '' });
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

    useEffect(() => {
        const initialize = async () => {
            setLoading(true);
            await Promise.all([
                fetchMenu(),
                fetchRatings(),
                fetchRequests(),
                fetchAnalytics()
            ]);
            setLoading(false);
        };
        initialize();
    }, []);

    const fetchMenu = async () => {
        try {
            const res = await fetch('/api/v1/nhost/get-mess-menu');
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setMessMenu(data || []);
        } catch (err: any) {
            console.error('Menu Fetch Error:', err.message);
        }
    };

    const fetchRatings = async () => {
        try {
            const res = await fetch('/api/v1/nhost/get-meal-ratings');
            const result = await res.json();
            if (result.success) setRatings(result.data || []);
        } catch (err) {
            console.error('Ratings Fetch Error:', err);
        }
    };

    const fetchRequests = async () => {
        try {
            const res = await fetch('/api/v1/nhost/get-mess-change-requests');
            const result = await res.json();
            if (Array.isArray(result)) setRequests(result);
            else if (result.data) setRequests(result.data);
        } catch (err) {
            console.error('Requests Fetch Error:', err);
        }
    };

    const fetchAnalytics = async () => {
        try {
            const res = await fetch('/api/v1/nhost/get-mess-analytics');
            const result = await res.json();
            if (result.success) setAnalytics(result.data);
        } catch (err) {
            console.error('Analytics Fetch Error:', err);
        }
    };

    const handleUpsertMeal = async (meal: Partial<MealEntry>) => {
        try {
            const itemsString = meal.items_json?.map(i => i.name).join(', ') || '';
            const res = await fetch('/api/v1/nhost/upsert-mess-menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...meal,
                    items: itemsString,
                    updated_by: user?.id
                })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message || 'Failed to save');
            return true;
        } catch (err: any) {
            showToast(err.message, 'error');
            return false;
        }
    };

    const handleAddNewMenu = async () => {
        setIsSaving(true);
        let successCount = 0;
        
        for (const type of MEAL_TYPES) {
            const items = newMealBuffer[type];
            if (items.length > 0) {
                const ok = await handleUpsertMeal({
                    day: newDay,
                    meal_type: type,
                    items_json: items
                });
                if (ok) successCount++;
            }
        }

        if (successCount > 0) {
            showToast(`Successfully saved ${successCount} meals for ${newDay}`);
            setIsAddModalOpen(false);
            fetchMenu();
            // Reset buffer
            setNewMealBuffer({ breakfast: [], lunch: [], snacks: [], dinner: [] });
        }
        setIsSaving(false);
    };

    const handleBulkAdd = () => {
        if (!bulkInput.trim()) return;
        const items = bulkInput.split(',').map(i => i.trim()).filter(i => i !== '');
        const newItems: MenuItem[] = items.map(name => ({ name }));
        
        setNewMealBuffer(prev => ({
            ...prev,
            [selectedNewMealType]: [...prev[selectedNewMealType], ...newItems]
        }));
        
        setBulkInput('');
        setIsBulkAddOpen(false);
        showToast(`Added ${newItems.length} items to ${selectedNewMealType}`);
    };

    const removeBufferItem = (type: string, index: number) => {
        setNewMealBuffer(prev => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index)
        }));
    };

    const openItemModal = (index: number | null = null) => {
        if (index !== null) {
            setEditingItem(newMealBuffer[selectedNewMealType][index]);
            setEditingItemIndex(index);
        } else {
            setEditingItem({ name: '', image_url: '' });
            setEditingItemIndex(null);
        }
        setIsItemModalOpen(true);
    };

    const saveItemDetail = () => {
        if (!editingItem.name.trim()) return;
        
        setNewMealBuffer(prev => {
            const currentItems = [...prev[selectedNewMealType]];
            if (editingItemIndex !== null) {
                currentItems[editingItemIndex] = editingItem;
            } else {
                currentItems.push(editingItem);
            }
            return {
                ...prev,
                [selectedNewMealType]: currentItems
            };
        });
        
        setIsItemModalOpen(false);
        showToast(editingItemIndex !== null ? 'Item updated' : 'Item added');
    };

    const filteredMenu = messMenu.filter(m => 
        m.day === selectedDay && 
        (m.items.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return (
        <div className="min-h-screen bg-black text-white p-4 md:p-8 font-mono relative overflow-hidden">
            {/* Background Atmosphere */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#0f172a_0%,#000000_100%)] z-0" />
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] z-0" />

            {/* Content Container */}
            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
                                <Utensils className="w-6 h-6 text-emerald-500" />
                            </div>
                            <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-white">
                                MESS<span className="text-emerald-500">_ADMIN</span>
                            </h1>
                        </div>
                        <p className="text-[#64748B] text-xs font-bold tracking-[0.3em] uppercase ml-1">
                            Administrative Terminal v4.0.2
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => {
                                setNewMealBuffer({
                                    breakfast: [],
                                    lunch: [],
                                    snacks: [],
                                    dinner: []
                                });
                                setNewDay(DAYS[new Date().getDay()]);
                                setIsAddModalOpen(true);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/20"
                        >
                            <PlusCircle className="w-4 h-4" />
                            New Schedule
                        </button>
                        <button 
                            onClick={fetchMenu}
                            className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                        >
                            <RefreshCcw className={`w-5 h-5 text-emerald-500 ${loading ? 'animate-spin' : ''}`} />
                        </button>
                    </div>
                </header>

                {/* Dashboard Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
                    <div className="bg-[#111625]/80 backdrop-blur-xl border border-white/5 p-5 rounded-[24px]">
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-3">Active Complaints</p>
                        <h3 className="text-3xl font-black tracking-tighter">
                            {messComplaints.filter(c => c.status !== 'Completed').length} 
                            <span className="text-sm font-medium text-[#64748B] ml-2">tickets</span>
                        </h3>
                    </div>
                    <div className="bg-[#111625]/80 backdrop-blur-xl border border-white/5 p-5 rounded-[24px]">
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-3">Feedback Index</p>
                        <h3 className="text-3xl font-black tracking-tighter">
                            {ratings.length > 0 
                                ? (ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length).toFixed(1) 
                                : '0.0'}
                            <span className="text-sm font-medium text-[#64748B] ml-2">/ 5</span>
                        </h3>
                    </div>
                    <div className="bg-[#111625]/80 backdrop-blur-xl border border-white/5 p-5 rounded-[24px]">
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-3">Meal Feedback</p>
                        <h3 className="text-3xl font-black tracking-tighter">
                            {ratings.length}
                            <span className="text-sm font-medium text-[#64748B] ml-2">reviews</span>
                        </h3>
                    </div>
                    <div className="bg-[#111625]/80 backdrop-blur-xl border border-white/5 p-5 rounded-[24px]">
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-3">System Uptime</p>
                        <h3 className="text-3xl font-black tracking-tighter">99.9%</h3>
                    </div>
                </div>

                {/* Main View Navigation */}
                <div className="flex items-center gap-2 bg-[#111625]/90 backdrop-blur-md p-2.5 rounded-[24px] border border-white/10 mb-10 w-fit mx-auto md:mx-0 shadow-2xl overflow-x-auto max-w-full no-scrollbar">
                    {(['menu', 'reviews', 'requests', 'complaints', 'analytics'] as const).map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-12 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all whitespace-nowrap ${
                                activeTab === tab 
                                ? 'bg-emerald-500 text-black shadow-[0_0_30px_rgba(16,185,129,0.5)] scale-[1.05] ring-2 ring-emerald-400/50' 
                                : 'text-[#64748B] hover:text-white hover:bg-emerald-500/5'
                            }`}
                        >
                            {tab.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'menu' && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-6"
                        >
                            {/* Filters & Day Selector */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex flex-wrap gap-2">
                                    {DAYS.map(day => (
                                        <button
                                            key={day}
                                            onClick={() => setSelectedDay(day)}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                                                selectedDay === day
                                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                                : 'bg-white/5 text-[#64748B] border-transparent hover:border-white/10 hover:text-white'
                                            }`}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                                
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                                    <input 
                                        type="text"
                                        placeholder="SEARCH_MENU..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="bg-[#111625] border border-white/10 rounded-xl pl-12 pr-6 py-3 text-xs text-white placeholder:text-[#475569] focus:outline-none focus:border-emerald-500/50 transition-all w-full md:w-64 uppercase tracking-tighter"
                                    />
                                </div>
                            </div>

                            {/* Menu Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {MEAL_TYPES.map(type => {
                                    const entry = filteredMenu.find(m => m.meal_type === type);
                                    return (
                                        <div key={type} className="group relative">
                                            <div className="absolute inset-0 bg-emerald-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                                            <div className="bg-[#111625]/80 backdrop-blur-md border border-white/5 h-full rounded-[32px] overflow-hidden transition-all duration-300 group-hover:border-emerald-500/30 flex flex-col">
                                                {/* Card Header */}
                                                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                                                    <div>
                                                        <h3 className="text-xs font-black text-white uppercase tracking-[0.3em]">{type}</h3>
                                                        <p className="text-[10px] text-[#64748B] font-bold mt-1">NEXUS_FEED_SYS</p>
                                                    </div>
                                                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10">
                                                        <Utensils className="w-4 h-4 text-emerald-500/50 group-hover:text-emerald-500 transition-colors" />
                                                    </div>
                                                </div>

                                                {/* Card Content */}
                                                <div className="p-6 flex-1">
                                                    {entry ? (
                                                        <div className="space-y-4">
                                                            <div className="flex flex-wrap gap-2">
                                                                {entry.items_json.map((item, idx) => (
                                                                    <div key={idx} className="px-3 py-1.5 rounded-lg bg-black/40 border border-white/5 text-[10px] text-slate-300 uppercase tracking-widest flex items-center gap-2 group/tag">
                                                                        {item.name}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                            <p className="text-[11px] text-[#475569] leading-relaxed italic border-t border-white/5 pt-4 mt-4">
                                                                Last updated: {entry.updated_at ? new Date(entry.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="h-full flex flex-col items-center justify-center py-12 text-center">
                                                            <LayoutGrid className="w-8 h-8 text-[#1e293b] mb-4" />
                                                            <p className="text-xs font-bold text-[#475569] uppercase tracking-widest leading-loose">
                                                                No entries detected.<br/>
                                                                <span className="text-emerald-500/50">Awaiting input...</span>
                                                            </p>
                                                            <button 
                                                                onClick={() => {
                                                                    setNewDay(selectedDay);
                                                                    setSelectedNewMealType(type);
                                                                    setIsAddModalOpen(true);
                                                                }}
                                                                className="mt-6 px-4 py-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 text-[10px] font-black uppercase tracking-widest transition-all"
                                                            >
                                                                Create Menu
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Action Bar */}
                                                {entry && (
                                                    <div className="px-6 py-4 bg-black/20 border-t border-white/5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => {
                                                                setNewDay(selectedDay);
                                                                setSelectedNewMealType(type);
                                                                setNewMealBuffer(prev => ({ ...prev, [type]: entry.items_json }));
                                                                setIsAddModalOpen(true);
                                                            }}
                                                            className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest hover:text-emerald-400 transition-colors flex items-center gap-2"
                                                        >
                                                            <Edit2 className="w-3.5 h-3.5" />
                                                            Edit
                                                        </button>
                                                        <button className="p-2 rounded-lg hover:bg-red-500/10 text-red-500/50 hover:text-red-500 transition-all">
                                                            <Trash className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </motion.div>
                    )}

                    {/* Complaints Tab */}
                    {activeTab === 'complaints' && (
                        <motion.div 
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="bg-[#111625]/80 backdrop-blur-xl border border-white/5 rounded-[32px] overflow-hidden"
                        >
                            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                                <div>
                                    <h2 className="text-xl font-black text-white tracking-tighter uppercase">Mess_Tickets</h2>
                                    <p className="text-[#64748B] text-[10px] font-black tracking-widest mt-1">ACTIVE_ISSUES_QUEUE</p>
                                </div>
                                <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest">
                                    {messComplaints.length} Total Tickets
                                </div>
                            </div>
                            <div className="p-8">
                                <div className="grid grid-cols-1 gap-6">
                                    {messComplaints.length > 0 ? messComplaints.map((complaint) => (
                                        <motion.div
                                            key={complaint.id}
                                            whileHover={{ y: -4 }}
                                            className="p-8 relative overflow-hidden bg-[#0F172A]/80 border border-white/5 rounded-[32px] group hover:border-emerald-500/20 transition-all flex justify-between gap-8"
                                        >
                                            {/* Left Content Area */}
                                            <div className="flex-1 flex flex-col gap-5">
                                                {/* Top Status Row */}
                                                <div className="flex items-center gap-3">
                                                    <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                                                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">{complaint.priority} Priority</span>
                                                    </div>
                                                    <div className={`px-3 py-1 rounded-full border ${
                                                        complaint.status === 'Completed' 
                                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                                                        : 'bg-blue-500/10 border-blue-500/20 text-blue-500'
                                                    }`}>
                                                        <span className="text-[9px] font-black uppercase tracking-widest">{complaint.status}</span>
                                                    </div>
                                                    <span className="text-[10px] font-mono text-slate-500 lowercase tracking-tight">#{complaint.id.slice(0, 8)}</span>
                                                    {complaint.dueAt && (
                                                        <div className="px-3 py-1 rounded-full bg-emerald-950/30 border border-emerald-500/20 flex items-center gap-2">
                                                            <Clock className="w-3 h-3 text-emerald-500" />
                                                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Due {new Date(complaint.dueAt).toLocaleDateString('en-GB')}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Subject Block */}
                                                <div className="flex flex-col">
                                                    <h3 className="text-2xl font-bold text-white tracking-tight mb-4 group-hover:text-emerald-400 transition-colors">
                                                        {complaint.subject}
                                                    </h3>
                                                    
                                                    {/* Date of Incident Badge */}
                                                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 border border-white/10 mb-4 self-start">
                                                        <Calendar className="w-3 h-3 text-slate-500" />
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                            Incident_Date: {new Date(complaint.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                        </span>
                                                    </div>

                                                    <div className="relative">
                                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500/20 rounded-full" />
                                                        <p className="text-sm font-medium text-slate-300 leading-relaxed whitespace-pre-wrap pl-6 py-1">
                                                            {complaint.description}
                                                        </p>
                                                    </div>
                                                </div>


                                                {/* Footer Metadata Line */}
                                                <div className="flex items-center gap-8 mt-4 pt-4 border-t border-white/5">
                                                    <div className="flex items-center gap-2.5">
                                                        <Users className="w-4 h-4 text-emerald-500/50" />
                                                        <span className="text-[11px] font-bold text-slate-200 uppercase tracking-wide">
                                                            {complaint.studentName} ({complaint.phone || 'N/A'}, {complaint.gender || 'MALE'})
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2.5">
                                                        <Calendar className="w-4 h-4 text-slate-600" />
                                                        <span className="text-[11px] font-bold text-slate-500">
                                                            {new Date(complaint.createdAt).toLocaleDateString('en-GB')}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Action Area */}
                                            <div className="w-64 flex flex-col items-end justify-between py-1">
                                                {complaint.image ? (
                                                    <button 
                                                        onClick={() => setPreviewImage(complaint.image || null)}
                                                        className="flex items-center gap-2 text-emerald-500 hover:text-emerald-400 transition-colors"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Evidence</span>
                                                    </button>
                                                ) : <div className="h-4" />}

                                                <div className="flex flex-col gap-3 w-full">
                                                    <button 
                                                        onClick={() => {
                                                            setDeadlineComplaint(complaint);
                                                            setLocalDeadlineValue(complaint.dueAt || '');
                                                            setIsDeadlineModalOpen(true);
                                                        }}

                                                        className="w-full py-3.5 border border-amber-500/20 text-amber-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/5 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Clock className="w-3.5 h-3.5" />
                                                        Edit Deadline
                                                    </button>
                                                    
                                                    <button 
                                                        onClick={() => {
                                                            updateTicketStatus(complaint.id, 'Completed');
                                                            showToast('Ticket Resolved', 'success');
                                                        }}
                                                        disabled={complaint.status === 'Completed'}
                                                        className={`w-full py-3.5 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                                            complaint.status !== 'Completed' 
                                                            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' 
                                                            : 'opacity-40 border-emerald-500/10 bg-emerald-500/5 text-emerald-500/50 cursor-not-allowed'
                                                        }`}
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        {complaint.status === 'Completed' ? 'Resolved' : 'Resolved'}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Decorative Cursor Indicator */}
                                            <div className="absolute top-6 left-2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                                                <svg width="20" height="20" viewBox="0 0 32 32" fill="none" className="text-cyan-400 animate-pulse">
                                                    <path d="M12 2L2 28L12 22L22 28L12 2Z" fill="currentColor" />
                                                </svg>
                                            </div>
                                        </motion.div>
                                    )) : (
                                        <div className="bg-[#111625]/80 backdrop-blur-xl border border-white/5 rounded-[32px] p-20 text-center">
                                            <AlertCircle className="w-12 h-12 text-white/5 mx-auto mb-4" />
                                            <p className="text-[#64748B] text-[10px] font-black uppercase tracking-[0.3em]">Operational_Queue_Empty</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>

                    )}

                    {/* Reviews Tab */}
                    {activeTab === 'reviews' && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="bg-[#111625]/80 backdrop-blur-xl border border-white/5 rounded-[32px] p-8"
                        >
                            <div className="flex items-center justify-between mb-8 pb-8 border-b border-white/5">
                                <div>
                                    <h2 className="text-xl font-black text-white tracking-tighter uppercase">Student_Feedback</h2>
                                    <p className="text-[#64748B] text-[10px] font-black tracking-widest mt-1">LATEST_MEAL_REVIEWS</p>
                                </div>
                                <div className="flex items-center gap-6">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Average_Score</p>
                                        <p className="text-2xl font-black text-white mt-0.5">
                                            {ratings.length > 0 
                                                ? (ratings.reduce((acc, r) => acc + r.rating, 0) / ratings.length).toFixed(1) 
                                                : '0.0'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {ratings.length > 0 ? ratings.map((review) => (
                                    <div key={review.id} className="group relative">
                                        <div className="absolute inset-0 bg-emerald-500/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px]" />
                                        <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[32px] hover:border-emerald-500/30 transition-all relative z-10">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-emerald-500 font-black text-sm border border-white/10">
                                                        {review.user?.displayName?.[0] || 'S'}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-white uppercase tracking-widest">{review.user?.displayName || 'Anonymous Student'}</p>
                                                        <p className="text-[10px] text-[#64748B] font-bold mt-1 uppercase tracking-tighter">
                                                            {review.meal_type} • {new Date(review.created_at).toLocaleDateString('en-US', { day: '2-digit', month: 'short' })}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <div className="flex items-center gap-1">
                                                        {[...Array(5)].map((_, i) => (
                                                            <Star 
                                                                key={i} 
                                                                className={`w-3 h-3 ${i < review.rating ? 'fill-emerald-500 text-emerald-500' : 'text-white/10'}`} 
                                                            />
                                                        ))}
                                                    </div>
                                                    <span className="text-[10px] font-black text-emerald-500/50 uppercase tracking-widest">Score: {review.rating}.0</span>
                                                </div>
                                            </div>
                                            
                                            <div className="bg-black/40 border border-white/10 p-6 rounded-2xl relative overflow-hidden group-hover:border-emerald-500/20 transition-all">
                                                <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />
                                                <p className="text-[11px] text-slate-300 leading-relaxed font-medium italic relative z-10">
                                                    "{review.feedback || 'No detailed remarks provided for this meal session.'}"
                                                </p>
                                            </div>
                                            
                                            <div className="mt-4 flex items-center justify-between px-2">
                                                <div className="text-[8px] font-black text-[#475569] uppercase tracking-[0.2em]">Verified_Session_Log</div>
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30 group-hover:bg-emerald-500 transition-all animate-pulse" />
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-span-2 py-20 text-center">
                                        <History className="w-12 h-12 text-white/10 mx-auto mb-4" />
                                        <p className="text-[#64748B] text-xs font-bold uppercase tracking-[0.2em]">No reviews archived yet</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* Analytics Tab */}
                    {activeTab === 'analytics' && (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-8"
                        >
                            {/* Header Row */}
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                                        <TrendingUp className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white tracking-tight">Mess Performance Analytics</h2>
                                </div>
                                <button className="flex items-center gap-2.5 px-6 py-2.5 rounded-xl bg-indigo-500/5 border border-white/5 hover:border-indigo-500/30 text-indigo-400 text-xs font-black uppercase tracking-widest transition-all">
                                    <Download className="w-4 h-4" />
                                    Weekly Report
                                </button>
                            </div>

                            {/* Charts Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Bar Chart Container */}
                                <div className="bg-[#0F172A]/80 backdrop-blur-xl border border-white/5 p-8 rounded-[40px] relative overflow-hidden group">
                                    <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />
                                    <div className="flex items-center gap-3 mb-8">
                                        <Utensils className="w-5 h-5 text-emerald-500" />
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Top Rated Meals</h3>
                                    </div>
                                    <div className="h-[300px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={[
                                                { name: 'Monday breakfast', rating: 5 },
                                                { name: 'Tuesday breakfast', rating: 5 },
                                                { name: 'Tuesday dinner', rating: 5 },
                                                { name: 'Tuesday lunch', rating: 5 },
                                                { name: 'Tuesday snacks', rating: 5 },
                                            ]}>
                                                <XAxis 
                                                    dataKey="name" 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fill: '#64748B', fontSize: 10, fontWeight: 700 }}
                                                    interval={0}
                                                />
                                                <YAxis 
                                                    axisLine={false} 
                                                    tickLine={false} 
                                                    tick={{ fill: '#64748B', fontSize: 10 }}
                                                    domain={[0, 5]}
                                                    ticks={[0, 2, 4, 5]}
                                                />
                                                <Bar dataKey="rating" fill="#10B981" radius={[6, 6, 0, 0]} barSize={32} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Donut Chart Container */}
                                <div className="bg-[#0F172A]/80 backdrop-blur-xl border border-white/5 p-8 rounded-[40px] relative overflow-hidden group">
                                    <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />
                                    <div className="flex items-center gap-3 mb-8">
                                        <AlertCircle className="w-5 h-5 text-amber-500" />
                                        <h3 className="text-sm font-black text-white uppercase tracking-widest">Complaint Categories</h3>
                                    </div>
                                    <div className="h-[300px] w-full flex items-center justify-center">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={[{ name: 'Main', value: 100 }]}
                                                    innerRadius={80}
                                                    outerRadius={110}
                                                    paddingAngle={0}
                                                    dataKey="value"
                                                >
                                                    <Cell fill="#EF4444" />
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    { label: 'Total Complaints', value: messComplaints.length, color: 'text-white' },
                                    { label: 'Overdue (SLA)', value: analytics?.overdueCount || 0, color: 'text-red-500' },
                                    { label: 'Suggestion Rate', value: '0%', color: 'text-emerald-500' },
                                    { label: 'Avg Satisfaction', value: analytics?.overallAvg || '5.0', color: 'text-blue-400' }
                                ].map((stat, i) => (
                                    <div key={i} className="bg-[#0F172A]/80 backdrop-blur-xl border border-white/5 p-8 rounded-[32px] group hover:border-white/10 transition-all">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">{stat.label}</p>
                                        <p className={`text-4xl font-black tracking-tighter ${stat.color}`}>{stat.value}</p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}


                    {/* Requests Tab */}
                    {activeTab === 'requests' && (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="bg-[#111625]/80 backdrop-blur-xl border border-white/5 rounded-[32px] overflow-hidden"
                        >
                            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/5">
                                <div>
                                    <h2 className="text-xl font-black text-white tracking-tighter uppercase">Menu_Suggestions</h2>
                                    <p className="text-[#64748B] text-[10px] font-black tracking-widest mt-1">STUDENT_MODIFICATION_REQUESTS</p>
                                </div>
                                <div className="px-4 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 text-[10px] font-black uppercase tracking-widest">
                                    {requests.length} Change Requests
                                </div>
                            </div>
                            
                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {requests.length > 0 ? requests.map((req) => (
                                    <div key={req.id} className="group relative">
                                        <div className="absolute inset-0 bg-blue-500/5 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity rounded-[32px]" />
                                        <div className="bg-white/[0.03] border border-white/5 p-8 rounded-[32px] hover:border-blue-500/30 transition-all relative z-10">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-sm border ${
                                                        req.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' :
                                                        req.status === 'rejected' ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                                                        'bg-blue-500/10 border-blue-500/20 text-blue-500'
                                                    }`}>
                                                        {req.student_name?.[0] || 'S'}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-white uppercase tracking-widest">{req.student_name}</p>
                                                        <p className="text-[10px] text-[#64748B] font-bold mt-1 uppercase tracking-tighter">
                                                            {req.day} • {req.meal_type}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="px-3 py-1 rounded-full bg-white/5 border border-white/5 flex items-center gap-2">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${
                                                        req.status === 'approved' ? 'bg-emerald-500' :
                                                        req.status === 'rejected' ? 'bg-red-500' : 'bg-blue-500'
                                                    } animate-pulse`} />
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${
                                                        req.status === 'approved' ? 'text-emerald-400' :
                                                        req.status === 'rejected' ? 'text-red-400' : 'text-blue-400'
                                                    }`}>
                                                        {req.status}
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="bg-black/40 border border-white/10 p-6 rounded-2xl relative overflow-hidden group-hover:border-blue-500/20 transition-all">
                                                <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />
                                                <div className="relative z-10 flex flex-col gap-4">
                                                    <div className="text-[8px] font-black text-[#475569] uppercase tracking-[0.2em] mb-1">Proposed_Modification</div>
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex-1">
                                                            <p className="text-[9px] font-bold text-red-400/50 uppercase mb-1">Current</p>
                                                            <p className="text-xs font-black text-white line-through decoration-red-500/30 truncate">{req.current_item}</p>
                                                        </div>
                                                        <ArrowRight className="w-4 h-4 text-white/20 mt-4" />
                                                        <div className="flex-1 text-right">
                                                            <p className="text-[9px] font-bold text-emerald-400 uppercase mb-1">Suggested</p>
                                                            <p className="text-xs font-black text-emerald-400 uppercase truncate">{req.suggested_item}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-4 flex items-center justify-between px-2">
                                                <div className="text-[8px] font-black text-[#475569] uppercase tracking-[0.2em]">
                                                    REF_ID: {req.id.slice(0, 8)}...
                                                </div>
                                                <div className="text-[8px] font-bold text-[#64748B] uppercase">
                                                    {new Date(req.created_at).toLocaleDateString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-span-2 py-20 text-center">
                                        <RefreshCcw className="w-12 h-12 text-white/10 mx-auto mb-4" />
                                        <p className="text-[#64748B] text-xs font-bold uppercase tracking-[0.2em]">No modification requests pending</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Modals & Overlays */}
            <AnimatePresence>
                {/* Main Configuration Modal */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/80 backdrop-blur-md"
                            onClick={() => setIsAddModalOpen(false)}
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-[#0f172a] border border-white/10 w-full max-w-4xl max-h-[90vh] rounded-[32px] shadow-3xl flex flex-col relative z-20 overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-8 border-b border-white/5 bg-black/20">
                                <div>
                                    <h2 className="text-xl font-black text-white tracking-widest uppercase">Configure_Schedule</h2>
                                    <p className="text-[10px] text-emerald-500 font-bold mt-1 tracking-[0.2em] uppercase">Mass_Upsert_Engine_v4</p>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
                                    <X className="w-5 h-5 text-[#475569]" />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-emerald-500" /> Targeted Day
                                        </label>
                                        <div className="relative">
                                            <select 
                                                value={newDay}
                                                onChange={(e) => setNewDay(e.target.value)}
                                                className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-xs text-white appearance-none cursor-pointer focus:outline-none focus:border-emerald-500/50 transition-all font-bold uppercase tracking-widest"
                                            >
                                                {DAYS.map(day => <option key={day} value={day}>{day}</option>)}
                                            </select>
                                            <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#475569] pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-bold text-[#64748B] uppercase tracking-widest flex items-center gap-2">
                                            <History className="w-4 h-4 text-emerald-500" /> Meal Type
                                        </label>
                                        <div className="flex gap-1 bg-black/40 p-1.5 rounded-xl border border-white/5">
                                            {MEAL_TYPES.map(type => (
                                                <button
                                                    key={type}
                                                    onClick={() => setSelectedNewMealType(type)}
                                                    className={`flex-1 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                                                        selectedNewMealType === type 
                                                        ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' 
                                                        : 'text-[#475569] hover:text-white'
                                                    }`}
                                                >
                                                    {type}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                            {selectedNewMealType}_Items
                                        </h3>
                                        <button 
                                            onClick={() => setIsBulkAddOpen(true)}
                                            className="text-[10px] font-bold text-emerald-500 hover:text-emerald-400 uppercase tracking-widest transition-all flex items-center gap-2 px-4 py-2 bg-emerald-500/5 border border-emerald-500/10 rounded-xl hover:bg-emerald-500/10"
                                        >
                                            <ClipboardList className="w-4 h-4" />
                                            Bulk Import
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {newMealBuffer[selectedNewMealType].map((item, idx) => (
                                            <motion.div 
                                                layout
                                                key={`${selectedNewMealType}-${idx}`}
                                                initial={{ scale: 0.9, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                className="bg-black/60 border border-white/5 p-4 rounded-2xl flex items-center justify-between group/item hover:border-emerald-500/20 transition-all"
                                            >
                                                <div className="flex items-center gap-3 truncate pr-2">
                                                    {item.image_url ? (
                                                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
                                                            <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-lg bg-emerald-500/5 border border-white/5 flex items-center justify-center flex-shrink-0">
                                                            <Utensils className="w-4 h-4 text-emerald-500/20" />
                                                        </div>
                                                    )}
                                                    <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wide truncate">{item.name}</span>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => openItemModal(idx)}
                                                        className="p-2 rounded-lg hover:bg-emerald-500/10 text-emerald-500/30 hover:text-emerald-500 transition-all"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button 
                                                        onClick={() => removeBufferItem(selectedNewMealType, idx)}
                                                        className="p-2 rounded-lg hover:bg-red-500/10 text-red-500/30 hover:text-red-500 transition-all"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                        
                                        <button 
                                            onClick={() => openItemModal()}
                                            className="border-2 border-dashed border-white/5 p-4 rounded-2xl flex items-center justify-center gap-3 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all text-[#475569] hover:text-emerald-500 group"
                                        >
                                            <Plus className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Add Individually</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="p-8 border-t border-white/5 bg-black/40 backdrop-blur-xl flex items-center justify-between">
                                <div className="text-left hidden sm:block">
                                    <p className="text-[9px] font-black text-[#475569] uppercase tracking-widest mb-1">Session_Progress</p>
                                    <div className="flex gap-1.5">
                                        {MEAL_TYPES.map(t => (
                                            <div key={t} className={`w-6 h-1 rounded-full ${newMealBuffer[t].length > 0 ? 'bg-emerald-500' : 'bg-white/5'}`} />
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-4 w-full sm:w-auto">
                                    <button 
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="flex-1 sm:flex-none px-8 py-4 rounded-xl text-[10px] font-bold text-[#64748B] hover:text-white uppercase tracking-widest transition-all"
                                    >
                                        Discard
                                    </button>
                                    <button 
                                        onClick={handleAddNewMenu}
                                        disabled={isSaving || !MEAL_TYPES.some(t => newMealBuffer[t].length > 0)}
                                        className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-black px-10 py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(16,185,129,0.3)] flex items-center justify-center gap-3"
                                    >
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                        Initialize Schedule
                                    </button>
                                </div>
                            </div>

                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* NESTED SUB-MODALS (Moved outside main modal transform scope to prevent clipping) */}
            <AnimatePresence>
                {isItemModalOpen && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
                            onClick={() => setIsItemModalOpen(false)}
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-[#0f172a] border border-white/10 w-full max-w-md rounded-[32px] p-8 relative z-[1001] shadow-2xl overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <Utensils className="w-24 h-24 text-emerald-500" />
                            </div>
                            
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-8 flex items-center gap-3 text-emerald-500">
                                <PlusCircle className="w-5 h-5" />
                                Define_Item
                            </h3>

                            <div className="space-y-8 relative z-10">
                                <div className="aspect-video w-full rounded-2xl bg-black/40 border border-white/5 overflow-hidden flex items-center justify-center group/preview">
                                    {editingItem.image_url ? (
                                        <img src={editingItem.image_url} alt="Preview" className="w-full h-full object-cover" onError={(e) => (e.currentTarget.style.display = 'none')} />
                                    ) : (
                                        <div className="flex flex-col items-center gap-3">
                                            <ImageIcon className="w-8 h-8 text-[#475569]" />
                                            <span className="text-[8px] font-black text-[#475569] uppercase tracking-widest">Image_Preview_Offline</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Item_Label</label>
                                        <input 
                                            type="text"
                                            value={editingItem.name}
                                            onChange={(e) => setEditingItem(prev => ({ ...prev, name: e.target.value }))}
                                            placeholder="Masala Dosa"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-all font-bold uppercase tracking-widest"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">Image_Resource_URL</label>
                                        <input 
                                            type="text"
                                            value={editingItem.image_url || ''}
                                            onChange={(e) => setEditingItem(prev => ({ ...prev, image_url: e.target.value }))}
                                            placeholder="https://images.unsplash.com/..."
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-xs text-white focus:outline-none focus:border-emerald-500/50 transition-all font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-10">
                                <button onClick={() => setIsItemModalOpen(false)} className="flex-1 px-6 py-4 rounded-xl text-[10px] font-black text-[#64748B] hover:text-white uppercase tracking-widest transition-all">Cancel</button>
                                <button onClick={saveItemDetail} disabled={!editingItem.name.trim()} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20">Confirm</button>
                            </div>
                        </motion.div>
                    </div>
                )}

                {isBulkAddOpen && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
                            onClick={() => setIsBulkAddOpen(false)}
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-[#111625] border border-white/10 w-full max-w-lg rounded-[32px] p-8 relative z-[1001] shadow-2xl"
                        >
                            <h3 className="text-sm font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-3 text-emerald-500">
                                <ClipboardList className="w-5 h-5" />
                                Bulk_Import_Terminal
                            </h3>
                            <p className="text-[9px] font-medium text-[#64748B] uppercase tracking-widest mb-4">Enter items separated by commas</p>
                            <textarea
                                value={bulkInput}
                                onChange={(e) => setBulkInput(e.target.value)}
                                placeholder="Item 1, Item 2, Item 3..."
                                className="w-full bg-black/60 border border-white/10 rounded-2xl p-6 text-sm text-white placeholder:text-[#475569] focus:outline-none focus:border-emerald-500/30 transition-all h-48 resize-none mb-8 font-medium"
                            />
                            <div className="flex gap-3">
                                <button onClick={() => setIsBulkAddOpen(false)} className="flex-1 px-6 py-4 rounded-xl text-[10px] font-black text-[#64748B] hover:text-white uppercase tracking-widest transition-all">Cancel</button>
                                <button onClick={handleBulkAdd} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">Execute Import</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Global Toasts */}
            <AnimatePresence>
                {toast && (
                    <motion.div 
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[300]"
                    >
                        <div className={`px-8 py-4 rounded-2xl border backdrop-blur-2xl shadow-3xl flex items-center gap-4 ${
                            toast.type === 'success' 
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                            : 'bg-red-500/10 border-red-500/30 text-red-400'
                        }`}>
                            {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            <span className="text-xs font-black uppercase tracking-widest">{toast.message}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* UPGRADED COMPLAINT DETAIL MODAL */}
            <GlassModal
                isOpen={!!selectedComplaint}
                onClose={() => setSelectedComplaint(null)}
                title="Management_Terminal_v2"
                className="max-w-2xl"
                footer={
                    <div className="flex items-center justify-between w-full">
                        <div className="flex gap-2">
                            {selectedComplaint?.status !== 'In Progress' && selectedComplaint?.status !== 'Completed' && (
                                <Button
                                    onClick={async () => {
                                        await updateTicketStatus(selectedComplaint.id, 'In Progress');
                                        showToast('Ticket marked as In Progress', 'success');
                                        setSelectedComplaint(null);
                                    }}
                                    className="bg-blue-600 hover:bg-blue-500 text-white font-black text-[10px] uppercase tracking-widest px-6 h-12 rounded-xl"
                                >
                                    Start Progress
                                </Button>
                            )}
                            {selectedComplaint?.status !== 'Completed' && (
                                <Button
                                    onClick={async () => {
                                        await updateTicketStatus(selectedComplaint.id, 'Completed');
                                        showToast('Ticket marked as Resolved', 'success');
                                        setSelectedComplaint(null);
                                    }}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-black font-black text-[10px] uppercase tracking-widest px-6 h-12 rounded-xl"
                                >
                                    Mark Resolved
                                </Button>
                            )}
                        </div>
                        <Button 
                            variant="outline" 
                            onClick={() => setSelectedComplaint(null)}
                            className="bg-white/5 border-white/10 text-[#64748B] hover:text-white font-black text-[10px] uppercase tracking-widest px-6 h-12 rounded-xl"
                        >
                            Close_Session
                        </Button>
                    </div>
                }
            >
                {selectedComplaint && (
                    <div className="space-y-8 py-4">
                        {/* Header Stats */}
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-black/40 border border-white/5 p-4 rounded-2xl">
                                <p className="text-[8px] font-black text-[#64748B] uppercase tracking-widest mb-1">Status</p>
                                <p className={`text-[10px] font-black uppercase ${
                                    selectedComplaint.status === 'Completed' ? 'text-emerald-500' : 'text-amber-500'
                                }`}>{selectedComplaint.status}</p>
                            </div>
                            <div className="bg-black/40 border border-white/5 p-4 rounded-2xl">
                                <p className="text-[8px] font-black text-[#64748B] uppercase tracking-widest mb-1">Priority</p>
                                <p className={`text-[10px] font-black uppercase ${
                                    selectedComplaint.priority === 'High' || selectedComplaint.priority === 'Urgent' ? 'text-red-500' : 'text-blue-500'
                                }`}>{selectedComplaint.priority}</p>
                            </div>
                            <div className="bg-black/40 border border-white/5 p-4 rounded-2xl">
                                <p className="text-[8px] font-black text-[#64748B] uppercase tracking-widest mb-1">Category</p>
                                <p className="text-[10px] font-black text-white uppercase truncate">{selectedComplaint.type || 'General'}</p>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tighter leading-none mb-2">
                                    {selectedComplaint.subject}
                                </h3>
                                <p className="text-[9px] font-mono text-[#475569] uppercase">Ref_ID: {selectedComplaint.id}</p>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Detail_Report</span>
                                    </div>
                                    <div className="px-4 py-1.5 rounded-xl bg-white/5 border border-white/10">
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em]">
                                            INCIDENT_LOG: {new Date(selectedComplaint.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}
                                        </span>
                                    </div>
                                </div>
                                <div className="bg-black/40 border border-white/10 p-10 rounded-[40px] relative overflow-hidden shadow-inner">
                                    <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />
                                    
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Core_Description_Data</span>
                                        </div>
                                        
                                        <p className="text-base text-slate-200 leading-relaxed font-medium whitespace-pre-wrap tracking-wide">
                                            {selectedComplaint.description}
                                        </p>
                                    </div>
                                </div>

                            </div>

                            {selectedComplaint.image && (
                                <div className="mt-4 rounded-2xl overflow-hidden border border-white/10 aspect-video bg-black/40">
                                    <img src={selectedComplaint.image} alt="Complaint detail" className="w-full h-full object-contain" />
                                </div>
                            )}
                        </div>

                        {/* Metadata & Deadline */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-black text-[10px]">
                                        {selectedComplaint.studentName?.[0] || 'S'}
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-white uppercase tracking-widest">{selectedComplaint.studentName || 'Student'}</p>
                                        <p className="text-[9px] font-bold text-[#64748B]">
                                            {selectedComplaint.email} | {selectedComplaint.hostelType || 'H-0'} - {selectedComplaint.roomNumber || '000'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-[9px] font-bold text-[#64748B] uppercase tracking-widest">
                                    <Clock className="w-3 h-3" />
                                    Submitted: {new Date(selectedComplaint.createdAt).toLocaleString()}
                                </div>
                                <div className="flex items-center gap-2 text-emerald-500 text-[10px] font-black uppercase">
                                    <ThumbsUp className="w-3.5 h-3.5" />
                                    {selectedComplaint.votes || 0} Endorsements
                                </div>
                            </div>

                            <div className="space-y-4 pt-4">
                                <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 relative group hover:border-[#F59E0B]/30 transition-all">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]" />
                                            <p className="text-[10px] font-black text-[#64748B] uppercase tracking-[0.2em]">Resolution_Target</p>
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setDeadlineComplaint(selectedComplaint);
                                                setLocalDeadlineValue(selectedComplaint.dueAt || '');
                                                setIsDeadlineModalOpen(true);
                                            }}
                                            className="text-[10px] font-black text-[#F59E0B] uppercase tracking-widest hover:text-[#D97706] transition-colors"
                                        >
                                            Modify_Timeframe
                                        </button>
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-xl font-black text-white tracking-widest uppercase">
                                            {selectedComplaint.dueAt 
                                                ? new Date(selectedComplaint.dueAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
                                                : 'Awaiting_Schedule'}
                                        </p>
                                        <p className="text-[8px] font-bold text-[#475569] uppercase tracking-tighter">Verified_Sync</p>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                )}
            </GlassModal>

            {/* FULL-SCREEN EVIDENCE VIEWER */}
            <AnimatePresence>
                {previewImage && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-12">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/98 backdrop-blur-3xl"
                            onClick={() => setPreviewImage(null)}
                        />
                        
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full h-full flex flex-col items-center justify-center"
                        >
                            <button 
                                onClick={() => setPreviewImage(null)}
                                className="absolute top-0 right-0 p-4 text-white/40 hover:text-white transition-colors z-10"
                            >
                                <X className="w-8 h-8" />
                            </button>

                            <div className="relative group w-full h-full flex items-center justify-center">
                                <img 
                                    src={previewImage} 
                                    alt="Evidence Large" 
                                    className="max-w-full max-h-full object-contain shadow-[0_0_100px_rgba(16,185,129,0.1)] rounded-lg"
                                />
                                
                                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-6 px-8 py-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-[24px] opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Evidence_Verified</span>
                                        <span className="text-[8px] font-bold text-[#64748B] uppercase tracking-[0.2em]">Source_Matrix: Secure_Cloud</span>
                                    </div>
                                    <div className="w-px h-6 bg-white/10" />
                                    <a 
                                        href={previewImage} 
                                        download 
                                        className="p-2 hover:bg-white/5 rounded-full text-[#64748B] hover:text-white transition-all"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                    >
                                        <Download className="w-4 h-4" />
                                    </a>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* SET RESOLUTION DEADLINE MODAL */}
            <AnimatePresence>
                {isDeadlineModalOpen && deadlineComplaint && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
                            onClick={() => setIsDeadlineModalOpen(false)}
                        />
                        
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-[#0B0F1A] border border-white/5 w-full max-w-lg rounded-[32px] p-10 relative z-[2001] shadow-2xl overflow-hidden"
                        >
                            {/* Decorative Cursor Icon from Image */}
                            <div className="mb-6 relative">
                                <div className="absolute -top-4 -left-4 w-12 h-12 bg-cyan-500/20 blur-2xl rounded-full opacity-50" />
                                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="relative z-10 text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]">
                                    <path d="M12 2L2 28L12 22L22 28L12 2Z" fill="currentColor" stroke="currentColor" strokeWidth="1" />
                                </svg>
                            </div>

                            <button 
                                onClick={() => setIsDeadlineModalOpen(false)}
                                className="absolute top-8 right-8 p-2 rounded-full border border-white/5 bg-white/5 text-[#475569] hover:text-white hover:border-white/20 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="mb-8">
                                <h3 className="text-3xl font-black text-white tracking-tight leading-tight mb-3 uppercase">
                                    Set Resolution <span className="text-[#F59E0B]">Deadline</span>
                                </h3>
                                <p className="text-sm font-medium text-[#64748B] leading-relaxed">
                                    Set a target date and time by which this complaint should be resolved.
                                </p>
                            </div>

                            {/* Styled Date Input */}
                            <div className="relative group mb-10">
                                <div className="absolute inset-0 bg-[#F59E0B]/5 blur-xl transition-opacity duration-500 opacity-0 group-focus-within:opacity-100" />
                                <div className="relative flex items-center bg-[#07090F] border border-[#F59E0B]/40 rounded-2xl h-16 px-6 focus-within:border-[#F59E0B] transition-all overflow-hidden shadow-inner">
                                    <input 
                                        type="date"
                                        value={localDeadlineValue}
                                        onChange={(e) => setLocalDeadlineValue(e.target.value)}
                                        className="w-full bg-transparent border-none text-white font-bold text-lg focus:outline-none [color-scheme:dark] h-full"
                                    />
                                    <Calendar className="w-5 h-5 text-[#64748B] pointer-events-none" />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-6 pt-4">
                                <button 
                                    onClick={() => setIsDeadlineModalOpen(false)}
                                    className="text-xs font-black text-[#475569] hover:text-white uppercase tracking-[0.2em] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={async () => {
                                        if (localDeadlineValue) {
                                            await setDeadline(deadlineComplaint.id, localDeadlineValue);
                                            showToast('Resolution deadline updated', 'success');
                                            setIsDeadlineModalOpen(false);
                                        } else {
                                            showToast('Please select a valid date', 'error');
                                        }
                                    }}
                                    className="bg-[#F59E0B] hover:bg-[#D97706] text-black h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 active:scale-95"
                                >
                                    Confirm Deadline
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>



            {/* Scanlines Effect */}
            <div className="fixed inset-0 pointer-events-none z-[999] opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]" />
        </div>
    );
};

export default MessAdminPage;
