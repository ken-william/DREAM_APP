from django.urls import path

from . import views
from django.views.decorators.csrf import csrf_exempt


urlpatterns = [
    # ex: /polls/
    path('create', csrf_exempt(views.DreamCreateAPIView.as_view()), name='create_dream'),
    # ex: /polls/5/
]