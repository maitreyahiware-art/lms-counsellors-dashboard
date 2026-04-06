"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { Monitor, Smartphone } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type ViewMode = "phone" | "laptop";

interface ViewContextType {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export function ViewProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ViewMode>("phone");

  return (
    <ViewContext.Provider value={{ mode, setMode }}>
      <div className="min-h-screen relative overflow-x-hidden bg-[#0D2A1E]">
        {/* Toggle UI */}
        <div className="fixed top-6 right-6 z-[100] flex gap-2 p-1.5 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-2xl">
          <button 
            onClick={() => setMode("phone")}
            className={`p-2 rounded-xl transition-all ${mode === 'phone' ? 'bg-[#C9A84C] text-[#0D2A1E]' : 'text-white/40 hover:text-white'}`}
          >
            <Smartphone size={18} />
          </button>
          <button 
            onClick={() => setMode("laptop")}
            className={`p-2 rounded-xl transition-all ${mode === 'laptop' ? 'bg-[#C9A84C] text-[#0D2A1E]' : 'text-white/40 hover:text-white'}`}
          >
            <Monitor size={18} />
          </button>
        </div>

        {/* Framing */}
        <div className={`transition-all duration-700 ease-in-out min-h-screen flex justify-center items-start ${mode === 'phone' ? 'bg-black/20' : ''}`}>
          <div 
            className={`transition-all duration-700 ease-in-out relative ${
              mode === 'phone' 
                ? 'w-full max-w-[430px] h-[932px] my-4 rounded-[3.5rem] border-[12px] border-[#1A1A1A] overflow-hidden shadow-[0_0_80px_rgba(0,0,0,0.8)]' 
                : 'w-full max-w-none min-h-screen rounded-none border-0'
            }`}
          >
            <div className={`h-full w-full overflow-y-auto overflow-x-hidden relative ${mode === 'phone' ? 'scrollbar-hide' : 'pl-24'}`} id="view-viewport">
              {children}
            </div>
            
            {/* Phone Notch */}
            {mode === 'phone' && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[#1A1A1A] rounded-b-3xl z-[60]" />
            )}
          </div>
        </div>
      </div>
    </ViewContext.Provider>
  );
}

export const useViewMode = () => {
    const context = useContext(ViewContext);
    if (!context) throw new Error("useViewMode must be used within a ViewProvider");
    return context;
};
