import React, { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

const ASSETS = {
  images: [
    '/assets/images/home-bg.png',
    '/assets/images/building.png',
    '/assets/images/image-3.png',
    '/assets/images/image-4.png',
    '/assets/images/image-5.png',
    '/assets/images/image-6.png',
    '/assets/images/Image-exterior.png',
    '/assets/images/territory.png',
    '/assets/images/yoga.jpg',
    '/assets/images/bnw-logo.png',
    '/assets/images/floorplan.png',
    '/assets/images/360-bg.png',
    '/assets/images/Entrance_VRay.jpg',
    '/assets/images/sofa_new.jpg',
    '/assets/images/living_door.jpg',
    '/assets/images/Corrior.jpg',
    '/assets/images/kitchen_doo-1.jpg',
    '/assets/images/kitchen_main.jpg',
    '/assets/images/Bedroom_Entrance.jpg',
    '/assets/images/Bedroom_Main.jpg',
    '/assets/images/Bathroom_1.jpg',
    '/assets/images/Bedroom_Entrance_1.jpg',
    '/assets/images/Kitchen_Entrance_2.jpg',
  ],
  icons: [
    '/assets/icons/bed-single-02.png',
    '/assets/icons/left-arrow.png',
    '/assets/icons/right-arrow.png',
    '/assets/icons/beach.png',
    '/assets/icons/tree-02.png',
    '/assets/icons/yoga-02.png',
    '/assets/icons/pool.png',
    '/assets/icons/3d-rotate.png',
    '/assets/icons/arrow-expand.png',
    '/assets/icons/arrow-shrink.png',
  ],
  videos: [
    '/assets/movies/movie_taj.mp4',
    '/assets/movies/home-bg-video.mp4'
  ],
  models: [
    '/assets/models/floorplan_wall.glb',
    '/assets/models/floorplan_glass.glb',
  ],
};

// Global cache to store preloaded assets
const AssetCache = {
  images: new Map(),
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
    this.images.clear();
    this.videos.clear();
    this.models.clear();
  }
};

// Make cache available globally
window.AssetCache = AssetCache;

const getAssetSize = async (src) => {
  try {
    // First check if it's cached in service worker
    if ('caches' in window) {
      const cache = await caches.open('tour-assets-v1');
      const cachedResponse = await cache.match(src);
      if (cachedResponse) {
        const blob = await cachedResponse.blob();
        return blob.size;
      }
    }
    
    // If not cached, try HEAD request first
    const headResponse = await fetch(src, { method: 'HEAD' });
    if (headResponse.ok) {
      const contentLength = headResponse.headers.get('content-length');
      if (contentLength && parseInt(contentLength, 10) > 0) {
        return parseInt(contentLength, 10);
      }
    }
    
    // If no content-length or it's 0, do a full fetch to get actual size
    const response = await fetch(src);
    if (!response.ok) throw new Error(`Failed to fetch: ${src}`);
    const blob = await response.blob();
    return blob.size;
  } catch (error) {
    console.warn(`Failed to get size for ${src}:`, error);
    return 0;
  }
};

const preloadImageToPersistentCache = (src, onProgress) => new Promise(async (resolve, reject) => {
  // Check if already cached in our in-memory cache
  if (AssetCache.has('images', src)) {
    resolve({ src, cached: true, loadTime: 0, success: true, size: 0 });
    return;
  }

  const img = new Image();
  const startTime = Date.now();
  
  // For images, we can't track real progress, so we'll simulate it
  let progressInterval;
  let simulatedProgress = 0;
  
  const simulateProgress = () => {
    if (simulatedProgress < 90) {
      simulatedProgress += Math.random() * 20;
      if (simulatedProgress > 90) simulatedProgress = 90;
      onProgress && onProgress(simulatedProgress);
    }
  };
  
  img.onload = async () => {
    // Clear simulation and set to 100%
    clearInterval(progressInterval);
    onProgress && onProgress(100);
    
    // Store in cache
    AssetCache.set('images', src, img);
    
    // Also trigger browser caching by setting src again
    const cacheImg = new Image();
    cacheImg.src = src;
    
    try {
      // Check service worker cache first, then network
      let size = 0;
      if ('caches' in window) {
        const cache = await caches.open('tour-assets-v1');
        const cachedResponse = await cache.match(src);
        if (cachedResponse) {
          const blob = await cachedResponse.blob();
          size = blob.size;
        }
      }
      
      // If not in cache or size is 0, fetch from network
      if (size === 0) {
        const response = await fetch(src);
        const blob = await response.blob();
        size = blob.size;
      }
      
      resolve({ 
        src, 
        cached: false,
        loadTime: Date.now() - startTime, 
        success: true,
        size: size
      });
    } catch (error) {
      console.warn(`Failed to get size for ${src}:`, error);
      resolve({ 
        src, 
        cached: false,
        loadTime: Date.now() - startTime, 
        success: true,
        size: 0
      });
    }
  };
  
  img.onerror = () => {
    clearInterval(progressInterval);
    reject(new Error(`Failed to load image: ${src}`));
  };
  
  // Start progress simulation
  progressInterval = setInterval(simulateProgress, 100);
  img.src = src;
});

const preloadVideoToPersistentCache = (src, onProgress) => new Promise((resolve, reject) => {
  // Check if already cached
  if (AssetCache.has('videos', src)) {
    resolve({ src, cached: true, loadTime: 0, success: true, size: 0 });
    return;
  }

  const video = document.createElement('video');
  const startTime = Date.now();
  
  // Track video loading progress
  const updateProgress = () => {
    if (video.buffered.length > 0) {
      const buffered = video.buffered.end(0);
      const duration = video.duration;
      if (duration > 0) {
        const progress = (buffered / duration) * 100;
        onProgress && onProgress(progress);
      }
    }
  };
  
  video.addEventListener('progress', updateProgress);
  video.addEventListener('loadeddata', updateProgress);
  
  video.onloadeddata = () => {
    onProgress && onProgress(100);
    
    // Store in cache
    AssetCache.set('videos', src, video);
    
    // Get actual size by fetching the blob
    fetch(src)
      .then(res => res.blob())
      .then(blob => {
        resolve({ 
          src, 
          cached: false,
          loadTime: Date.now() - startTime, 
          success: true,
          size: blob.size
        });
      })
      .catch(() => {
        resolve({ 
          src, 
          cached: false,
          loadTime: Date.now() - startTime, 
          success: true,
          size: 0
        });
      });
  };
  
  video.onerror = () => reject(new Error(`Failed to load video: ${src}`));
  video.src = src;
  video.preload = 'auto';
  video.load();
});

const preloadModelToPersistentCache = (src, onProgress) => new Promise(async (resolve, reject) => {
  // Check if already cached in our in-memory cache
  if (AssetCache.has('models', src)) {
    resolve({ src, cached: true, loadTime: 0, success: true, size: 0 });
    return;
  }

  const startTime = Date.now();
  
  try {
    let blob;
    let size = 0;
    
    // Check service worker cache first
    if ('caches' in window) {
      const cache = await caches.open('tour-assets-v1');
      const cachedResponse = await cache.match(src);
      if (cachedResponse) {
        blob = await cachedResponse.blob();
        size = blob.size;
        onProgress && onProgress(100);
        console.log(`GLB ${src} loaded from service worker cache, size: ${size} bytes`);
      }
    }
    
    // If not in cache, fetch from network with progress tracking
    if (!blob) {
      const response = await fetch(src);
      if (!response.ok) throw new Error(`Failed: ${src}`);
      
      const contentLength = response.headers.get('content-length');
      const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
      
      if (totalSize > 0) {
        // Track download progress
        const reader = response.body.getReader();
        const chunks = [];
        let receivedLength = 0;
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          chunks.push(value);
          receivedLength += value.length;
          
          const progress = (receivedLength / totalSize) * 100;
          onProgress && onProgress(progress);
        }
        
        blob = new Blob(chunks);
        size = blob.size;
      } else {
        blob = await response.blob();
        size = blob.size;
        onProgress && onProgress(100);
      }
      
      console.log(`GLB ${src} loaded from network, size: ${size} bytes`);
    }
    
    // Store blob in cache
    AssetCache.set('models', src, blob);
    
    resolve({ 
      src, 
      cached: false,
      loadTime: Date.now() - startTime, 
      success: true,
      size: size
    });
  } catch (error) {
    console.error(`Failed to load model ${src}:`, error);
    reject(error);
  }
});

const formatBytes = (bytes) => {
  if (bytes === 0) return '0 MB';
  const mb = bytes / (1024 * 1024);
  return mb.toFixed(1) + ' MB';
};

const formatSpeed = (bytesPerSecond) => {
  if (bytesPerSecond === 0) return '0 Mbps';
  const mbps = (bytesPerSecond * 8) / (1024 * 1024); // Convert to Mbps
  return mbps.toFixed(1) + ' Mbps';
};

const formatTime = (seconds) => {
  if (seconds === 0 || !isFinite(seconds)) return '0s';
  if (seconds < 60) return Math.round(seconds) + 's';
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}m ${remainingSeconds}s`;
};

const AssetPreloader = ({ onComplete, children }) => {
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadedAssets, setLoadedAssets] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentAsset, setCurrentAsset] = useState('');
  const [currentAssetProgress, setCurrentAssetProgress] = useState(0);
  const [totalSize, setTotalSize] = useState(0);
  const [loadedSize, setLoadedSize] = useState(0);
  const [cachedCount, setCachedCount] = useState(0);
  const [sizeCalculated, setSizeCalculated] = useState(false);
  const [internetSpeed, setInternetSpeed] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);
  const [mbProgress, setMbProgress] = useState(0);
  const loadingRef = useRef(false);
  const speedCalculationRef = useRef({ startTime: 0, startBytes: 0, samples: [] });

  const totalAssets = ASSETS.images.length + ASSETS.icons.length + ASSETS.videos.length + ASSETS.models.length;

  useEffect(() => {
    if (loadingRef.current) return;
    loadingRef.current = true;

    const loadAssets = async () => {
      const allAssets = [
        ...ASSETS.images.map(src => ({ src, type: 'images', loader: preloadImageToPersistentCache })),
        ...ASSETS.icons.map(src => ({ src, type: 'images', loader: preloadImageToPersistentCache })),
        ...ASSETS.videos.map(src => ({ src, type: 'videos', loader: preloadVideoToPersistentCache })),
        ...ASSETS.models.map(src => ({ src, type: 'models', loader: preloadModelToPersistentCache })),
      ];

      // First, calculate total size
      setCurrentAsset('Calculating total size...');
      setCurrentAssetProgress(0);
      const sizePromises = allAssets.map(({ src }) => getAssetSize(src));
      const sizes = await Promise.all(sizePromises);
      const calculatedTotalSize = sizes.reduce((sum, size) => sum + size, 0);
      setTotalSize(calculatedTotalSize);
      setSizeCalculated(true);

      let loaded = 0;
      let loadedBytes = 0;
      let cached = 0;
      const startTime = Date.now();
      speedCalculationRef.current.startTime = startTime;
      speedCalculationRef.current.startBytes = 0;

      // Process assets sequentially to avoid race conditions
      for (const { src, type, loader } of allAssets) {
        try {
          const assetName = src.split('/').pop() || src;
          setCurrentAsset(assetName);
          setCurrentAssetProgress(0);
          
          // Progress callback for individual asset
          const onProgress = (progress) => {
            setCurrentAssetProgress(progress);
          };
          
          const result = await loader(src, onProgress);
          
          if (result.cached) {
            cached++;
            setCachedCount(cached);
            setCurrentAssetProgress(100);
          } else {
            loadedBytes += result.size;
            setLoadedSize(loadedBytes);
            setCurrentAssetProgress(100);
            
            // Calculate progress based on MBs
            const mbProgressValue = calculatedTotalSize > 0 ? (loadedBytes / calculatedTotalSize) * 100 : 0;
            setMbProgress(mbProgressValue);
            
            // Calculate internet speed
            const currentTime = Date.now();
            const elapsedTime = (currentTime - startTime) / 1000; // in seconds
            
            if (elapsedTime > 0 && loadedBytes > 0) {
              const currentSpeed = loadedBytes / elapsedTime; // bytes per second
              setInternetSpeed(currentSpeed);
              
              // Calculate estimated time for remaining data
              const remainingBytes = calculatedTotalSize - loadedBytes;
              const estimated = remainingBytes / currentSpeed;
              setEstimatedTime(estimated);
            }
          }
          
          loaded++;
          setLoadedAssets(loaded);
          setLoadingProgress((loaded / totalAssets) * 100);
          
        } catch (err) {
          console.error(`Failed to load ${src}:`, err);
          loaded++;
          setLoadedAssets(loaded);
          setLoadingProgress((loaded / totalAssets) * 100);
          setCurrentAssetProgress(100);
        }
      }

      console.log(`Preloading complete. ${cached} assets were already cached.`);
      setIsLoading(false);
      onComplete && onComplete();
    };

    loadAssets();
  }, [onComplete, totalAssets]);

  if (!isLoading) return children;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center z-50">
      <div className="text-center space-y-6 max-w-md mx-auto px-6">
        <div className="flex items-center justify-center gap-8 mb-8">
          <img src="/assets/images/bnw-logo.png" alt="Company Logo" className="h-16 object-contain" />
          <img src="/assets/images/web3-white.png" alt="Partner Logo" className="h-16 object-contain" />
        </div>

        <div className="relative">
          <div className="w-20 h-20 mx-auto mb-4">
            <Loader2 className="w-full h-full text-blue-500 animate-spin" />
          </div>
          <div className="absolute inset-0 w-20 h-20 mx-auto border-4 border-blue-500/20 rounded-full"></div>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">Loading Web3Interactive - 360 Virtual Tour</h2>
          
          <div className="space-y-3">
            {/* Internet Speed */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Internet Speed</span>
              <span className="text-blue-400 font-medium">{formatSpeed(internetSpeed)}</span>
            </div>
            
            {/* Estimated Time */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-300">Estimated Time</span>
              <span className="text-green-400 font-medium">{formatTime(estimatedTime)}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm text-gray-300">
              <span>Assets loaded</span>
              <span>{loadedAssets} / {totalAssets}</span>
            </div>
            
            {cachedCount > 0 && (
              <div className="flex justify-between text-sm text-green-400">
                <span>Already cached</span>
                <span>{cachedCount}</span>
              </div>
            )}
            
            {/* Overall Progress Bar */}
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${mbProgress}%` }}
              ></div>
            </div>
            <div className="text-center text-lg font-semibold text-blue-400">
              {Math.round(mbProgress)}%
            </div>
            
            {/* Individual Asset Progress */}
            {currentAsset && (
              <div className="space-y-2">
                <div className="text-sm text-gray-400">Loading: {currentAsset}</div>
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-1.5 rounded-full transition-all duration-150 ease-out"
                    style={{ width: `${currentAssetProgress}%` }}
                  ></div>
                </div>
                <div className="text-center text-sm text-green-400">
                  {Math.round(currentAssetProgress)}%
                </div>
              </div>
            )}
            
            {sizeCalculated && totalSize > 0 && (
              <div className="text-center text-sm text-gray-400">
                {formatBytes(loadedSize)} / {formatBytes(totalSize)}
              </div>
            )}
          </div>
        </div>

        <div className="text-xs text-gray-500 mt-8">
          Please wait while we prepare your immersive experience...
        </div>
      </div>
    </div>
  );
};

export default AssetPreloader;