'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, ChevronDown, CloudUpload, Clock, FileText, Send, Search, Lock, Camera, X, Image as ImageIcon, Upload, Users, Globe, PlusSquare, ThumbsUp } from 'lucide-react';
import { useTickets, TicketProvider } from '@/lib/ticket-context';
import { useAuthenticationStatus, useUserData } from '@nhost/react';
import { useRef } from 'react';

const SUBJECT_OPTIONS: Record<string, string[]> = {
    Academic: ['Course Content', 'Exam Schedule', 'Faculty Feedback', 'Lab Equipment', 'Resource Accessibility'],
    Hostel: ['Room Maintenance', 'Water Supply', 'Electricity', 'Security', 'Cleanliness'],
    Mess: ['Food Quality', 'Menu Variety', 'Hygiene Standards', 'Token Issues', 'Timings']
};

function ComplaintsContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { createTicket, updateTicketContent, tickets, upvoteTicket } = useTickets();
    const [activeTab, setActiveTab] = useState<'submit' | 'track' | 'details' | 'community'>('submit');
    const [complaintId, setComplaintId] = useState('');
    const [trackingResult, setTrackingResult] = useState<any>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form State
    const [formData, setFormData] = useState({
        category: '',
        subject: '',
        otherSubject: '',
        description: '',
        hostelType: '',
        roomNumber: '',
        dateOfIncident: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedId, setSubmittedId] = useState<string | null>(null);
    const [editId, setEditId] = useState<string | null>(null);
    const [showUpdateSuccess, setShowUpdateSuccess] = useState(false);

    // Photo State
    const [image, setImage] = useState<string | null>(null);
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const { isAuthenticated, isLoading: authLoading } = useAuthenticationStatus();
    const user = useUserData();

    useEffect(() => {
        // Hydrate the login state using Nhost auth status
        setIsLoggedIn(isAuthenticated);
        setLoading(authLoading);
    }, [isAuthenticated, authLoading]);

    // Check for track, view or edit param
    useEffect(() => {
        const trackId = searchParams.get('track');
        const viewId = searchParams.get('view');
        const editParamId = searchParams.get('edit');

        if (editParamId && tickets.length > 0) {
            const foundTicket = tickets.find(t => t.id === editParamId);
            if (foundTicket) {
                setActiveTab('submit');
                setEditId(foundTicket.id);
                let cleanDescription = foundTicket.description || '';
                let extractedDate = '';
                const dateMatch = cleanDescription.match(/^\[Date of Incident: (.*?)\]\n\n/);
                if (dateMatch) {
                    extractedDate = dateMatch[1];
                    cleanDescription = cleanDescription.replace(dateMatch[0], '');
                }

                setFormData({
                    category: foundTicket.type,
                    subject: foundTicket.subject || '',
                    otherSubject: '',
                    description: cleanDescription,
                    hostelType: '', // Or extract from description if possible, but keeping it empty for now
                    roomNumber: '',
                    dateOfIncident: extractedDate
                });
                setImage(foundTicket.image || null);
            }
        } else if (viewId && tickets.length > 0) {
            const foundTicket = tickets.find(t => t.id === viewId);
            if (foundTicket) {
                setActiveTab('details');
                setTrackingResult({
                    id: foundTicket.id,
                    status: foundTicket.status,
                    date: new Date(foundTicket.createdAt).toLocaleDateString(),
                    title: foundTicket.type,
                    subject: foundTicket.subject,
                    department: foundTicket.department,
                    description: foundTicket.description,
                    timeline: foundTicket.timeline,
                    image: foundTicket.image
                });
            }
        } else if (trackId && tickets.length > 0) {
            const foundTicket = tickets.find(t => t.id === trackId);
            if (foundTicket) {
                setActiveTab('track');
                setComplaintId(trackId);
                setTrackingResult({
                    id: foundTicket.id,
                    status: foundTicket.status,
                    date: new Date(foundTicket.createdAt).toLocaleDateString(),
                    title: foundTicket.type,
                    subject: foundTicket.subject,
                    department: foundTicket.department,
                    description: foundTicket.description,
                    timeline: foundTicket.timeline,
                    image: foundTicket.image
                });
            }
        }
    }, [searchParams, tickets]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name === 'category') {
            setFormData(prev => ({ 
                ...prev, 
                category: value, 
                subject: '', 
                otherSubject: '', 
                hostelType: '', 
                roomNumber: '',
                dateOfIncident: ''
            }));
            return;
        }

        if (name === 'subject') {
            setFormData(prev => ({ 
                ...prev, 
                subject: value, 
                otherSubject: '' 
            }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Camera & Image Handlers
    const startCamera = async () => {
        try {
            setIsCameraOpen(true);
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access camera. Please check permissions.");
            setIsCameraOpen(false);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setIsCameraOpen(false);
    };

    const capturePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                // Set canvas dimensions to match video
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                const dataUrl = canvasRef.current.toDataURL('image/jpeg');
                setImage(dataUrl);
                stopCamera();
            }
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                alert("File size too large. Max 5MB.");
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removePhoto = () => {
        setImage(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Basic validation
            if (!formData.category || !formData.subject || !formData.description) {
                alert('Please fill in all required fields'); // Ideally use toast
                setIsSubmitting(false);
                return;
            }

            // Hostel specific validation
            if (formData.category === 'Hostel') {
                if (!formData.hostelType || !formData.roomNumber) {
                    alert('Please provide Hostel Type and Room Number');
                    setIsSubmitting(false);
                    return;
                }
                if (!image) {
                    alert('Evidence/Photo is mandatory for Hostel complaints');
                    setIsSubmitting(false);
                    return;
                }
            }

            if (editId) {
                const finalSubject = formData.subject === 'Other' ? formData.otherSubject : formData.subject;
                
                const metadata = user?.metadata as any;
                const phoneStr = metadata?.phone ? metadata.phone : '';
                const genderStr = metadata?.gender ? metadata.gender : '';
                const extras = [phoneStr, genderStr].filter(Boolean).join(', ');
                const studentNameString = extras ? `${user?.displayName || 'Student'} (${extras})` : user?.displayName || 'Student';

                const compiledDescription = formData.dateOfIncident 
                    ? `[Date of Incident: ${formData.dateOfIncident}]\n\n${formData.description}`
                    : formData.description;

                updateTicketContent(editId, {
                    studentName: studentNameString,
                    email: user?.email || 'student@email.com',
                    department: formData.category,
                    type: formData.category,
                    subject: finalSubject,
                    description: compiledDescription,
                    image: image || undefined,
                    hostelType: formData.category === 'Hostel' ? formData.hostelType : undefined,
                    roomNumber: formData.category === 'Hostel' ? formData.roomNumber : undefined
                });

                // Show success modal
                setShowUpdateSuccess(true);
                // Reset edit state but keep modal open until user navigates
                setEditId(null);
                setFormData({
                    category: '',
                    subject: '',
                    otherSubject: '',
                    description: '',
                    hostelType: '',
                    roomNumber: '',
                    dateOfIncident: ''
                });

            } else {
                const finalSubject = formData.subject === 'Other' ? formData.otherSubject : formData.subject;

                const metadata = user?.metadata as any;
                const phoneStr = metadata?.phone ? metadata.phone : '';
                const genderStr = metadata?.gender ? metadata.gender : '';
                const extras = [phoneStr, genderStr].filter(Boolean).join(', ');
                const studentNameString = extras ? `${user?.displayName || 'Student'} (${extras})` : user?.displayName || 'Student';

                const compiledDescription = formData.dateOfIncident 
                    ? `[Date of Incident: ${formData.dateOfIncident}]\n\n${formData.description}`
                    : formData.description;

                const newId = createTicket({
                    studentName: studentNameString,
                    email: user?.email || 'student@email.com',
                    department: formData.category,
                    type: formData.category,
                    subject: finalSubject,
                    description: compiledDescription,
                    priority: 'Medium', // Default priority
                    proofUrl: '',
                    image: image || undefined,
                    hostelType: formData.category === 'Hostel' ? formData.hostelType : undefined,
                    roomNumber: formData.category === 'Hostel' ? formData.roomNumber : undefined
                });

                // Set submitted ID to show success message
                setSubmittedId(newId);

                // Reset form
                setFormData({
                    category: '',
                    subject: '',
                    otherSubject: '',
                    description: '',
                    hostelType: '',
                    roomNumber: '',
                    dateOfIncident: ''
                });
            }

        } catch (error) {
            console.error('Failed to submit complaint', error);
            alert('Failed to submit complaint. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleTrack = (e: React.FormEvent) => {
        e.preventDefault();
        const foundTicket = tickets.find(t => t.id === complaintId);

        if (foundTicket) {
            setTrackingResult({
                id: foundTicket.id,
                status: foundTicket.status,
                date: new Date(foundTicket.createdAt).toLocaleDateString(),
                title: foundTicket.type, // Mapping category/type to title for display
                subject: foundTicket.subject,
                department: foundTicket.department,
                description: foundTicket.description,
                timeline: foundTicket.timeline,
                image: foundTicket.image
            });
        } else {
            setTrackingResult(null);
            alert('Complaint ID not found.');
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
            </div>
        );
    }

    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
                <Card className="w-full max-w-md bg-white/5 border-white/10">
                    <CardHeader className="text-center">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-8 h-8 text-cyan-500" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Authentication Required</CardTitle>
                        <CardDescription>
                            You must be logged in to submit or track complaints.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/login">
                            <Button className="w-full bg-cyan-500 text-black hover:bg-cyan-400 font-bold">
                                Login to Continue
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white pt-24 md:pt-16 pb-20 font-sans selection:bg-cyan-500/30">
            <div className="container mx-auto px-4 max-w-5xl">

                <div className="text-center mb-10">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-3 tracking-tight">Student Grievance Redressal</h1>
                    <p className="text-[#64748B] text-lg">We are here to listen and resolve your concerns efficiently.</p>
                </div>

                {/* Tabs */}
                <div className="flex justify-center mb-16">
                    <div className="bg-[#0d1321] border border-white/5 p-1.5 rounded-2xl inline-flex overflow-x-auto max-w-full shadow-2xl">
                        <button
                            onClick={() => setActiveTab('submit')}
                            className={`px-5 sm:px-8 py-2.5 rounded-xl text-[15px] font-bold tracking-wide transition-all duration-300 flex items-center gap-2.5 whitespace-nowrap ${activeTab === 'submit'
                                ? 'bg-[#0e7490]/20 text-[#22d3ee] shadow-sm'
                                : 'text-[#64748B] hover:text-white'
                                }`}
                        >
                            <PlusSquare className="w-[18px] h-[18px]" strokeWidth={2.5} />
                            Submit Complaint
                        </button>
                        <button
                            onClick={() => setActiveTab('track')}
                            className={`px-5 sm:px-8 py-2.5 rounded-xl text-[15px] font-bold tracking-wide transition-all duration-300 flex items-center gap-2.5 whitespace-nowrap ${activeTab === 'track'
                                ? 'bg-[#0e7490]/20 text-[#22d3ee] shadow-sm'
                                : 'text-[#64748B] hover:text-white'
                                }`}
                        >
                            <Search className="w-[18px] h-[18px]" strokeWidth={2.5} />
                            Track Status
                        </button>
                        <button
                            onClick={() => setActiveTab('community')}
                            className={`px-5 sm:px-8 py-2.5 rounded-xl text-[15px] font-bold tracking-wide transition-all duration-300 flex items-center gap-2.5 whitespace-nowrap ${activeTab === 'community'
                                ? 'bg-[#0e7490]/20 text-[#22d3ee] shadow-sm'
                                : 'text-[#64748B] hover:text-white'
                                }`}
                        >
                            <Globe className="w-[18px] h-[18px]" strokeWidth={2.5} />
                            Community
                        </button>
                    </div>
                </div>

                {/* Content */}
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeTab === 'submit' && (
                        <Card className="bg-white/5 border-white/10">
                            <CardHeader>
                                <CardTitle>{editId ? 'Edit Complaint' : 'New Complaint'}</CardTitle>
                                <CardDescription>{editId ? 'Update your complaint details below.' : 'Please provide detailed information to help us resolve the issue faster.'}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {submittedId ? (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center space-y-4"
                                    >
                                        <div className="w-16 h-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto">
                                            <CheckCircle2 className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white">Complaint Submitted!</h3>
                                        <p className="text-gray-300">
                                            Your complaint has been registered successfully. You can track its status using the Ticket ID below.
                                        </p>
                                        <div className="bg-black/50 p-4 rounded-md border border-white/10 inline-block">
                                            <span className="text-gray-400 text-sm block mb-1">Ticket ID</span>
                                            <span className="text-2xl font-mono text-cyan-500 font-bold tracking-wider">{submittedId}</span>
                                        </div>
                                        <div className="pt-4 flex gap-4 justify-center">
                                            <Button
                                                variant="outline"
                                                className="border-white/10 hover:bg-white/5"
                                                onClick={() => setSubmittedId(null)}
                                            >
                                                Submit Another
                                            </Button>
                                            <Button
                                                className="bg-cyan-500 text-black hover:bg-cyan-400"
                                                onClick={() => {
                                                    setComplaintId(submittedId); // Auto-fill tracking ID
                                                    setSubmittedId(null);
                                                    setActiveTab('track');
                                                    // Optional: auto-search
                                                }}
                                            >
                                                Track Status
                                            </Button>
                                        </div>
                                    </motion.div>
                                ) : (
                                    <form className="space-y-8" onSubmit={handleSubmit}>
                                        <div className="text-xs text-[#94a3b8] italic -mb-4 flex items-center">
                                            <span className="text-red-500 font-bold text-sm mr-1">*</span> indicates a mandatory field
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold tracking-widest text-[#6b7280] uppercase">
                                                    Complaint Category <span className="text-red-500 text-sm">*</span>
                                                </label>
                                                <select
                                                    name="category"
                                                    value={formData.category}
                                                    onChange={handleChange}
                                                    className="w-full bg-[#111827] border border-white/5 rounded-md px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-[#3b82f6]/50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] transition-colors shadow-inner"
                                                    required
                                                >
                                                    <option value="" disabled hidden>Select a category...</option>
                                                    <option value="Academic">Academic</option>
                                                    <option value="Hostel">Hostel</option>
                                                    <option value="Mess">Mess</option>
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold tracking-widest text-[#6b7280] uppercase">
                                                    Subject <span className="text-red-500 text-sm">*</span>
                                                </label>
                                                <select
                                                    name="subject"
                                                    value={formData.subject}
                                                    onChange={handleChange}
                                                    className="w-full bg-[#111827] border border-white/5 rounded-md px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-[#3b82f6]/50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] transition-colors shadow-inner"
                                                    required={formData.category !== ''}
                                                    disabled={formData.category === ''}
                                                >
                                                    <option value="" disabled hidden>
                                                        {formData.category === '' ? 'Select a category first...' : 'Select a subject...'}
                                                    </option>
                                                    {formData.category && SUBJECT_OPTIONS[formData.category]?.map(subject => (
                                                        <option key={subject} value={subject}>{subject}</option>
                                                    ))}
                                                    <option value="Other">Other (Custom Subject)</option>
                                                </select>
                                                
                                                {formData.subject === 'Other' && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: 'auto' }}
                                                        className="pt-2"
                                                    >
                                                        <input
                                                            type="text"
                                                            name="otherSubject"
                                                            value={formData.otherSubject}
                                                            onChange={handleChange}
                                                            className="w-full bg-[#111827] border border-white/5 rounded-md px-4 py-3 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#3b82f6]/50 transition-colors shadow-inner"
                                                            placeholder="Enter your custom subject"
                                                            required
                                                        />
                                                    </motion.div>
                                                )}
                                            </div>
                                        </div>

                                        {formData.category === 'Hostel' && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="grid grid-cols-1 md:grid-cols-2 gap-8"
                                            >
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold tracking-widest text-[#6b7280] uppercase">
                                                        Hostel Type <span className="text-red-500 text-sm">*</span>
                                                    </label>
                                                    <select
                                                        name="hostelType"
                                                        value={formData.hostelType}
                                                        onChange={handleChange}
                                                        className="w-full bg-[#111827] border border-white/5 rounded-md px-4 py-3 text-sm text-gray-300 focus:outline-none focus:border-[#3b82f6]/50 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M5%208l5%205%205-5%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%20fill%3D%22none%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[position:right_1rem_center] transition-colors shadow-inner"
                                                        required
                                                    >
                                                        <option value="" disabled hidden>Select hostel type...</option>
                                                        <option value="Boys Hostel">Boys Hostel</option>
                                                        <option value="Girls Hostel">Girls Hostel</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold tracking-widest text-[#6b7280] uppercase">
                                                        Room Number <span className="text-red-500 text-sm">*</span>
                                                    </label>
                                                    <input
                                                        type="text"
                                                        name="roomNumber"
                                                        value={formData.roomNumber}
                                                        onChange={handleChange}
                                                        className="w-full bg-[#111827] border border-white/5 rounded-md px-4 py-3 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#3b82f6]/50 transition-colors shadow-inner"
                                                        placeholder="e.g. 101, B-202"
                                                        required
                                                    />
                                                </div>
                                            </motion.div>
                                        )}

                                        {(formData.category === 'Hostel' || formData.category === 'Mess') && (
                                            <motion.div 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                className="grid grid-cols-1 md:grid-cols-2 gap-8"
                                            >
                                                <div className="space-y-2">
                                                    <label className="text-xs font-bold tracking-widest text-[#6b7280] uppercase">
                                                        Date of Incident <span className="text-red-500 text-sm">*</span>
                                                    </label>
                                                    <input
                                                        type="date"
                                                        name="dateOfIncident"
                                                        value={formData.dateOfIncident}
                                                        onChange={handleChange}
                                                        className="w-full bg-[#111827] border border-white/5 rounded-md px-4 py-3 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#3b82f6]/50 transition-colors shadow-inner"
                                                        required
                                                    />
                                                </div>
                                            </motion.div>
                                        )}

                                        <div className="space-y-2">
                                            <label className="text-xs font-bold tracking-widest text-[#6b7280] uppercase">
                                                Detailed Description <span className="text-red-500 text-sm">*</span>
                                            </label>
                                            <textarea
                                                name="description"
                                                value={formData.description}
                                                onChange={handleChange}
                                                rows={5}
                                                className="w-full bg-[#111827] border border-white/5 rounded-md px-4 py-4 text-sm text-gray-300 placeholder-gray-600 focus:outline-none focus:border-[#3b82f6]/50 resize-none transition-colors shadow-inner"
                                                placeholder="Please provide as much detail as possible about the incident or issue..."
                                                required
                                            />
                                        </div>

                                        {/* Photo Upload Section */}
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold tracking-widest text-[#6b7280] uppercase flex items-center">
                                                Upload Evidence 
                                                {formData.category === 'Hostel' ? (
                                                    <span className="text-red-500 text-sm ml-1">*</span>
                                                ) : (
                                                    <span className="text-[#6b7280] lowercase italic ml-2 opacity-70">(optional)</span>
                                                )}
                                            </label>

                                            {!isCameraOpen && !image && (
                                                <div
                                                    className="border-[1.5px] border-dashed border-[#1f2937] hover:border-[#374151] rounded-xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 bg-transparent group"
                                                    onClick={() => document.getElementById('file-upload')?.click()}
                                                >
                                                    <input
                                                        id="file-upload"
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={handleFileUpload}
                                                    />
                                                    <div className="flex items-center justify-center mb-4 transition-transform group-hover:-translate-y-1">
                                                        <CloudUpload className="w-8 h-8 text-[#9ca3af]" strokeWidth={1.5} />
                                                    </div>
                                                    <h4 className="text-[15px] font-bold text-white mb-2 tracking-wide">Drag and drop files here</h4>
                                                    <p className="text-[13px] text-[#6b7280] font-medium">JPG, PNG, PDF up to 10MB each</p>

                                                    {/* Optional camera fallback button */}
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            startCamera();
                                                        }}
                                                        className="mt-6 text-xs text-[#6b7280] hover:text-white hover:bg-transparent tracking-widest uppercase font-bold"
                                                    >
                                                        <Camera className="w-3 h-3 mr-2 inline" /> OR USE CAMERA
                                                    </Button>
                                                </div>
                                            )}

                                            {isCameraOpen && (
                                                <div className="relative bg-[#111827] border border-white/5 rounded-xl overflow-hidden max-w-md mx-auto aspect-video shadow-2xl">
                                                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                                    <canvas ref={canvasRef} className="hidden" />
                                                    <div className="absolute inset-x-0 bottom-4 flex justify-center gap-4">
                                                        <Button type="button" onClick={capturePhoto} className="bg-white text-black hover:bg-gray-200 shadow-xl">
                                                            <Camera className="w-4 h-4 mr-2" /> Capture
                                                        </Button>
                                                        <Button type="button" onClick={stopCamera} variant="destructive" className="bg-red-500/90 backdrop-blur hover:bg-red-600 shadow-xl">
                                                            <X className="w-4 h-4 mr-1" /> Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}

                                            {image && (
                                                <div className="relative inline-block mt-4 p-2 bg-[#111827] rounded-xl border border-white/5 shadow-xl">
                                                    <img src={image} alt="Complaint Attachment" className="h-48 w-auto rounded-lg object-cover" />
                                                    <button
                                                        type="button"
                                                        onClick={removePhoto}
                                                        className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 shadow-xl transition-transform hover:scale-110"
                                                    >
                                                        <X className="w-4 h-4" strokeWidth={3} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col sm:flex-row items-center justify-end gap-x-8 gap-y-4 pt-10 pb-4">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    if (editId) {
                                                        setEditId(null);
                                                        router.push('/complaints/history');
                                                    }
                                                    setFormData({
                                                        category: '',
                                                        subject: '',
                                                        otherSubject: '',
                                                        description: '',
                                                        hostelType: '',
                                                        roomNumber: '',
                                                        dateOfIncident: ''
                                                    });
                                                }}
                                                className="text-[15px] font-bold text-[#6b7280] hover:text-white transition-colors"
                                            >
                                                Discard
                                            </button>
                                            <Button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full sm:w-auto bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold px-10 py-6 text-[15px] tracking-wide shadow-lg shadow-blue-500/20"
                                            >
                                                {isSubmitting ? (editId ? 'UPDATING...' : 'SUBMITTING...') : (editId ? 'UPDATE COMPLAINT' : 'SUBMIT COMPLAINT')}
                                            </Button>
                                        </div>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'details' && trackingResult && (
                        <Card className="bg-white/5 border-white/10">
                            <CardHeader>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                    <div className="space-y-1">
                                        <CardTitle className="text-2xl">Complaint Details</CardTitle>
                                        <CardDescription>Details of your submission.</CardDescription>
                                    </div>
                                    <Link href={`/complaints?track=${trackingResult.id}`} onClick={(e) => { e.preventDefault(); setActiveTab('track'); setComplaintId(trackingResult.id); }} className="w-full sm:w-auto">
                                        <Button variant="outline" className="w-full sm:w-auto border-white/20 text-cyan-500 hover:text-cyan-400 hover:bg-white/10">
                                            Track Status
                                        </Button>
                                    </Link>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Category</label>
                                        <div className="w-full bg-black/50 border border-white/10 rounded-md px-4 py-2 text-white">
                                            {trackingResult.title}
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-gray-300">Department</label>
                                        <div className="w-full bg-black/50 border border-white/10 rounded-md px-4 py-2 text-white">
                                            {trackingResult.department}
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Subject</label>
                                    <div className="w-full bg-black/50 border border-white/10 rounded-md px-4 py-2 text-white">
                                        {trackingResult.subject || 'No Subject Provided'}
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-300">Description</label>
                                    <div className="w-full bg-black/50 border border-white/10 rounded-md px-4 py-2 text-white min-h-[120px] whitespace-pre-wrap">
                                        {trackingResult.description}
                                    </div>
                                </div>

                                {trackingResult.image && (
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold tracking-widest text-[#6b7280] uppercase">Attached Photo</label>
                                        <div className="p-2 bg-[#0B0F19] rounded-xl border border-white/5 inline-block">
                                            <img src={trackingResult.image} alt="Attachment" className="max-w-full h-auto max-h-[300px] rounded-lg object-contain" />
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'track' && (
                        <div className="space-y-8 max-w-4xl mx-auto">
                            <Card className="bg-[#0d1321] border-white/5 shadow-2xl rounded-[24px] overflow-hidden relative">
                                {/* Decorative Icon */}
                                <div className="absolute top-8 right-8 text-[#0ea5e9]/20 hidden sm:block">
                                    <div className="relative">
                                        <Globe className="w-12 h-12" />
                                        <Search className="w-6 h-6 absolute -bottom-1 -right-1" strokeWidth={3} />
                                    </div>
                                </div>

                                <CardHeader className="px-8 pt-8 pb-6">
                                    <CardTitle className="text-[28px] font-extrabold tracking-tight text-white mb-1">Track Complaint</CardTitle>
                                    <CardDescription className="text-[#94a3b8] text-[15px]">Enter your Complaint ID to check the current status.</CardDescription>
                                </CardHeader>

                                <CardContent className="px-8 pb-8">
                                    <form onSubmit={handleTrack}>
                                        <div className="bg-[#0B0F19] border border-white/5 rounded-2xl p-2.5 flex flex-col sm:flex-row gap-3 mb-6 shadow-inner relative z-10">
                                            <input
                                                type="text"
                                                value={complaintId}
                                                onChange={(e) => setComplaintId(e.target.value)}
                                                className="flex-grow bg-transparent border-none px-4 py-3 text-gray-300 font-mono tracking-widest text-[15px] focus:outline-none focus:ring-0 w-full placeholder-[#475569]"
                                                placeholder="e.g. CMP-2025-001"
                                            />
                                            <Button type="submit" className="bg-[#06b6d4] hover:bg-[#0891b2] text-black font-extrabold tracking-widest text-sm rounded-xl px-8 py-6 sm:w-auto w-full shadow-lg shadow-cyan-500/20">
                                                TRACK
                                            </Button>
                                        </div>

                                        <div className="flex justify-between items-center text-[10px] sm:text-xs font-bold tracking-[0.2em] text-[#475569] uppercase px-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse"></div>
                                                <span>SYSTEM READY</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span>SEARCH ENCRYPTED</span>
                                                <Lock className="w-3 h-3" strokeWidth={2.5} />
                                            </div>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>

                            <div className="text-center">
                                <p className="text-[#64748B] text-sm italic font-medium">Lost your tracking ID? Contact the student council admin desk.</p>
                            </div>

                            {trackingResult && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                >
                                    <Card className="bg-[#0d1321] border-white/5 rounded-[24px] overflow-hidden shadow-2xl relative">
                                        {/* Status Accent Line */}
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-[#06b6d4] to-[#3b82f6]"></div>

                                        <CardHeader className="px-8 pt-8 pb-4">
                                            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                                                <div>
                                                    <Badge variant="outline" className={`mb-3 border px-3 py-1 font-bold tracking-widest text-[10px] uppercase rounded-full ${trackingResult.status.includes('Resolved') ? 'border-[#22c55e]/30 text-[#22c55e] bg-[#22c55e]/10' : 'border-[#0ea5e9]/30 text-[#0ea5e9] bg-[#0ea5e9]/10'}`}>
                                                        {trackingResult.status}
                                                    </Badge>
                                                    <CardTitle className="text-[22px] font-extrabold text-white break-words tracking-tight">{trackingResult.subject || trackingResult.title}</CardTitle>
                                                    <CardDescription className="text-[#64748B] text-sm mt-1">ID: <span className="text-[#94a3b8] font-mono">{trackingResult.id}</span> • Submitted on {trackingResult.date}</CardDescription>
                                                </div>
                                                <Link href={`/complaints?view=${trackingResult.id}`} onClick={(e) => { e.preventDefault(); setActiveTab('details'); }} className="w-full sm:w-auto">
                                                    <Button variant="ghost" className="w-full sm:w-auto text-[#0ea5e9] hover:bg-[#0ea5e9]/10 hover:text-[#38bdf8] justify-start sm:justify-center px-4 font-bold tracking-wide rounded-xl">
                                                        View Details
                                                    </Button>
                                                </Link>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="bg-white/5 p-4 rounded-lg mb-8 space-y-3">
                                                <div className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-gray-400 block">Category</span>
                                                        <span className="text-white font-medium">{trackingResult.title}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-400 block">Department</span>
                                                        <span className="text-white font-medium">{trackingResult.department}</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <span className="text-gray-400 block text-sm mb-1">Description</span>
                                                    <p className="text-gray-300 text-sm whitespace-pre-wrap">{trackingResult.description}</p>
                                                </div>
                                            </div>

                                            {trackingResult.image && (
                                                <div className="bg-white/5 p-4 rounded-lg mb-8 space-y-2">
                                                    <span className="text-gray-400 block text-sm">Attachment</span>
                                                    <img src={trackingResult.image} alt="Attachment" className="max-w-full h-auto max-h-[200px] rounded-lg border border-white/10" />
                                                </div>
                                            )}

                                            <div className="relative pl-8 border-l border-white/10 space-y-8">
                                                {trackingResult.timeline.map((step: any, index: number) => (
                                                    <div key={step.id || `${trackingResult.id}-step-${index}`} className="relative">
                                                        <div className={`absolute -left-[37px] w-4 h-4 rounded-full border-2 ${step.completed ? 'bg-cyan-500 border-cyan-500' : 'bg-black border-gray-600'}`} />
                                                        <h4 className={`font-medium ${step.completed ? 'text-white' : 'text-gray-500'}`}>{step.status}</h4>
                                                        {step.description && <p className="text-sm text-gray-300 mt-1 leading-relaxed">{step.description}</p>}
                                                        <p className="text-[11px] text-[#64748B] font-mono mt-1.5">{step.date}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}
                        </div>
                    )}

                    {activeTab === 'community' && (
                        <div className="space-y-8 max-w-4xl mx-auto">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                                <div className="space-y-2">
                                    <h2 className="text-3xl font-bold text-white tracking-tight">Community Complaints</h2>
                                    <p className="text-[#64748B] text-[15px] max-w-md">View, discuss, and support issues raised by other students. Upvote priority issues.</p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
                                    <div className="relative">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                                        <input
                                            type="text"
                                            placeholder="Search complaints..."
                                            className="w-full sm:w-[280px] bg-[#0d1321] border border-white/5 rounded-2xl py-3 pl-11 pr-4 text-sm text-gray-300 placeholder-[#64748B] focus:outline-none focus:border-[#3b82f6]/50 shadow-inner"
                                        />
                                    </div>
                                    <div className="relative">
                                        <select className="w-full sm:w-auto bg-[#0d1321] border border-white/5 rounded-2xl py-3 pl-4 pr-10 text-sm text-gray-300 focus:outline-none focus:border-[#3b82f6]/50 shadow-inner appearance-none disabled">
                                            <option>Sort by: Newest</option>
                                        </select>
                                        <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B] pointer-events-none" />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                {[...tickets]
                                    .sort((a, b) => (b.votes || 0) - (a.votes || 0)) // Sort by votes desc
                                    .map((ticket) => (
                                        <Card key={ticket.id} className="bg-[#0d1321] border border-white/5 hover:border-white/10 transition-colors rounded-[24px] overflow-hidden shadow-2xl">
                                            <CardContent className="p-6">
                                                <div className="flex gap-6">
                                                    {/* Upvote Box */}
                                                    <div className="flex flex-col items-center flex-shrink-0">
                                                        <button
                                                            onClick={() => {
                                                                const email = user?.email || 'demo-user';
                                                                upvoteTicket(ticket.id, email);
                                                            }}
                                                            className={`flex flex-col items-center justify-center w-[52px] py-3 rounded-2xl border ${ticket.votedBy?.includes(user?.email || 'demo-user') ? 'bg-[#0e7490]/20 border-[#0e7490]/40 text-[#22d3ee]' : 'bg-[#111827] border-white/5 text-[#94a3b8] hover:bg-[#1f2937] hover:border-white/10 hover:text-white'} transition-all`}
                                                        >
                                                            <ThumbsUp className={`w-[18px] h-[18px] mb-1.5 ${ticket.votedBy?.includes(user?.email || 'demo-user') ? 'fill-current' : ''}`} strokeWidth={ticket.votedBy?.includes(user?.email || 'demo-user') ? 2 : 1.5} />
                                                            <span className="font-bold text-[13px]">{ticket.votes || 0}</span>
                                                        </button>
                                                    </div>

                                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                        <div className="flex justify-between items-start mb-3 gap-4">
                                                            <div className="flex items-center gap-3 flex-wrap">
                                                                <Badge variant="outline" className={`rounded-full px-3 py-1 border text-[10px] font-bold tracking-widest uppercase
                                                                    ${ticket.priority === 'High' ? 'border-[#ef4444]/30 text-[#ef4444] bg-[#ef4444]/10' :
                                                                        ticket.priority === 'Medium' ? 'border-[#0ea5e9]/30 text-[#0ea5e9] bg-[#0ea5e9]/10' :
                                                                            'border-[#3b82f6]/30 text-[#3b82f6] bg-[#3b82f6]/10'}
                                                                `}>
                                                                    {ticket.priority} Priority
                                                                </Badge>
                                                                <Badge variant="outline" className="rounded-full px-3 py-1 border-[#475569]/40 text-[#94a3b8] bg-[#1e293b]/30 text-[10px] font-bold tracking-widest uppercase">
                                                                    {ticket.status}
                                                                </Badge>
                                                            </div>
                                                            <span className="text-[#64748B] text-[13px] font-medium whitespace-nowrap">{new Date(ticket.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                                                        </div>

                                                        <h3 className="text-[22px] font-extrabold text-white mb-2 truncate leading-tight tracking-tight">{ticket.subject}</h3>
                                                        <p className="text-[#64748B] text-[15px] line-clamp-2 leading-snug mb-4 font-medium">{ticket.description}</p>

                                                        <div className="flex items-center gap-3 text-[13px] text-[#64748B] font-medium mt-auto">
                                                            <span>{ticket.department}</span>
                                                            <span className="w-1 h-1 rounded-full bg-[#334155]"></span>
                                                            <span>{ticket.type}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}

                                {tickets.length === 0 && (
                                    <div className="text-center py-16 text-[#64748B] bg-[#0d1321] rounded-[24px] border border-white/5">
                                        <Globe className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        <p className="text-lg font-medium">No community complaints found.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </motion.div>

                {/* Update Success Modal */}
                {
                    showUpdateSuccess && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-gray-900 border border-cyan-500 rounded-lg max-w-sm w-full p-6 text-center shadow-2xl"
                            >
                                <div className="w-16 h-16 bg-cyan-500/20 text-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-2">Update Successful!</h3>
                                <p className="text-gray-400 mb-6">
                                    Your complaint details have been updated successfully.
                                </p>
                                <Button
                                    className="w-full bg-cyan-500 text-black hover:bg-cyan-400 font-bold"
                                    onClick={() => {
                                        setShowUpdateSuccess(false);
                                        router.push('/complaints/history');
                                    }}
                                >
                                    Back to History
                                </Button>
                            </motion.div>
                        </div>
                    )
                }
            </div>
        </div>
    );
}

export default function ComplaintsPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div></div>}>
            <ComplaintsContent />
        </Suspense>
    );
}
