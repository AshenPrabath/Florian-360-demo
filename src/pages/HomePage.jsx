// src/pages/HomePage.jsx
import React from "react";
import { useNavigate } from "react-router-dom";

function HomePage() {
  const navigate = useNavigate();
  const villaBg = "/assets/images/7_Day.jpg";

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black select-none -mt-20">
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center transition-opacity duration-1000"
        style={{ backgroundImage: `url(${villaBg})` }}
      />
      
      {/* Premium Gradient Overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

      {/* Hero Content */}
      <div className="relative z-20 h-full flex items-center justify-start px-8 md:px-16 lg:px-24 text-white">
        <div className="max-w-4xl animate-fade-in-left">
          <div className="mb-2 overflow-hidden">
            <span className="inline-block text-[#DCC5B7] text-sm md:text-base tracking-[0.5em] uppercase font-light">
              Refined Living
            </span>
          </div>
          
          <h1 className="leading-[1.1] mb-2 text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-bold tracking-tight">
            FLORAIN
          </h1>
          <h1 className="leading-[1.1] mb-2 text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-bold tracking-tight text-[#DCC5B7]">
            OTIUM
          </h1>
          <h1 className="leading-[1.1] mb-8 text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-light tracking-widest opacity-90 uppercase">
            {/* VILLA <span className="text-sm md:text-lg vertical-top ml-2 opacity-50">—</span> */} <span className="border-b border-white/30 pb-2">TALPE</span>
          </h1>

          <p className="text-gray-300 mb-12 text-sm md:text-lg lg:text-xl leading-relaxed max-w-2xl font-light">
            An iconic residence offering modern villa living, top-tier amenities, and smart integration at its finest in the most exclusive location of UAE. Welcome to a serene escapade amid curated luxury.
          </p>

          <div className="flex flex-col sm:flex-row gap-6">
            <button
              onClick={() => navigate("/tour")}
              className="group relative bg-[#DCC5B7] text-black hover:bg-white transition-all duration-500 px-12 py-5 rounded-full text-lg font-bold uppercase tracking-widest shadow-2xl flex items-center justify-center overflow-hidden"
            >
              <span className="relative z-10 font-bold">Enter 360 Villa Tour</span>
              <div className="absolute inset-0 bg-white transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
            </button>
            
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute bottom-12 right-12 z-20 hidden lg:block text-white/40 text-xs tracking-[0.8em] uppercase transform rotate-90 origin-bottom-right">
        Modernity & Nature
      </div>
      
      <div className="absolute bottom-12 left-12 z-20 flex gap-4 text-white/50 text-xs uppercase tracking-widest font-light">
        <span>Talpe, Sri Lanka</span>
        <span className="opacity-30">|</span>
        <span>Est. 2025</span>
      </div>
    </div>
  );
}

export default HomePage;
