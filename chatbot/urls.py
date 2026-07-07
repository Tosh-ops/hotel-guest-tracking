from django.urls import path
from . import views

urlpatterns = [
    path('chat/', views.chatbot_reply, name='chatbot_reply'),
]