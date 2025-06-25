// frontend_dream_synthesizer/src/components/pages/ChatDreamPage.jsx
import React from 'react';

const ChatDreamPage = ({
  setCurrentPage,
  currentDreamForChat, chatHistory, setChatHistory,
  chatInput, setChatInput, handleChatSubmit, chatLoading
}) => (
  <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 p-4 w-full">
    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl border border-gray-200">
      <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">Interprétation de Rêve par IA</h2>
      
      {!currentDreamForChat ? (
        <div className="text-center text-gray-600">
          <p className="mb-4">Veuillez sélectionner un rêve à discuter depuis la page "Mes Rêves".</p>
          <button onClick={() => setCurrentPage('my-dreams')} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg">Aller à Mes Rêves</button>
        </div>
      ) : (
        <>
          <div className="mb-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
            <h3 className="text-xl font-semibold text-indigo-800 mb-2">Rêve en cours de discussion:</h3>
            <p className="text-gray-800 italic">"{currentDreamForChat.raw_prompt}"</p>
          </div>

          <div className="chat-area h-96 overflow-y-auto border rounded-lg p-4 mb-4 bg-gray-50 flex flex-col space-y-3">
            {chatHistory.length === 0 ? (
              <p className="text-center text-gray-500">Commencez la discussion...</p>
            ) : (
              chatHistory.map((msg, index) => (
                <div key={index} className={`p-3 rounded-lg ${msg.role === 'user' ? 'bg-blue-100 text-blue-900 self-end' : 'bg-green-100 text-green-900 self-start'} max-w-[80%]`}>
                  <p className="font-semibold mb-1">{msg.role === 'user' ? 'Vous' : 'IA'}:</p>
                  <p>{msg.content}</p>
                </div>
              ))
            )}
            {chatLoading && (
              <div className="text-center text-gray-500 mt-2">
                <span className="animate-pulse">L'IA réfléchit...</span>
              </div>
            )}
          </div>

          <form onSubmit={handleChatSubmit} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="flex-grow p-3 border rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Posez une question sur votre rêve..."
              disabled={chatLoading}
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg transition duration-200"
              disabled={chatLoading}
            >
              Envoyer
            </button>
          </form>
        </>
      )}
      <button onClick={() => setCurrentPage('dashboard')} className="mt-8 bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200">
        Retour au Tableau de Bord
      </button>
    </div>
  </div>
  );

export default ChatDreamPage;