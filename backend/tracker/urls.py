from django.urls import path
from .views import BrandApiView,CiggretteEntriesApiView
urlpatterns = [
    path('brand/',BrandApiView.as_view(),name="brand"),
    path('brand/<int:pk>/',BrandApiView.as_view(),name="brand"),
    path('entries/',BrandApiView.as_view(),name="brand")
    
]