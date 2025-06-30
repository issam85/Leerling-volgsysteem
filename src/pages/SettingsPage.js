import React from 'react';
import SettingsTab from '../features/admin/settings/SettingsTab';
// Optioneel: SettingsContext als je instellingen globaal wilt beheren
// import { SettingsProvider } from '../contexts/SettingsContext';

const SettingsPage = () => {
  return (
    // <SettingsProvider> // Als je een context gebruikt
      <SettingsTab />
    // </SettingsProvider>
  );
};

export default SettingsPage;