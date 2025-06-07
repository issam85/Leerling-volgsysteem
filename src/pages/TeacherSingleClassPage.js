// src/pages/TeacherSingleClassPage.js - SIMPLE TEST VERSION
import React from 'react';
import { useParams } from 'react-router-dom';

const TeacherSingleClassPage = () => {
  const { classId } = useParams();
  
  return (
    <div style={{ padding: '2rem' }}>
      <h1>✅ Route werkt!</h1>
      <p>Je bekijkt klas: <strong>{classId}</strong></p>
      <p>Deze pagina wordt geladen via TeacherSingleClassPage component.</p>
    </div>
  );
};

export default TeacherSingleClassPage;