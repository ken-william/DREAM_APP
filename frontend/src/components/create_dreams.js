// frontend/src/components/create_dreams.js
import React, { useRef, useState } from "react";

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
  const [previewData, setPreviewData] = useState(null); // Données pour sauvegarde
  const [privacy, setPrivacy] = useState("private"); // Choix de confidentialité
  const [isSaved, setIsSaved] = useState(false); // Rêve déjà sauvegardé ?

  // Enregistrement micro
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);

  // Fonction pour générer le rêve (SANS sauvegarder)
  const generateDream = async (audioBlobOrFile) => {
    const form = new FormData();
    form.append("audio", audioBlobOrFile, audioBlobOrFile.name || "recording.webm");

    const res = await fetch(`${API_BASE}/api/dreams/generate`, { // ✅ Nouvelle API
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

  // Fonction pour sauvegarder le rêve
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

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus("");
    if (!file) {
      setStatus("Veuillez sélectionner un fichier audio ou utiliser le micro.");
      return;
    }
    
    // Reset des résultats précédents
    resetResults();
    
    setLoading(true);
    try {
      const data = await generateDream(file);
      setStatus("✅ Rêve généré ! Vous pouvez maintenant choisir de le sauvegarder.");
      
      // Afficher les résultats
      if (data.image && data.image.includes('data:image/')) {
        setGeneratedImage(data.image);
      }
      if (data.transcription) setTranscription(data.transcription);
      if (data.preview_data) setPreviewData(data.preview_data);
      
      console.log("Réponse generate_dreams:", data);
    } catch (err) {
      console.error(err);
      setStatus(err.message || "Erreur réseau / serveur.");
    } finally {
      setLoading(false);
    }
  };

  // Contrôles micro
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
          
          // Afficher les résultats
          if (data.image && data.image.includes('data:image/')) {
            setGeneratedImage(data.image);
          }
          if (data.transcription) setTranscription(data.transcription);
          if (data.preview_data) setPreviewData(data.preview_data);
          
          console.log("Réponse generate_dreams (micro):", data);
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
    setPreviewData(null);
    setIsSaved(false);
    setStatus("");
  };

  const clearAll = () => {
    resetResults();
    setFile(null);
  };

  return (
    <div className="container" style={{ maxWidth: 900, margin: "2rem auto", padding: "0 1rem" }}>
      <h2 style={{ textAlign: "center", color: "#333", marginBottom: "2rem" }}>
        🌙 Créer un rêve (Audio uniquement) ✨
      </h2>

      {/* Section Upload */}
      <div style={{ 
        background: "#f8f9fa", 
        padding: "2rem", 
        borderRadius: "12px", 
        marginBottom: "2rem",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)"
      }}>
        <h3 style={{ 
          textAlign: "center", 
          marginBottom: "2rem", 
          color: "#374151",
          fontSize: "1.5rem" 
        }}>
          🎤 Racontez votre rêve
        </h3>

        {/* Upload de fichier audio */}
        <div style={{ marginBottom: "2rem" }}>
          <label style={{ 
            fontWeight: "bold", 
            display: "block", 
            marginBottom: "1rem",
            color: "#374151",
            fontSize: "1.1rem"
          }}>
            📁 Choisir un fichier audio :
          </label>
          <div style={{
            border: "2px dashed #d1d5db",
            borderRadius: "12px",
            padding: "2rem",
            textAlign: "center",
            backgroundColor: file ? "#f0f9ff" : "#fafafa",
            borderColor: file ? "#3b82f6" : "#d1d5db",
            transition: "all 0.3s"
          }}>
            <input
              type="file"
              accept=".wav,.mp3,.m4a,.ogg,.webm"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              style={{ 
                width: "100%",
                padding: "1rem",
                fontSize: "1rem",
                border: "none",
                backgroundColor: "transparent"
              }}
            />
            {file && (
              <div style={{
                marginTop: "1rem",
                padding: "0.75rem",
                backgroundColor: "#dbeafe",
                borderRadius: "8px",
                display: "inline-block"
              }}>
                ✅ Fichier sélectionné : {file.name}
              </div>
            )}
          </div>
        </div>

        {/* OU Enregistrement micro */}
        <div style={{ 
          textAlign: "center",
          borderTop: "1px solid #e5e7eb",
          paddingTop: "2rem"
        }}>
          <label style={{ 
            fontWeight: "bold", 
            display: "block", 
            marginBottom: "1rem",
            color: "#374151",
            fontSize: "1.1rem"
          }}>
            🎙️ Ou enregistrer directement :
          </label>
          
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginBottom: "2rem" }}>
            {!recording ? (
              <button 
                type="button" 
                onClick={startRecording} 
                disabled={loading}
                style={{
                  padding: "1rem 2rem",
                  backgroundColor: loading ? "#ccc" : "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "50px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontWeight: "600",
                  fontSize: "1.1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)"
                }}
              >
                🎙️ Commencer l'enregistrement
              </button>
            ) : (
              <button 
                type="button" 
                onClick={stopRecording} 
                disabled={loading}
                style={{
                  padding: "1rem 2rem",
                  backgroundColor: "#dc2626",
                  color: "white",
                  border: "none",
                  borderRadius: "50px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "1.1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  animation: "pulse 1.5s infinite",
                  boxShadow: "0 4px 12px rgba(220, 38, 38, 0.4)"
                }}
              >
                ⏹️ Arrêter & générer
              </button>
            )}
            
            {(generatedImage || transcription) && (
              <button 
                type="button" 
                onClick={clearAll}
                style={{
                  padding: "1rem 2rem",
                  backgroundColor: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: "50px",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "1.1rem"
                }}
              >
                🗑️ Tout effacer
              </button>
            )}
          </div>

          {/* Bouton générer pour fichier */}
          {file && (
            <button 
              onClick={onSubmit}
              disabled={loading}
              style={{
                padding: "1rem 3rem",
                backgroundColor: loading ? "#ccc" : "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "50px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "600",
                fontSize: "1.2rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                margin: "0 auto",
                boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)"
              }}
            >
              {loading ? "⏳ Génération..." : "🎨 Générer le rêve"}
            </button>
          )}
        </div>
      </div>

      {/* Status */}
      {status && (
        <div style={{ 
          padding: "1rem", 
          marginBottom: "1rem", 
          backgroundColor: status.includes("✅") ? "#d4edda" : "#f8d7da",
          color: status.includes("✅") ? "#155724" : "#721c24",
          borderRadius: "8px",
          border: `1px solid ${status.includes("✅") ? "#c3e6cb" : "#f5c6cb"}`
        }}>
          {status}
        </div>
      )}

      {/* Résultats générés */}
      {(generatedImage || transcription) && (
        <div style={{ 
          background: "white", 
          padding: "2rem", 
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          border: "1px solid #e9ecef",
          marginBottom: "1rem"
        }}>
          <h3 style={{ color: "#495057", marginBottom: "1.5rem", textAlign: "center" }}>
            🎨 Votre rêve généré
          </h3>
          
          {/* Transcription */}
          {transcription && (
            <div style={{ marginBottom: "1.5rem" }}>
              <h4 style={{ color: "#6c757d", marginBottom: "0.5rem" }}>
                🎤 Transcription :
              </h4>
              <p style={{ 
                background: "#f8f9fa", 
                padding: "1rem", 
                borderRadius: "8px",
                margin: 0,
                borderLeft: "4px solid #007bff"
              }}>
                {transcription}
              </p>
            </div>
          )}
          
          {/* Image générée */}
          {generatedImage && (
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <h4 style={{ color: "#6c757d", marginBottom: "1rem" }}>
                🖼️ Image de votre rêve :
              </h4>
              <div style={{
                display: "inline-block",
                padding: "1rem",
                background: "#f8f9fa",
                borderRadius: "12px",
                boxShadow: "0 2px 15px rgba(0,0,0,0.1)"
              }}>
                <img 
                  src={generatedImage} 
                  alt="Rêve généré" 
                  style={{ 
                    maxWidth: "100%", 
                    height: "auto", 
                    borderRadius: "8px",
                    maxHeight: "500px",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
                  }} 
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Section de sauvegarde */}
      {previewData && !isSaved && (
        <div style={{
          background: "white",
          padding: "2rem",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          border: "1px solid #e9ecef"
        }}>
          <h3 style={{ color: "#495057", marginBottom: "1.5rem", textAlign: "center" }}>
            💾 Sauvegarder votre rêve ?
          </h3>
          
          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ fontWeight: "bold", display: "block", marginBottom: "0.5rem" }}>
              🔒 Confidentialité :
            </label>
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="radio"
                  name="privacy"
                  value="private"
                  checked={privacy === "private"}
                  onChange={(e) => setPrivacy(e.target.value)}
                />
                🔒 Privé (seulement vous)
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="radio"
                  name="privacy"
                  value="friends_only"
                  checked={privacy === "friends_only"}
                  onChange={(e) => setPrivacy(e.target.value)}
                />
                👥 Amis uniquement
              </label>
              <label style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="radio"
                  name="privacy"
                  value="public"
                  checked={privacy === "public"}
                  onChange={(e) => setPrivacy(e.target.value)}
                />
                🌍 Public
              </label>
            </div>
          </div>
          
          <div style={{ textAlign: "center", display: "flex", gap: "1rem", justifyContent: "center" }}>
            <button
              onClick={saveDream}
              disabled={saving}
              style={{
                padding: "0.75rem 2rem",
                backgroundColor: saving ? "#ccc" : "#28a745",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                cursor: saving ? "not-allowed" : "pointer",
                fontWeight: "bold"
              }}
            >
              {saving ? "⏳ Sauvegarde..." : "💾 Sauvegarder le rêve"}
            </button>
            
            <button
              onClick={clearAll}
              style={{
                padding: "0.75rem 2rem",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontSize: "16px",
                cursor: "pointer"
              }}
            >
              🗑️ Ne pas sauvegarder
            </button>
          </div>
        </div>
      )}

      {/* Message si déjà sauvegardé */}
      {isSaved && (
        <div style={{
          background: "#d4edda",
          border: "1px solid #c3e6cb",
          color: "#155724",
          padding: "1rem",
          borderRadius: "8px",
          textAlign: "center"
        }}>
          <p style={{ margin: 0, fontWeight: "bold" }}>
            ✅ Rêve sauvegardé ! Vous pouvez le retrouver dans votre profil.
          </p>
        </div>
      )}

      {/* CSS pour l'animation pulse */}
      <style>{`
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}