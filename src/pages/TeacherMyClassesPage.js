// src/pages/TeacherMyClassesPage.js - DE "NAKTE WAARHEID" DIAGNOSE-VERSIE

import React from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const TeacherMyClassesPage = () => {
  const { classId } = useParams();
  const { realData } = useData();
  const { currentUser, loadingUser } = useAuth();

  // Wacht tot de AuthContext klaar is. Dit is de eerste en belangrijkste gate.
  if (loadingUser) {
    return <LoadingSpinner message="Wachten op authenticatie..." />;
  }

  // Stijlen voor de leesbaarheid van de debug-output
  const preStyle = {
    background: '#f0f0f0',
    padding: '1rem',
    borderRadius: '8px',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    border: '1px solid #ccc',
    fontSize: '12px',
    marginTop: '0.5rem',
    maxHeight: '400px',
    overflowY: 'auto'
  };
  
  const sectionStyle = {
    background: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    border: '1px solid #ddd',
    marginBottom: '1.5rem'
  };

  const h2Style = {
    fontSize: '18px',
    marginBottom: '1rem',
    borderBottom: '1px solid #ccc',
    paddingBottom: '0.5rem',
    color: 'black'
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', background: '#f9fafb' }}>
      <h1 style={{ fontSize: '24px', borderBottom: '2px solid black', marginBottom: '1rem', paddingBottom: '0.5rem' }}>
        🕵️‍♂️ Diagnose Pagina
      </h1>

      <div style={sectionStyle}>
        <h2 style={h2Style}>1. Input van de URL</h2>
        <p><strong>URL Klas ID (classId):</strong> <br/><code>{classId || "N.v.t."}</code></p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>2. Status van `AuthContext`</h2>
        <p><strong>Is `loadingUser` true?</strong> {loadingUser.toString()}</p>
        <p><strong>Heeft `currentUser` een waarde?</strong> {currentUser ? '✅ Ja' : '❌ Nee'}</p>
        <p><strong>Inhoud van `currentUser`:</strong></p>
        <pre style={preStyle}>
          {JSON.stringify(currentUser, null, 2)}
        </pre>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>3. Status van `DataContext`</h2>
        <p><strong>Is `realData.loading` true?</strong> {realData.loading.toString()}</p>
        <p><strong>Heeft `realData.error` een waarde?</strong> {realData.error || 'Nee'}</p>
        <p><strong>Inhoud van `realData`:</strong></p>
        <pre style={preStyle}>
          {JSON.stringify(realData, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default TeacherMyClassesPage;