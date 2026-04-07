import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, Clock, Database, Globe, HardDrive } from 'lucide-react';

const CacheTester = () => {
  const [cacheStatus, setCacheStatus] = useState({
    memoryCache: { available: false, count: 0, items: [] },
    serviceWorker: { available: false, count: 0, items: [] },
    browserCache: { available: false, status: 'unknown' }
  });
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Test assets from your configuration
  const testAssets = [
    '/assets/images/home-bg.png',
    '/assets/images/building.png',
    '/assets/images/bnw-logo.png',
    '/assets/icons/bed-single-02.png',
    '/assets/movies/movie.mp4',
    '/assets/models/floorplan_wall.glb'
  ];

  // Check memory cache (your AssetCache)
  const checkMemoryCache = () => {
    const hasGlobalCache = typeof window !== 'undefined' && window.AssetCache;
    if (!hasGlobalCache) return { available: false, count: 0, items: [] };

    const cache = window.AssetCache;
    const items = [];
    
    // Check images
    testAssets.forEach(asset => {
      if (cache.has('images', asset)) {
        items.push({ url: asset, type: 'image', cached: true });
      }
      if (cache.has('videos', asset)) {
        items.push({ url: asset, type: 'video', cached: true });
      }
      if (cache.has('models', asset)) {
        items.push({ url: asset, type: 'model', cached: true });
      }
    });

    return {
      available: true,
      count: items.length,
      items
    };
  };

  // Check Service Worker cache
  const checkServiceWorkerCache = async () => {
    if (!('serviceWorker' in navigator) || !('caches' in window)) {
      return { available: false, count: 0, items: [] };
    }

    try {
      const cache = await caches.open('tour-assets-v1');
      const cachedRequests = await cache.keys();
      const items = cachedRequests.map(req => ({
        url: req.url,
        type: 'service-worker',
        cached: true
      }));

      return {
        available: true,
        count: items.length,
        items
      };
    } catch (error) {
      console.error('Service Worker cache check failed:', error);
      return { available: false, count: 0, items: [] };
    }
  };

  // Check browser cache by measuring load times
  const checkBrowserCache = async () => {
    const results = [];
    
    for (const asset of testAssets.slice(0, 3)) { // Test first 3 assets
      const startTime = performance.now();
      
      try {
        const response = await fetch(asset, { cache: 'default' });
        const endTime = performance.now();
        const loadTime = endTime - startTime;
        
        results.push({
          url: asset,
          loadTime: Math.round(loadTime),
          cached: loadTime < 50, // Assume cached if loads in < 50ms
          status: response.status,
          fromCache: response.headers.get('cf-cache-status') === 'HIT' || loadTime < 50
        });
      } catch (error) {
        results.push({
          url: asset,
          loadTime: 0,
          cached: false,
          status: 'error',
          error: error.message
        });
      }
    }
    
    return results;
  };

  // Run comprehensive cache test
  const runCacheTest = async () => {
    setIsLoading(true);
    
    try {
      // Check memory cache
      const memoryCache = checkMemoryCache();
      
      // Check service worker cache
      const serviceWorkerCache = await checkServiceWorkerCache();
      
      // Check browser cache
      const browserCacheResults = await checkBrowserCache();
      
      setCacheStatus({
        memoryCache,
        serviceWorker: serviceWorkerCache,
        browserCache: { 
          available: true, 
          status: 'tested',
          results: browserCacheResults
        }
      });
      
      setTestResults(browserCacheResults);
    } catch (error) {
      console.error('Cache test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear all caches
  const clearAllCaches = async () => {
    try {
      // Clear memory cache
      if (window.AssetCache) {
        window.AssetCache.clear();
      }
      
      // Clear service worker cache
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Refresh page to clear browser cache
      window.location.reload();
    } catch (error) {
      console.error('Failed to clear caches:', error);
    }
  };

  useEffect(() => {
    runCacheTest();
  }, []);

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-800">Asset Cache Testing Tool</h1>
          <div className="flex gap-2">
            <button
              onClick={runCacheTest}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Test Cache
            </button>
            <button
              onClick={clearAllCaches}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              <Database className="w-4 h-4" />
              Clear All
            </button>
          </div>
        </div>

        {/* Cache Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Memory Cache */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <div className="flex items-center gap-2 mb-2">
              <HardDrive className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-800">Memory Cache</h3>
            </div>
            <div className="flex items-center gap-2">
              {cacheStatus.memoryCache.available ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm">
                {cacheStatus.memoryCache.available 
                  ? `${cacheStatus.memoryCache.count} items cached`
                  : 'Not available'
                }
              </span>
            </div>
          </div>

          {/* Service Worker Cache */}
          <div className="border rounded-lg p-4 bg-green-50">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-800">Service Worker</h3>
            </div>
            <div className="flex items-center gap-2">
              {cacheStatus.serviceWorker.available ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <XCircle className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm">
                {cacheStatus.serviceWorker.available 
                  ? `${cacheStatus.serviceWorker.count} items cached`
                  : 'Not available'
                }
              </span>
            </div>
          </div>

          {/* Browser Cache */}
          <div className="border rounded-lg p-4 bg-purple-50">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-purple-800">Browser Cache</h3>
            </div>
            <div className="flex items-center gap-2">
              {cacheStatus.browserCache.status === 'tested' ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <Clock className="w-4 h-4 text-yellow-500" />
              )}
              <span className="text-sm">
                {cacheStatus.browserCache.status === 'tested' 
                  ? 'Load times measured'
                  : 'Testing...'
                }
              </span>
            </div>
          </div>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Load Time Test Results</h3>
            <div className="space-y-2">
              {testResults.map((result, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div className="flex items-center gap-2">
                    {result.cached || result.fromCache ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <Clock className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className="text-sm font-mono">
                      {result.url.split('/').pop()}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className={`text-sm ${result.cached ? 'text-green-600' : 'text-yellow-600'}`}>
                      {result.loadTime}ms
                    </span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      result.cached ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {result.cached ? 'Cached' : 'Network'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">How to Test Your Cache:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
            <li>First load: Click "Test Cache" - should show low cache counts</li>
            <li>Run your asset preloader in the main app</li>
            <li>Come back and click "Test Cache" again - should show higher counts</li>
            <li>Check browser dev tools → Application → Storage to see cached files</li>
            <li>Use "Clear All" to test the full loading cycle again</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default CacheTester;