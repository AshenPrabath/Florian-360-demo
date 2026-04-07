// src/components/editor/FileDropzone.jsx
import React, { useState, useRef } from 'react';
import { Upload, FileType, CheckCircle } from 'lucide-react';

/**
 * Modern Drag and Drop component for the 360 editor.
 * 
 * @param {Object} props
 * @param {Function} props.onFileSelect - Callback with the selected File object.
 * @param {string} props.currentFile - Current filename or path for display.
 */
const FileDropzone = ({ onFileSelect, currentFile }) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = () => {
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        onFileSelect(file);
      } else {
        alert('Please select an image file (JPEG, PNG).');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onFileSelect(e.target.files[0]);
    }
  };

  const fileName = currentFile ? currentFile.split('/').pop() : 'No image selected';

  return (
    <div 
      onClick={() => fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-6 transition-all flex flex-col items-center justify-center text-center gap-3 ${
        isDragActive 
          ? 'border-[#DCC5B7] bg-[#DCC5B7]/10' 
          : 'border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/[0.08]'
      }`}
    >
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept="image/*"
      />

      <div className={`p-4 rounded-full transition-all ${
        currentFile ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/40'
      }`}>
        {currentFile ? <CheckCircle size={24} /> : <Upload size={24} />}
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium text-white group-hover:text-[#DCC5B7] transition-colors">
          {currentFile ? 'Replace Panorama' : 'Upload Panorama'}
        </p>
        <p className="text-[10px] text-white/40 uppercase tracking-widest leading-relaxed">
          Drag & Drop or click to browse<br/>(JPEG, PNG)
        </p>
      </div>

      {currentFile && (
        <div className="mt-2 px-3 py-1 bg-white/10 rounded-full flex items-center gap-2 overflow-hidden max-w-full">
           <FileType size={10} className="text-white/40 flex-shrink-0" />
           <span className="text-[10px] text-white/60 truncate font-mono">{fileName}</span>
        </div>
      )}

      {/* Decorative accent for active state */}
      {isDragActive && (
        <div className="absolute inset-0 border-2 border-[#DCC5B7] rounded-2xl animate-pulse -m-0.5" />
      )}
    </div>
  );
};

export default FileDropzone;
