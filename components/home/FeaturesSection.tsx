'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TiltCard } from '@/components/ui/TiltCard';
import { cn } from '@/lib/utils';
import {
    Users,
    Building2,
    Calendar,
    Vote,
    MessageSquare,
    ShoppingBag,
    Megaphone,
    Trophy
} from 'lucide-react';
import Link from 'next/link';

const features = [
    {
        title: "Representation",
        description: "Ensuring student voices shape campus policies and decisions.",
        icon: Users,
    },
    {
        title: "Campus Development",
        description: "Driving infrastructure improvements and facility upgrades.",
        icon: Building2,
    },
    {
        title: "Events & Culture",
        description: "Organizing fests, workshops, and cultural celebrations.",
        icon: Calendar,
    },
    {
        title: "Digital Governance",
        description: "Transparent, tech-driven management of student affairs.",
        icon: Vote,
    },
    {
        title: "Student Support",
        description: "Dedicated channels for complaints and grievance redressal.",
        icon: MessageSquare,
    },
    {
        title: "Clubs & Comm.",
        description: "Supporting diverse student clubs and interest groups.",
        icon: Users,
    },
];

const quickLinks = [
    { name: "Announce", icon: Megaphone, href: "/announcements" },
    { name: "Events", icon: Calendar, href: "/events" },
    { name: "Elections", icon: Vote, href: "/elections" },
    { name: "Complaints", icon: MessageSquare, href: "/complaints" },
    { name: "Clubs", icon: Users, href: "/clubs" },
    { name: "Achieve", icon: Trophy, href: "/achievements" },
    { name: "Market", icon: ShoppingBag, href: "/marketplace" },
    { name: "Feedback", icon: MessageSquare, href: "/feedback" },
];

const container = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            duration: 0.5
        }
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 30, rotateX: 15 },
    show: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.8, ease: "easeOut" } }
};

const animations = ["animate-float-1", "animate-float-2", "animate-float-3"];

export function FeaturesSection() {
    return (
        <section className="py-32 relative bg-transparent overflow-hidden" style={{ clipPath: "polygon(0 5%, 100% 0, 100% 95%, 0 100%)" }}>
            {/* Background elements to break borders */}
            <div className="absolute top-1/4 left-[-10%] w-[40%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full point-events-none" />
            <div className="absolute bottom-1/4 right-[-10%] w-[40%] h-[50%] bg-cyan-600/5 blur-[120px] rounded-full point-events-none" />

            <div className="container mx-auto px-4 lg:px-12 relative z-10 w-full">

                {/* Asymmetric Header */}
                <motion.div
                    className="mb-10 md:mb-16 md:w-2/3 lg:w-1/2 border-l-[4px] border-blue-500 pl-6"
                    initial={{ opacity: 0, x: -50 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                >
                    <div className="text-[10px] text-blue-500 font-mono tracking-[0.3em] uppercase mb-4">
                        [ OP_MATRIX // WHAT WE DO ]
                    </div>
                    <h2 className="text-3xl sm:text-4xl md:text-6xl font-display font-bold uppercase tracking-widest text-white leading-tight mb-6 text-balance">
                        System <br className="hidden sm:block" /> Capabilities
                    </h2>
                    <p className="text-gray-400 font-mono text-xs sm:text-sm leading-relaxed max-w-md">
                        The nexus drives operational efficiency for campus policies, digital governance, and infrastructure development.
                    </p>
                </motion.div>

                {/* Destroyed Grid Layout - Floating Cards */}
                <motion.div
                    className="flex flex-wrap justify-center lg:justify-end gap-x-4 sm:gap-x-8 gap-y-8 sm:gap-y-16 pb-16 md:pb-24"
                    variants={container}
                    initial="hidden"
                    whileInView="show"
                    viewport={{ once: true, margin: "-100px" }}
                >
                    {features.map((feature, index) => {
                        const isEven = index % 2 === 0;
                        const floatClass = animations[index % 3];

                        return (
                            <motion.div
                                key={feature.title}
                                variants={itemVariants}
                                className={cn(
                                    "w-full sm:w-[45%] md:w-[40%] lg:w-[28%] relative",
                                    isEven ? "lg:-mt-16" : "lg:mt-16",
                                    floatClass
                                )}
                                style={{ zIndex: 10 - index }}
                            >
                                <TiltCard className="h-full">
                                    <div className="group relative">
                                        {/* Glow Halos */}
                                        <div className="absolute -inset-1 bg-blue-500/20 rounded-sm blur opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />

                                        <Card className="h-full relative glass-panel flex flex-col items-start border-l-[3px] border-l-blue-500 hover:border-l-cyan-500 transition-colors duration-500 min-h-[180px] sm:min-h-[220px]">
                                            <CardHeader className="pb-1 sm:pb-2">
                                                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black border border-blue-500/30 flex items-center justify-center mb-3 sm:mb-4 text-blue-500 group-hover:text-cyan-500 group-hover:-translate-y-2 group-hover:rotate-12 transition-all duration-300">
                                                    <feature.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                                </div>
                                                <CardTitle className="font-display tracking-widest text-base sm:text-lg uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">{feature.title}</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <CardDescription className="font-mono text-xs leading-relaxed text-blue-500/60 uppercase">
                                                    {feature.description}
                                                </CardDescription>
                                            </CardContent>

                                            {/* Decorative Index */}
                                            <div className="absolute bottom-4 right-4 text-[10px] font-mono text-blue-500/20 font-bold">
                                                0{index + 1}
                                            </div>
                                        </Card>
                                    </div>
                                </TiltCard>
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* Quick Access - Skewed alignment right bleeding */}
                <div className="mt-12 md:mt-24 w-full flex flex-col lg:items-end">
                    <motion.div
                        className="text-left lg:text-right mb-12 border-l-[4px] lg:border-l-0 lg:border-r-[4px] border-cyan-500 pl-6 lg:pl-0 lg:pr-6"
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                    >
                        <div className="text-[10px] text-cyan-500 font-mono tracking-[0.3em] uppercase mb-4">
                            [ IMMEDIATE // ACCESS ]
                        </div>
                        <h2 className="text-3xl md:text-5xl font-display font-bold uppercase tracking-widest text-white">
                            Quick Links
                        </h2>
                    </motion.div>

                    <motion.div
                        className="flex flex-wrap justify-start lg:justify-end gap-3 w-full lg:w-[80%]"
                        variants={container}
                        initial="hidden"
                        whileInView="show"
                        viewport={{ once: true }}
                    >
                        {quickLinks.map((link, index) => (
                            <motion.div key={link.name} variants={itemVariants} className="animate-float-1" style={{ animationDelay: `${index * 0.5}s` }}>
                                <Link href={link.href}>
                                    <div className="glass-panel border-r-[2px] border-r-cyan-500/50 hover:border-r-cyan-500 hover:-translate-y-2 transition-all duration-300 flex items-center justify-center p-3 sm:p-4 gap-3 cursor-pointer group">
                                        <link.icon className="w-4 h-4 text-gray-500 group-hover:text-cyan-500 transition-colors" />
                                        <span className="text-[10px] sm:text-xs font-mono font-medium tracking-widest uppercase text-gray-400 group-hover:text-white transition-colors">{link.name}</span>
                                    </div>
                                </Link>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
