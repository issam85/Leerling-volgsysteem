// src/components/SessionTimeoutWarning.js - Session timeout warning modal
import React from 'react';
import Button from './Button';
import Modal from './Modal';
import { Clock, LogOut, RefreshCw } from 'lucide-react';

const SessionTimeoutWarning = ({ isOpen, timeLeft, onExtend, onLogout }) => {
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={() => {}} className="max-w-md">
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 mb-4">
          <Clock className="h-6 w-6 text-yellow-600" />
        </div>
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Sessie verloopt binnenkort
        </h3>
        
        <p className="text-sm text-gray-500 mb-4">
          Uw sessie verloopt over <strong className="text-yellow-600">{formatTime(timeLeft)}</strong> 
          vanwege inactiviteit. Wilt u ingelogd blijven?
        </p>
        
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={onLogout}
            className="flex-1 flex items-center justify-center"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Uitloggen
          </Button>
          
          <Button
            variant="primary"
            onClick={onExtend}
            className="flex-1 flex items-center justify-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Sessie verlengen
          </Button>
        </div>
        
        <p className="text-xs text-gray-400 mt-3">
          Voor uw veiligheid worden sessies automatisch beëindigd na 2 uur inactiviteit.
        </p>
      </div>
    </Modal>
  );
};

export default SessionTimeoutWarning;