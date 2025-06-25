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
import NavigationButton from './components/common/NavigationButton';
import GlobalMessage from './components/auth/GlobalMessage';


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
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [userSearchError, setUserSearchError] = useState('');
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
  const handleApiError = (error, pageErrorSetter) => {
    console.error("Erreur API:", error);
    // Tenter de parser l'erreur JSON si elle est présente
    error.json().then(errData => {
        pageErrorSetter(`Erreur API: ${errData.error || errData.detail || JSON.stringify(errData)}`);
    }).catch(() => {
        pageErrorSetter(`Erreur réseau: ${error.message || 'Veuillez réessayer.'}`);
    });
  };


  // --- Fonctions d'Authentification ---

  // Vérifie l'authentification au chargement de l'application
  useEffect(() => {
    const accessToken = localStorage.getItem('access_token');
    if (accessToken) {
      fetch(`${DJANGO_API_BASE_URL}/profile/`, { headers: getAuthHeaders() })
      .then(response => {
        if (response.ok) return response.json();
        throw new Error('Token invalide ou expiré');
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
      });
    }
  }, [getAuthHeaders]);

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
      const data = await response.json();
      if (response.ok) {
        setGlobalMessage("Inscription réussie ! Vous pouvez maintenant vous connecter.");
        setCurrentPage('login'); setUsername(''); setEmail(''); setPassword(''); setPassword2('');
      } else {
        const errors = Object.values(data).flat().join(' ');
        setGlobalMessage(`Erreur d'inscription: ${errors}`);
      }
    } catch (error) { setGlobalMessage(`Erreur réseau: ${error.message}`); console.error(error); }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setGlobalMessage('');
    try {
      const response = await fetch(`${DJANGO_API_BASE_URL}/token/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        setIsAuthenticated(true);
        setGlobalMessage("Connexion réussie !");
        const userResponse = await fetch(`${DJANGO_API_BASE_URL}/profile/`, { headers: { 'Authorization': `Bearer ${data.access}` } });
        const userData = await userResponse.json();
        setCurrentUser(userData);
        setCurrentPage('dashboard'); setUsername(''); setPassword('');
      } else {
        setGlobalMessage(`Erreur de connexion: ${data.detail || 'Identifiants invalides.'}`);
      }
    } catch (error) { setGlobalMessage(`Erreur réseau: ${error.message}`); console.error(error); }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setIsAuthenticated(false);
    setCurrentUser(null);
    setGlobalMessage("Vous avez été déconnecté.");
    setCurrentPage('home');
  };

  // --- Fonctions d'Enregistrement Audio (Passées à CreateDreamPage) ---
  const startRecording = async () => {
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
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setCreateDreamLoading(false);
      setGlobalMessage("Enregistrement terminé. Traitement de l'audio...");
    }
  };

  // --- Fonctions API pour la Création de Rêve (Passées à CreateDreamPage) ---
  const transcribeAudio = async () => {
    if (!audioBlob) { setCreateDreamError("Aucun audio à transcrire."); return; }
    setCreateDreamLoading(true); setCreateDreamError(''); setGlobalMessage("Transcription de l'audio en cours...");
    try {
      // CORRECTION ICI : Ajouter '/dreams' au chemin de l'API
      const formData = new FormData();
      formData.append('audio', audioBlob, 'dream_audio.webm');
      const response = await fetch(`${DJANGO_API_BASE_URL}/dreams/transcribe-audio/`, {
        method: 'POST', headers: getAuthHeaders(), body: formData,
      });
      // Vérifier si la réponse est JSON
      if (!response.headers.get('content-type')?.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Réponse non JSON reçue: ${response.status} ${response.statusText} - ${text.substring(0, 100)}...`);
      }
      const data = await response.json();
      if (response.ok) { setAudioTranscript(data.transcription); setGlobalMessage("Transcription réussie !"); }
      else { setCreateDreamError(`Erreur de transcription: ${data.error || 'Veuillez réessayer.'}`); }
    } catch (error) { handleApiError(error, setCreateDreamError); } finally { setCreateDreamLoading(false); }
  };

  const generateImage = async (prompt) => {
    if (!prompt) { setCreateDreamError("Veuillez fournir un texte pour la génération d'image."); return; }
    setCreateDreamLoading(true); setCreateDreamError(''); setGlobalMessage("Génération de l'image en cours...");
    try {
      // CORRECTION ICI : Ajouter '/dreams' au chemin de l'API
      const response = await fetch(`${DJANGO_API_BASE_URL}/dreams/generate-image/`, {
        method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }),
      });
      // Vérifier si la réponse est JSON
      if (!response.headers.get('content-type')?.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Réponse non JSON reçue: ${response.status} ${response.statusText} - ${text.substring(0, 100)}...`);
      }
      const data = await response.json();
      if (response.ok) { setGeneratedImageUrl(data.image_url); setGlobalMessage("Image générée avec succès !"); }
      else { setCreateDreamError(`Erreur de génération d'image: ${data.error || 'Veuillez réessayer.'}`); }
    } catch (error) { handleApiError(error, setCreateDreamError); } finally { setCreateDreamLoading(false); }
  };

  const analyzeEmotion = async (text) => {
    if (!text) { setCreateDreamError("Veuillez fournir un texte pour l'analyse émotionnelle."); return; }
    setCreateDreamLoading(true); setCreateDreamError(''); setGlobalMessage("Analyse émotionnelle en cours...");
    try {
      // CORRECTION ICI : Ajouter '/dreams' au chemin de l'API
      const response = await fetch(`${DJANGO_API_BASE_URL}/dreams/analyze-emotion/`, {
        method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ text }),
      });
      // Vérifier si la réponse est JSON
      if (!response.headers.get('content-type')?.includes('application/json')) {
        const textResponse = await response.text();
        throw new Error(`Réponse non JSON reçue: ${response.status} ${response.statusText} - ${textResponse.substring(0, 100)}...`);
      }
      const data = await response.json();
      if (response.ok) { setEmotionAnalysis(data.emotion_analysis); setGlobalMessage("Analyse émotionnelle terminée !"); }
      else { setCreateDreamError(`Erreur d'analyse émotionnelle: ${data.error || 'Veuillez réessayer.'}`); }
    } catch (error) { handleApiError(error, setCreateDreamError); } finally { setCreateDreamLoading(false); }
  };

  const saveDream = async () => {
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
      // Vérifier si la réponse est JSON
      if (!response.headers.get('content-type')?.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Réponse non JSON reçue: ${response.status} ${response.statusText} - ${text.substring(0, 100)}...`);
      }
      const data = await response.json();
      if (response.ok) {
        setGlobalMessage("Rêve sauvegardé avec succès !");
        // Réinitialiser les états après sauvegarde réussie
        setAudioBlob(null); setAudioTranscript(''); setGeneratedImageUrl(''); setEmotionAnalysis(null);
        fetchMyDreams(); // Rafraîchit la liste des rêves après sauvegarde
      } else { 
        setCreateDreamError(`Erreur de sauvegarde: ${Object.values(data).flat().join(' ') || 'Veuillez réessayer.'}`); 
      }
    } catch (error) { handleApiError(error, setCreateDreamError); } finally { setCreateDreamLoading(false); }
  };

  // --- Fonctions de Chat avec l'IA (Passées à ChatDreamPage) ---
  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || !currentDreamForChat) return;

    const newChatHistory = [...chatHistory, { role: 'user', content: chatInput }];
    setChatHistory(newChatHistory);
    setChatInput('');
    setChatLoading(true); setGlobalMessage('');

    try {
      // CORRECTION ICI : Ajouter '/dreams' au chemin de l'API
      const response = await fetch(`${DJANGO_API_BASE_URL}/dreams/chat-dream/`, {
        method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dream_context: currentDreamForChat.raw_prompt,
          user_question: chatInput,
          chat_history: newChatHistory.map(msg => ({ role: msg.role, content: msg.content }))
        }),
      });
      // Vérifier si la réponse est JSON
      if (!response.headers.get('content-type')?.includes('application/json')) {
        const text = await response.text();
        throw new Error(`Réponse non JSON reçue: ${response.status} ${response.statusText} - ${text.substring(0, 100)}...`);
      }
      const data = await response.json();
      if (response.ok) { setChatHistory(prev => [...prev, { role: 'assistant', content: data.ai_response }]); }
      else { setGlobalMessage(`Erreur de chat avec l'IA: ${data.error || 'Veuillez réessayer.'}`); }
    } catch (error) { handleApiError(error, setGlobalMessage); } finally { setChatLoading(false); }
  };

  // --- Fonctions pour "Mes Rêves" (Passées à MyDreamsPage) ---
  const fetchMyDreams = useCallback(async () => {
    setMyDreamsLoading(true); setMyDreamsError('');
    try {
      const response = await fetch(`${DJANGO_API_BASE_URL}/dreams/`, { method: 'GET', headers: getAuthHeaders(), });
      const data = await response.json();
      if (response.ok) { setMyDreams(Array.isArray(data) ? data : []); } // S'assurer que 'data' est un tableau
      else { setMyDreamsError(`Erreur de chargement des rêves: ${data.detail || 'Veuillez réessayer.'}`); }
    } catch (error) { handleApiError(error, setMyDreamsError); } finally { setMyDreamsLoading(false); }
  }, [getAuthHeaders]);

  const handleDeleteDream = async (dreamId) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce rêve ?")) return;
    try {
      const response = await fetch(`${DJANGO_API_BASE_URL}/dreams/${dreamId}/`, { method: 'DELETE', headers: getAuthHeaders(), });
      if (response.ok) { setGlobalMessage("Rêve supprimé avec succès !"); fetchMyDreams(); }
      else { const errorData = await response.json(); setGlobalMessage(`Erreur de suppression: ${errorData.detail || 'Veuillez réessayer.'}`); }
    } catch (error) { handleApiError(error, setGlobalMessage); }
  };

  const handleChangeDreamVisibility = async (dreamId, newVisibility) => {
    try {
      const response = await fetch(`${DJANGO_API_BASE_URL}/dreams/${dreamId}/`, {
        method: 'PATCH', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ visibility: newVisibility }),
      });
      if (response.ok) { setGlobalMessage("Visibilité du rêve mise à jour !"); fetchMyDreams(); }
      else { const errorData = await response.json(); setGlobalMessage(`Erreur de mise à jour de la visibilité: ${errorData.detail || 'Veuillez réessayer.'}`); }
    } catch (error) { handleApiError(error, setGlobalMessage); }
  };

  // --- Fonctions pour "Fil d'Actualité" (Passées à FeedPage) ---
  const fetchFeedDreams = useCallback(async () => {
    setFeedLoading(true); setFeedError('');
    try {
      const response = await fetch(`${DJANGO_API_BASE_URL}/feed/`, { method: 'GET', headers: getAuthHeaders(), });
      const data = await response.json();
      if (response.ok) { setFeedDreams(Array.isArray(data) ? data : []); } // S'assurer que 'data' est un tableau
      else {
        const errorText = await response.text();
        console.error("Erreur feed API:", response.status, errorText);
        setFeedError(`Erreur de chargement du fil d'actualité: ${response.status} - ${response.statusText}. Vérifiez les logs du serveur Django.`);
      }
    } catch (error) { handleApiError(error, setFeedError); } finally { setFeedLoading(false); }
  }, [getAuthHeaders]);

  const handleLikeDream = (dreamId) => { setGlobalMessage(`Fonctionnalité Like sur rêve ${dreamId} à implémenter.`); };
  const handleCommentDream = (dreamId) => { setGlobalMessage(`Fonctionnalité Commentaire sur rêve ${dreamId} à implémenter.`); };

  // --- Fonctions pour "Gérer Amis" (Passées à FriendsPage) ---
  const fetchFriendsAndRequests = useCallback(async () => {
    setFriendsLoading(true); setFriendsError('');
    try {
      const friendsResponse = await fetch(`${DJANGO_API_BASE_URL}/friends/`, { headers: getAuthHeaders() });
      const friendsData = await friendsResponse.json();
      if (friendsResponse.ok) { setFriends(Array.isArray(friendsData) ? friendsData : []); }
      else { setFriendsError(`Erreur de chargement des amis: ${friendsData.detail || 'Veuillez réessayer.'}`); }

      const notificationsResponse = await fetch(`${DJANGO_API_BASE_URL}/notifications/?is_read=false&notification_type=friend_request`, { headers: getAuthHeaders() });
      const notificationsData = await notificationsResponse.json();
      if (notificationsResponse.ok) { setFriendRequests(Array.isArray(notificationsData) ? notificationsData : []); }
      else { console.error("Erreur chargement notifications de demande d'ami:", notificationsData); }

    } catch (error) { handleApiError(error, setFriendsError); } finally { setFriendsLoading(false); }
  }, [getAuthHeaders]);

  const handleSearchUsers = async (query) => {
    if (!query.trim()) { setUserSearchResults([]); return; }
    setIsSearchingUsers(true); setUserSearchError('');
    try {
        const response = await fetch(`${DJANGO_API_BASE_URL}/users/?search=${query}`, { headers: getAuthHeaders() });
        const data = await response.json();
        if (response.ok) {
            const filteredResults = (Array.isArray(data) ? data : data.results || []).filter(
                (user) => currentUser && user.id !== currentUser.id && !friends.some(friend => friend.id === user.id)
            );
            setUserSearchResults(filteredResults);
        } else { setUserSearchError(`Erreur lors de la recherche: ${data.detail || 'Vérifiez les logs du serveur Django.'}`); }
    } catch (error) { handleApiError(error, setUserSearchError); } finally { setIsSearchingUsers(false); }
  };

  const handleSendFriendRequest = async (userId) => {
    try {
      const response = await fetch(`${DJANGO_API_BASE_URL}/friends/request/`, {
        method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: userId }),
      });
      const data = await response.json();
      if (response.ok || response.status === 200) {
        setFriendActionMessage(data.message || "Demande d'ami envoyée !");
        fetchFriendsAndRequests();
        handleSearchUsers(friendSearchQuery);
      } else { setFriendActionMessage(`Erreur: ${data.error || 'Veuillez réessayer.'}`); }
    } catch (error) { handleApiError(error, setFriendActionMessage); }
  };

  const handleFriendRequestAction = async (notificationId, action) => {
    try {
      const response = await fetch(`${DJANGO_API_BASE_URL}/friends/request/action/`, {
        method: 'POST', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ friendship_id: notificationId, action }),
      });
      const data = await response.json();
      if (response.ok) {
        setFriendActionMessage(`Demande ${action === 'accept' ? 'acceptée' : 'rejetée'} !`);
        fetchFriendsAndRequests();
        fetchNotifications();
      } else { setFriendActionMessage(`Erreur: ${data.error || 'Veuillez réessayer.'}`); }
    } catch (error) { handleApiError(error, setFriendActionMessage); }
  };

  // --- Fonctions pour "Notifications" (Passées à NotificationsPage) ---
  const fetchNotifications = useCallback(async () => {
    setNotificationsLoading(true); setNotificationsError('');
    try {
      const response = await fetch(`${DJANGO_API_BASE_URL}/notifications/`, { method: 'GET', headers: getAuthHeaders(), });
      const data = await response.json();
      if (response.ok) { setNotifications(Array.isArray(data) ? data : []); }
      else {
        const errorText = await response.text();
        console.error("Erreur notifications API:", response.status, errorText);
        setNotificationsError(`Erreur de chargement des notifications: ${response.status} - ${response.statusText}. Vérifiez les logs du serveur Django.`);
      }
    } catch (error) { handleApiError(error, setNotificationsError); } finally { setNotificationsLoading(false); }
  }, [getAuthHeaders]);

  const handleMarkNotificationAsRead = async (notificationId) => {
    try {
      const response = await fetch(`${DJANGO_API_BASE_URL}/notifications/${notificationId}/read/`, { method: 'POST', headers: getAuthHeaders(), });
      if (response.ok) { setGlobalMessage("Notification marquée comme lue."); fetchNotifications(); }
      else { const errorData = await response.json(); setGlobalMessage(`Erreur: ${errorData.detail || 'Veuillez réessayer.'}`); }
    } catch (error) { handleApiError(error, setGlobalMessage); }
  };

  const handleMarkAllNotificationsAsRead = async () => {
    try {
      const response = await fetch(`${DJANGO_API_BASE_URL}/notifications/read-all/`, { method: 'POST', headers: getAuthHeaders(), });
      if (response.ok) { setGlobalMessage("Toutes les notifications marquées comme lues."); fetchNotifications(); }
      else { const errorData = await response.json(); setGlobalMessage(`Erreur: ${errorData.detail || 'Veuillez réessayer.'}`); }
    } catch (error) { handleApiError(error, setGlobalMessage); }
  };


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
          searchUser={friendSearchQuery} setSearchUser={setFriendSearchQuery}
          userSearchResults={userSearchResults} isSearchingUsers={isSearchingUsers} userSearchError={userSearchError} handleSearchUsers={handleSearchUsers}
          handleSendFriendRequest={handleSendFriendRequest}
          handleAcceptFriendRequest={handleFriendRequestAction} handleRejectFriendRequest={handleFriendRequestAction}
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
      <header className="bg-indigo-800 text-white py-3 shadow-md sticky top-0 z-50">
        <nav className="container mx-auto flex justify-between items-center px-4 max-w-6xl">
          <button onClick={() => setCurrentPage(isAuthenticated ? 'dashboard' : 'home')} className="text-2xl font-bold hover:text-indigo-200 transition duration-200 focus:outline-none">
            Synthétiseur de Rêves
          </button>
          <div className="flex items-center space-x-2 sm:space-x-4">
            {isAuthenticated ? (
              <>
                <span className="text-lg hidden md:inline-block">Bienvenue, {currentUser?.username}!</span>
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
        <GlobalMessage message={globalMessage} />
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