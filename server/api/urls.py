from django.urls import path, re_path

from . import views

urlpatterns = [
    re_path(r'^(?:.*)/?$', views.not_found, name='catch-all-api'),
]