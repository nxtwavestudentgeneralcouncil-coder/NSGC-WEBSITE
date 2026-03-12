import Link from 'next/link';

export function Footer() {
    return (
        <footer className="bg-black border-t border-white/10 py-12 text-gray-400">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-cyan-600 rounded-full flex items-center justify-center text-black font-bold text-sm overflow-hidden">
                                <img src="/images/nsgc_logo_transparent.png" alt="NSGC Logo" className="w-6 h-6 object-contain" />
                            </div>
                            <span className="text-xl font-bold text-white">NSGC</span>
                        </div>
                        <p className="text-sm max-w-md">
                            The NxtWave Students General Council Portal empowers students to lead, innovate, and voice their opinions.
                            Bridging the gap between administration and the student body.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-white font-semibold mb-4">Quick Links</h4>
                        <ul className="space-y-2 text-sm">
                            <li><Link href="/council" className="hover:text-cyan-500 transition-colors">About Council</Link></li>
                            <li><Link href="/events" className="hover:text-cyan-500 transition-colors">Events</Link></li>
                            <li><Link href="/complaints" className="hover:text-cyan-500 transition-colors">Complaints</Link></li>
                            <li><Link href="/marketplace" className="hover:text-cyan-500 transition-colors">Marketplace</Link></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs">
                    <p className="text-center md:text-left">&copy; {new Date().getFullYear()} NxtWave Students General Council. All rights reserved.</p>
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                        <p className="text-gray-500 text-center md:text-right">
                            Designed by <span className="text-cyan-500 font-semibold tracking-widest uppercase">V_Mach</span>
                        </p>
                        <div className="flex gap-4 md:gap-6">
                            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
                            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
