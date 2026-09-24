from django.shortcuts import render
from .serializers import BrandSerializer,CigaretteEntrySerializer
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Brand
from django.shortcuts import get_object_or_404
# Create your views here.
class BrandApiView(APIView):
    def get(self,request,**kwargs):
        if kwargs:
            data = get_object_or_404(Brand,pk=kwargs['pk'])
            serializer = BrandSerializer(data)
        else: 
            data = Brand.objects.all()
            serializer = BrandSerializer(data,many=True)
        return Response(serializer.data,status=status.HTTP_200_OK)
    
    
    def post(self,request):
        brand_name = request.data.get('brand')
        brand_price = request.data.get('price')
        
        serializer = BrandSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            
        return Response(serializer.data,status=status.HTTP_201_CREATED)
    
    def patch(self,request,**kwargs):
        product = get_object_or_404(Brand,pk=kwargs['pk'])
        serializer = BrandSerializer(product,data=request.data,partial=True)
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data,status=status.HTTP_200_OK)
            
            
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
    
    def delete(self,request,pk):
        data = get_object_or_404(Brand,pk=pk)
        data.delete()
        return Response({
            "success":"product deleted sucessfully"
        ,},status=status.HTTP_200_OK)
        
        
class CiggretteEntriesApiView(APIView):
    def get(self,request,**kwargs):
        pass
    def post(self,request):
        brand = get_object_or_404(Brand,pk=request.data.get('brand'))
        serializer = CigaretteEntrySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(
                brand=brand
            )
            return Response(serializer.data,status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
    
    
    
    
    