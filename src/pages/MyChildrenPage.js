// src/pages/MyChildrenPage.js
import React from 'react';
import MyChildrenTab from '../features/parent/MyChildrenTab'; // Zorg dat het pad correct is

const MyChildrenPage = () => {
  // Deze pagina component is een simpele wrapper voor de Tab component.
  // Je zou hier later paginaspecifieke layout of context kunnen toevoegen indien nodig.
  return (
    <div>
      <MyChildrenTab />
    </div>
  );
};

export default MyChildrenPage;