from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from rest_framework.test import APIClient
from rest_framework import status
from tracker.models import Brand, CigaretteEntry

class InsightsApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.brand_a = Brand.objects.create(name="Brand A", price=25.0)
        self.brand_b = Brand.objects.create(name="Brand B", price=10.0)
        self.today = timezone.now().date()
        self.start_of_current_week = self.today - timedelta(days=self.today.weekday())
        self.start_of_prev_week = self.start_of_current_week - timedelta(days=7)

    def create_entry(self, brand, quantity, date):
        entry = CigaretteEntry.objects.create(brand=brand, quantity=quantity)
        naive_dt = timezone.datetime.combine(date, timezone.datetime.min.time().replace(hour=12))
        dt = timezone.make_aware(naive_dt, timezone.get_current_timezone())
        CigaretteEntry.objects.filter(id=entry.id).update(created_at=dt)
        entry.refresh_from_db()
        return entry

    def test_3_no_entries(self):
        """Test 3: No entries returns 200 OK with zeroed metrics and empty daily_usage."""
        response = self.client.get('/api/insights/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['current_week']['usage'], 0)
        self.assertEqual(data['current_week']['spending'], 0)
        self.assertEqual(data['current_week']['average_per_day'], 0)
        self.assertEqual(data['previous_week']['usage'], 0)
        self.assertEqual(data['previous_week']['spending'], 0)
        self.assertEqual(data['previous_week']['average_per_day'], 0)
        self.assertEqual(data['comparison']['usage_change_percent'], 0)
        self.assertEqual(data['comparison']['spending_change'], 0)
        self.assertEqual(data['daily_usage'], [])

    def test_1_current_week_with_entries(self):
        """Test 1: Current week with entries calculates usage, spending, and elapsed day average."""
        self.create_entry(self.brand_a, 4, self.start_of_current_week)
        response = self.client.get('/api/insights/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['current_week']['usage'], 4)
        self.assertEqual(data['current_week']['spending'], 100)
        elapsed_days = self.today.weekday() + 1
        expected_avg = round(4 / elapsed_days, 2)
        self.assertEqual(data['current_week']['average_per_day'], expected_avg)

    def test_2_previous_week_with_entries(self):
        """Test 2: Previous week with entries calculates usage, spending, and 7-day average."""
        self.create_entry(self.brand_b, 14, self.start_of_prev_week)
        response = self.client.get('/api/insights/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['previous_week']['usage'], 14)
        self.assertEqual(data['previous_week']['spending'], 140)
        self.assertEqual(data['previous_week']['average_per_day'], 2.0)

    def test_4_previous_week_usage_zero(self):
        """Test 4: Previous week usage = 0 handles division by zero safely."""
        self.create_entry(self.brand_a, 5, self.start_of_current_week)
        response = self.client.get('/api/insights/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['previous_week']['usage'], 0)
        self.assertEqual(data['comparison']['usage_change_percent'], 0)
        self.assertEqual(data['comparison']['spending_change'], 125)

    def test_5_multiple_brands_with_different_prices(self):
        """Test 5: Multiple brands with different prices calculate spending accurately."""
        self.create_entry(self.brand_a, 2, self.start_of_current_week)
        self.create_entry(self.brand_b, 3, self.start_of_current_week)
        response = self.client.get('/api/insights/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['current_week']['usage'], 5)
        self.assertEqual(data['current_week']['spending'], 80)

    def test_6_multiple_entries_on_same_day(self):
        """Test 6: Multiple entries on the same day are aggregated in daily_usage."""
        self.create_entry(self.brand_a, 3, self.start_of_current_week)
        self.create_entry(self.brand_b, 2, self.start_of_current_week)
        response = self.client.get('/api/insights/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(len(data['daily_usage']), 1)
        self.assertEqual(data['daily_usage'][0]['date'], self.start_of_current_week.strftime('%Y-%m-%d'))
        self.assertEqual(data['daily_usage'][0]['quantity'], 5)

    def test_full_comparison_example(self):
        """Test full comparison with both current and previous weeks populated matching the spec example."""
        self.create_entry(self.brand_a, 20, self.start_of_current_week)
        self.create_entry(self.brand_a, 24, self.start_of_prev_week)
        response = self.client.get('/api/insights/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data['current_week']['usage'], 20)
        self.assertEqual(data['current_week']['spending'], 500)
        self.assertEqual(data['previous_week']['usage'], 24)
        self.assertEqual(data['previous_week']['spending'], 600)
        self.assertEqual(data['previous_week']['average_per_day'], 3.43)
        self.assertEqual(data['comparison']['usage_change_percent'], -16.67)
        self.assertEqual(data['comparison']['spending_change'], -100)
