import React, { useState, useEffect } from 'react';

// URL de base de votre backend Django
const DJANGO_API_BASE_URL = 'http://127.0.0.1:8000/api'; // N'oubliez pas de changer ceci pour votre URL de production!

function App() {
  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'login', 'register', 'dashboard', 'my-dreams', 'feed'
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState(''); // Pour la confirmation du mot de passe
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [message, setMessage] = useState(''); // Pour les messages d'erreur/succès
  const [currentUser, setCurrentUser] = useState(null); // Informations de l'utilisateur connecté

  // Vérifie l'état d'authentification au chargement de l'application
  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      // Tentative de récupérer le profil utilisateur pour vérifier le token
      fetch(`${DJANGO_API_BASE_URL}/profile/`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Token invalide ou expiré');
      })
      .then(data => {
        setIsAuthenticated(true);
        setCurrentUser(data);
        setCurrentPage('dashboard'); // Aller au tableau de bord si authentifié
      })
      .catch(error => {
        console.error("Vérification du token échouée:", error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setIsAuthenticated(false);
        setMessage("Votre session a expiré. Veuillez vous reconnecter.");
        setCurrentPage('login');
      });
    }
  }, []);

  // Gère l'inscription d'un nouvel utilisateur
  const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');

    if (password !== password2) {
      setMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      const response = await fetch(`${DJANGO_API_BASE_URL}/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, password2 }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage("Inscription réussie ! Vous pouvez maintenant vous connecter.");
        // Après l'inscription, on redirige vers la page de connexion
        setCurrentPage('login');
        setUsername('');
        setEmail('');
        setPassword('');
        setPassword2('');
      } else {
        // Afficher les erreurs spécifiques de Django
        const errors = Object.values(data).flat().join(' ');
        setMessage(`Erreur d'inscription: ${errors}`);
      }
    } catch (error) {
      console.error("Erreur réseau lors de l'inscription:", error);
      setMessage("Une erreur réseau est survenue. Veuillez réessayer.");
    }
  };

  // Gère la connexion de l'utilisateur
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const response = await fetch(`${DJANGO_API_BASE_URL}/token/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        setIsAuthenticated(true);
        setMessage("Connexion réussie !");
        // Récupérer les infos utilisateur après connexion réussie
        await fetch(`${DJANGO_API_BASE_URL}/profile/`, {
            headers: { 'Authorization': `Bearer ${data.access}` }
        })
        .then(res => res.json())
        .then(userData => setCurrentUser(userData));

        setCurrentPage('dashboard');
        setUsername('');
        setPassword('');
      } else {
        setMessage(`Erreur de connexion: ${data.detail || 'Identifiants invalides.'}`);
      }
    } catch (error) {
      console.error("Erreur réseau lors de la connexion:", error);
      setMessage("Une erreur réseau est survenue. Veuillez réessayer.");
    }
  };

  // Gère la déconnexion
  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setMessage("Vous avez été déconnecté.");
    setCurrentPage('home');
  };

  // Composant du formulaire d'inscription
  const RegisterForm = () => (
    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
      <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">Inscription</h2>
      {message && <p className={`mb-4 text-center ${message.includes('Erreur') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
            Nom d'utilisateur
          </label>
          <input
            type="text"
            id="username"
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input
            type="email"
            id="email"
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Mot de passe
          </label>
          <input
            type="password"
            id="password"
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password2">
            Confirmer le mot de passe
          </label>
          <input
            type="password"
            id="password2"
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            required
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 w-full"
          >
            S'inscrire
          </button>
        </div>
      </form>
      <p className="text-center text-gray-600 text-sm mt-4">
        Déjà un compte ?{' '}
        <button onClick={() => setCurrentPage('login')} className="text-indigo-600 hover:text-indigo-800 font-bold">
          Connectez-vous ici
        </button>
      </p>
    </div>
  );

  // Composant du formulaire de connexion
  const LoginForm = () => (
    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
      <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">Connexion</h2>
      {message && <p className={`mb-4 text-center ${message.includes('Erreur') ? 'text-red-600' : 'text-green-600'}`}>{message}</p>}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
            Nom d'utilisateur
          </label>
          <input
            type="text"
            id="username"
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Mot de passe
          </label>
          <input
            type="password"
            id="password"
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline focus:border-indigo-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-200 w-full"
          >
            Se connecter
          </button>
        </div>
      </form>
      <p className="text-center text-gray-600 text-sm mt-4">
        Pas encore de compte ?{' '}
        <button onClick={() => setCurrentPage('register')} className="text-indigo-600 hover:text-indigo-800 font-bold">
          Inscrivez-vous ici
        </button>
      </p>
    </div>
  );

  // Composant du tableau de bord après connexion
  const Dashboard = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl text-center">
        <h2 className="text-4xl font-extrabold text-indigo-800 mb-4">Bienvenue, {currentUser?.username || 'Utilisateur'} !</h2>
        <p className="text-gray-700 text-lg mb-8">Ceci est votre tableau de bord personnel. Préparez-vous à explorer le monde de vos rêves.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button
            onClick={() => setCurrentPage('my-dreams')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg shadow-md hover:shadow-lg transition duration-300 transform hover:-translate-y-1"
          >
            Mes Rêves
          </button>
          <button
            onClick={() => setCurrentPage('feed')}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg shadow-md hover:shadow-lg transition duration-300 transform hover:-translate-y-1"
          >
            Fil d'Actualité
          </button>
          <button
            onClick={() => alert('Fonctionnalité "Ajouter un rêve" à implémenter.')} // Remplacez par le composant d'ajout de rêve
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg shadow-md hover:shadow-lg transition duration-300 transform hover:-translate-y-1"
          >
            Ajouter un Rêve
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="mt-10 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200"
        >
          Déconnexion
        </button>
      </div>
    </div>
  );

  // Composant de la page d'accueil
  const HomePage = () => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 text-white p-4">
      <div className="text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold mb-4 animate-fade-in">Synthétiseur de Rêves</h1>
        <p className="text-xl md:text-2xl mb-8 animate-slide-up">Transformez vos rêves en expériences visuelles et partagez-les avec vos amis !</p>
        <div className="space-x-4">
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

  // Composant générique pour les pages à venir
  const FuturePage = ({ title }) => (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl text-center">
        <h2 className="text-4xl font-extrabold text-gray-800 mb-4">{title}</h2>
        <p className="text-gray-600 text-lg mb-8">Cette page est en cours de développement. Revenez bientôt !</p>
        <button
          onClick={() => setCurrentPage('dashboard')}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200"
        >
          Retour au Tableau de Bord
        </button>
      </div>
    </div>
  );

  // Rendu principal de l'application
  let content;
  if (isAuthenticated) {
    switch (currentPage) {
      case 'dashboard':
        content = <Dashboard />;
        break;
      case 'my-dreams':
        content = <FuturePage title="Mes Rêves" />;
        break;
      case 'feed':
        content = <FuturePage title="Fil d'Actualité des Rêves" />;
        break;
      default:
        content = <Dashboard />;
    }
  } else {
    switch (currentPage) {
      case 'login':
        content = <LoginForm />;
        break;
      case 'register':
        content = <RegisterForm />;
        break;
      default:
        content = <HomePage />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans">
      <header className="bg-indigo-800 text-white py-4 shadow-md">
        <nav className="container mx-auto flex justify-between items-center px-4">
          <button onClick={() => setCurrentPage(isAuthenticated ? 'dashboard' : 'home')} className="text-2xl font-bold hover:text-indigo-200 transition duration-200">
            Synthétiseur de Rêves
          </button>
          <div className="space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-lg hidden md:inline">Bienvenue, {currentUser?.username}!</span>
                <button onClick={() => setCurrentPage('my-dreams')} className="text-white hover:text-indigo-200 transition duration-200">Mes Rêves</button>
                <button onClick={() => setCurrentPage('feed')} className="text-white hover:text-indigo-200 transition duration-200">Fil d'Actu</button>
                <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition duration-200">Déconnexion</button>
              </>
            ) : (
              <>
                <button onClick={() => setCurrentPage('login')} className="text-white hover:text-indigo-200 transition duration-200">Connexion</button>
                <button onClick={() => setCurrentPage('register')} className="bg-white text-indigo-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition duration-200">Inscription</button>
              </>
            )}
          </div>
        </nav>
      </header>
      
      <main className="flex items-center justify-center p-4">
        {content}
      </main>

      {/* Ajout d'animations Tailwind */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 1s ease-out forwards;
        }
        .animate-slide-up {
          animation: slideUp 0.8s ease-out 0.5s forwards;
          opacity: 0; /* Assurez-vous qu'il est caché avant l'animation */
        }
      `}</style>
    </div>
  );
}

export default App;