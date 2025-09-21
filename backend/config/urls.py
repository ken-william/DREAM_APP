from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# Import direct de la fonction health_check
def health_check(request):
    from django.http import JsonResponse
    from django.db import connection
    from datetime import datetime
    
    status = "healthy"
    checks = {}
    
    # Vérification base de données
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        checks["database"] = "healthy"
    except Exception as e:
        checks["database"] = f"unhealthy: {str(e)}"
        status = "unhealthy"
    
    checks["timestamp"] = datetime.now().isoformat()
    
    return JsonResponse({
        "status": status,
        "checks": checks,
        "message": "Dream Synthesizer API Health Check"
    }, status=200 if status == "healthy" else 503)

urlpatterns = [
    path("admin/", admin.site.urls),

    # Health check pour monitoring
    path("health/", health_check, name="health_check"),

    # Auth standard SimpleJWT
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/account/", include("accounts.urls")),
    path("api/dreams/", include("dreams.urls")),
    path("api/social/", include("social.urls")),
    path("", include("dreams.urls")),
]

