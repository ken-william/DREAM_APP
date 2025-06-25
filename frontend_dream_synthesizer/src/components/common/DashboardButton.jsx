// frontend_dream_synthesizer/src/components/common/DashboardButton.jsx
import React from 'react';

const DashboardButton = ({ text, icon, onClick }) => (
  <button
    onClick={onClick}
    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-6 rounded-lg shadow-md hover:shadow-lg transition duration-300 transform hover:-translate-y-1 flex flex-col items-center justify-center text-xl"
  >
    <span className="text-4xl mb-2">{icon}</span>
    {text}
  </button>
);

export default DashboardButton;