'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
    UtensilsCrossed, Save, Edit2, X, CheckCircle2, XCircle, 
    Calendar, Users, RotateCcw, Plus, Trash2, Loader2,
    MessageSquare, Clock, Check, Eye, AlertTriangle
} from 'lucide-react';
import { useTickets } from '@/lib/ticket-context';
import { GlassModal } from '@/components/ui/glass-modal';
import { useAuthenticationStatus, useUserData } from '@nhost/react';
import { useDashboardAuth } from '@/hooks/useDashboardAuth';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'snacks', 'dinner'];

interface MenuItem {
    id: string;
    day: string;
    meal_type: string;
    items: string;
    updated_at: string;
}

interface ChangeRequest {
    id: string;
    student_name: string;
    student_email: string;
    day: string;
    meal_type: string;
    current_item: string;
    suggested_item: string;
    status: string;
    admin_notes: string;
    created_at: string;
    updated_at: string;
}

function MessAdminContent() {
    const router = useRouter();

    // Nhost Integration
    const { isAuthorized, isLoading, user, isAuthenticated } = useDashboardAuth({
        allowedRoles: ['mess_admin', 'mess-admin', 'admin', 'developer', 'president']
    });

    // Menu state
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [loadingMenu, setLoadingMenu] = useState(true);
    const [editingDay, setEditingDay] = useState<string | null>(null);
    const [editBuffer, setEditBuffer] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
    const [selectedDay, setSelectedDay] = useState<string>(
        new Date().toLocaleDateString('en-US', { weekday: 'long' })
    );

    // Change requests
    const [changeRequests, setChangeRequests] = useState<ChangeRequest[]>([]);
    const [loadingRequests, setLoadingRequests] = useState(true);
    const [updatingRequestId, setUpdatingRequestId] = useState<string | null>(null);

    // Add new item
    const [addingNew, setAddingNew] = useState(false);
    const [newDay, setNewDay] = useState('');
    const [newMealType, setNewMealType] = useState('');
    const [newItems, setNewItems] = useState('');

    // Complaints logic
    const { tickets, updateTicketStatus, setDeadline } = useTickets();
    const [viewingImage, setViewingImage] = useState<string | null>(null);
    const [deadlineTicketId, setDeadlineTicketId] = useState<string | null>(null);
    const [deadlineValue, setDeadlineValue] = useState<string>('');

    const messComplaints = useMemo(() => tickets.filter(t => 
        t.type === 'Mess' || t.department === 'Mess'
    ), [tickets]);

    const activeMessComplaints = messComplaints.filter(t => t.status !== 'Completed');


    const fetchMenu = useCallback(async () => {
        try {
            setLoadingMenu(true);
            const res = await fetch('/api/v1/nhost/get-mess-menu');
            const data = await res.json();
            if (data.error) {
                console.error('API Error (Menu):', data.error);
                // Only alert if we're not just getting a 401/403 which are handled by middleware/auth
                if (res.status === 500) alert(`Failed to load menu: ${data.error}`);
            } else if (Array.isArray(data)) {
                setMenuItems(data);
            }
        } catch (err) {
            console.error('Failed to fetch menu:', err);
        } finally {
            setLoadingMenu(false);
        }
    }, []);

    const fetchChangeRequests = useCallback(async () => {
        try {
            setLoadingRequests(true);
            const res = await fetch('/api/v1/nhost/get-mess-change-requests');
            const data = await res.json();
            if (data.error) {
                console.error('API Error (Requests):', data.error);
                if (res.status === 500) alert(`Failed to load change requests: ${data.error}`);
            } else if (Array.isArray(data)) {
                setChangeRequests(data);
            }
        } catch (err) {
            console.error('Failed to fetch change requests:', err);
        } finally {
            setLoadingRequests(false);
        }
    }, []);

    useEffect(() => {
        if (isAuthorized) {
            fetchMenu();
            fetchChangeRequests();
        }
    }, [isAuthorized, fetchMenu, fetchChangeRequests]);

    // Helper: get menu item for a day + meal
    const getMenuItem = (day: string, meal: string) => {
        return menuItems.find(m => m.day === day && m.meal_type === meal);
    };

    // Build a map for edit mode
    const getMenuForDay = (day: string): Record<string, string> => {
        const result: Record<string, string> = {};
        MEAL_TYPES.forEach(meal => {
            const item = getMenuItem(day, meal);
            result[meal] = item?.items || '';
        });
        return result;
    };

    const startEditing = (day: string) => {
        setEditingDay(day);
        setEditBuffer(getMenuForDay(day));
    };

    const cancelEditing = () => {
        setEditingDay(null);
        setEditBuffer({});
    };

    const saveEditing = async () => {
        if (!editingDay) return;
        setSaving(true);
        try {
            for (const meal of MEAL_TYPES) {
                if (editBuffer[meal]?.trim()) {
                    await fetch('/api/v1/nhost/upsert-mess-menu', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            day: editingDay,
                            meal_type: meal,
                            items: editBuffer[meal].trim(),
                            updated_by: user?.id
                        })
                    });
                }
            }
            setEditingDay(null);
            setEditBuffer({});
            setSaveSuccess('Menu updated successfully!');
            setTimeout(() => setSaveSuccess(null), 2500);
            await fetchMenu();
        } catch (err) {
            console.error('Save failed:', err);
        } finally {
            setSaving(false);
        }
    };

    const deleteMenuItem = async (id: string) => {
        try {
            await fetch('/api/v1/nhost/delete-mess-menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            setSaveSuccess('Item deleted!');
            setTimeout(() => setSaveSuccess(null), 2000);
            await fetchMenu();
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    const addNewItem = async () => {
        if (!newDay || !newMealType || !newItems.trim()) return;
        setSaving(true);
        try {
            await fetch('/api/v1/nhost/upsert-mess-menu', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    day: newDay,
                    meal_type: newMealType,
                    items: newItems.trim(),
                    updated_by: user?.id
                })
            });
            setAddingNew(false);
            setNewDay('');
            setNewMealType('');
            setNewItems('');
            setSaveSuccess('New item added!');
            setTimeout(() => setSaveSuccess(null), 2000);
            await fetchMenu();
        } catch (err) {
            console.error('Add failed:', err);
        } finally {
            setSaving(false);
        }
    };

    const updateRequestStatus = async (id: string, status: string) => {
        setUpdatingRequestId(id);
        try {
            await fetch('/api/v1/nhost/update-mess-change-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });
            await fetchChangeRequests();
        } catch (err) {
            console.error('Update request failed:', err);
        } finally {
            setUpdatingRequestId(null);
        }
    };

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const pendingRequests = changeRequests.filter(r => r.status === 'pending');
    const dayMealCount = menuItems.length;

    if (isLoading || !isAuthorized) {
        return (
            <div className="min-h-screen bg-[#0B1120] text-white flex flex-col items-center justify-center p-4">
                <div className="flex flex-col items-center space-y-4">
                    <Loader2 className="w-12 h-12 text-[#10b981] animate-spin" />
                    <p className="text-[#64748B] font-mono text-xs uppercase tracking-[0.2em] animate-pulse">Authenticating Command...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B1120] text-white pt-24 md:pt-16 pb-20 font-sans">
            <div className="container mx-auto px-4 lg:px-8 max-w-[1400px]">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 border-b border-white/5 pb-6">
                    <div>
                        <h1 className="text-3xl md:text-[40px] font-extrabold tracking-widest uppercase leading-none font-mono">
                            <span className="text-white">Mess</span> <span className="text-[#10b981]">Admin</span>
                        </h1>
                        <div className="flex items-center gap-4 mt-2">
                            <p className="text-[#64748B] text-[10px] tracking-[0.2em] font-mono uppercase">Mess.Management.Console</p>
                            <Badge variant="outline" className="border-[#10b981]/30 bg-[#10b981]/5 text-[#10b981] rounded-full px-3 py-0.5 text-[8px] font-bold tracking-[0.2em] uppercase flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" /> Active
                            </Badge>
                        </div>
                    </div>
                    <Button
                        onClick={() => setAddingNew(true)}
                        className="bg-[#10b981] hover:bg-[#10b981]/90 text-black font-bold text-xs gap-2 uppercase tracking-widest"
                    >
                        <Plus className="w-3.5 h-3.5" /> Add Menu Item
                    </Button>
                </div>

                {/* Toast */}
                {saveSuccess && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-6 bg-[#10b981]/10 border border-[#10b981]/30 rounded-xl p-4 flex items-center gap-3"
                    >
                        <CheckCircle2 className="w-5 h-5 text-[#10b981]" />
                        <p className="text-sm font-bold text-[#10b981]">{saveSuccess}</p>
                    </motion.div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <Card className="bg-[#0F172A] border-none rounded-xl relative overflow-hidden shadow-lg">
                        <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#10b981] shadow-[0_0_10px_#10b981]" />
                        <CardContent className="p-6 flex justify-between items-end relative pb-8 pt-8">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-3">Menu Items in DB</p>
                                <h3 className="text-4xl font-bold text-white leading-none">{dayMealCount}</h3>
                            </div>
                            <UtensilsCrossed className="w-8 h-8 text-slate-600 mb-1" />
                        </CardContent>
                    </Card>
                    <Card className="bg-[#0F172A] border-none rounded-xl shadow-lg">
                        <CardContent className="p-6 flex justify-between items-end pb-8 pt-8">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-3">Pending Requests</p>
                                <h3 className="text-4xl font-bold text-white leading-none">{pendingRequests.length}</h3>
                            </div>
                            <MessageSquare className="w-8 h-8 text-slate-600 mb-1" />
                        </CardContent>
                    </Card>
                    <Card className="bg-[#0F172A] border-none rounded-xl shadow-lg">
                        <CardContent className="p-6 flex justify-between items-end pb-8 pt-8">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-3">Today</p>
                                <h3 className="text-4xl font-bold text-white leading-none">{today.slice(0, 3).toUpperCase()}</h3>
                            </div>
                            <Calendar className="w-8 h-8 text-slate-600 mb-1" />
                        </CardContent>
                    </Card>
                </div>

                {/* Add New Item Modal */}
                {addingNew && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setAddingNew(false)}>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-[#0F172A] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-6 border-b border-white/10">
                                <h2 className="text-lg font-bold text-white">Add / Update Menu Item</h2>
                                <button onClick={() => setAddingNew(false)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center">
                                    <X className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest mb-2 block">Day</label>
                                    <select value={newDay} onChange={e => setNewDay(e.target.value)} className="w-full bg-[#1A2133] border border-white/10 rounded-xl px-4 py-3 text-sm text-white appearance-none focus:outline-none focus:border-[#10b981]/50">
                                        <option value="" className="bg-[#1A2133]">— Select Day —</option>
                                        {DAYS.map(d => <option key={d} value={d} className="bg-[#1A2133]">{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest mb-2 block">Meal Type</label>
                                    <select value={newMealType} onChange={e => setNewMealType(e.target.value)} className="w-full bg-[#1A2133] border border-white/10 rounded-xl px-4 py-3 text-sm text-white appearance-none focus:outline-none focus:border-[#10b981]/50">
                                        <option value="" className="bg-[#1A2133]">— Select Meal —</option>
                                        {MEAL_TYPES.map(m => <option key={m} value={m} className="bg-[#1A2133] capitalize">{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest mb-2 block">Items</label>
                                    <textarea value={newItems} onChange={e => setNewItems(e.target.value)} placeholder="E.g., Idli, Sambar, Chutney" rows={3} className="w-full bg-[#1A2133] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#475569] focus:outline-none focus:border-[#10b981]/50 resize-none" />
                                </div>
                                <Button onClick={addNewItem} disabled={!newDay || !newMealType || !newItems.trim() || saving} className="w-full bg-[#10b981] hover:bg-[#10b981]/90 text-black font-bold text-xs uppercase tracking-widest gap-2">
                                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                    {saving ? 'Saving...' : 'Add Item'}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                )}

                <Tabs defaultValue="menu" className="space-y-6">
                    <TabsList className="bg-[#0F172A] border border-slate-800 rounded-xl p-1">
                        <TabsTrigger value="menu" className="data-[state=active]:bg-[#10b981]/15 data-[state=active]:text-[#10b981] text-xs font-bold uppercase tracking-widest rounded-lg px-4">
                            <UtensilsCrossed className="w-3.5 h-3.5 mr-2" /> Menu Editor
                        </TabsTrigger>
                        <TabsTrigger value="requests" className="data-[state=active]:bg-[#f59e0b]/15 data-[state=active]:text-[#f59e0b] text-xs font-bold uppercase tracking-widest rounded-lg px-4">
                            <MessageSquare className="w-3.5 h-3.5 mr-2" /> Requests
                            {pendingRequests.length > 0 && (
                                <Badge className="ml-2 bg-[#f59e0b] text-black text-[9px] px-1.5 py-0 rounded-full">{pendingRequests.length}</Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="complaints" className="data-[state=active]:bg-[#0ea5e9]/15 data-[state=active]:text-[#0ea5e9] text-xs font-bold uppercase tracking-widest rounded-lg px-4">
                            <AlertTriangle className="w-3.5 h-3.5 mr-2" /> Complaints
                            {activeMessComplaints.length > 0 && (
                                <Badge className="ml-2 bg-[#0ea5e9] text-black text-[9px] px-1.5 py-0 rounded-full">{activeMessComplaints.length}</Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* ===== MENU EDITOR TAB ===== */}
                    <TabsContent value="menu">
                        <div className="bg-[#0F172A] rounded-xl border border-slate-800 overflow-hidden">
                            {/* Day Tabs */}
                            <div className="border-b border-slate-800 px-4 overflow-x-auto">
                                <div className="flex items-center gap-1 min-w-max py-2">
                                    {DAYS.map(day => {
                                        const hasMeals = menuItems.some(m => m.day === day);
                                        return (
                                            <button
                                                key={day}
                                                onClick={() => setSelectedDay(day)}
                                                className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                                                    selectedDay === day
                                                        ? 'bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30'
                                                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                                                } ${day === today ? 'ring-1 ring-[#10b981]/20' : ''}`}
                                            >
                                                {day.slice(0, 3)}
                                                {day === today && <span className="ml-1.5 text-[8px]">●</span>}
                                                {!hasMeals && <span className="ml-1 text-red-400 text-[8px]">○</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {loadingMenu ? (
                                <div className="p-12 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-[#10b981] animate-spin" />
                                    <span className="ml-3 text-sm text-slate-400">Loading menu...</span>
                                </div>
                            ) : (
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <h2 className="text-xl font-bold text-white">{selectedDay}</h2>
                                            {selectedDay === today && (
                                                <Badge className="bg-[#10b981] text-black text-[9px] font-bold px-2 py-0.5 rounded-full">TODAY</Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {editingDay === selectedDay ? (
                                                <>
                                                    <Button size="sm" variant="outline" onClick={cancelEditing} className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs gap-1.5">
                                                        <X className="w-3 h-3" /> Cancel
                                                    </Button>
                                                    <Button size="sm" onClick={saveEditing} disabled={saving} className="bg-[#10b981] hover:bg-[#10b981]/90 text-black font-bold text-xs gap-1.5">
                                                        {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                                        {saving ? 'Saving...' : 'Save Changes'}
                                                    </Button>
                                                </>
                                            ) : (
                                                <Button size="sm" onClick={() => startEditing(selectedDay)} className="bg-[#f59e0b] hover:bg-[#f59e0b]/90 text-black font-bold text-xs gap-1.5">
                                                    <Edit2 className="w-3 h-3" /> Edit Menu
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {MEAL_TYPES.map(meal => {
                                            const item = getMenuItem(selectedDay, meal);
                                            return (
                                                <div key={meal} className={`rounded-xl border p-5 transition-all ${editingDay === selectedDay ? 'bg-[#1A2133] border-[#f59e0b]/20' : 'bg-[#1A2133] border-white/5 hover:border-white/10'}`}>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-2 h-2 rounded-full ${meal === 'breakfast' ? 'bg-amber-400' : meal === 'lunch' ? 'bg-orange-500' : meal === 'snacks' ? 'bg-cyan-400' : 'bg-indigo-400'}`} />
                                                            <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest">{meal}</p>
                                                        </div>
                                                        {item && editingDay !== selectedDay && (
                                                            <button onClick={() => deleteMenuItem(item.id)} className="text-red-400/50 hover:text-red-400 transition-colors" title="Delete">
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                    {editingDay === selectedDay ? (
                                                        <textarea
                                                            value={editBuffer[meal] || ''}
                                                            onChange={e => setEditBuffer(prev => ({ ...prev, [meal]: e.target.value }))}
                                                            rows={3}
                                                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#475569] focus:outline-none focus:border-[#f59e0b]/50 transition-all resize-none"
                                                        />
                                                    ) : (
                                                        <p className="text-sm text-[#94a3b8] leading-relaxed">{item?.items || <span className="italic text-[#475569]">No menu set</span>}</p>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Full Week Overview */}
                            <div className="border-t border-slate-800">
                                <div className="p-6 border-b border-slate-800">
                                    <h2 className="text-lg font-bold text-white tracking-tight">Full Week Overview</h2>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[700px]">
                                        <thead>
                                            <tr className="border-b border-slate-800">
                                                <th className="text-left p-4 text-[10px] text-[#64748B] font-bold uppercase tracking-widest">Day</th>
                                                {MEAL_TYPES.map(meal => (
                                                    <th key={meal} className="text-left p-4 text-[10px] text-[#64748B] font-bold uppercase tracking-widest">{meal}</th>
                                                ))}
                                                <th className="text-center p-4 text-[10px] text-[#64748B] font-bold uppercase tracking-widest">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {DAYS.map(day => (
                                                <tr key={day} className={`border-b border-slate-800/50 hover:bg-white/[0.02] transition-colors ${day === today ? 'bg-[#10b981]/5' : ''}`}>
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-sm font-bold ${day === today ? 'text-[#10b981]' : 'text-white'}`}>{day.slice(0, 3)}</span>
                                                            {day === today && <div className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />}
                                                        </div>
                                                    </td>
                                                    {MEAL_TYPES.map(meal => {
                                                        const item = getMenuItem(day, meal);
                                                        return (
                                                            <td key={meal} className="p-4">
                                                                <p className="text-xs text-[#94a3b8] leading-relaxed max-w-[200px]">{item?.items || <span className="italic text-[#475569]">—</span>}</p>
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="p-4 text-center">
                                                        <button onClick={() => { setSelectedDay(day); startEditing(day); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-[10px] text-[#f59e0b] hover:text-[#f59e0b]/80 font-bold uppercase tracking-widest transition-colors">
                                                            Edit
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ===== CHANGE REQUESTS TAB ===== */}
                    <TabsContent value="requests">
                        <div className="bg-[#0F172A] rounded-xl border border-slate-800 overflow-hidden">
                            <div className="p-6 border-b border-slate-800">
                                <h2 className="text-lg font-bold text-white tracking-tight">Student Change Requests</h2>
                                <p className="text-xs text-[#64748B] mt-1">Review and manage menu change suggestions from students</p>
                            </div>

                            {loadingRequests ? (
                                <div className="p-12 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-[#f59e0b] animate-spin" />
                                    <span className="ml-3 text-sm text-slate-400">Loading requests...</span>
                                </div>
                            ) : changeRequests.length === 0 ? (
                                <div className="p-12 text-center">
                                    <MessageSquare className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                                    <p className="text-sm text-slate-400">No change requests yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-800/50">
                                    {changeRequests.map(req => (
                                        <div key={req.id} className="p-5 hover:bg-white/[0.02] transition-colors">
                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                                            req.status === 'pending' ? 'bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/30' :
                                                            req.status === 'approved' ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30' :
                                                            'bg-red-500/10 text-red-400 border border-red-500/30'
                                                        }`}>
                                                            {req.status}
                                                        </Badge>
                                                        <span className="text-[10px] text-[#64748B] font-mono">{req.day} • {req.meal_type}</span>
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <div>
                                                            <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest">Current: </span>
                                                            <span className="text-xs text-[#94a3b8]">{req.current_item || '—'}</span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] text-[#10b981] font-bold uppercase tracking-widest">Suggested: </span>
                                                            <span className="text-xs text-white font-medium">{req.suggested_item}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-2 text-[10px] text-[#475569]">
                                                        <span>{req.student_name || req.student_email || 'Anonymous'}</span>
                                                        <span>•</span>
                                                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(req.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                                
                                                {req.status === 'pending' && (
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <Button
                                                            size="sm"
                                                            onClick={() => updateRequestStatus(req.id, 'approved')}
                                                            disabled={updatingRequestId === req.id}
                                                            className="bg-[#10b981] hover:bg-[#10b981]/90 text-black font-bold text-[10px] gap-1 h-8"
                                                        >
                                                            {updatingRequestId === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Approve
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => updateRequestStatus(req.id, 'rejected')}
                                                            disabled={updatingRequestId === req.id}
                                                            className="border-red-500/30 text-red-400 hover:bg-red-500/10 font-bold text-[10px] gap-1 h-8"
                                                        >
                                                            <XCircle className="w-3 h-3" /> Reject
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* ===== COMPLAINTS TAB ===== */}
                    <TabsContent value="complaints">
                        <div className="bg-[#0F172A] rounded-xl border border-slate-800 overflow-hidden">
                            <div className="p-6 border-b border-slate-800">
                                <h2 className="text-lg font-bold text-white tracking-tight">Mess Complaints</h2>
                                <p className="text-xs text-[#64748B] mt-1">Direct feedback and issues reported by students regarding mess facilities</p>
                            </div>

                            {messComplaints.length === 0 ? (
                                <div className="p-12 text-center text-slate-400">
                                    <AlertTriangle className="w-8 h-8 text-slate-600 mx-auto mb-3 opacity-20" />
                                    <p className="text-sm">No complaints logged for mess category</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-800/30">
                                    {messComplaints.map(ticket => (
                                        <div key={ticket.id} className="p-6 hover:bg-white/[0.01] transition-colors">
                                            <div className="flex flex-col lg:flex-row gap-6">
                                                <div className="flex-1 space-y-3">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <Badge className={`${
                                                            ticket.priority === 'High' ? 'bg-red-500/20 text-red-500 border-red-500/10' : 
                                                            ticket.priority === 'Medium' ? 'bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/10' : 
                                                            'bg-emerald-500/20 text-emerald-500 border-emerald-500/10'
                                                        } border text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full`}>
                                                            {ticket.priority} Priority
                                                        </Badge>
                                                        <Badge variant="outline" className={`${
                                                            ticket.status === 'Completed' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5' :
                                                            ticket.status === 'In Progress' ? 'border-[#0ea5e9]/30 text-[#0ea5e9] bg-[#0ea5e9]/5' :
                                                            'border-slate-500/30 text-slate-400'
                                                        } rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider`}>
                                                            {ticket.status}
                                                        </Badge>
                                                        <span className="text-[10px] text-[#475569] font-mono">#{ticket.id.split('-')[0]}</span>
                                                        {ticket.dueAt && (
                                                            <Badge variant="outline" className={`${
                                                                new Date(ticket.dueAt).getTime() < Date.now() 
                                                                    ? 'border-red-500 text-red-500 bg-red-500/10' 
                                                                    : 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
                                                            } rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 animate-pulse`}>
                                                                <Clock className="w-3 h-3" />
                                                                {new Date(ticket.dueAt).getTime() < Date.now() ? 'Overdue' : `Due ${new Date(ticket.dueAt).toLocaleDateString()}`}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <div>
                                                        <h3 className="text-base font-bold text-white mb-1">{ticket.subject}</h3>
                                                        <p className="text-sm text-[#94a3b8] leading-relaxed italic line-clamp-2">"{ticket.description}"</p>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-4 text-[10px] text-[#64748B] pt-2 font-bold tracking-widest uppercase">
                                                        <div className="flex items-center gap-1.5">
                                                            <Users className="w-3.5 h-3.5 text-[#10b981]" />
                                                            <span className="text-slate-300">{ticket.studentName}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="lg:w-48 flex flex-col justify-center gap-2">
                                                    {ticket.status !== 'Completed' && (
                                                        <>
                                                            <Button 
                                                                size="sm" 
                                                                className={`h-8 font-bold text-[10px] uppercase tracking-wider ${ticket.status === 'In Progress' ? 'bg-[#0ea5e9] text-black hover:bg-[#0ea5e9]/90' : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'}`}
                                                                onClick={() => updateTicketStatus(ticket.id, 'In Progress')}
                                                            >
                                                                {ticket.status === 'In Progress' ? 'Update Note' : 'In Progress'}
                                                            </Button>
                                                            <Button 
                                                                size="sm" 
                                                                className="h-8 font-bold text-[10px] uppercase tracking-wider bg-[#10b981] text-black hover:bg-[#10b981]/90"
                                                                onClick={() => updateTicketStatus(ticket.id, 'Completed')}
                                                            >
                                                                Resolve
                                                            </Button>
                                                        </>
                                                    )}
                                                    {ticket.image && (
                                                        <Button 
                                                            variant="ghost" 
                                                            size="sm" 
                                                            className="h-8 text-[10px] text-[#10b981] hover:bg-[#10b981]/10 uppercase font-bold tracking-widest"
                                                            onClick={() => setViewingImage(ticket.image!)}
                                                        >
                                                            <Eye className="w-3.5 h-3.5 mr-2" /> Evidence
                                                        </Button>
                                                    )}
                                                    <Button 
                                                        size="sm" 
                                                        className="h-8 font-bold text-[10px] uppercase tracking-wider bg-white/5 text-[#f59e0b] hover:bg-[#f59e0b]/10 border border-[#f59e0b]/20"
                                                        onClick={() => {
                                                            setDeadlineTicketId(ticket.id);
                                                            setDeadlineValue(ticket.dueAt ? new Date(ticket.dueAt).toISOString().slice(0, 10) : '');
                                                        }}
                                                    >
                                                        <Clock className="w-3 h-3 mr-1" />
                                                        {ticket.dueAt ? 'Edit Deadline' : 'Set Deadline'}
                                                    </Button>
                                                    {ticket.status === 'Completed' && (
                                                        <div className="flex items-center justify-center gap-1.5 text-emerald-500 font-bold text-[10px] uppercase tracking-widest py-2 bg-emerald-500/5 rounded-lg border border-emerald-500/10">
                                                            <CheckCircle2 className="w-3.5 h-3.5" /> Resolved
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                {/* Evidence Modal */}
                <GlassModal
                    isOpen={!!viewingImage}
                    onClose={() => setViewingImage(null)}
                    title="Complaint Attachment"
                    footer={
                        <Button onClick={() => setViewingImage(null)} className="w-full bg-[#1A2133] text-white border border-white/10 hover:bg-white/5 font-bold uppercase tracking-widest text-xs h-12">
                            Close
                        </Button>
                    }
                >
                    <div className="flex justify-center items-center bg-black/40 rounded-2xl overflow-hidden border border-white/5 p-1">
                        {viewingImage && (
                            <img 
                                src={viewingImage} 
                                alt="Complaint Evidence" 
                                className="max-w-full max-h-[75vh] object-contain" 
                            />
                        )}
                    </div>
                </GlassModal>

                {/* Set Deadline Modal */}
                <GlassModal
                    isOpen={!!deadlineTicketId}
                    onClose={() => { setDeadlineTicketId(null); setDeadlineValue(''); }}
                    title="Set Resolution Deadline"
                    footer={
                        <div className="flex justify-end gap-3 w-full p-2">
                            <Button 
                                variant="ghost" 
                                onClick={() => { setDeadlineTicketId(null); setDeadlineValue(''); }}
                                className="text-[#64748B] hover:text-white font-bold uppercase tracking-widest text-[10px]"
                            >
                                Cancel
                            </Button>
                            <Button 
                                className="bg-[#f59e0b] text-black hover:bg-[#f59e0b]/90 font-bold uppercase tracking-widest text-[10px] px-6"
                                onClick={() => {
                                    if (!deadlineValue || !deadlineTicketId) return;
                                    setDeadline(deadlineTicketId, new Date(deadlineValue).toISOString());
                                    setDeadlineTicketId(null);
                                    setDeadlineValue('');
                                }}
                                disabled={!deadlineValue}
                            >
                                Confirm Deadline
                            </Button>
                        </div>
                    }
                >
                    <div className="py-2 space-y-4">
                        <p className="text-xs text-[#94a3b8] font-medium leading-relaxed">
                            Set a target date and time by which this complaint should be resolved.
                        </p>
                        <input 
                            type="date"
                            value={deadlineValue}
                            onChange={(e) => setDeadlineValue(e.target.value)}
                            className="w-full bg-[#0B0B14] border border-white/10 rounded-2xl px-5 py-4 text-sm text-white focus:outline-none focus:border-[#f59e0b]/50 transition-all [color-scheme:dark]"
                            min={new Date().toISOString().slice(0, 10)}
                            autoFocus
                        />
                    </div>
                </GlassModal>

            </div>
        </div>
    );
}

export default function MessAdminDashboard() {
    return <MessAdminContent />;
}
