"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { cn } from "@/lib/utils";

interface TextRevealProps {
    text: string;
    className?: string;
    delay?: number;
    duration?: number;
    type?: "word" | "char";
}

export default function TextReveal({
    text,
    className,
    delay = 0,
    duration = 0.5,
    type = "word",
}: TextRevealProps) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-50px" });

    const containerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: type === "word" ? 0.1 : 0.03,
                delayChildren: delay,
            },
        },
    };

    const childVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                duration: duration,
                ease: "easeOut",
            },
        },
    };

    const items = type === "word" ? text.split(" ") : text.split("");

    return (
        <motion.span
            ref={ref}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={containerVariants}
            className={cn("inline-block", className)}
            aria-label={text}
        >
            {items.map((item, index) => (
                <motion.span
                    key={`${type}-${index}-${item}`}
                    variants={childVariants}
                    className="inline-block mr-[0.2em] last:mr-0"
                >
                    {item === " " ? "\u00A0" : item}
                </motion.span>
            ))}
        </motion.span>
    );
}
