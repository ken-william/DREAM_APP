from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),

    # Auth standard SimpleJWT
    path("api/token/", TokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/account/", include("accounts.urls")),
    path("api/dreams/", include("dreams.urls")),
    path("api/social/", include("social.urls")),
    path("", include("dreams.urls")),
]

