// src/pages/TeacherMyClassesPage.js - DE "NAKTE WAARHEID" DEBUG-VERSIE

import React from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const TeacherMyClassesPage = () => {
  const { classId } = useParams();
  const { realData } = useData();
  const { currentUser } = useAuth();
  const { classes, loading: dataLoading } = realData;

  // Wacht tot de basisdata is geladen
  if (dataLoading || !currentUser) {
    return <LoadingSpinner message="Wachten op data en gebruiker..." />;
  }

  // Stijl voor de leesbaarheid
  const preStyle = {
    background: '#eee',
    padding: '1rem',
    borderRadius: '8px',
    whiteSpace: 'pre-wrap', // Zorgt dat de tekst afbreekt
    wordBreak: 'break-all',
    border: '1px solid #ccc',
    fontSize: '12px'
  };
  
  const sectionStyle = {
    background: 'white',
    padding: '1.5rem',
    borderRadius: '8px',
    border: '1px solid #ddd',
    marginBottom: '1.5rem'
  };

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', background: '#f0f0f0' }}>
      <h1 style={{ fontSize: '24px', borderBottom: '2px solid black', marginBottom: '1rem' }}>
        🕵️‍♂️ DEBUG PAGINA
      </h1>

      <div style={sectionStyle}>
        <h2 style={{ fontSize: '18px', marginBottom: '0.5rem' }}>1. De Input (Wat we zoeken)</h2>
        <p><strong>URL Klas ID (classId):</strong> {classId || "N.v.t."}</p>
        <p><strong>Ingelogde Docent ID (currentUser.id):</strong> {currentUser?.id || "N.v.t."}</p>
      </div>

      <div style={sectionStyle}>
        <h2 style={{ fontSize: '18px', marginBottom: '0.5rem' }}>2. De Data (Waar we in zoeken)</h2>
        <p><strong>Volledige `classes` array uit DataContext ({classes.length} items):</strong></p>
        <pre style={preStyle}>
          {JSON.stringify(classes, null, 2)}
        </pre>
      </div>

      <div style={sectionStyle}>
        <h2 style={{ fontSize: '18px', marginBottom: '0.5rem' }}>3. De Vergelijking</h2>
        <p>Hieronder staat elke klas en of het ID en de leraar-ID overeenkomen.</p>
        {classes.map(c => {
            const isIdMatch = String(c.id) === String(classId);
            const isTeacherMatch = String(c.teacher_id) === String(currentUser.id);
            return (
                <div key={c.id} style={{ border: '1px solid #ccc', padding: '1rem', margin: '0.5rem 0', background: isIdMatch ? 'lightgreen' : 'white' }}>
                    <p><strong>Klas:</strong> {c.name} (ID: {c.id})</p>
                    <p><strong>Match met URL-ID?</strong> {isIdMatch ? '✅ JA' : '❌ NEE'}</p>
                    <p><strong>Leraar ID in data:</strong> '{c.teacher_id}'</p>
                    <p><strong>Match met ingelogde leraar?</strong> {isTeacherMatch ? '✅ JA' : '❌ NEE'}</p>
                </div>
            )
        })}
      </div>
    </div>
  );
};

export default TeacherMyClassesPage;