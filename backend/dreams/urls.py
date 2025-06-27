from django.urls import path

from . import views
from django.views.decorators.csrf import csrf_exempt


urlpatterns = [
    # ex: /polls/
    path('create', views.DreamCreateAPIView.as_view(), name='create_dream'),
    path('create-page', views.create_dream_page, name='create_dream_page'),
    # ex: /polls/5/
]