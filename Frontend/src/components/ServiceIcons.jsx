import React from "react";
import { Zap, Droplet, BrushCleaning, Wind } from "lucide-react";

const DEFAULT_SERVICES = [
    { icon: Zap, label: "Electrician", bg: "#FAEEDA", color: "#854F0B" },
    { icon: Droplet, label: "Plumbing", bg: "#E6F1FB", color: "#0C447C" },
    { icon: BrushCleaning, label: "Cleaning", bg: "#EAF3DE", color: "#27500A" },
    { icon: Wind, label: "AC repair", bg: "#FCEBEB", color: "#791F1F" },
];

export default function ServiceIcons({ size = 40, gap = 14, services = DEFAULT_SERVICES }) {
    return (
        <div
            className="flex justify-center"
            style={{ gap: typeof gap === 'number' ? `${gap}px` : gap }}
        >
            <style>{`
        @keyframes service-icon-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-7px); }
        }
      `}</style>
            {services.map(({ icon: Icon, label, bg, color }, i) => (
                <div
                    key={label}
                    title={label}
                    className="flex items-center justify-center rounded-full animate-[service-icon-bounce_1.6s_ease-in-out_infinite]"
                    style={{
                        width: size,
                        height: size,
                        backgroundColor: bg,
                        animationDelay: `${i * 0.15}s`,
                    }}
                >
                    <Icon size={Math.round(size * 0.45)} color={color} aria-hidden="true" />
                </div>
            ))}
        </div>
    );
}
