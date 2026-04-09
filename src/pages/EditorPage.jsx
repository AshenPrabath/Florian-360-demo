// src/pages/EditorPage.jsx
import React, { useState, Suspense, useRef, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import EditorSphere from '../components/editor/EditorSphere';
import { LOCATIONS } from '../data/locations';
import { Save, Plus, Trash2, Home, Download, Copy, Image as ImageIcon, Crosshair, ChevronRight, ChevronDown, Folder, Camera, MapPin, Check, Sun, Compass } from 'lucide-react';

import FileDropzone from '../components/editor/FileDropzone';

const EditorPage = () => {
  // --- State ---
  const [tourData, setTourData] = useState(LOCATIONS);
  const [activeLocationId, setActiveLocationId] = useState(Object.keys(LOCATIONS)[0]);
  const [activeViewpointId, setActiveViewpointId] = useState(LOCATIONS[Object.keys(LOCATIONS)[0]].viewpoints[0].id);
  const [selectedHotspotId, setSelectedHotspotId] = useState(null);
  const [editMode, setEditMode] = useState('view'); // 'view', 'add', or 'rotate'
  const [showExportModal, setShowExportModal] = useState(false);
  const [isRotateLocked, setIsRotateLocked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const orbitControlsRef = useRef();

  // --- Derived Data ---
  const activeLocation = tourData[activeLocationId];
  const activeViewpoint = activeLocation?.viewpoints.find(v => v.id === activeViewpointId);
  const selectedHotspot = activeViewpoint?.hotspots.find(h => h.id === selectedHotspotId);

  // --- Handlers ---
  const handleAddHotspot = (position) => {
    if (editMode !== 'add' || !activeViewpoint) return;

    const newId = `hotspot_${Date.now()}`;
    const pos = new THREE.Vector3(position.x, position.y, position.z).normalize().multiplyScalar(10);

    const newHotspot = {
      id: newId,
      target: activeLocationId,
      targetViewpoint: activeViewpointId,
      label: 'New Hotspot',
      panoramaPosition: [pos.x, pos.y, pos.z],
      minimap3DPosition: [0, 0, 0],
      minimap2DPosition: { x: 0, y: 0 }
    };

    const updatedTourData = { ...tourData };
    const vpIndex = updatedTourData[activeLocationId].viewpoints.findIndex(v => v.id === activeViewpointId);
    updatedTourData[activeLocationId].viewpoints[vpIndex].hotspots.push(newHotspot);

    setTourData(updatedTourData);
    setSelectedHotspotId(newId);
    setEditMode('view');
  };

  const handleAddLocation = () => {
    const locName = prompt('Enter Main Point Name (e.g. Entrance, Lobby):');
    if (!locName) return;
    const locId = locName.toLowerCase().replace(/\s+/g, '');
    
    const vpName = prompt(`Enter first Sub Point name for "${locName}" (e.g. Center View):`);
    if (!vpName) return;
    const vpId = `${locId}_${Date.now()}`;

    const newViewpoint = {
      id: vpId,
      name: vpName,
      image: 'pending_upload', // User will upload in the UI thereafter
      rotationOffset: 0,
      hotspots: []
    };

    setTourData({
      ...tourData,
      [locId]: {
        id: locId,
        name: locName,
        viewpoints: [newViewpoint],
        minimap3DPosition: { x: 0, z: 0 },
        minimap2DPosition: { x: 0, y: 0 }
      }
    });

    setActiveLocationId(locId);
    setActiveViewpointId(vpId);
    setSelectedHotspotId(null);
  };

  const handleAddViewpoint = (locId) => {
    const locName = tourData[locId].name;
    const name = prompt(`Enter new Sub Point name for "${locName}":`);
    if (!name) return;
    const id = `${locId}_${Date.now()}`;
    
    const newViewpoint = {
      id,
      name,
      image: 'pending_upload',
      rotationOffset: 0,
      hotspots: []
    };

    const updatedTourData = { ...tourData };
    updatedTourData[locId].viewpoints.push(newViewpoint);
    setTourData(updatedTourData);
    setActiveViewpointId(id);
    setSelectedHotspotId(null);
  };

  const handleSaveToProject = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const response = await fetch('http://localhost:3001/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(tourData),
      });

      const result = await response.json();
      if (result.success) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert('Failed to save project: ' + result.error);
      }
    } catch (err) {
      console.error('[Editor] Save Error:', err);
      alert('Error connecting to Save Server. Please ensure it is running.');
    } finally {
      setIsSaving(false);
    }
  };

  // Generic viewpoint update
  const handleUpdateViewpoint = (updates) => {
    const updatedTourData = { ...tourData };
    const vpIndex = updatedTourData[activeLocationId].viewpoints.findIndex(v => v.id === activeViewpointId);
    updatedTourData[activeLocationId].viewpoints[vpIndex] = {
      ...updatedTourData[activeLocationId].viewpoints[vpIndex],
      ...updates
    };
    setTourData(updatedTourData);
  };

  const handleImageUpload = (file) => {
    const previewUrl = URL.createObjectURL(file);
    const projectPath = `assets/images/${file.name}`;
    handleUpdateViewpoint({ 
      image: projectPath,
      previewUrl: previewUrl 
    });
  };

  // Existing deletion handlers omitted for brevity in this block, preserving them in actual file

  // ... (keeping other handlers like deletions and hotspot updates)

  const handleDeleteLocation = (locId) => {
    if (!window.confirm(`Are you sure you want to delete the location "${tourData[locId].name}" and all its viewpoints?`)) return;
    
    const updatedTourData = { ...tourData };
    delete updatedTourData[locId];
    setTourData(updatedTourData);

    const remainingLocs = Object.keys(updatedTourData);
    if (remainingLocs.length > 0) {
      const firstLocId = remainingLocs[0];
      setActiveLocationId(firstLocId);
      setActiveViewpointId(updatedTourData[firstLocId].viewpoints[0]?.id || null);
    } else {
      setActiveLocationId(null);
      setActiveViewpointId(null);
    }
  };

  const handleDeleteViewpoint = (locId, vpId) => {
    if (!window.confirm(`Are you sure you want to delete this viewpoint?`)) return;
    
    const updatedTourData = { ...tourData };
    updatedTourData[locId].viewpoints = updatedTourData[locId].viewpoints.filter(v => v.id !== vpId);
    setTourData(updatedTourData);

    if (activeViewpointId === vpId) {
      setActiveViewpointId(updatedTourData[locId].viewpoints[0]?.id || null);
    }
  };

  const handleUpdateHotspot = (updates) => {
    const updatedTourData = { ...tourData };
    const vpIndex = updatedTourData[activeLocationId].viewpoints.findIndex(v => v.id === activeViewpointId);
    const hsIndex = updatedTourData[activeLocationId].viewpoints[vpIndex].hotspots.findIndex(h => h.id === selectedHotspotId);
    
    updatedTourData[activeLocationId].viewpoints[vpIndex].hotspots[hsIndex] = {
      ...updatedTourData[activeLocationId].viewpoints[vpIndex].hotspots[hsIndex],
      ...updates
    };

    setTourData(updatedTourData);
  };

  const handleDeleteHotspot = () => {
    const updatedTourData = { ...tourData };
    const vpIndex = updatedTourData[activeLocationId].viewpoints.findIndex(v => v.id === activeViewpointId);
    updatedTourData[activeLocationId].viewpoints[vpIndex].hotspots = 
      updatedTourData[activeLocationId].viewpoints[vpIndex].hotspots.filter(h => h.id !== selectedHotspotId);

    setTourData(updatedTourData);
    setSelectedHotspotId(null);
  };

  const copyToClipboard = () => {
    const code = `export const LOCATIONS = ${JSON.stringify(tourData, null, 2)};`;
    navigator.clipboard.writeText(code);
    alert('Configuration copied to clipboard!');
  };

  // --- Render ---
  return (
    <div className="flex h-screen bg-neutral-950 text-white overflow-hidden font-sans">
      
      {/* --- Left Sidebar: Assets & Navigation --- */}
      <div className="w-72 bg-neutral-900 border-r border-white/10 flex flex-col">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-xl font-bold tracking-tight text-[#DCC5B7]">TOUR EDITOR</h1>
          <p className="text-xs text-white/40 mt-1 uppercase tracking-widest">Florain Otium Talpe</p>
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-6">
          {/* Rooms List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Locations</h3>
              <button 
                onClick={handleAddLocation}
                className="p-1 hover:bg-white/10 rounded transition-all text-[#DCC5B7]"
                title="Add New Location"
              >
                <Plus size={14} />
              </button>
            </div>
            <div className="space-y-1">
              {Object.keys(tourData).map(locId => (
                <div key={locId} className="space-y-1">
                  <div className={`group flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                      activeLocationId === locId ? 'bg-[#DCC5B7]/10 text-[#DCC5B7]' : 'hover:bg-white/5 text-white/70'
                    }`}>
                    <button
                      onClick={() => {
                        setActiveLocationId(locId);
                        if (tourData[locId].viewpoints.length > 0) {
                          setActiveViewpointId(tourData[locId].viewpoints[0].id);
                        } else {
                          setActiveViewpointId(null);
                        }
                        setSelectedHotspotId(null);
                      }}
                      className="flex-grow flex items-center gap-2 text-left font-medium"
                    >
                       <Folder size={16} className={activeLocationId === locId ? 'text-[#DCC5B7]' : 'text-white/30'} />
                       <span>{tourData[locId].name}</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleAddViewpoint(locId); }}
                        className="p-1 hover:bg-white/10 rounded text-white/40 hover:text-white transition-all"
                        title="Add Sub Point (Panorama)"
                      >
                        <Plus size={14} />
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteLocation(locId); }}
                        className="p-1 hover:bg-red-500/20 rounded text-red-500/40 hover:text-red-500 transition-all"
                        title="Delete Main Point"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  {activeLocationId === locId && (
                    <div className="ml-4 space-y-1 mt-1 border-l border-white/10 pl-3">
                      {tourData[locId].viewpoints.map(vp => (
                        <div key={vp.id} className="group/vp flex items-center justify-between px-3 py-1.5 rounded-md transition-all hover:bg-white/5">
                          <button
                            onClick={() => {
                              setActiveViewpointId(vp.id);
                              setSelectedHotspotId(null);
                            }}
                            className={`flex-grow flex items-center gap-2 text-xs transition-all ${
                              activeViewpointId === vp.id ? 'text-[#DCC5B7] font-semibold' : 'text-white/40 hover:text-white font-normal'
                            }`}
                          >
                            <Camera size={12} className={activeViewpointId === vp.id ? 'text-[#DCC5B7]' : 'text-white/20'} />
                            {vp.name}
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); handleDeleteViewpoint(locId, vp.id); }}
                            className="opacity-0 group-hover/vp:opacity-100 p-1 hover:bg-red-500/20 rounded text-red-400/60 transition-all"
                            title="Delete Sub Point"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                      {tourData[locId].viewpoints.length === 0 && (
                        <div className="px-3 py-2 text-[10px] text-white/20 italic">No sub points added.</div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-white/10 space-y-3">
           <button 
             onClick={handleSaveToProject}
             disabled={isSaving}
             className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${
               saveSuccess 
                 ? 'bg-emerald-500 text-white' 
                 : 'bg-[#DCC5B7] text-black hover:bg-white active:scale-[0.98]'
             } ${isSaving ? 'opacity-70 cursor-not-allowed' : ''}`}
           >
             {isSaving ? (
               <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
             ) : saveSuccess ? (
               <Check size={18} />
             ) : (
               <Save size={18} />
             )}
             {isSaving ? 'SAVING...' : saveSuccess ? 'SAVED TO PROJECT!' : 'SAVE TO PROJECT'}
           </button>

           <button 
             onClick={() => setShowExportModal(true)}
             className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 text-white/60 py-2.5 rounded-xl text-[11px] font-medium hover:bg-white/10 transition-all uppercase tracking-widest"
           >
             <Download size={14} />
             Export Code (Manual)
           </button>
        </div>
      </div>

      {/* --- Main Content: 3D Viewport --- */}
      <div className="flex-grow relative bg-black">
        {/* Editor Toolbar Overlay */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-neutral-900/80 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full shadow-2xl">
           <button
             onClick={() => setEditMode('view')}
             className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
               editMode === 'view' ? 'bg-white text-black' : 'hover:bg-white/10'
             }`}
           >
             <Home size={14} />
             View Mode
           </button>
           <div className="w-px h-4 bg-white/20 mx-1" />
           <button
             onClick={() => setEditMode('rotate')}
             className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
               editMode === 'rotate' ? 'bg-[#DCC5B7] text-black shadow-lg scale-105' : 'hover:bg-white/10'
             }`}
           >
             <Compass size={14} />
             Set Orientation
           </button>
           <div className="w-px h-4 bg-white/20 mx-1" />
           <button
             onClick={() => setEditMode('add')}
             className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
               editMode === 'add' ? 'bg-[#DCC5B7] text-black' : 'hover:bg-white/10'
             }`}
           >
             <Plus size={14} />
             Add Hotspot
           </button>
        </div>

        {editMode === 'add' && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-blue-600/90 text-white text-[10px] uppercase tracking-widest font-bold rounded animate-pulse">
            Click anywhere on the sphere to place a hotspot
          </div>
        )}

        {editMode === 'rotate' && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 px-4 py-2 bg-emerald-600/90 text-white text-[10px] uppercase tracking-widest font-bold rounded animate-pulse">
            Panning is locked to horizontal. Set the 'North' orientation for this image.
          </div>
        )}

        <Canvas shadows className="cursor-crosshair">
          <Suspense fallback={null}>
            <PerspectiveCamera makeDefault position={[0, 0, 0.1]} fov={75} />
            <ambientLight intensity={0.5} />
            
            {activeViewpoint ? (
              <EditorSphere 
                viewpoint={activeViewpoint} 
                onAddHotspot={handleAddHotspot}
                onSelectHotspot={setSelectedHotspotId}
                selectedHotspotId={selectedHotspotId}
              />
            ) : (
              <gridHelper args={[100, 100, 0x444444, 0x222222]} rotation={[Math.PI / 2, 0, 0]} />
            )}

            <OrbitControls 
              ref={orbitControlsRef}
              enablePan={false}
              enableZoom={true}
              zoomSpeed={0.5}
              rotateSpeed={-0.5}
              reverseOrbit={true}
              minPolarAngle={editMode === 'rotate' ? Math.PI / 2 : 0}
              maxPolarAngle={editMode === 'rotate' ? Math.PI / 2 : Math.PI}
            />
          </Suspense>
        </Canvas>

        {!activeViewpoint && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm">
             <div className="text-center p-8 bg-neutral-900 border border-white/10 rounded-3xl shadow-3xl max-w-sm">
                <ImageIcon size={48} className="text-white/20 mx-auto mb-4" />
                <h3 className="text-lg font-bold mb-2">No Viewpoints in this Location</h3>
                <p className="text-sm text-white/40 mb-6">Add a panorama image to start mapping this room.</p>
                <button 
                  onClick={() => handleAddViewpoint(activeLocationId)}
                  className="bg-[#DCC5B7] text-black px-6 py-2.5 rounded-full text-xs font-bold hover:bg-white transition-all flex items-center justify-center gap-2 mx-auto"
                >
                  <Plus size={14} />
                  Add First Viewpoint
                </button>
             </div>
          </div>
        )}

        {/* Viewport Overlay Info */}
        <div className="absolute bottom-6 left-6 text-white/40 text-[10px] uppercase tracking-[0.3em]">
          Editing: {activeLocation.name} / {activeViewpoint.name}
        </div>
      </div>

      {/* --- Right Sidebar: Property Panel --- */}
      <div className="w-80 bg-neutral-900 border-l border-white/10 p-6 space-y-8 overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Properties</h3>
          {selectedHotspot && (
            <button 
              onClick={() => setSelectedHotspotId(null)}
              className="text-[10px] text-[#DCC5B7] hover:underline"
            >
              Back to Viewpoint
            </button>
          )}
        </div>

        {selectedHotspot ? (
          <div className="space-y-6 animate-slide-up">
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
               <div>
                 <label className="text-[10px] uppercase text-white/40 tracking-wider mb-1.5 block">Hotspot ID</label>
                 <div className="text-sm font-mono opacity-60 truncate">{selectedHotspot.id}</div>
               </div>
               
               <div>
                 <label className="text-[10px] uppercase text-white/40 tracking-wider mb-1.5 block">Label</label>
                 <input 
                   type="text" 
                   value={selectedHotspot.label}
                   onChange={(e) => handleUpdateHotspot({ label: e.target.value })}
                   className="w-full bg-neutral-800 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#DCC5B7]"
                 />
               </div>

               <div>
                 <label className="text-[10px] uppercase text-white/40 tracking-wider mb-1.5 block">Target Room</label>
                 <select 
                   value={selectedHotspot.target}
                   onChange={(e) => handleUpdateHotspot({ target: e.target.value, targetViewpoint: tourData[e.target.value].viewpoints[0].id })}
                   className="w-full bg-neutral-800 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#DCC5B7]"
                 >
                   {Object.keys(tourData).map(locId => (
                     <option key={locId} value={locId}>{tourData[locId].name}</option>
                   ))}
                 </select>
               </div>

               <div>
                 <label className="text-[10px] uppercase text-white/40 tracking-wider mb-1.5 block">Target Viewpoint</label>
                 <select 
                   value={selectedHotspot.targetViewpoint}
                   onChange={(e) => handleUpdateHotspot({ targetViewpoint: e.target.value })}
                   className="w-full bg-neutral-800 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#DCC5B7]"
                 >
                   {tourData[selectedHotspot.target].viewpoints.map(vp => (
                     <option key={vp.id} value={vp.id}>{vp.name}</option>
                   ))}
                 </select>
               </div>
            </div>

            <div className="space-y-2">
               <div className="text-[10px] uppercase text-white/40 tracking-wider mb-1.5 block">Position (Internal Data)</div>
               <div className="grid grid-cols-3 gap-2">
                  {['x', 'y', 'z'].map((axis, i) => (
                    <div key={axis} className="bg-neutral-800 p-2 rounded text-center text-xs font-mono">
                       <span className="opacity-40 mr-1">{axis.toUpperCase()}</span>
                       {selectedHotspot.panoramaPosition[i].toFixed(2)}
                    </div>
                  ))}
               </div>
            </div>

            <button 
              onClick={handleDeleteHotspot}
              className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-500 py-3 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-all"
            >
              <Trash2 size={16} />
              Delete Hotspot
            </button>
          </div>
        ) : activeViewpoint ? (
          <div className="space-y-6 animate-slide-up">
            <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
               <div>
                  <label className="text-[10px] uppercase text-white/40 tracking-wider mb-1.5 block">Viewpoint Name</label>
                  <input 
                    type="text" 
                    value={activeViewpoint.name}
                    onChange={(e) => handleUpdateViewpoint({ name: e.target.value })}
                    className="w-full bg-neutral-800 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#DCC5B7]"
                  />
               </div>


               <div className="space-y-4 pt-2">
                  <div className="p-3 bg-neutral-800 rounded-lg border border-white/5 space-y-3">
                     <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase text-white/40 tracking-wider flex items-center gap-2">
                           Horizontal Pitch Offset
                        </label>
                        <span className="text-[10px] font-mono text-[#DCC5B7] bg-white/5 px-2 py-0.5 rounded">{activeViewpoint.rotationOffset || 0}°</span>
                     </div>
                     <input 
                        type="range"
                        min="-180"
                        max="180"
                        step="1"
                        value={activeViewpoint.rotationOffset || 0}
                        onChange={(e) => handleUpdateViewpoint({ rotationOffset: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-[#DCC5B7]"
                     />
                     <button 
                        onClick={() => {
                           if (orbitControlsRef.current) {
                              // azimuthalAngle is in radians. Correct for the negative rotateSpeed
                              // If current angle is theta, we want to shift pano content by theta
                              const currentAzimuth = orbitControlsRef.current.getAzimuthalAngle();
                              const degrees = Math.round((currentAzimuth * 180) / Math.PI);
                              handleUpdateViewpoint({ rotationOffset: -degrees });
                           }
                        }}
                        className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-bold text-white/50 hover:text-white transition-all border border-white/5 flex items-center justify-center gap-2"
                     >
                        <Compass size={12} /> USE CURRENT VIEW AS HOME
                     </button>
                  </div>

                  <div>
                    <label className="text-[10px] uppercase text-white/40 tracking-wider mb-1.5 block flex items-center gap-2">
                      <Sun size={10} className="text-[#DCC5B7]" /> Day Panorama
                    </label>
                    <FileDropzone 
                      onFileSelect={(file) => handleImageUpload(file, 'day')} 
                      currentFile={activeViewpoint.image === 'pending_upload' ? null : activeViewpoint.image} 
                    />
                  </div>

               </div>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
               <p className="text-[10px] text-blue-400 mb-1 font-bold uppercase tracking-widest flex items-center gap-2">
                 <MapPin size={10} /> Pro Tip
               </p>
               <p className="text-[11px] text-blue-400/80 leading-relaxed">
                 Selected images will be automatically mapped to <strong>assets/images/</strong> in your final configuration.
               </p>
            </div>
          </div>
        ) : (
          <div className="h-48 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl text-center px-6">
            <Crosshair size={24} className="text-white/20 mb-3" />
            <p className="text-xs text-white/30">Select a sub-point to manage its panorama or use "Add Hotspot" to link rooms.</p>
          </div>
        )}
      </div>

      {/* --- Export Modal --- */}
      {showExportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 backdrop-blur-md bg-black/60">
          <div className="bg-neutral-900 border border-white/10 w-full max-w-4xl max-h-[80vh] rounded-3xl flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
               <h2 className="text-lg font-bold">Generated Locations.js</h2>
               <div className="flex gap-2">
                 <button 
                   onClick={copyToClipboard}
                   className="flex items-center gap-2 bg-white text-black px-4 py-2 rounded-full text-xs font-bold hover:bg-[#DCC5B7] transition-all"
                 >
                   <Copy size={14} />
                   Copy to Clipboard
                 </button>
                 <button 
                   onClick={() => setShowExportModal(false)}
                   className="text-white/40 hover:text-white px-2 transition-all"
                 >
                    Close
                 </button>
               </div>
            </div>
            <div className="flex-grow p-6 overflow-hidden">
               <div className="bg-black/50 rounded-2xl p-6 h-full overflow-y-auto font-mono text-[11px] leading-relaxed select-all">
                 <pre className="text-emerald-400/80">
                   {`export const LOCATIONS = ${JSON.stringify(tourData, null, 2)};`}
                 </pre>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditorPage;
