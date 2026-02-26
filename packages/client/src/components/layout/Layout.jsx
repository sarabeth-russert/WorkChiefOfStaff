import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navigation from './Navigation';
import NotificationBanner from '../wellness/NotificationBanner';
import { WellnessSessionPanel } from '../wellness';
import useWellnessStore from '../../stores/wellnessStore';

const Layout = () => {
  const notifications = useWellnessStore((state) => state.notifications);
  const dismissNotification = useWellnessStore((state) => state.dismissNotification);

  // Show the most recent notification
  const notification = notifications.length > 0 ? notifications[0] : null;

  const handleDismiss = () => {
    if (notification) {
      dismissNotification(notification.id);
    }
  };

  const handleStartBreathing = () => {
    // TODO: Navigate to breathing exercise or trigger it
    console.log('Starting breathing exercise...');
  };

  return (
    <div className="min-h-screen bg-cream paper-texture">
      <Navigation />
      <NotificationBanner
        notification={notification}
        onDismiss={handleDismiss}
        onStartBreathing={handleStartBreathing}
      />
      <main className={`container mx-auto px-6 py-8 ${notification ? 'mt-24' : ''}`}>
        <Outlet />
      </main>
      <WellnessSessionPanel />
    </div>
  );
};

export default Layout;
