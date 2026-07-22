interface ResonanceFooterProps {
    isMobile: boolean;
}

export const ResonanceFooter: React.FC<ResonanceFooterProps> = ({ isMobile }) => {
    return (
        <div className={`absolute bottom-0 left-0 right-0 z-50 ${isMobile ? 'pb-2' : 'pb-8'} text-zinc-400 font-mono ${isMobile ? 'text-[6.5px]' : 'text-[9px]'} tracking-[0.1em] pointer-events-none text-center uppercase`}>
            DATA_STREAM: <span className="text-[#CCFF00] font-bold">STABLE</span> | SIGNAL_LATENCY: 14ms | OS_VERSION: 1.2.0
        </div>
    );
};
