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
  const { classes, students, loading: dataLoading } = realData;

  // Stop met renderen en toon een laadscherm zolang de basisdata er niet is.
  if (dataLoading || !currentUser) {
    return <LoadingSpinner message="Wachten op data en gebruiker..." />;
  }

  // Probeer de klas te vinden.
  const foundClass = classId ? classes.find(c => String(c.id) === String(classId)) : null;

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace', fontSize: '14px', background: '#f5f5f5' }}>
      <h1 style={{ fontSize: '24px', borderBottom: '2px solid black', marginBottom: '1rem' }}>
        🕵️‍♂️ Debug Pagina voor Mijn Klassen
      </h1>

      <div style={{ marginBottom: '1.5rem', background: 'white', padding: '1rem' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '0.5rem' }}>1. Basis Informatie</h2>
        <p><strong>URL Klas ID (classId):</strong> {classId || "Geen (je bent op de overzichtspagina)"}</p>
        <p><strong>Ingelogde Docent ID:</strong> {currentUser?.id || "Geen gebruiker gevonden"}</p>
      </div>

      <div style={{ marginBottom: '1.5rem', background: 'white', padding: '1rem' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '0.5rem' }}>2. Data uit DataContext</h2>
        <p><strong>Aantal klassen geladen:</strong> {classes.length}</p>
        <p><strong>Aantal leerlingen geladen:</strong> {students.length}</p>
      </div>

      <div style={{ marginBottom: '1.5rem', background: 'white', padding: '1rem' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '0.5rem' }}>3. De Zoektocht</h2>
        <p><strong>Gevonden Klas (foundClass):</strong></p>
        <pre style={{ background: '#eee', padding: '0.5rem', borderRadius: '4px', whiteSpace: 'pre-wrap' }}>
          {foundClass ? JSON.stringify(foundClass, null, 2) : "NULL (Klas niet gevonden met de ID hierboven)"}
        </pre>
      </div>
      
      {foundClass && (
        <div style={{ background: 'lightgreen', padding: '1rem', border: '2px solid green' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '0.5rem' }}>✅ CONCLUSIE: KLAS GEVONDEN!</h2>
            <p>De pagina zou nu de details moeten tonen. Als dat niet gebeurt, zit het probleem in de render-logica na de zoektocht.</p>
        </div>
      )}

      {!foundClass && classId && (
        <div style={{ background: 'lightcoral', padding: '1rem', border: '2px solid red' }}>
            <h2 style={{ fontSize: '18px', marginBottom: '0.5rem' }}>❌ CONCLUSIE: KLAS NIET GEVONDEN!</h2>
            <p>Dit is de kern van het probleem. De `classId` uit de URL kon niet worden gevonden in de lijst met klassen uit de `DataContext`.</p>
            <p><strong>Mogelijke oorzaken:</strong></p>
            <ul>
                <li>- Een timingprobleem (deze pagina laadt voordat DataContext klaar is).</li>
                <li>- Een onzichtbaar verschil tussen de ID's (bijv. spaties, type-verschil).</li>
            </ul>
        </div>
      )}
    </div>
  );
};

export default TeacherMyClassesPage;