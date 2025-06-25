// frontend_dream_synthesizer/src/components/common/NavigationButton.jsx
import React from 'react';

const NavigationButton = ({ text, onClick, icon = null }) => (
  <button
    onClick={onClick}
    className="text-white hover:text-indigo-200 transition duration-200 px-2 py-1 rounded-md text-sm sm:text-base flex items-center gap-1"
  >
    {icon && <span className="text-xl">{icon}</span>}
    <span className="hidden sm:inline-block">{text}</span>
  </button>
);

export default NavigationButton;