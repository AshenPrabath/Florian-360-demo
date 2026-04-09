import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import * as THREE from 'three';
import { getTourAssets, getEssentialAssets } from '../../utils/assetUtils';

// Enable Three.js Global Cache
THREE.Cache.enabled = true;

const TOUR_ASSETS = getTourAssets();

// Global cache to store preloaded assets (Textures, etc.)
const AssetCache = {
  textures: new Map(),
  videos: new Map(),
  models: new Map(),
  
  set(type, src, data) {
    this[type].set(src, data);
  },
  
  get(type, src) {
    return this[type].get(src);
  },
  
  has(type, src) {
    return this[type].has(src);
  },
  
  clear() {
    this.textures.clear();
    this.videos.clear();
    this.models.clear();
  }
};

// Make cache available globally
window.AssetCache = AssetCache;

const getAssetSize = async (src) => {
  try {
    if ('caches' in window) {
      const cache = await caches.open('tour-assets-v1');
      const cachedResponse = await cache.match(src);
      if (cachedResponse) {
        const blob = await cachedResponse.blob();
        return blob.size;
      }
    }
    
    const headResponse = await fetch(src, { method: 'HEAD' });
    if (headResponse.ok) {
      const contentLength = headResponse.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > 0) {
        return parseInt(contentLength, 10);
      }
    }
    
    const response = await fetch(src);
    if (!response.ok) throw new Error(`Failed to fetch: ${src}`);
    const blob = await response.blob();
    return blob.size;
  } catch (error) {
    console.warn(`Failed to get size for ${src}:`, error);
    return 0;
  }
};

const preloadImageToCache = (src, onProgress) => new Promise(async (resolve, reject) => {
  if (AssetCache.has('textures', src)) {
    resolve({ src, cached: true, loadTime: 0, success: true, size: 0 });
    return;
  }

  const startTime = Date.now();
  const loader = new THREE.TextureLoader();
  const size = await getAssetSize(src);
  
  loader.load(
    src,
    (texture) => {
      texture.wrapS = THREE.RepeatWrapping;
      texture.repeat.x = -1;
      texture.colorSpace = THREE.SRGBColorSpace;
      
      AssetCache.set('textures', src, texture);
      onProgress && onProgress(100);
      
      resolve({ 
        src, 
        cached: false,
        loadTime: Date.now() - startTime, 
        success: true,
        size: size
      });
    },
    (xhr) => {
      if (xhr.lengthComputable) {
        onProgress && onProgress((xhr.loaded / xhr.total) * 100);
      }
    },
    (err) => reject(err)
  );
});

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 MB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const formatSpeed = (bytesPerSecond) => {
  if (bytesPerSecond === 0) return '0 Mbps';
  return ((bytesPerSecond * 8) / (1024 * 1024)).toFixed(1) + ' Mbps';
};

const formatTime = (seconds) => {
  if (!isFinite(seconds) || seconds === 0) return '0s';
  if (seconds < 60) return Math.round(seconds) + 's';
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
};

const ESSENTIAL_ASSETS = getEssentialAssets();

const AssetPreloader = ({ onComplete, children }) => {
  const [mbProgress, setMbProgress] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [currentAsset, setCurrentAsset] = React.useState('');
  const [loadedAssets, setLoadedAssets] = React.useState(0);
  const [totalSize, setTotalSize] = React.useState(0);
  const [loadedSize, setLoadedSize] = React.useState(0);
  const [internetSpeed, setInternetSpeed] = React.useState(0);
  const [estimatedTime, setEstimatedTime] = React.useState(0);
  const loadingStartedRef = React.useRef(false);

  const allAssetsList = [
    ...TOUR_ASSETS.images.map(src => ({ src, loader: preloadImageToCache })),
    ...TOUR_ASSETS.icons.map(src => ({ src, loader: preloadImageToCache })),
  ];

  const totalAssets = allAssetsList.length;

  React.useEffect(() => {
    if (loadingStartedRef.current) return;
    loadingStartedRef.current = true;

    const loadAssets = async () => {
      const startTime = Date.now();
      const essential = allAssetsList.filter(a => ESSENTIAL_ASSETS.includes(a.src));
      const lazy = allAssetsList.filter(a => !ESSENTIAL_ASSETS.includes(a.src));

      const sizes = await Promise.all(allAssetsList.map(a => getAssetSize(a.src)));
      const calculatedTotalSize = sizes.reduce((sum, s) => sum + s, 0);
      setTotalSize(calculatedTotalSize);

      let currentLoadedBytes = 0;
      let currentLoadedCount = 0;

      const loadBatch = async (batch) => {
        const limit = navigator.hardwareConcurrency ? Math.min(navigator.hardwareConcurrency, 6) : 4;
        const pool = new Set();
        
        for (const item of batch) {
          if (pool.size >= limit) await Promise.race(pool);

          const promise = (async () => {
            try {
              setCurrentAsset(item.src.split('/').pop());
              const result = await item.loader(item.src);
              currentLoadedBytes += result.size;
              currentLoadedCount++;
              
              setLoadedSize(currentLoadedBytes);
              setLoadedAssets(currentLoadedCount);
              setMbProgress((currentLoadedBytes / calculatedTotalSize) * 100);

              const elapsed = (Date.now() - startTime) / 1000;
              if (elapsed > 0) {
                const speed = currentLoadedBytes / elapsed;
                setInternetSpeed(speed);
                setEstimatedTime((calculatedTotalSize - currentLoadedBytes) / speed);
              }
            } catch (err) {
              console.warn(`Load failed for ${item.src}:`, err);
            }
          })();

          pool.add(promise);
          promise.finally(() => pool.delete(promise));
        }
        await Promise.all(pool);
      };

      await loadBatch(essential);
      setIsLoading(false);
      onComplete && onComplete();

      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
          type: 'PRELOAD_ASSETS',
          payload: allAssetsList.map(a => a.src)
        });
      }

      await loadBatch(lazy);
    };

    loadAssets();
  }, [onComplete]);

  if (!isLoading) return children;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center z-50">
      <div className="text-center space-y-6 max-w-md mx-auto px-6 font-sans">
        <div className="flex flex-col items-center justify-center gap-2 mb-8 uppercase tracking-[0.4em] text-white">
          <div className="text-2xl font-bold">Florain</div>
          <div className="text-2xl font-light text-[#DCC5B7]">Otium</div>
        </div>

        <div className="relative w-20 h-20 mx-auto">
          <Loader2 className="w-full h-full text-blue-500 animate-spin" />
          <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold text-white tracking-tight">Preparing Your 360 Villa Experience</h2>
          
          <div className="grid grid-cols-2 gap-4 text-[10px] uppercase tracking-wider text-white/40">
            <div className="bg-white/5 p-2 rounded border border-white/5">
              <div className="mb-1">Speed</div>
              <div className="text-blue-400 font-mono text-xs">{formatSpeed(internetSpeed)}</div>
            </div>
            <div className="bg-white/5 p-2 rounded border border-white/5">
              <div className="mb-1">Time Left</div>
              <div className="text-green-400 font-mono text-xs">{formatTime(estimatedTime)}</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-[10px] uppercase tracking-widest text-white/60 font-bold">
              <span>Assets Prepared</span>
              <span>{loadedAssets} / {totalAssets}</span>
            </div>
            
            <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-full rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                style={{ width: `${mbProgress}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-[10px] text-white/30 font-mono truncate max-w-[150px]">
                {currentAsset ? `Current: ${currentAsset}` : 'Initializing...'}
              </span>
              <span className="text-lg font-bold text-white/90 font-mono leading-none">
                {Math.round(mbProgress)}%
              </span>
            </div>
            
            {totalSize > 0 && (
              <div className="text-[10px] text-white/20 font-mono">
                {formatBytes(loadedSize)} / {formatBytes(totalSize)}
              </div>
            )}
          </div>
        </div>

        <div className="text-[10px] text-white/10 uppercase tracking-[0.2em] pt-4">
          Florain Otium Ac 2025
        </div>
      </div>
    </div>
  );
};

export default AssetPreloader;