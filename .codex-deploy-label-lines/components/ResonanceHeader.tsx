import { motion } from "framer-motion"
import { GatewayLocation } from "@/lib/gateway-data"

interface ResonanceHeaderProps {
    isMobile: boolean;
    isMouseActive: boolean;
    selectedLocation: GatewayLocation | null;
}

export const ResonanceHeader: React.FC<ResonanceHeaderProps> = ({ isMobile, isMouseActive, selectedLocation }) => {
    return (
        <div className={`absolute top-0 left-0 right-0 z-50 text-center ${isMobile ? 'pt-4' : 'pt-8'} pointer-events-none`}>
            <motion.h1
                className={`${isMobile ? 'text-xl md:text-2xl pt-2' : 'text-4xl md:text-5xl'} font-bold mb-1 tracking-tighter`}
                animate={{ textShadow: (isMouseActive && !selectedLocation) ? '0 0 30px rgba(204, 255, 0, 0.4)' : '0 0 0px rgba(204, 255, 0, 0)' }}
                transition={{ duration: 0.5 }}
            >
                OOLIMTONG <span className="text-zinc-500">GATEWAY NETWORK</span>
            </motion.h1>
            <div className="flex flex-col items-center gap-0.5">
                <div className="flex items-center gap-2">
                    <span className={`${isMobile ? 'text-[7px]' : 'text-[10px]'} font-bold tracking-[0.3em] text-[#CCFF00]`} style={{ textShadow: '0 0 8px rgba(204, 255, 0, 0.3)' }}>RESONANCE MAP</span>
                </div>
                <p className={`text-zinc-400 ${isMobile ? 'text-[9px] mt-0.5' : 'text-base md:text-lg mt-2'}`}>
                    Gameplay available only on <span className="text-white font-bold">Mobile Devices</span>.
                </p>
            </div>
        </div>
    );
};
