from django.urls import path, re_path
from django.views.decorators.csrf import csrf_exempt
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from rest_framework import permissions
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
'''
path('login/', obtain_jwt_token)其实相当于path('login/', ObtainJSONWebToken.as_view())
因为我们之间进源码可以看到
obtain_jwt_token = ObtainJSONWebToken.as_view()     #获得
refresh_jwt_token = RefreshJSONWebToken.as_view()   #刷新
verify_jwt_token = VerifyJSONWebToken.as_view()     #验证
'''


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
    path('dataset/create', views.DatasetCreate.as_view()),
    path('dataset/rawfile/upload', views.FileUploadView.as_view()),
    path('dataset/<str:uuid>/', views.DataContent.as_view(), name='dataset-detail'),
    path('viscontent/vqdatastream/', views.PostVQDataStream.as_view(), name='vq-datastream'),
    path('viscontent/<str:uuid>/', views.GetRskContent.as_view(), name='rsk-content'),
    path('ncfcontent/<str:uuid>/', views.GetNcfContent.as_view(), name='ncf-content'),
    path('tags/', views.TagList.as_view()),
    path('user/token/', views.token, name='get-token'),
    path('user/login/', TokenObtainPairView.as_view(), name='user-login'),
    path('user/token/refresh/', TokenRefreshView.as_view(), name='user-token-refresh'),
    path('user/logout/', views.Logout.as_view(), name='user-logout'),
    path('user/register/', views.Register.as_view(), name='user-register'),
    path('user/profile/', views.GetUserProfile.as_view(), name='user-profile'),
    re_path(r'^swagger(?P<format>\.json|\.yaml)$', schema_view.without_ui(cache_timeout=0), name='schema-json'),
    re_path(r'^swagger/$', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger'),
    re_path(r'^redoc/$', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    re_path(r'^(?:.*)/?$', views.not_found, name='catch-all-api'),
]