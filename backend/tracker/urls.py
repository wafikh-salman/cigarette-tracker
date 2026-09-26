from django.urls import path
from .views import (
    BrandApiView,
    CiggretteEntriesApiView,
    DashboardApiView,
    BrandStatsApiView,
    BrandUsageTrendApiView,
    InsightsApiView,
)

urlpatterns = [
    path('brand/',BrandApiView.as_view(),name="brand"),
    path('brand/<int:pk>/',BrandApiView.as_view(),name="brandwithid"),
    path('entries/',CiggretteEntriesApiView.as_view(),name="entires"),
    path('entries/<int:pk>/',CiggretteEntriesApiView.as_view(),name="entry"),
    path('dashboard/',DashboardApiView.as_view(),name="dashboard"),
    path('brand/<int:pk>/stats/',BrandStatsApiView.as_view(),name="brandstats"),
    path(
        'brand/<int:id>/usage/',
        BrandUsageTrendApiView.as_view(),
        name='brandusage'
    ),
    path('insights/', InsightsApiView.as_view(), name='insights'),
]