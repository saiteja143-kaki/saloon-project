"""
URL configuration for core project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse, HttpResponse

def api_root(request):
    return JsonResponse({
        "message": "Welcome to SalonFlow API", 
        "info": "Please open index.html in your browser to use the frontend app. The API endpoints are located at /api/"
    })

def favicon_view(request):
    return HttpResponse(status=204) # No Content to prevent 404s

urlpatterns = [
    path('', api_root, name='api_root'),
    path('favicon.ico', favicon_view),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]
