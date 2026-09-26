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


class InsightsApiView(APIView):
    def get(self, request):
        today = timezone.now().date()
        # Monday of current week (weekday(): 0=Mon, ..., 6=Sun)
        start_of_current_week = today - timedelta(days=today.weekday())
        end_of_current_week = start_of_current_week + timedelta(days=6)

        # Elapsed days in current week: Mon=1, Tue=2, ..., Sun=7
        elapsed_days = today.weekday() + 1

        # Previous completed calendar week (Monday to Sunday)
        start_of_prev_week = start_of_current_week - timedelta(days=7)
        end_of_prev_week = start_of_current_week - timedelta(days=1)

        # 1. Current Week Queries
        current_week_entries = CigaretteEntry.objects.filter(
            created_at__date__gte=start_of_current_week,
            created_at__date__lte=end_of_current_week
        )

        current_usage = current_week_entries.aggregate(
            total_usage=Sum('quantity')
        )['total_usage'] or 0

        current_spending = current_week_entries.aggregate(
            total_spending=Sum(F('quantity') * F('brand__price'))
        )['total_spending'] or 0

        current_avg = round(float(current_usage) / elapsed_days, 2) if elapsed_days > 0 else 0

        # 2. Previous Week Queries
        prev_week_entries = CigaretteEntry.objects.filter(
            created_at__date__gte=start_of_prev_week,
            created_at__date__lte=end_of_prev_week
        )

        prev_usage = prev_week_entries.aggregate(
            total_usage=Sum('quantity')
        )['total_usage'] or 0

        prev_spending = prev_week_entries.aggregate(
            total_spending=Sum(F('quantity') * F('brand__price'))
        )['total_spending'] or 0

        prev_avg = round(float(prev_usage) / 7.0, 2) if prev_usage > 0 else 0

        # 3. Comparison
        if prev_usage > 0:
            usage_change_percent = round(((float(current_usage) - float(prev_usage)) / float(prev_usage)) * 100, 2)
        else:
            usage_change_percent = 0

        raw_spending_change = float(current_spending) - float(prev_spending)
        if raw_spending_change.is_integer():
            spending_change = int(raw_spending_change)
        else:
            spending_change = round(raw_spending_change, 2)

        # 4. Daily Usage for current week
        daily_usage_qs = (
            current_week_entries
            .annotate(date=TruncDate('created_at'))
            .values('date')
            .annotate(quantity=Sum('quantity'))
            .order_by('date')
        )

        daily_usage = [
            {
                "date": item["date"].strftime("%Y-%m-%d") if hasattr(item["date"], "strftime") else str(item["date"]),
                "quantity": item["quantity"] or 0
            }
            for item in daily_usage_qs
        ]

        def clean_numeric(val):
            if val is None:
                return 0
            f = float(val)
            if f.is_integer():
                return int(f)
            return round(f, 2)

        return Response({
            "current_week": {
                "usage": current_usage,
                "spending": clean_numeric(current_spending),
                "average_per_day": current_avg
            },
            "previous_week": {
                "usage": prev_usage,
                "spending": clean_numeric(prev_spending),
                "average_per_day": prev_avg
            },
            "comparison": {
                "usage_change_percent": usage_change_percent,
                "spending_change": spending_change
            },
            "daily_usage": daily_usage
        }, status=status.HTTP_200_OK)