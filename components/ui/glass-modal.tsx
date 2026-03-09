import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReactNode } from 'react';

interface GlassModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    variant?: 'default' | 'danger';
    className?: string;
}

export function GlassModal({ isOpen, onClose, title, children, footer, variant = 'default', className = '' }: GlassModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <div key="glass-modal-container" className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {/* Modal Content */}
                    <div className="relative z-10 w-full max-w-lg pointer-events-none flex justify-center items-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className={`
                                relative w-full pointer-events-auto overflow-hidden rounded-2xl 
                                border bg-black/80 shadow-2xl
                                ${variant === 'danger' ? 'border-red-500/30' : 'border-cyan-500/30'}
                                ${className || 'max-w-lg'}
                            `}
                        >
                            {/* Glow Effects */}
                            <div className={`absolute top-0 left-0 w-full h-1 ${variant === 'danger' ? 'bg-red-500' : 'bg-cyan-500'} opacity-50 shadow-[0_0_20px_rgba(234,179,8,0.5)]`} />
                            <div className="absolute -top-[200px] -left-[200px] w-[400px] h-[400px] bg-white/5 blur-[100px] rounded-full pointer-events-none" />

                            {/* Header */}
                            <div className="relative flex items-center justify-between p-6 pb-2">
                                <h2 className={`text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${variant === 'danger' ? 'from-red-400 to-rose-600' : 'from-cyan-400 to-amber-600'}`}>
                                    {title}
                                </h2>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full"
                                >
                                    <X className="w-5 h-5" />
                                </Button>
                            </div>

                            {/* Body */}
                            <div className="relative p-6 pt-4 text-gray-300">
                                {children}
                            </div>

                            {/* Footer */}
                            {footer && (
                                <div className="relative p-6 pt-0 flex justify-end gap-3 rounded-b-2xl">
                                    {footer}
                                </div>
                            )}
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
}
