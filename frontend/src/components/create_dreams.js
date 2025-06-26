<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Créer un rêve</title>
</head>
<body>
  <h1>Créer un rêve</h1>

  <form id="dreamForm" method="POST" enctype="multipart/form-data">
    <label for="audio">Audio (.mp3, .wav) :</label><br>
    <input type="file" name="audio" accept="audio/*" required><br><br>

    <button type="submit">Envoyer</button>
  </form>

  <p id="responseMessage"></p>

  <script>
    const form = document.getElementById("dreamForm");
    const messageEl = document.getElementById("responseMessage");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      try {
        const res = await fetch("http://localhost:8000/dreams/create", {
          method: "POST",
          body: formData
        });

        const data = await res.json();
        if (res.ok) {
          messageEl.textContent = `Rêve n°${data.dream_id} créé avec succès.`;
        } else {
          messageEl.textContent = `Erreur : ${data.error || 'Inconnue'}`;
        }
      } catch (err) {
        messageEl.textContent = `Erreur réseau : ${err.message}`;
      }
    });
  </script>
<li><a href="{% url 'home' %}">Accueil</a></li>
</body>
</html>