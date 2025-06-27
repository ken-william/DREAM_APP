from django.contrib import admin
from django.urls import path, include
from dreams.views import home_page

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/dreams/', include('dreams.urls')),
    path('api/account/', include('accounts.urls')),
    path('api/social/', include('social.urls')),
]
