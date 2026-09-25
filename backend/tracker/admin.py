from django.contrib import admin
from .models import Brand, CigaretteEntry


@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'price')


admin.site.register(CigaretteEntry)