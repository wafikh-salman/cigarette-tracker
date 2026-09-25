from rest_framework import serializers
from .models import Brand,CigaretteEntry
class BrandSerializer(serializers.ModelSerializer):
    class Meta:
        model = Brand
        fields = "__all__"
        
    
class CigaretteEntrySerializer(serializers.ModelSerializer):
    brand_name = serializers.SerializerMethodField()
    class Meta:
        model = CigaretteEntry
        fields = ['id','brand',"brand_name","quantity","created_at"]
      
    def validate_quantity(self,data):
        if data <=0:
            raise serializers.ValidationError("quantity must be greater than 0")
        
        return data
      
    def get_brand_name(self,obj):
        if obj.brand:
            return obj.brand.name
        
        return None
    
    