import React, { useRef, useState } from "react";
import "../styles/CreateDreams.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://127.0.0.1:8000";

function getAuthHeader() {
  const token = localStorage.getItem("token") || localStorage.getItem("authToken");
  if (token) return { Authorization: `Token ${token}` };
  return {};
}

export default function CreateDreams() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // États pour les résultats
  const [generatedImage, setGeneratedImage] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [emotion, setEmotion] = useState(null); // AJOUTÉ
  const [previewData, setPreviewData] = useState(null);
  const [privacy, setPrivacy] = useState("private");
  const [isSaved, setIsSaved] = useState(false);

  // Enregistrement micro
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);

  const generateDream = async (audioBlobOrFile) => {
    const form = new FormData();
    form.append("audio", audioBlobOrFile, audioBlobOrFile.name || "recording.webm");

    const res = await fetch(`${API_BASE}/api/dreams/generate`, {
      method: "POST",
      headers: {
        ...getAuthHeader(),
      },
      body: form,
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`Erreur ${res.status} : ${txt}`);
    }
    return res.json().catch(() => ({}));
  };

  const saveDream = async () => {
    if (!previewData) {
      setStatus("❌ Aucun rêve à sauvegarder");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/dreams/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          ...previewData,
          privacy: privacy
        }),
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        throw new Error(`Erreur sauvegarde ${res.status} : ${txt}`);
      }

      const data = await res.json();
      setStatus(`✅ Rêve sauvegardé avec succès ! (${data.privacy})`);
      setIsSaved(true);
      
    } catch (err) {
      console.error(err);
      setStatus(`❌ Erreur sauvegarde : ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const processGenerationResult = (data) => {
    // Afficher l'image
    if (data.image && data.image.includes('data:image/')) {
      setGeneratedImage(data.image);
    }
    
    // Afficher la transcription
    if (data.transcription) {
      setTranscription(data.transcription);
    }
    
    // Afficher l'émotion - AJOUTÉ
    if (data.emotion) {
      setEmotion(data.emotion);
      console.log("Émotion détectée:", data.emotion);
    }
    
    // Sauvegarder les données de prévisualisation
    if (data.preview_data) {
      setPreviewData(data.preview_data);
    }
    
    console.log("Réponse complète generate_dreams:", data);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    if (!file) {
      setStatus("Veuillez sélectionner un fichier audio ou utiliser le micro.");
      return;
    }
    
    resetResults();
    
    setLoading(true);
    try {
      const data = await generateDream(file);
      setStatus("✅ Rêve généré ! Vous pouvez maintenant choisir de le sauvegarder.");
      processGenerationResult(data);
      
    } catch (err) {
      console.error(err);
      setStatus(err.message || "Erreur réseau / serveur.");
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    setStatus("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("🎤 Micro non supporté par ce navigateur.");
      return;
    }
    
    resetResults();
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          setLoading(true);
          const data = await generateDream(blob);
          setStatus("✅ Rêve généré ! Vous pouvez maintenant choisir de le sauvegarder.");
          processGenerationResult(data);
          
        } catch (err) {
          console.error(err);
          setStatus(err.message || "Erreur lors de l'envoi de l'audio micro.");
        } finally {
          setLoading(false);
        }
      };
      mediaRecorderRef.current = mr;
      mr.start();
      setRecording(true);
    } catch (err) {
      console.error(err);
      setStatus("Impossible d'accéder au micro.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach((t) => t.stop());
      setRecording(false);
    }
  };

  const resetResults = () => {
    setGeneratedImage(null);
    setTranscription("");
    setEmotion(null); // AJOUTÉ
    setPreviewData(null);
    setIsSaved(false);
    setStatus("");
  };

  const clearAll = () => {
    resetResults();
    setFile(null);
    setPrivacy("private");
    // Forcer le re-render en resetant l'input file
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
    console.log("🗑️ Interface nettoyée, prête pour un nouveau rêve");
  };

  return (
    <div className="create-dreams-container">
      <h2 className="create-dreams-title">
        🌙 Créer un rêve (Audio uniquement) ✨
      </h2>

      {/* Section Upload */}
      <div className="upload-section">
        <h3 className="upload-section-title">
          🎤 Racontez votre rêve
        </h3>

        {/* Upload de fichier audio */}
        <div className="file-upload-container">
          <label className="file-upload-label">
            📁 Choisir un fichier audio :
          </label>
          <div className={`file-upload-dropzone ${file ? 'has-file' : ''}`}>
            <input
              type="file"
              accept=".wav,.mp3,.m4a,.ogg,.webm"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="file-upload-input"
            />
            {file && (
              <div className="file-selected-info">
                ✅ Fichier sélectionné : {file.name}
              </div>
            )}
          </div>
        </div>

        {/* OU Enregistrement micro */}
        <div className="recording-section">
          <label className="recording-label">
            🎙️ Ou enregistrer directement :
          </label>
          
          <div className="recording-controls">
            {!recording ? (
              <button 
                type="button" 
                onClick={startRecording} 
                disabled={loading}
                className="recording-button start"
              >
                🎙️ Commencer l'enregistrement
              </button>
            ) : (
              <button 
                type="button" 
                onClick={stopRecording} 
                disabled={loading}
                className="recording-button stop"
              >
                ⏹️ Arrêter & générer
              </button>
            )}
            
            {(generatedImage || transcription || emotion) && (
              <button 
                type="button" 
                onClick={clearAll}
                className="recording-button clear"
              >
                🗑️ Tout effacer
              </button>
            )}
          </div>

          {/* Bouton générer pour fichier */}
          {file && !loading && !previewData && (
            <button 
              onClick={onSubmit}
              disabled={loading}
              className="recording-button generate"
            >
              {loading ? "⏳ Génération..." : "🎨 Générer le rêve"}
            </button>
          )}
        </div>
      </div>

      {/* Status */}
      {status && (
        <div className={`status-message ${status.includes("✅") ? 'success' : 'error'}`}>
          {status}
        </div>
      )}

      {/* Résultats générés */}
      {(generatedImage || transcription || emotion) && (
        <div className="results-section">
          <h3 className="results-title">
            🎨 Votre rêve généré
          </h3>
          
          {/* Transcription */}
          {transcription && (
            <div className="transcription-section">
              <h4 className="transcription-label">
                🎤 Transcription :
              </h4>
              <p className="transcription-text">
                {transcription}
              </p>
            </div>
          )}
          
          {/* Analyse d'émotion - AJOUTÉ */}
          {emotion && (
            <div className="emotion-section">
              <h4 className="emotion-label">
                😊 Analyse d'émotion :
              </h4>
              <div className="emotion-display">
                <div className="emotion-emoji">
                  {emotion.emoji || "😐"}
                </div>
                <div className="emotion-details">
                  <h5 className="emotion-name">
                    {emotion.emotion || emotion.name || "Neutre"}
                  </h5>
                  <p className="emotion-confidence">
                    Confiance : {emotion.confidence || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {/* Image générée */}
          {generatedImage && (
            <div className="image-section">
              <h4 className="image-label">
                🖼️ Image de votre rêve :
              </h4>
              <div className="image-container">
                <img 
                  src={generatedImage} 
                  alt="Rêve généré" 
                  className="generated-image"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section de sauvegarde */}
      {previewData && !isSaved && (
        <div className="save-section">
          <h3 className="save-title">
            💾 Sauvegarder votre rêve ?
          </h3>
          
          <div className="privacy-section">
            <label className="privacy-label">
              🔒 Confidentialité :
            </label>
            <div className="privacy-options">
              <label className="privacy-option">
                <input
                  type="radio"
                  name="privacy"
                  value="private"
                  checked={privacy === "private"}
                  onChange={(e) => setPrivacy(e.target.value)}
                />
                <span>🔒 Privé (seulement vous)</span>
              </label>
              <label className="privacy-option">
                <input
                  type="radio"
                  name="privacy"
                  value="friends_only"
                  checked={privacy === "friends_only"}
                  onChange={(e) => setPrivacy(e.target.value)}
                />
                <span>👥 Amis uniquement</span>
              </label>
              <label className="privacy-option">
                <input
                  type="radio"
                  name="privacy"
                  value="public"
                  checked={privacy === "public"}
                  onChange={(e) => setPrivacy(e.target.value)}
                />
                <span>🌍 Public</span>
              </label>
            </div>
          </div>
          
          <div className="save-actions">
            <button
              onClick={saveDream}
              disabled={saving}
              className="save-button primary"
            >
              {saving ? "⏳ Sauvegarde..." : "💾 Sauvegarder le rêve"}
            </button>
            
            <button
              onClick={clearAll}
              className="save-button secondary"
            >
              🗑️ Ne pas sauvegarder
            </button>
          </div>
        </div>
      )}

      {/* Message si déjà sauvegardé */}
      {isSaved && (
        <div className="saved-message">
          <p className="saved-message-text">
            ✅ Rêve sauvegardé ! Vous pouvez le retrouver dans votre profil.
          </p>
          <button
            onClick={clearAll}
            className="save-button primary"
          >
            🌅 Créer un nouveau rêve
          </button>
        </div>
      )}
    </div>
  );
}
