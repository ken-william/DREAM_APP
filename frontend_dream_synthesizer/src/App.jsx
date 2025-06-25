// frontend_dream_synthesizer/src/App.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';

// Import des composants des sous-dossiers
import HomePage from './components/pages/HomePage';
import AuthForms from './components/auth/AuthForms';
import DashboardPage from './components/pages/DashboardPage';
import CreateDreamPage from './components/pages/CreateDreamPage';
import MyDreamsPage from './components/pages/MyDreamsPage';
import FeedPage from './components/pages/FeedPage';
import FriendsPage from './components/pages/FriendsPage';
import NotificationsPage from './components/pages/NotificationsPage';
import ChatDreamPage from './components/pages/ChatDreamPage';
import NavigationButton from './components/common/NavigationButton'; // Chemin corrigé pour NavigationButton
import GlobalMessage from './components/auth/GlobalMessage';     // CHEMIN CORRIGÉ ICI !


// URL de base de votre backend Django
const DJANGO_API_BASE_URL = 'http://127.0.0.1:8000/api'; // CONFIRMEZ VOTRE PORT BACKEND ICI !

function App() {
  // États globaux de l'application
  const [currentPage, setCurrentPage] = useState('home');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [globalMessage, setGlobalMessage] = useState(''); // Message d'erreur/succès global
  const [currentUser, setCurrentUser] = useState(null); // Infos de l'utilisateur connecté

  // États pour la création de rêve (maintenus ici pour la cohérence des flux)
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioTranscript, setAudioTranscript] = useState('');
  const [generatedImageUrl, setGeneratedImageUrl] = useState('');
  const [emotionAnalysis, setEmotionAnalysis] = useState(null);
  const [createDreamLoading, setCreateDreamLoading] = useState(false);
  const [createDreamError, setCreateDreamError] = useState('');

  // États pour le chat avec l'IA
  const [currentDreamForChat, setCurrentDreamForChat] = useState(null);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // États pour "Mes Rêves"
  const [myDreams, setMyDreams] = useState([]);
  const [myDreamsLoading, setMyDreamsLoading] = useState(false);
  const [myDreamsError, setMyDreamsError] = useState('');

  // États pour "Fil d'Actualité"
  const [feedDreams, setFeedDreams] = useState([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState('');

  // États pour "Gérer Amis"
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [friendsLoading, setFriendsLoading] = useState(false);
  const [friendsError, setFriendsError] = useState('');
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [userSearchResults, setUserSearchResults] = useState([]); // Renommé de searchResults
  const [isSearchingUsers, setIsSearchingUsers] = useState(false); // Renommé de searchLoading
  const [userSearchError, setUserSearchError] = useState(''); // Nouveau pour les erreurs de recherche
  const [friendActionMessage, setFriendActionMessage] = useState('');

  // États pour "Notifications"
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');

  // Refs pour l'enregistrement audio
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);


  // --- Fonctions Utilitaires ---

  // Fonction pour obtenir les en-têtes d'authentification (mémorisée avec useCallback)
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('access_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }, []);

  // Gestion centralisée des erreurs API
  // Amélioration de handleApiError pour gérer les différents types d'erreurs,
  // y compris les réponses non JSON ou les erreurs réseau.
  const handleApiError = useCallback(async (error, pageErrorSetter) => {
    console.error("Erreur API:", error);
    let errorMessage = "Une erreur inconnue est survenue.";

    if (error instanceof Response) {
      try {
        const contentType = error.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errData = await error.json();
          errorMessage = `Erreur API: ${error.status} ${error.statusText} - ${errData.error || errData.detail || JSON.stringify(errData)}`;
        } else {
          const text = await error.text();
          errorMessage = `Erreur serveur: ${error.status} ${error.statusText} - ${text.substring(0, 100)}...`;
        }
      } catch (parseError) {
        console.error("Failed to parse error response:", parseError);
        errorMessage = `Erreur inattendue: ${error.status} ${error.statusText}.`;
      }
    } else if (error instanceof Error) {
      errorMessage = `Erreur réseau: ${error.message || 'Veuillez réessayer.'}`;
    } else {
      errorMessage = `Erreur inattendue: ${String(error)}`;
    }
    
    // Utilisez setGlobalMessage pour les messages généraux, et pageErrorSetter pour les erreurs spécifiques à une page
    setGlobalMessage(errorMessage);
    if (pageErrorSetter && typeof pageErrorSetter === 'function') { // Assurez-vous que pageErrorSetter est une fonction valide
        pageErrorSetter(errorMessage);
    }
  }, []);


  // --- Fonctions d'Authentification ---

  // Vérifie l'authentification au chargement de l'application
  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      fetch(`${DJANGO_API_BASE_URL}/profile/`, { headers: getAuthHeaders() })
      .then(response => {
        if (response.ok) return response.json();
        // Lancer une erreur de type Response pour que handleApiError puisse la traiter correctement
        throw response; 
      })
      .then(data => {
        setIsAuthenticated(true);
        setCurrentUser(data);
        setGlobalMessage("Connexion automatique réussie !");
        setCurrentPage('dashboard');
      })
      .catch(error => {
        console.error("Échec de l'auto-connexion:", error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setIsAuthenticated(false);
        setGlobalMessage("Votre session a expiré ou le token est invalide. Veuillez vous reconnecter.");
        setCurrentPage('login');
        // Appeler handleApiError avec l'erreur pour une gestion plus détaillée si nécessaire
        handleApiError(error, setGlobalMessage);
      });
    }
  }, [getAuthHeaders, handleApiError]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setGlobalMessage('');
    if (password !== password2) { setGlobalMessage("Les mots de passe ne correspondent pas."); return; }

    try {
      const response = await fetch(`${DJANGO_API_BASE_URL}/register/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, password2 }),
      });
      // Gérer la réponse avec handleApiError si elle n'est pas OK
      if (!response.ok) {
        throw response;
      }
      const data = await response.json();
      setGlobalMessage("Inscription réussie ! Vous pouvez maintenant vous connecter.");
      setCurrentPage('login'); setUsername(''); setEmail(''); setPassword(''); setPassword2('');
    } catch (error) { 
      handleApiError(error, setGlobalMessage); 
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setGlobalMessage('');
    try {
      const response = await fetch(`${DJANGO_API_BASE_URL}/token/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }),
      });
      // Gérer la réponse avec handleApiError si elle n'est pas OK
      if (!response.ok) {
        throw response;
      }
      const data = await response.json();
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      setIsAuthenticated(true);
      setGlobalMessage("Connexion réussie !");
      const userResponse = await fetch(`${DJANGO_API_BASE_URL}/profile/`, { headers: { 'Authorization': `Bearer ${data.access}` } });
      // Gérer la réponse du profil aussi
      if (!userResponse.ok) {
        throw userResponse;
      }
      const userData = await userResponse.json();
      setCurrentUser(userData);
      setCurrentPage('dashboard'); setUsername(''); setPassword('');
    } catch (error) { 
      handleApiError(error, setGlobalMessage); 
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setGlobalMessage("Vous avez été déconnecté.");
    setCurrentPage('home');
  };


  // --- Fonctions pour "Mes Rêves" (Déplacé avant la création de rêve pour l'ordre des dépendances) ---
  const fetchMyDreams = useCallback(async () => {
    setMyDreamsLoading(true); setMyDreamsError('');
    try {
      const response = await fetch(`${DJANGO_API_BASE_URL}/dreams/`, { method: 'GET', headers: getAuthHeaders(), });
      if (!response.ok) { throw response; } // Lancer l'erreur si la réponse n'est pas OK
      const data = await response.json();
      setMyDreams(Array.isArray(data) ? data : []); // S'assurer que 'data' est un tableau
    } catch (error) { handleApiError(error, setMyDreamsError); } finally { setMyDreamsLoading(false); }
  }, [getAuthHeaders, handleApiError]);

  const handleDeleteDream = useCallback(async (dreamId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce rêve ?")) return; // Utilisation de window.confirm
    try {
      const response = await fetch(`${DJANGO_API_BASE_URL}/dreams/${dreamId}/`, { method: 'DELETE', headers: getAuthHeaders(), });
      if (response.ok) {
        setGlobalMessage("Rêve supprimé avec succès !");
        fetchMyDreams(); // Rafraîchir la liste
      } else {
        throw response; // Lancer l'erreur si la réponse n'est pas OK
      }
    } catch (error) { handleApiError(error, setGlobalMessage); }
  }, [getAuthHeaders, handleApiError, fetchMyDreams]);

  const handleChangeDreamVisibility = useCallback(async (dreamId, newVisibility) => {
    try {
      const response = await fetch(`${DJANGO_API_BASE_URL}/dreams/${dreamId}/`, {
        method: 'PATCH', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ visibility: newVisibility }),
      });
      if (response.ok) {
        setGlobalMessage("Visibilité du rêve mise à jour !");
        fetchMyDreams();
      } else {
        throw response; // Lancer l'erreur si la réponse n'est pas OK
      }
    } catch (error) { handleApiError(error, setGlobalMessage); }
  }, [getAuthHeaders, handleApiError, fetchMyDreams]);


  // --- Fonctions d'Enregistrement Audio (Passées à CreateDreamPage) ---
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => { audioChunksRef.current.push(event.data); };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        setCreateDreamLoading(false); // Arrêter le loading après l'arrêt de l'enregistrement
      };
      mediaRecorder.start();
      setIsRecording(true);
      setCreateDreamLoading(true);
      setCreateDreamError('');
      setGlobalMessage("Enregistrement en cours...");
      setAudioTranscript('');
      setGeneratedImageUrl('');
      setEmotionAnalysis(null);
    } catch (error) {
      console.error("Erreur d'accès au micro:", error);
      setCreateDreamError("Impossible d'accès au microphone. Vérifiez les permissions.");
      setCreateDreamLoading(false);
      handleApiError(error, setCreateDreamError);
    }
  }, [handleApiError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setGlobalMessage("Enregistrement terminé. Traitement de l'audio...");
    }
  }, [isRecording]);


  // --- Fonctions API pour la Création de Rêve (Passées à CreateDreamPage) ---
  const transcribeAudio = useCallback(async () => {
    if (!audioBlob) { setCreateDreamError("Aucun audio à transcrire."); return; }
    setCreateDreamLoading(true); setCreateDreamError(''); setGlobalMessage("Transcription de l'audio en cours...");
    try {
      // CORRECTION DU CHEMIN DE L'API : Ajout de '/dreams'
      const formData = new FormData();
      formData.append('audio', audioBlob, 'dream_audio.webm');
      const response = await fetch(`${DJANGO_API_BASE_URL}/dreams/transcribe-audio/`, {
        method: 'POST', headers: getAuthHeaders(), body: formData,
      });
      if (!response.ok) { throw response; } // Throw the response object for handleApiError
      const data = await response.json();
      setAudioTranscript(data.transcription); setGlobalMessage("Transcription réussie !");
    } catch (error) { handleApiError(error, setCreateDreamError); } finally { setCreateDreamLoading(false); }
  }, [audioBlob, getAuthHeaders, handleApiError]);

  const generateImage = useCallback(async (prompt) => {
    if (!prompt) { setCreateDreamError("Veuillez fournir un texte pour la génération d'image."); return; }
    setCreateDreamLoading(true); setCreateDreamError(''); setGlobalMessage("Génération de l'image en cours...");
    try {
      // CORRECTION DU CHEMIN DE L'API : Ajout de '/dreams'
      const response = await fetch(`${DJANGO_API_BASE_URL}/dreams/generate-image/`, {
        method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }),
      });
      if (!response.ok) { throw response; }
      const data = await response.json();
      setGeneratedImageUrl(data.image_url); setGlobalMessage("Image générée avec succès !");
    } catch (error) { handleApiError(error, setCreateDreamError); } finally { setCreateDreamLoading(false); }
  }, [getAuthHeaders, handleApiError]);

  const analyzeEmotion = useCallback(async (text) => {
    if (!text) { setCreateDreamError("Veuillez fournir un texte pour l'analyse émotionnelle."); return; }
    setCreateDreamLoading(true); setCreateDreamError(''); setGlobalMessage("Analyse émotionnelle en cours...");
    try {
      // CORRECTION DU CHEMIN DE L'API : Ajout de '/dreams'
      const response = await fetch(`${DJANGO_API_BASE_URL}/dreams/analyze-emotion/`, {
        method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ text }),
      });
      if (!response.ok) { throw response; }
      const data = await response.json();
      setEmotionAnalysis(data.emotion_analysis); setGlobalMessage("Analyse émotionnelle terminée !");
    } catch (error) { handleApiError(error, setCreateDreamError); } finally { setCreateDreamLoading(false); }
  }, [getAuthHeaders, handleApiError]);

  const saveDream = useCallback(async () => {
    if (!audioTranscript) { setCreateDreamError("Veuillez transcrire votre rêve avant de le sauvegarder."); return; }
    setCreateDreamLoading(true); setCreateDreamError(''); setGlobalMessage("Sauvegarde du rêve en cours...");
    
    // Assurez-vous que les champs sont bien définis, même si vides/null
    const dreamData = {
      raw_prompt: audioTranscript,
      image_path: generatedImageUrl || null, // Assurez-vous d'envoyer null si pas d'image
      emotion_analysis: emotionAnalysis || {}, // Assurez-vous d'envoyer un objet vide si pas d'analyse
      visibility: 'private', // Valeur par défaut
    };

    try {
      const response = await fetch(`${DJANGO_API_BASE_URL}/dreams/`, {
        method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify(dreamData),
      });
      if (!response.ok) { throw response; }
      const data = await response.json();
      setGlobalMessage("Rêve sauvegardé avec succès !");
      // Réinitialiser les états après sauvegarde réussie
      setAudioBlob(null); setAudioTranscript(''); setGeneratedImageUrl(''); setEmotionAnalysis(null);
      fetchMyDreams(); // Rafraîchit la liste des rêves après sauvegarde
    } catch (error) { handleApiError(error, setCreateDreamError); } finally { setCreateDreamLoading(false); }
  }, [audioTranscript, generatedImageUrl, emotionAnalysis, getAuthHeaders, handleApiError, fetchMyDreams]);


  // --- Fonctions de Chat avec l'IA (Passées à ChatDreamPage) ---
  const handleChatSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !currentDreamForChat) return;

    const newChatHistory = [...chatHistory, { role: 'user', content: chatInput }];
    setChatHistory(newChatHistory);
    setChatInput('');
    setChatLoading(true); setGlobalMessage('');

    try {
      // CORRECTION DU CHEMIN DE L'API : Ajout de '/dreams'
      const response = await fetch(`${DJANGO_API_BASE_URL}/dreams/chat-dream/`, {
        method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dream_context: currentDreamForChat.raw_prompt,
          user_question: chatInput,
          chat_history: newChatHistory.map(msg => ({ role: msg.role, content: msg.content }))
        }),
      });
      if (!response.ok) { throw response; }
      const data = await response.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.ai_response }]);
    } catch (error) { handleApiError(error, setGlobalMessage); } finally { setChatLoading(false); }
  }, [chatInput, currentDreamForChat, chatHistory, getAuthHeaders, handleApiError]);


  // --- Fonctions pour "Fil d'Actualité" (Passées à FeedPage) ---
  const fetchFeedDreams = useCallback(async () => {
    setFeedLoading(true); setFeedError('');
    try {
      // CORRECTION DU CHEMIN DE L'API : Utilisation de /api/feed/ qui est un endpoint spécifique
      const response = await fetch(`${DJANGO_API_BASE_URL}/feed/`, { method: 'GET', headers: getAuthHeaders(), });
      if (!response.ok) { throw response; } // Lancer l'erreur si la réponse n'est pas OK
      const data = await response.json();
      setFeedDreams(Array.isArray(data) ? data : []); // S'assurer que 'data' est un tableau
    } catch (error) { handleApiError(error, setFeedError); } finally { setFeedLoading(false); }
  }, [getAuthHeaders, handleApiError]);

  const handleLikeDream = useCallback(async (dreamId) => {
    try {
      // Endpoint pour liker un rêve : /api/dreams/<int:dream_id>/like/
      const response = await fetch(`${DJANGO_API_BASE_URL}/dreams/${dreamId}/like/`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!response.ok) { throw response; }
      const data = await response.json();
      setGlobalMessage(data.message);
      fetchFeedDreams(); // Rafraîchir le feed pour refléter le like
    } catch (error) {
      handleApiError(error, setGlobalMessage);
    }
  }, [getAuthHeaders, handleApiError, fetchFeedDreams]);

  const handleCommentDream = useCallback(async (dreamId, commentContent) => {
    if (!commentContent.trim()) {
      setGlobalMessage("Le commentaire ne peut pas être vide.");
      return;
    }
    try {
      // Endpoint pour commenter un rêve : /api/dreams/<int:dream_id>/comments/
      const response = await fetch(`${DJANGO_API_BASE_URL}/dreams/${dreamId}/comments/`, {
        method: 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentContent }),
      });
      if (!response.ok) { throw response; }
      const data = await response.json();
      setGlobalMessage("Commentaire ajouté !");
      fetchFeedDreams(); // Rafraîchir le feed pour refléter le commentaire
    } catch (error) {
      handleApiError(error, setGlobalMessage);
    }
  }, [getAuthHeaders, handleApiError, fetchFeedDreams]);


  // --- Fonctions pour "Notifications" (Déplacé avant Gérer Amis car utilisée par FriendsPage) ---
  const fetchNotifications = useCallback(async () => {
    setNotificationsLoading(true); setNotificationsError('');
    try {
      const response = await fetch(`${DJANGO_API_BASE_URL}/notifications/`, { method: 'GET', headers: getAuthHeaders(), });
      if (!response.ok) { throw response; }
      const data = await response.json();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) { handleApiError(error, setNotificationsError); } finally { setNotificationsLoading(false); }
  }, [getAuthHeaders, handleApiError]);

  const handleMarkNotificationAsRead = useCallback(async (notificationId) => {
    try {
      const response = await fetch(`${DJANGO_API_BASE_URL}/notifications/${notificationId}/read/`, { method: 'POST', headers: getAuthHeaders(), });
      if (!response.ok) { throw response; }
      setGlobalMessage("Notification marquée comme lue.");
      fetchNotifications();
    } catch (error) { handleApiError(error, setGlobalMessage); }
  }, [fetchNotifications, getAuthHeaders, handleApiError]);

  const handleMarkAllNotificationsAsRead = useCallback(async () => {
    try {
      const response = await fetch(`${DJANGO_API_BASE_URL}/notifications/read-all/`, { method: 'POST', headers: getAuthHeaders(), });
      if (!response.ok) { throw response; }
      setGlobalMessage("Toutes les notifications marquées comme lues.");
      fetchNotifications();
    } catch (error) { handleApiError(error, setGlobalMessage); }
  }, [fetchNotifications, getAuthHeaders, handleApiError]);


  // --- Fonctions pour "Gérer Amis" (Passées à FriendsPage) ---
  const fetchFriendsAndRequests = useCallback(async () => {
    setFriendsLoading(true); setFriendsError('');
    try {
      const friendsResponse = await fetch(`${DJANGO_API_BASE_URL}/friends/`, { headers: getAuthHeaders() });
      if (!friendsResponse.ok) { throw friendsResponse; }
      const friendsData = await friendsResponse.json();
      setFriends(Array.isArray(friendsData) ? friendsData : []);

      // Note: Le backend renvoie les demandes d'amis comme des notifications avec notification_type='friend_request'
      const notificationsResponse = await fetch(`${DJANGO_API_BASE_URL}/notifications/?is_read=false&notification_type=friend_request`, { headers: getAuthHeaders() });
      if (!notificationsResponse.ok) { throw notificationsResponse; }
      const notificationsData = await notificationsResponse.json();
      setFriendRequests(Array.isArray(notificationsData) ? notificationsData : []);

    } catch (error) { handleApiError(error, setFriendsError); } finally { setFriendsLoading(false); }
  }, [getAuthHeaders, handleApiError]);

  const handleSearchUsers = useCallback(async (query) => {
    if (!query.trim()) { setUserSearchResults([]); return; }
    setIsSearchingUsers(true); setUserSearchError('');
    try {
        // L'endpoint de recherche d'utilisateurs doit être dans votre backend Django
        // Assuming /users/ can handle search queries
        const response = await fetch(`${DJANGO_API_BASE_URL}/users/?search=${query}`, { headers: getAuthHeaders() });
        if (!response.ok) { throw response; }
        const data = await response.json();
        // Filtrer l'utilisateur actuel et les amis existants des résultats de recherche
        const filteredResults = (Array.isArray(data) ? data : data.results || []).filter(
            (user) => currentUser && user.id !== currentUser.id && !friends.some(friend => friend.id === user.id)
        );
        setUserSearchResults(filteredResults);
    } catch (error) { handleApiError(error, setUserSearchError); } finally { setIsSearchingUsers(false); }
  }, [currentUser, friends, getAuthHeaders, handleApiError]);

  const handleSendFriendRequest = useCallback(async (userId) => {
    try {
      const response = await fetch(`${DJANGO_API_BASE_URL}/friends/request/`, {
        method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId }),
      });
      if (!response.ok) { throw response; }
      const data = await response.json();
      setFriendActionMessage(data.message || "Demande d'ami envoyée !");
      fetchFriendsAndRequests();
      handleSearchUsers(friendSearchQuery); // Re-run search to update status
    } catch (error) { handleApiError(error, setFriendActionMessage); }
  }, [friendSearchQuery, fetchFriendsAndRequests, handleSearchUsers, getAuthHeaders, handleApiError]);

  const handleFriendRequestAction = useCallback(async (notificationId, action) => {
    // Dans votre backend, l'action de demande d'ami prend friendship_id, pas notification_id.
    // Il faut récupérer l'ID de la Friendship depuis la notification.
    const notification = friendRequests.find(req => req.id === notificationId);
    if (!notification || !notification.related_friendship) {
      setGlobalMessage("Impossible de trouver la demande d'ami associée à cette notification.");
      return;
    }
    const friendshipId = notification.related_friendship; // Assurez-vous que le sérialiseur de notification renvoie related_friendship.id

    try {
      const response = await fetch(`${DJANGO_API_BASE_URL}/friends/request/action/`, {
        method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ friendship_id: friendshipId, action }),
      });
      if (!response.ok) { throw response; }
      const data = await response.json();
      setFriendActionMessage(`Demande ${action === 'accept' ? 'acceptée' : 'rejetée'} !`);
      fetchFriendsAndRequests(); // Rafraîchit les listes après action
      fetchNotifications(); // Rafraîchit les notifications après action
    } catch (error) { handleApiError(error, setFriendActionMessage); }
  }, [friendRequests, fetchFriendsAndRequests, fetchNotifications, getAuthHeaders, handleApiError]);


  // --- Rendu Principal de l'Application (Gestion des Pages) ---
  let pageContent;
  if (isAuthenticated) {
    switch (currentPage) {
      case 'dashboard': pageContent = <DashboardPage setCurrentPage={setCurrentPage} currentUser={currentUser} handleLogout={handleLogout} />; break;
      case 'create-dream': pageContent = <CreateDreamPage
          setCurrentPage={setCurrentPage}
          isRecording={isRecording} startRecording={startRecording} stopRecording={stopRecording}
          audioBlob={audioBlob} audioTranscript={audioTranscript} setAudioTranscript={setAudioTranscript} transcribeAudio={transcribeAudio}
          generatedImageUrl={generatedImageUrl} generateImage={generateImage}
          emotionAnalysis={emotionAnalysis} analyzeEmotion={analyzeEmotion}
          saveDream={saveDream} createDreamLoading={createDreamLoading} createDreamError={createDreamError}
        />; break;
      case 'my-dreams': pageContent = <MyDreamsPage
          setCurrentPage={setCurrentPage}
          myDreams={myDreams} myDreamsLoading={myDreamsLoading} myDreamsError={myDreamsError} fetchMyDreams={fetchMyDreams}
          onDiscuss={(dream) => { setCurrentDreamForChat(dream); setChatHistory([]); setCurrentPage('chat-dream'); }}
          onDelete={handleDeleteDream} onChangeVisibility={handleChangeDreamVisibility}
        />; break;
      case 'feed': pageContent = <FeedPage
          setCurrentPage={setCurrentPage}
          feedDreams={feedDreams} feedLoading={feedLoading} feedError={feedError} fetchFeedDreams={fetchFeedDreams}
          onLike={handleLikeDream} onComment={handleCommentDream}
        />; break;
      case 'friends': pageContent = <FriendsPage
          setCurrentPage={setCurrentPage}
          friends={friends} friendRequests={friendRequests} friendsLoading={friendsLoading} friendsError={friendsError} fetchFriendsAndRequests={fetchFriendsAndRequests}
          currentUser={currentUser} // Pass currentUser to FriendsPage for filtering self from search results
          searchUser={friendSearchQuery} setSearchUser={setFriendSearchQuery} // Pass search state
          userSearchResults={userSearchResults} isSearchingUsers={isSearchingUsers} userSearchError={userSearchError} handleSearchUsers={handleSearchUsers}
          handleSendFriendRequest={handleSendFriendRequest}
          handleAcceptFriendRequest={handleFriendRequestAction} handleRejectFriendRequest={handleFriendRequestAction} // Pass the common action handler
          friendActionMessage={friendActionMessage}
        />; break;
      case 'notifications': pageContent = <NotificationsPage
          setCurrentPage={setCurrentPage}
          notifications={notifications} notificationsLoading={notificationsLoading} notificationsError={notificationsError} fetchNotifications={fetchNotifications}
          onMarkAsRead={handleMarkNotificationAsRead} onMarkAllAsRead={handleMarkAllNotificationsAsRead}
        />; break;
      case 'chat-dream': pageContent = <ChatDreamPage
          setCurrentPage={setCurrentPage}
          currentDreamForChat={currentDreamForChat} chatHistory={chatHistory} setChatHistory={setChatHistory}
          chatInput={chatInput} setChatInput={setChatInput} handleChatSubmit={handleChatSubmit} chatLoading={chatLoading}
          globalMessage={globalMessage} // Passer le message global au ChatDreamPage
        />; break;
      default: pageContent = <DashboardPage setCurrentPage={setCurrentPage} currentUser={currentUser} handleLogout={handleLogout} />;
    }
  } else {
    switch (currentPage) {
      case 'login': pageContent = <AuthForms formType="login" username={username} setUsername={setUsername} password={password} setPassword={setPassword} handleLogin={handleLogin} setCurrentPage={setCurrentPage} message={globalMessage} />; break;
      case 'register': pageContent = <AuthForms formType="register" username={username} setUsername={setUsername} email={email} setEmail={setEmail} password={password} setPassword={setPassword} password2={password2} setPassword2={setPassword2} handleRegister={handleRegister} setCurrentPage={setCurrentPage} message={globalMessage} />; break;
      default: pageContent = <HomePage setCurrentPage={setCurrentPage} />;
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 font-sans flex flex-col">
      <GlobalMessage message={globalMessage} /> {/* Ce composant gère l'affichage des messages globaux */}
      <header className="bg-indigo-800 text-white py-3 shadow-md sticky top-0 z-50">
        <nav className="container mx-auto flex justify-between items-center px-4 max-w-6xl">
          <button onClick={() => setCurrentPage(isAuthenticated ? 'dashboard' : 'home')} className="text-2xl font-bold hover:text-indigo-200 transition duration-200 focus:outline-none">
            Synthétiseur de Rêves
          </button>
          <div className="flex items-center space-x-2 sm:space-x-4">
            {isAuthenticated ? (
              <>
                {/* Affiche le nom d'utilisateur si disponible, sinon "Utilisateur" */}
                <span className="text-lg hidden md:inline-block">Bienvenue, {currentUser?.username || 'Utilisateur'}!</span>
                <NavigationButton text="Créer Rêve" onClick={() => setCurrentPage('create-dream')} icon="✨" />
                <NavigationButton text="Mes Rêves" onClick={() => setCurrentPage('my-dreams')} icon="📖" />
                <NavigationButton text="Fil d'Actu" onClick={() => setCurrentPage('feed')} icon="🌐" />
                <NavigationButton text="Amis" onClick={() => setCurrentPage('friends')} icon="👥" />
                <NavigationButton text="Notifications" onClick={() => setCurrentPage('notifications')} icon="🔔" />
                <button onClick={handleLogout} className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg transition duration-200 text-sm sm:text-base">Déconnexion</button>
              </>
            ) : (
              <>
                <NavigationButton text="Connexion" onClick={() => setCurrentPage('login')} />
                <button onClick={() => setCurrentPage('register')} className="bg-white text-indigo-800 px-3 py-1 sm:px-4 sm:py-2 rounded-lg hover:bg-gray-100 transition duration-200 text-sm sm:text-base">Inscription</button>
              </>
            )}
          </div>
        </nav>
      </header>
      
      <main className="flex-grow flex flex-col items-center justify-start py-8 px-4 sm:px-6 lg:px-8">
        {pageContent}
      </main>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: slideInUp 1s ease-out forwards; }
        .animate-slide-in-up { animation: slideInUp 0.8s ease-out forwards; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-600 { animation-delay: 0.6s; }
      `}</style>
    </div>
  );
}

export default App;