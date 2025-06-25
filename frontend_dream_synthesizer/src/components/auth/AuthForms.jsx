// frontend_dream_synthesizer/src/components/auth/AuthForms.jsx
import React from 'react';

const AuthForms = ({
  formType,
  username, setUsername,
  email, setEmail,
  password, setPassword,
  password2, setPassword2,
  handleLogin, handleRegister,
  setCurrentPage,
  message // Le message global passé depuis App.jsx
}) => (
  <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 p-4 w-full">
    {formType === 'login' ? (
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">Connexion</h2>
        {/* Affichage du message global. Les styles sont dynamiques selon le contenu du message. */}
        {message && <p className={`mb-4 text-center ${message.includes('Erreur') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">Nom d'utilisateur</label>
            <input type="text" id="username" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Mot de passe</label>
            <input type="password" id="password" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div className="flex items-center justify-between">
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 w-full">Se connecter</button>
          </div>
        </form>
        <p className="text-center text-gray-600 text-sm mt-4">Pas encore de compte ?{' '}<button onClick={() => setCurrentPage('register')} className="text-indigo-600 hover:text-indigo-800 font-bold">Inscrivez-vous ici</button></p>
      </div>
    ) : (
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">Inscription</h2>
        {/* Affichage du message global pour le formulaire d'inscription également. */}
        {message && <p className={`mb-4 text-center ${message.includes('Erreur') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">Nom d'utilisateur</label>
            <input type="text" id="username" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500" value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email</label>
            <input type="email" id="email" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Mot de passe</label>
            <input type="password" id="password" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password2">Confirmer le mot de passe</label>
            <input type="password" id="password2" className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500" value={password2} onChange={(e) => setPassword2(e.target.value)} required />
          </div>
          <div className="flex items-center justify-between">
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 w-full">S'inscrire</button>
          </div>
        </form>
        <p className="text-center text-gray-600 text-sm mt-4">Déjà un compte ?{' '}<button onClick={() => setCurrentPage('login')} className="text-indigo-600 hover:text-indigo-800 font-bold">Connectez-vous ici</button></p>
      </div>
    )}
  </div>
);

export default AuthForms;