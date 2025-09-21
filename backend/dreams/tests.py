# dreams/tests.py - Point d'entrée des tests pour l'application dreams
"""
Tests principaux pour l'application dreams.
Structure modulaire organisée dans features/steps/

Pour exécuter tous les tests:
    python manage.py test dreams

Organisation:
- features/steps/test_models.py : Tests des modèles Django
- features/steps/test_serializers.py : Tests des serializers DRF
- features/steps/test_validation.py : Tests validation fichiers audio
- features/steps/test_emotions.py : Tests analyse émotionnelle
- features/steps/test_images.py : Tests génération d'images
- features/steps/test_apis.py : Tests des APIs REST
- features/steps/test_security.py : Tests de sécurité
- features/steps/test_export.py : Tests d'export HTML
"""

# Import des tests modulaires depuis features/steps
from .features.steps.test_models import *
from .features.steps.test_serializers import *
from .features.steps.test_validation import *
from .features.steps.test_emotions import *
from .features.steps.test_images import *
from .features.steps.test_apis import *
from .features.steps.test_security import *
from .features.steps.test_export import *
