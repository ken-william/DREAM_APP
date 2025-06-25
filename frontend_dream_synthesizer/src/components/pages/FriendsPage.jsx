// frontend_dream_synthesizer/src/components/pages/FriendsPage.jsx
import React, { useEffect } from 'react';

const FriendsPage = ({
  setCurrentPage,
  friends, friendRequests, friendsLoading, friendsError, fetchFriendsAndRequests,
  searchUser, setSearchUser,
  userSearchResults, isSearchingUsers, userSearchError, handleSearchUsers,
  handleSendFriendRequest,
  handleAcceptFriendRequest, handleRejectFriendRequest,
  friendActionMessage
}) => {
  useEffect(() => {
    fetchFriendsAndRequests();
  }, [fetchFriendsAndRequests]);

  return (
    <div className="flex flex-col items-center min-h-[calc(100vh-64px)] bg-gray-50 p-4 w-full">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl border border-gray-200">
        <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">Gérer Amis</h2>
        {friendsLoading && <p className="text-center text-gray-600">Chargement des amis et des demandes...</p>}
        {friendsError && <p className="text-center text-red-600">{friendsError}</p>}
        {friendActionMessage && <p className="mb-4 text-center text-green-600">{friendActionMessage}</p>}
  
        {/* Section Demandes d'amis */}
        <div className="mb-8 border-b pb-4">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Demandes d'amis en attente ({Array.isArray(friendRequests) ? friendRequests.length : 0})</h3>
          {Array.isArray(friendRequests) && friendRequests.length === 0 ? (
            <p className="text-gray-600">Aucune demande d'ami en attente.</p>
          ) : (
            <div className="space-y-3">
              {Array.isArray(friendRequests) && friendRequests.map(notification => (
                <div key={notification.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-800 font-medium">{notification.sender_username} vous a envoyé une demande d'ami.</p>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleAcceptFriendRequest(notification.id)}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-lg text-sm"
                    >
                      Accepter
                    </button>
                    <button
                      onClick={() => handleRejectFriendRequest(notification.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm"
                    >
                      Rejeter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
  
        {/* Section Mes Amis */}
        <div className="mb-8 border-b pb-4">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Mes Amis ({Array.isArray(friends) ? friends.length : 0})</h3>
          {Array.isArray(friends) && friends.length === 0 ? (
            <p className="text-gray-600">Vous n'avez pas encore d'amis.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.isArray(friends) && friends.map(friend => (
                <div key={friend.id} className="flex items-center p-3 bg-gray-100 rounded-lg shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-800 font-bold mr-3">
                    {friend.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-gray-800 font-medium">{friend.username}</span>
                  {/* Optionnel: Bouton pour retirer l'ami (non implémenté côté backend) */}
                  {/* <button className="ml-auto bg-red-400 hover:bg-red-500 text-white px-2 py-1 rounded-lg text-xs">Retirer</button> */}
                </div>
              ))}
            </div>
          )}
        </div>
  
        {/* Section Rechercher des Utilisateurs */}
        <div>
          <h3 className="text-xl font-semibold text-gray-800 mb-4">Rechercher des Utilisateurs</h3>
          <form onSubmit={(e) => { e.preventDefault(); handleSearchUsers(searchUser); }} className="flex gap-2 mb-4">
            <input
              type="text"
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
              className="flex-grow p-2 border rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Nom d'utilisateur à rechercher..."
            />
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition duration-200"
              disabled={isSearchingUsers}
            >
              {isSearchingUsers ? 'Recherche...' : 'Rechercher'}
            </button>
          </form>
          {userSearchError && <p className="text-red-600 text-center">{userSearchError}</p>}
          {Array.isArray(userSearchResults) && userSearchResults.length > 0 && (
            <div className="mt-4 space-y-3">
              <h4 className="font-semibold text-gray-700">Résultats de la recherche:</h4>
              {userSearchResults.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-100 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-green-200 flex items-center justify-center text-green-800 font-bold mr-3 text-sm">
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-gray-800 font-medium">{user.username}</span>
                  </div>
                  <button
                    onClick={() => handleSendFriendRequest(user.id)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-sm"
                  >
                    Ajouter
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
  
        <button onClick={() => setCurrentPage('dashboard')} className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200">
          Retour au Tableau de Bord
        </button>
      </div>
    </div>
  );
};

export default FriendsPage;