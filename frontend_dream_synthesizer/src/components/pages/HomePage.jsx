// frontend_dream_synthesizer/src/components/pages/HomePage.jsx
import React from 'react';

const HomePage = ({ setCurrentPage }) => (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gradient-to-br from-indigo-600 to-purple-700 text-white p-4">
      <div className="text-center animate-fade-in-up">
        <h1 className="text-5xl md:text-7xl font-extrabold mb-4 drop-shadow-lg">Synthétiseur de Rêves</h1>
        <p className="text-xl md:text-2xl mb-8 opacity-0 animate-slide-in-up delay-300">Transformez vos rêves en expériences visuelles et partagez-les avec vos amis !</p>
        <div className="space-x-4 opacity-0 animate-slide-in-up delay-600">
          <button
            onClick={() => setCurrentPage('login')}
            className="bg-white text-indigo-700 font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition duration-300"
          >
            Se Connecter
          </button>
          <button
            onClick={() => setCurrentPage('register')}
            className="bg-transparent border-2 border-white text-white font-bold py-3 px-8 rounded-full shadow-lg hover:shadow-xl transform hover:scale-105 transition duration-300"
          >
            S'inscrire
          </button>
        </div>
      </div>
    </div>
  );

export default HomePage;