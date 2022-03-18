from django.urls import path, re_path
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework import permissions

from . import views

schema_view = get_schema_view(
    openapi.Info(
        title="SKLEC-VIS API",
        default_version='v1',
        description="This is the OpenAPI document of SKLEC-VIS system.",
        contact=openapi.Contact(email="Bill.Chen@live.com"),
        license=openapi.License(name="MIT License"),
    ),
    public=True,
    permission_classes=[permissions.AllowAny],
)

urlpatterns = [
    path('dataset/', views.DatasetList.as_view()),
    path('dataset/<str:uuid>/', views.DataContent.as_view(), name='dataset-detail'),
    path('viscontent/<str:uuid>/', views.GetVisContent.as_view(), name='data-content'),
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    re_path(r'^swagger/$', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger'),
    re_path(r'^redoc/$', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    re_path(r'^(?:.*)/?$', views.not_found, name='catch-all-api'),
]