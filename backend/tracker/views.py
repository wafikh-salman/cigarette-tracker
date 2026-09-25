from django.shortcuts import render
from .serializers import BrandSerializer,CigaretteEntrySerializer
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from .models import Brand,CigaretteEntry
from django.shortcuts import get_object_or_404
from django.db.models import Avg, Count, Max, Min, Sum,F
from django.utils import timezone
from datetime import timedelta
from django.db.models.functions import TruncDate

class CigaretteEntryPagination(PageNumberPagination):
    page_size = 10

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
        
        entries = CigaretteEntry.objects.all().order_by('-created_at', '-id')
        paginator = CigaretteEntryPagination()
        page = paginator.paginate_queryset(entries, request, view=self)
        if page is not None:
            serializer = CigaretteEntrySerializer(page, many=True)
            return paginator.get_paginated_response(serializer.data)

        serializer = CigaretteEntrySerializer(entries, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
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
       
       elif request.data.get('action') == 'update':
           if request.data.get('quantity') <=0:
               return Response({"error":"quantity cant set to below 0"})
           
           entry.quantity = request.data.get('quantity')
           entry.save()
           serializer = CigaretteEntrySerializer(entry)
           return Response(serializer.data,status=status.HTTP_200_OK)
       
       else:
           return Response({"error":"action should be increase, decrease or update"},status=status.HTTP_400_BAD_REQUEST)
       
    def delete(self,request,pk):
        data = get_object_or_404(CigaretteEntry,pk=pk)
        data.delete()
        return Response({
            "success":"Entry deleted sucessfully"
        ,},status=status.HTTP_200_OK)   
   
class DashboardApiView(APIView):
    def get(self,request):
        today = timezone.now().date()
        entries = CigaretteEntry.objects.filter(
        created_at__date=today)
        last_7_days = timezone.now().date() - timedelta(days=7)
        last_30_days = timezone.now().date() - timedelta(days=30)
        
        #TODAY CALCULATION 
        today_quantity = entries.aggregate(
            today_quantity=Sum('quantity')
            )['today_quantity'] or 0
           
        today_spending = entries.aggregate(
            today_spending=Sum(F('quantity') * F('brand__price'))
        )['today_spending'] or 0
        
        # WEEKLY CALCULATION
        
        week_entries = CigaretteEntry.objects.filter(
        created_at__date__gte=last_7_days,
        created_at__date__lte=today
    )
        week_quantity = week_entries.aggregate(
            week_quantity=Sum('quantity')
            )['week_quantity'] or 0
        
        week_spending = week_entries.aggregate(
            week_spending=Sum(
                F('quantity') * F('brand__price'))
                )['week_spending'] or 0
        
        # MONTHLY CALCULATION 
        month_entry = CigaretteEntry.objects.filter(
            created_at__date__gte=last_30_days,created_at__date__lte=today
        )
        
        month_quantity = month_entry.aggregate(
            month_quantity=Sum('quantity')
            )['month_quantity'] or 0
        
        month_spending = month_entry.aggregate(
            month_spending=Sum(F('quantity') * F('brand__price'))
            )['month_spending'] or 0
        
        
        # WEEKLY USAGE 
        weekly_usage = (
            week_entries
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(quantity=Sum('quantity'))
            .order_by('date')
        )
        
        weekly_usage = list(weekly_usage)
        
        #BRAND USAGE 
        brand_usage = (
        CigaretteEntry.objects
        .values('brand__name')
        .annotate(quantity=Sum('quantity'))
        .order_by('-quantity')
        )
        
        brand_usage = [
        {
            "brand": item["brand__name"],
            "quantity": item["quantity"]
        }
        for item in brand_usage
        ]
        
        todayentries = CigaretteEntry.objects.filter(created_at__date=today)
        serializer = CigaretteEntrySerializer(todayentries,many=True)
        return Response({
            "total_quantity":today_quantity,
            "total_spending":today_spending,
            'week_quantity':week_quantity,
            'week_spending':week_spending,
            'month_quantity':month_quantity,
            'month_spending':month_spending,
            "weekly_usage": weekly_usage,
            "brand_usage": brand_usage,
            "today_entries":serializer.data
        },status=status.HTTP_200_OK)
        
        
class BrandStatsApiView(APIView):
    def get(self,request,pk):
        brand = get_object_or_404(Brand,pk=pk)
        total_quantity = CigaretteEntry.objects.filter(
            brand=brand).aggregate(total_quantity=Sum('quantity')
            )['total_quantity'] or 0
        
        total_spending = CigaretteEntry.objects.filter(
            brand=brand
        ).aggregate(
            total_spending=Sum(F('quantity')*F('brand__price'))
            )['total_spending'] or 0
        return Response({
            "brand_name":brand.name,
            "brand_price":brand.price,
            "total_quantity":total_quantity,
            "total_spending":total_spending
            })
        
        
class BrandUsageTrendApiView(APIView):
    def get(self, request, id):
        brand = get_object_or_404(Brand, pk=id)

        usage = (
            CigaretteEntry.objects
            .filter(brand=brand)
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(quantity=Sum('quantity'))
            .order_by('date')
        )

        return Response(
            list(usage),
            status=status.HTTP_200_OK
        )
        
   
    
    