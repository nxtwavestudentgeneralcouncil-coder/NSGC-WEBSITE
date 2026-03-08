'use client';

import { useState, useEffect } from 'react';
import { Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User,
    Shield,
    Bell,
    Monitor,
    LogOut,
    Camera,
    Moon,
    Sun,
    ChevronRight,
    Save
} from 'lucide-react';
import { useUserData, useSignOut } from '@nhost/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'appearance';

function SettingsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [isLoading, setIsLoading] = useState(false);

    // Nhost Integration
    const user = useUserData();
    const { signOut } = useSignOut();

    // UI State
    const [profile, setProfile] = useState({
        name: user?.displayName || 'Loading...',
        email: user?.email || 'Loading...',
        bio: 'Computer Science Major | Class of 2026',
        phone: '+91 98765 43210'
    });

    const [notifications, setNotifications] = useState({
        announcements: true,
        events: true,
        messages: false
    });

    const [is2FAEnabled, setIs2FAEnabled] = useState(false);


    useEffect(() => {
        // Sync profile state when user data loads
        if (user) {
            setProfile(prev => ({ 
                ...prev, 
                name: user.displayName || 'Student',
                email: user.email || ''
            }));
        }

        // Set active tab from URL query param if present
        const tab = searchParams.get('tab');
        if (tab && ['profile', 'security', 'notifications', 'appearance'].includes(tab)) {
            setActiveTab(tab as SettingsTab);
        }
    }, [searchParams, user]);

    const handleLogout = async () => {
        setIsLoading(true);
        await signOut();
        router.push('/login');
    };

    const handleSaveProfile = () => {
        setIsLoading(true);
        // Note: Actual Nhost profile updates require a GraphQL mutation, omitting for UI stub
        setTimeout(() => {
            setIsLoading(false);
        }, 1000);
    };

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'appearance', label: 'Appearance', icon: Monitor },
    ];

    return (
        <div className="min-h-screen bg-black text-white pt-24 pb-20">
            <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl md:text-4xl font-bold mb-8">Settings</h1>

                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Sidebar */}
                        <aside className="w-full md:w-64 flex-shrink-0">
                            <Card className="bg-white/5 border-white/10 overflow-hidden sticky top-24">
                                <nav className="flex flex-col p-2 space-y-1">
                                    {tabs.map((tab) => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as SettingsTab)}
                                            className={cn(
                                                "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200",
                                                activeTab === tab.id
                                                    ? "bg-cyan-500 text-black shadow-lg"
                                                    : "text-gray-400 hover:text-white hover:bg-white/5"
                                            )}
                                        >
                                            <tab.icon className="w-4 h-4" />
                                            {tab.label}
                                            {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto" />}
                                        </button>
                                    ))}

                                    <div className="h-px bg-white/10 my-2 mx-4" />

                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors w-full text-left"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        {isLoading ? 'Logging out...' : 'Log Out'}
                                    </button>
                                </nav>
                            </Card>
                        </aside>

                        {/* Main Content */}
                        <main className="flex-1">
                            <Card className="bg-white/5 border-white/10 min-h-[500px]">
                                <CardHeader>
                                    <CardTitle className="text-2xl capitalize">{activeTab}</CardTitle>
                                    <CardDescription>Manage your {activeTab} settings</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={activeTab}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -20 }}
                                            transition={{ duration: 0.2 }}
                                        >

                                            {/* --- PROFILE TAB --- */}
                                            {activeTab === 'profile' && (
                                                <div className="space-y-6">
                                                    <div className="flex items-center gap-6 mb-8">
                                                        <div className="w-24 h-24 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-500 text-3xl font-bold relative group cursor-pointer overflow-hidden">
                                                            {profile.name.charAt(0)}
                                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Camera className="w-6 h-6 text-white" />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-xl font-bold">{profile.name}</h3>
                                                            <p className="text-gray-400">Student</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid gap-4 max-w-xl">
                                                        <div className="space-y-2">
                                                            <Label>Full Name</Label>
                                                            <Input
                                                                value={profile.name}
                                                                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                                                className="bg-black/50 border-white/10 text-white"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Email</Label>
                                                            <Input
                                                                value={profile.email}
                                                                disabled
                                                                className="bg-black/20 border-white/10 text-gray-400 cursor-not-allowed"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Bio</Label>
                                                            <Input
                                                                value={profile.bio}
                                                                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                                                className="bg-black/50 border-white/10 text-white"
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>Phone</Label>
                                                            <Input
                                                                value={profile.phone}
                                                                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                                                                className="bg-black/50 border-white/10 text-white"
                                                            />
                                                        </div>

                                                        <Button onClick={handleSaveProfile} className="mt-4 bg-cyan-500 text-black hover:bg-cyan-400 w-fit" disabled={isLoading}>
                                                            <Save className="w-4 h-4 mr-2" />
                                                            {isLoading ? 'Saving...' : 'Save Changes'}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* --- SECURITY TAB --- */}
                                            {activeTab === 'security' && (
                                                <div className="space-y-8 max-w-xl">
                                                    <div className="space-y-4">
                                                        <h3 className="text-lg font-medium border-b border-white/10 pb-2">Change Password</h3>
                                                        <div className="space-y-2">
                                                            <Label>Current Password</Label>
                                                            <Input type="password" placeholder="••••••••" className="bg-black/50 border-white/10 text-white" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label>New Password</Label>
                                                            <Input type="password" placeholder="••••••••" className="bg-black/50 border-white/10 text-white" />
                                                        </div>
                                                        <Button variant="outline" className="border-white/10 hover:bg-white/5">Update Password</Button>
                                                    </div>

                                                    <div className="space-y-4">
                                                        <h3 className="text-lg font-medium border-b border-white/10 pb-2">Two-Factor Authentication</h3>
                                                        <div className="flex items-center justify-between">
                                                            <div className="space-y-0.5">
                                                                <Label className="text-base">Enable 2FA</Label>
                                                                <p className="text-sm text-gray-400">Add an extra layer of security to your account.</p>
                                                            </div>
                                                            <Switch
                                                                checked={is2FAEnabled}
                                                                onCheckedChange={setIs2FAEnabled}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* --- NOTIFICATIONS TAB --- */}
                                            {activeTab === 'notifications' && (
                                                <div className="space-y-6 max-w-xl">
                                                    <div className="flex items-center justify-between py-4 border-b border-white/10">
                                                        <div className="space-y-0.5">
                                                            <Label className="text-base">Announcements</Label>
                                                            <p className="text-sm text-gray-400">Receive emails about new council announcements.</p>
                                                        </div>
                                                        <Switch
                                                            checked={notifications.announcements}
                                                            onCheckedChange={(c: boolean) => setNotifications({ ...notifications, announcements: c })}
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between py-4 border-b border-white/10">
                                                        <div className="space-y-0.5">
                                                            <Label className="text-base">Event Reminders</Label>
                                                            <p className="text-sm text-gray-400">Get notified 24h before registered events.</p>
                                                        </div>
                                                        <Switch
                                                            checked={notifications.events}
                                                            onCheckedChange={(c: boolean) => setNotifications({ ...notifications, events: c })}
                                                        />
                                                    </div>
                                                    <div className="flex items-center justify-between py-4 border-b border-white/10">
                                                        <div className="space-y-0.5">
                                                            <Label className="text-base">Direct Messages</Label>
                                                            <p className="text-sm text-gray-400">Receive notifications for new messages.</p>
                                                        </div>
                                                        <Switch
                                                            checked={notifications.messages}
                                                            onCheckedChange={(c: boolean) => setNotifications({ ...notifications, messages: c })}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* --- APPEARANCE TAB --- */}
                                            {activeTab === 'appearance' && (
                                                <div className="space-y-8 max-w-xl">
                                                    <div className="space-y-4">
                                                        <h3 className="text-lg font-medium border-b border-white/10 pb-2">Theme Preference</h3>
                                                        <p className="text-sm text-gray-400 mb-4">
                                                            Customize how NSGC looks on your device.
                                                        </p>
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="border border-cyan-500 rounded-lg p-4 bg-black/50 cursor-pointer flex flex-col items-center gap-2">
                                                                <div className="w-full h-20 bg-black rounded border border-white/10 flex items-center justify-center">
                                                                    <Moon className="w-6 h-6 text-cyan-500" />
                                                                </div>
                                                                <span className="font-medium text-cyan-500">Dark Mode</span>
                                                            </div>
                                                            <div className="border border-white/10 rounded-lg p-4 bg-white/5 cursor-not-allowed opacity-50 flex flex-col items-center gap-2">
                                                                <div className="w-full h-20 bg-white rounded border border-gray-200 flex items-center justify-center">
                                                                    <Sun className="w-6 h-6 text-black" />
                                                                </div>
                                                                <span className="font-medium">Light Mode (Coming Soon)</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                        </motion.div>
                                    </AnimatePresence>
                                </CardContent>
                            </Card>
                        </main>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black text-white pt-24 pb-20 flex items-center justify-center">Loading settings...</div>}>
            <SettingsContent />
        </Suspense>
    );
}
