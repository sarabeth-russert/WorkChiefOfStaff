import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { Loading, ErrorBoundary } from './components/ui';

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Expedition = lazy(() => import('./pages/Expedition'));
const TradingPost = lazy(() => import('./pages/TradingPost'));
const MapRoom = lazy(() => import('./pages/MapRoom'));
const Outpost = lazy(() => import('./pages/Outpost'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Suspense fallback={<div className="min-h-screen bg-cream paper-texture flex items-center justify-center"><Loading text="Loading Adventureland..." /></div>}>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="expedition" element={<Expedition />} />
              <Route path="trading-post" element={<TradingPost />} />
              <Route path="map-room" element={<MapRoom />} />
              <Route path="outpost" element={<Outpost />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
