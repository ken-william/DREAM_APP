// frontend_dream_synthesizer/src/components/pages/CreateDreamPage.jsx
import React from 'react';

const CreateDreamPage = ({
  setCurrentPage,
  isRecording, startRecording, stopRecording,
  audioBlob, audioTranscript, setAudioTranscript, transcribeAudio,
  generatedImageUrl, generateImage,
  emotionAnalysis, analyzeEmotion,
  saveDream, createDreamLoading, createDreamError
}) => (
  <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 p-4 w-full">
    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl border border-gray-200">
      <h2 className="text-3xl font-bold text-center text-indigo-700 mb-6">Créer un Nouveau Rêve</h2>
      {createDreamError && <p className="mb-4 text-center text-red-600">{createDreamError}</p>}
      {createDreamLoading && <p className="mb-4 text-center text-gray-600">Chargement en cours...</p>}

      {/* Section Enregistrement Audio */}
      <div className="mb-6 border-b pb-4">
        <h3 className="text-xl font-semibold text-gray-800 mb-4">1. Enregistrez ou collez votre rêve</h3>
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`py-3 px-6 rounded-full text-white font-bold transition-all duration-300 ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
            disabled={createDreamLoading && !isRecording}
          >
            {isRecording ? 'Arrêter l\'enregistrement' : 'Commencer l\'enregistrement'}
          </button>
          {audioBlob && !isRecording && (
            <button
              onClick={transcribeAudio}
              className="py-3 px-6 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-bold transition-all duration-300"
              disabled={createDreamLoading}
            >
              Transcrire l'audio
            </button>
          )}
        </div>
        {audioBlob && !isRecording && (
          <div className="text-center mb-4">
            <audio controls src={URL.createObjectURL(audioBlob)} className="w-full max-w-md mx-auto"></audio>
          </div>
        )}
        <textarea
          className="w-full p-3 border rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 resize-y min-h-[100px]"
          placeholder="Ou tapez/collez votre rêve ici..."
          value={audioTranscript}
          onChange={(e) => setAudioTranscript(e.target.value)}
          disabled={createDreamLoading && !isRecording}
        ></textarea>
      </div>

      {/* Section Génération et Analyse */}
      {audioTranscript && (
        <div className="mb-6 border-b pb-4">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">2. Générer une image et analyser les émotions</h3>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-4">
            <button
              onClick={() => generateImage(audioTranscript)}
              className="py-3 px-6 rounded-full bg-purple-500 hover:bg-purple-600 text-white font-bold transition-all duration-300"
              disabled={createDreamLoading}
            >
              Générer l'Image
            </button>
            <button
              onClick={() => analyzeEmotion(audioTranscript)}
              className="py-3 px-6 rounded-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold transition-all duration-300"
              disabled={createDreamLoading}
            >
              Analyser les Émotions
            </button>
          </div>
          {generatedImageUrl && (
            <div className="mt-4 text-center">
              <h4 className="font-semibold text-gray-700 mb-2">Image générée :</h4>
              <img src={generatedImageUrl} alt="Rêve généré" className="max-w-full h-auto rounded-lg shadow-md mx-auto" />
            </div>
          )}
          {emotionAnalysis && (
            <div className="mt-4">
              <h4 className="font-semibold text-gray-700 mb-2 text-center">Analyse émotionnelle :</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {Object.entries(emotionAnalysis).map(([emotion, value]) => (
                  <div key={emotion} className="bg-indigo-100 rounded-md p-2 text-sm text-indigo-800 font-medium text-center">
                    {emotion}: {(value * 100).toFixed(0)}%
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section Sauvegarde */}
      {(audioTranscript || generatedImageUrl || emotionAnalysis) && (
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-800 mb-4">3. Sauvegarder votre rêve</h3>
          <button
            onClick={saveDream}
            className="py-3 px-8 rounded-full bg-teal-600 hover:bg-teal-700 text-white font-bold transition-all duration-300"
            disabled={createDreamLoading}
          >
            Sauvegarder mon Rêve
          </button>
        </div>
      )}
    </div>
    <button onClick={() => setCurrentPage('dashboard')} className="mt-8 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg shadow-md transition duration-200">
      Retour au Tableau de Bord
    </button>
  </div>
);

export default CreateDreamPage;