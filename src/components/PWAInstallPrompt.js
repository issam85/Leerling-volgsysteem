// PWA Install Prompt Component
import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor, CheckCircle } from 'lucide-react';

const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deviceType, setDeviceType] = useState('desktop');

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase();
    if (/android/.test(userAgent)) {
      setDeviceType('android');
    } else if (/iphone|ipad|ipod/.test(userAgent)) {
      setDeviceType('ios');
    } else {
      setDeviceType('desktop');
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e) => {
      console.log('[PWA] beforeinstallprompt event triggered');
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Don't show immediately - wait a bit for user to get familiar with app
      setTimeout(() => {
        // Check if user hasn't dismissed it before
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        const lastShown = localStorage.getItem('pwa-install-last-shown');
        const now = Date.now();
        
        // Show if never dismissed, or if dismissed more than 7 days ago
        if (!dismissed || (lastShown && now - parseInt(lastShown) > 7 * 24 * 60 * 60 * 1000)) {
          setShowPrompt(true);
          localStorage.setItem('pwa-install-last-shown', now.toString());
        }
      }, 5000); // Show after 5 seconds
    };

    // Listen for app installation
    const handleAppInstalled = () => {
      console.log('[PWA] App installed successfully');
      setIsInstalled(true);
      setShowPrompt(false);
      setDeferredPrompt(null);
      
      // Show success message
      showInstallSuccessNotification();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Fallback for iOS or other browsers
      showManualInstallInstructions();
      return;
    }

    setIsLoading(true);

    try {
      // Show the install prompt
      const { outcome } = await deferredPrompt.prompt();
      console.log('[PWA] Install prompt outcome:', outcome);

      if (outcome === 'accepted') {
        console.log('[PWA] User accepted the install prompt');
      } else {
        console.log('[PWA] User dismissed the install prompt');
      }

      setDeferredPrompt(null);
      setShowPrompt(false);
    } catch (error) {
      console.error('[PWA] Error showing install prompt:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
    localStorage.setItem('pwa-install-last-shown', Date.now().toString());
  };

  const showManualInstallInstructions = () => {
    let instructions = '';
    
    if (deviceType === 'ios') {
      instructions = `
        Voor iOS:
        1. Tap op het delen icoon (□↑) in Safari
        2. Scroll naar beneden en tap "Voeg toe aan beginscherm"
        3. Tap "Toevoegen" om MijnLVS als app te installeren
      `;
    } else if (deviceType === 'android') {
      instructions = `
        Voor Android:
        1. Tap op het menu (⋮) in Chrome
        2. Selecteer "App installeren" of "Toevoegen aan startscherm"
        3. Tap "Installeren" om MijnLVS als app te installeren
      `;
    } else {
      instructions = `
        Voor Desktop:
        1. Klik op het installeer icoon (⊕) in de adresbalk
        2. Of ga naar instellingen → "MijnLVS installeren"
        3. Klik "Installeren" om MijnLVS als desktop app te installeren
      `;
    }

    alert(instructions);
  };

  const showInstallSuccessNotification = () => {
    const notification = document.createElement('div');
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: #10b981;
        color: white;
        padding: 16px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 9999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        font-size: 14px;
        max-width: 350px;
        animation: slideIn 0.3s ease-out;
      ">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="font-size: 24px;">🎉</div>
          <div>
            <div style="font-weight: 600; margin-bottom: 4px;">App geïnstalleerd!</div>
            <div style="opacity: 0.9; font-size: 13px;">MijnLVS is nu beschikbaar als app op je apparaat.</div>
          </div>
        </div>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  };

  if (isInstalled || !showPrompt) {
    return null;
  }

  const getDeviceIcon = () => {
    switch (deviceType) {
      case 'ios':
      case 'android':
        return <Smartphone size={24} className="text-blue-600" />;
      default:
        return <Monitor size={24} className="text-blue-600" />;
    }
  };

  const getInstallText = () => {
    switch (deviceType) {
      case 'ios':
        return 'Voeg toe aan beginscherm';
      case 'android':
        return 'Installeer app';
      default:
        return 'Installeer als desktop app';
    }
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden transform transition-all duration-300 animate-slideUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getDeviceIcon()}
              <div>
                <h3 className="text-white font-semibold text-sm">
                  Installeer MijnLVS
                </h3>
                <p className="text-emerald-100 text-xs">
                  Snellere toegang zonder browser
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-emerald-100 hover:text-white p-1 rounded transition-colors"
              aria-label="Sluiten"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="space-y-3 mb-4">
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
              <span>Werkt offline</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
              <span>Sneller laden</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
              <span>App-achtige ervaring</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
              <span>Push notificaties</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={handleInstallClick}
              disabled={isLoading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Download size={18} />
                  <span>{getInstallText()}</span>
                </>
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="px-4 py-3 text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PWAInstallPrompt;