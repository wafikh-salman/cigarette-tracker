from django.shortcuts import render
from .serializers import BrandSerializer,CigaretteEntrySerializer
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Brand,CigaretteEntry
from django.shortcuts import get_object_or_404
from django.db.models import Avg, Count, Max, Min, Sum,F
from django.utils import timezone
from datetime import timedelta

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
        if kwargs:
            entry = get_object_or_404(CigaretteEntry,pk=kwargs['pk'])
            serializer = CigaretteEntrySerializer(entry)
            return Response(serializer.data,status=status.HTTP_200_OK)
        
        entries = CigaretteEntry.objects.all()
        serializer = CigaretteEntrySerializer(entries,many=True)
        return Response(serializer.data,status=status.HTTP_200_OK)
    
    def post(self, request):
        brand = get_object_or_404(
            Brand,
            pk=request.data.get('brand')
        )

        serializer = CigaretteEntrySerializer(data=request.data)

        if serializer.is_valid():
            serializer.save(
                brand=brand
            )
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
    def patch(self,request,**kwargs):
       entry = get_object_or_404(CigaretteEntry,pk=kwargs['pk'])
       if request.data.get('action') == "increase":
           entry.quantity+=1
           entry.save()
           serializer = CigaretteEntrySerializer(entry)
           return Response(serializer.data,status=status.HTTP_200_OK)
           
       elif request.data.get('action') == 'decrease':
           if entry.quantity == 1:
               return Response({'error':"quantity must be above 1"})

           entry.quantity-=1
           entry.save()
           serializer = CigaretteEntrySerializer(entry)
           return Response(serializer.data,status=status.HTTP_200_OK)
       
       else:
           return Response({"error":"action should be increase or decrease"},status=status.HTTP_400_BAD_REQUEST)
       
   
class DashboardApiView(APIView):
    def get(self,request):
        today = timezone.now().date()
        entries = CigaretteEntry.objects.filter(
        created_at__date=today)
        last_7_days = timezone.now().date() - timedelta(days=7)
        total_quantity = entries.aggregate(
            total_quantity=Sum('quantity')
            )['total_quantity'] or 0
           
        total_spending = entries.aggregate(
            total_spending=Sum(F('quantity') * F('brand__price'))
        )['total_spending'] or 0
        
        week_entries = CigaretteEntry.objects.filter(created_at__date=last_7_days)
        week_quantity = week_entries.aggregate(
            week_quantity=Sum('quantity')
            )['week_quantity'] or 0
        
        week_spending = week_entries.aggregate(
            week_spending=Sum(
                F('quantity') * F('brand__price'))
                )['week_spending'] or 0
        
        return Response({
            "total_quantity":total_quantity,
            "total_spending":total_spending,
            'week_quantity':week_quantity,
            'week_spending':week_spending
        },status=status.HTTP_200_OK)
        
        
        
    
    
    