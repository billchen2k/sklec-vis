from django.http import JsonResponse, HttpRequest, HttpResponse
from django.shortcuts import render

# Create your views here.
from rest_framework import status, generics


class DatasetList(generics.ListCreateAPIView):
    def get(self, request, *args, **kwargs):
        return HttpResponse(status=status.HTTP_200_OK)

def not_found(request: HttpRequest) -> HttpResponse:
    return JsonResponse({
        'detail': f'{request.method} {request.path} not found!!!!!'
    }, status=status.HTTP_404_NOT_FOUND)