'use client';

import { motion } from 'framer-motion';
import { useSharedData } from '@/hooks/useSharedData';
import { Camera } from 'lucide-react';

export default function GalleryPage() {
    const { galleryImages } = useSharedData();

    return (
        <div className="min-h-screen bg-black text-white pt-24 md:pt-10 pb-20">
            <div className="container mx-auto px-4">

                <div className="text-center mb-16">
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Campus Life</h1>
                    <p className="text-gray-400">Capturing moments that define our journey.</p>
                </div>

                {galleryImages.length === 0 ? (
                    <div className="text-center py-20 text-gray-500">
                        <Camera className="w-16 h-16 mx-auto mb-4 opacity-20" />
                        <h2 className="text-xl font-medium text-gray-400">No images yet</h2>
                        <p className="mt-2 text-sm">Images added from the President or Council dashboard will appear here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[200px] gap-4">
                        {galleryImages.map((img, index) => (
                            <motion.div
                                key={img.id || index}
                                className={`relative rounded-xl overflow-hidden group ${img.span}`}
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ delay: Math.min(index * 0.1, 1) }}
                            >
                                {img.src && (
                                    <img
                                        src={img.src}
                                        alt={img.alt}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                                    <div className="p-4 w-full">
                                        <p className="text-white font-bold text-lg">{img.alt}</p>
                                        <div className="flex justify-between items-center text-xs text-gray-300 mt-1">
                                            <span>{img.dateAdded}</span>
                                            <span className="bg-black/40 px-2 py-1 rounded border border-white/10">By {img.addedByRole}</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

            </div>
        </div>
    );
}
