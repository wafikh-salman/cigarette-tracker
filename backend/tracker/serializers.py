from rest_framework import serializers
from .models import Brand,CigaretteEntry
class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = "__all__"
        
    
class CigaretteEntrySerializer(serializers.ModelSerializer):
    class Meta:
        model = CigaretteEntry
        fields = ['brand',"quantity"]
        
