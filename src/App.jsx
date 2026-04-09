// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import HomePage from "./pages/HomePage";
import TourPage from "./pages/TourPage";
import { AudioProvider } from "./context/AudioContext";
import AssetPreloader from "./components/common/AssetPreloader";
import EditorPage from "./pages/EditorPage";

/**
 * App component serves as the main entry point for the React application.
 * It manages the current page view using React Router.
 */
function App() {
  const [assetsLoaded, setAssetsLoaded] = React.useState(false);

  const handleAssetsLoaded = () => {
    setAssetsLoaded(true);
    console.log('All assets have been preloaded and cached!');
  };

  return (
    <AudioProvider>
      <Router>
        <AssetPreloader onComplete={handleAssetsLoaded}>
          <div className="App flex flex-col min-h-screen bg-gray-900">
            {/* Navigation Header */}
            <header className="fixed top-0 left-0 w-full z-50 bg-transparent border-b border-white/20 backdrop-blur-md">
              <div className="container mx-auto flex justify-between items-center px-4 py-4">
                {/* Left spacer */}
                <div className="w-1/3 flex justify-start">
                </div>

                {/* Center logo */}
                <div className="w-1/3 flex justify-center">
                  <Link to="/" className="flex flex-col items-center">
                    <img 
                      src="/images/logo.png" 
                      alt="Florain Otium Logo" 
                      className="h-12 w-auto object-contain"
                    />
                  </Link>
                </div>

                {/* Right spacer */}
                <div className="w-1/3 flex justify-end">
                </div>
              </div>
            </header>

            {/* Main Content Area: Renders the active page based on the route */}
            <main className="flex-grow pt-20">
              {/* Use Routes to define your application's routes */}
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/tour" element={<TourPage />} />
                <Route path="/editor" element={<EditorPage />} />
                {/* Define a fallback route for unmatched paths */}
                <Route path="*" element={<HomePage />} />
              </Routes>
            </main>
          </div>
        </AssetPreloader>
      </Router>
    </AudioProvider>
  );
}

export default App;