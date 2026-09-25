from django.urls import path
from .views import BrandApiView,CiggretteEntriesApiView,DashboardApiView
urlpatterns = [
    path('brand/',BrandApiView.as_view(),name="brand"),
    path('brand/<int:pk>/',BrandApiView.as_view(),name="brandwithid"),
    path('entries/',CiggretteEntriesApiView.as_view(),name="entires"),
    path('entries/<int:pk>/',CiggretteEntriesApiView.as_view(),name="entry"),
    path('dashboard/',DashboardApiView.as_view(),name="dashboard"),
]