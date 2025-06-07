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
  const { teacherAssignedClasses, loading: dataLoading } = realData;

  // Wacht tot de basisdata is geladen
  if (dataLoading || !currentUser) {
    return <LoadingSpinner message="Wachten op data en gebruiker..." />;
  }

  // Stijlen voor de leesbaarheid
  const preStyle = { background: '#eee', padding: '1rem', borderRadius: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-all', border: '1px solid #ccc', fontSize: '12px', marginTop: '0.5rem' };
  const sectionStyle = { background: 'white', padding: '1.5rem', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '1.5rem' };
  const h2Style = { fontSize: '18px', marginBottom: '1rem', borderBottom: '1px solid #ccc', paddingBottom: '0.5rem' };
  const pStyle = { margin: '0.5rem 0' };

  // De zoekactie
  const foundClass = classId ? teacherAssignedClasses.find(c => String(c.id) === String(classId)) : null;

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', background: '#f0f0f0' }}>
      <h1 style={{ fontSize: '24px', borderBottom: '2px solid black', marginBottom: '1rem', paddingBottom: '0.5rem' }}>
        🕵️‍♂️ Debug Pagina
      </h1>

      <div style={sectionStyle}>
        <h2 style={h2Style}>1. De Zoekopdracht (Input)</h2>
        <p style={pStyle}><strong>URL Klas ID (classId):</strong> <br/><code>{classId || "N.v.t."}</code></p>
        <p style={pStyle}><strong>Ingelogde Docent ID (currentUser.id):</strong> <br/><code>{currentUser?.id || "N.v.t."}</code></p>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>2. De Databron (Waar we in zoeken)</h2>
        <p style={pStyle}><strong><code>teacherAssignedClasses</code> array uit DataContext ({teacherAssignedClasses.length} items):</strong></p>
        <pre style={preStyle}>
          {JSON.stringify(teacherAssignedClasses, null, 2)}
        </pre>
      </div>

      <div style={sectionStyle}>
        <h2 style={h2Style}>3. De Vergelijking (Resultaat)</h2>
        {classId ? (
          <>
            <p><strong>Resultaat van zoektocht naar ID <code>{classId}</code>:</strong></p>
            {foundClass ? (
              <pre style={{...preStyle, background: 'lightgreen', border: '1px solid green'}}>
                <strong>✅ GEVONDEN:</strong><br/>
                {JSON.stringify(foundClass, null, 2)}
              </pre>
            ) : (
              <pre style={{...preStyle, background: 'lightcoral', border: '1px solid red'}}>
                <strong>❌ NIET GEVONDEN!</strong><br/>
                De classId uit de URL komt in GEEN ENKELE klas in de `teacherAssignedClasses` array voor.
              </pre>
            )}
          </>
        ) : (
          <p>Geen classId in de URL om te zoeken.</p>
        )}
      </div>
    </div>
  );
};

export default TeacherMyClassesPage;