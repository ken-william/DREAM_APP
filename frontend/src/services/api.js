import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE || "http://127.0.0.1:8000",
});

const setAuthHeader = () => {
  const token = localStorage.getItem("token") || localStorage.getItem("access_token");
  if (token) api.defaults.headers.common.Authorization = `Token ${token}`;
  else delete api.defaults.headers.common.Authorization;
};
setAuthHeader();

window.addEventListener("auth-changed", setAuthHeader);

// 🆕 API FONCTIONS D'AUTHENTIFICATION

/**
 * Récupérer l'utilisateur actuel
 */
export const getCurrentUser = async () => {
  try {
    setAuthHeader();
    const response = await api.get('/api/account/profile/');
    return response.data;
  } catch (error) {
    console.error('Erreur getCurrentUser:', error);
    throw error;
  }
};

/**
 * Déconnexion
 */
export const logoutUser = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  delete api.defaults.headers.common.Authorization;
  window.dispatchEvent(new Event('auth-changed'));
};

// 🆕 API FONCTIONS POUR LE FEED SOCIAL

/**
 * Récupérer le feed public (rêves publics de tous les utilisateurs)
 * @param {number} page - Numéro de page (défaut: 1)
 * @param {number} perPage - Nombre d'items par page (défaut: 10)
 * @param {string} sort - Tri: 'recent' ou 'popular' (défaut: 'recent')
 */
export const getPublicFeed = async (page = 1, perPage = 10, sort = 'recent') => {
  try {
    setAuthHeader();
    const response = await api.get(`/api/dreams/feed/public?page=${page}&per_page=${perPage}&sort=${sort}`);
    return response.data;
  } catch (error) {
    console.error('Erreur getPublicFeed:', error);
    throw error;
  }
};

/**
 * Récupérer le feed des amis (rêves des amis acceptés)
 * @param {number} page - Numéro de page (défaut: 1)
 * @param {number} perPage - Nombre d'items par page (défaut: 10)
 * @param {string} sort - Tri: 'recent' ou 'popular' (défaut: 'recent')
 */
export const getFriendsFeed = async (page = 1, perPage = 10, sort = 'recent') => {
  try {
    setAuthHeader();
    const response = await api.get(`/api/dreams/feed/friends?page=${page}&per_page=${perPage}&sort=${sort}`);
    return response.data;
  } catch (error) {
    console.error('Erreur getFriendsFeed:', error);
    throw error;
  }
};

/**
 * Récupérer les rêves de l'utilisateur connecté
 */
export const getUserDreams = async () => {
  try {
    setAuthHeader();
    const response = await api.get('/api/dreams/list');
    return response.data;
  } catch (error) {
    console.error('Erreur getUserDreams:', error);
    throw error;
  }
};

// 🆕 API FONCTIONS POUR LA MESSAGERIE AMÉLIORÉE

/**
 * Partager un rêve avec un ami
 * @param {string} username - Nom d'utilisateur de l'ami
 * @param {number} dreamId - ID du rêve à partager
 * @param {string} message - Message d'accompagnement (optionnel)
 */
export const shareDreamWithFriend = async (username, dreamId, message = '') => {
  try {
    setAuthHeader();
    const response = await api.post(`/api/social/share-dream/${username}/`, {
      dream_id: dreamId,
      message: message
    });
    return response.data;
  } catch (error) {
    console.error('Erreur shareDreamWithFriend:', error);
    throw error;
  }
};

/**
 * Envoyer un message texte
 * @param {string} username - Nom d'utilisateur du destinataire
 * @param {string} text - Contenu du message
 */
export const sendTextMessage = async (username, text) => {
  try {
    setAuthHeader();
    const response = await api.post(`/api/social/messages/send/${username}/`, {
      text: text,
      message_type: 'text'
    });
    return response.data;
  } catch (error) {
    console.error('Erreur sendTextMessage:', error);
    throw error;
  }
};

/**
 * Récupérer les messages avec un ami
 * @param {string} username - Nom d'utilisateur de l'ami
 */
export const getMessagesWithFriend = async (username) => {
  try {
    setAuthHeader();
    const response = await api.get(`/api/social/messages/${username}/`);
    return response.data;
  } catch (error) {
    console.error('Erreur getMessagesWithFriend:', error);
    throw error;
  }
};

/**
 * Récupérer la liste des amis
 */
export const getFriendsList = async () => {
  try {
    setAuthHeader();
    const response = await api.get('/api/social/friends/');
    return response.data;
  } catch (error) {
    console.error('Erreur getFriendsList:', error);
    throw error;
  }
};

// 🆕 API FONCTIONS POUR LIKES ET COMMENTAIRES

/**
 * Liker/unliker un rêve
 * @param {number} dreamId - ID du rêve
 */
export const toggleDreamLike = async (dreamId) => {
  try {
    setAuthHeader();
    const response = await api.post(`/api/social/dream/${dreamId}/like/`);
    return response.data;
  } catch (error) {
    console.error('Erreur toggleDreamLike:', error);
    throw error;
  }
};

/**
 * Ajouter un commentaire sur un rêve
 * @param {number} dreamId - ID du rêve
 * @param {string} content - Contenu du commentaire
 */
export const addDreamComment = async (dreamId, content) => {
  try {
    setAuthHeader();
    const response = await api.post(`/api/social/dream/${dreamId}/comment/`, {
      content: content
    });
    return response.data;
  } catch (error) {
    console.error('Erreur addDreamComment:', error);
    throw error;
  }
};

/**
 * Récupérer les commentaires d'un rêve
 * @param {number} dreamId - ID du rêve
 */
export const getDreamComments = async (dreamId) => {
  try {
    setAuthHeader();
    const response = await api.get(`/api/social/dream/${dreamId}/comments/`);
    return response.data;
  } catch (error) {
    console.error('Erreur getDreamComments:', error);
    throw error;
  }
};

/**
 * Modifier la privacy d'un rêve
 * @param {number} dreamId - ID du rêve
 * @param {string} privacy - Nouvelle privacy: 'public', 'private', 'friends_only'
 */
export const updateDreamPrivacy = async (dreamId, privacy) => {
  try {
    setAuthHeader();
    const response = await api.put(`/api/dreams/${dreamId}/privacy`, {
      privacy: privacy
    });
    return response.data;
  } catch (error) {
    console.error('Erreur updateDreamPrivacy:', error);
    throw error;
  }
};

export default api;
