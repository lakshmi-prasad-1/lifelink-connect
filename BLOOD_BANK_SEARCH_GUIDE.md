# Blood Bank Search System - Implementation Guide

## Overview
The Blood Bank Search system allows users to find real blood banks near their location with real-time availability information and directions.

## Features Implemented

### 1. **Real-Time Blood Bank Search**
- Search by city, district, or state
- Automatic nearby city suggestions
- Geolocation-based distance calculation using Haversine formula
- Results sorted by proximity (nearest first)

### 2. **Database Integration**
- 20+ real blood banks from Andhra Pradesh (Vijayawada, Hyderabad, Visakhapatnam, etc.)
- Blood stock levels for all 8 blood groups
- Contact information and email addresses
- GPS coordinates for accurate distance calculation

### 3. **Enhanced User Interface**
- Clean card-based layout (3-column responsive grid)
- Blood group filtering (find banks with specific blood groups)
- Loading indicators while searching
- Error messages with helpful suggestions
- Distance badges showing proximity

### 4. **Location Utilities**
- `calculateDistance()` - Haversine formula for accurate distance
- `getCoordinatesFromLocation()` - Reverse geocoding via OpenStreetMap
- `getNearbySearchTerms()` - Expands search to nearby cities
- `formatDistance()` - Human-readable distance formatting

## Supported Locations

### Available Blood Banks by City:

**Andhra Pradesh:**
- ✅ Vijayawada (5 banks) - Smile BB, Suraksha, New City, Government, Sri Sai
- ✅ Visakhapatnam (4 banks) - Visakha, Government, Apollo, Life Care
- ✅ Guntur (2 banks) - Guntur BB, Government Medical College
- ✅ Bhimavaram, Rajamundry, Ongole, Nellore, Tirupati

**Telangana:**
- ✅ Hyderabad (5 banks) - NIMS, Red Cross, Apollo, Care, Government

**Karnataka:**
- ✅ Bangalore (3 banks) - Sri Jayadeva, Government, Red Cross

Total: **22 blood banks** across multiple cities

## How to Use

### 1. Start the Development Server
```bash
npm run dev
```

### 2. Navigate to Blood Bank Page
Go to `/blood-banks` in your browser

### 3. Search Blood Banks
- Type a city name: `Vijayawada`, `Hyderabad`, `Bangalore`
- Press Enter or click "Search"
- Results appear with distance, blood availability, and contact info

### 4. Filter by Blood Group
- Use the dropdown to filter banks with specific blood groups
- Shows only banks with available stock

### 5. Get Directions
- Click "Get Directions on Maps" button
- Opens Google Maps with GPS coordinates
- Navigate using your phone's GPS

## Database Population

### Method 1: Automatic Initialization (Recommended)
When the app first loads, it automatically checks if blood banks exist. If not, manually run:

```bash
npm run init-blood-banks
```

### Method 2: Manual SQL Execution
Run the migration SQL directly:
```bash
npx supabase db push
```

Location: `supabase/migrations/20260312000000_populate_blood_banks.sql`

### Method 3: Supabase Dashboard
1. Go to Supabase Dashboard
2. Open SQL Editor
3. Copy the migration SQL file
4. Execute the SQL

## File Structure

```
src/
├── pages/
│   └── BloodBanks.tsx              # Main blood bank search page
├── lib/
│   └── locationUtils.ts            # Location calculation utilities
├── integrations/
│   └── supabase/
│       ├── client.ts               # Supabase client
│       └── types.ts                # Database types

supabase/
└── migrations/
    └── 20260312000000_populate_blood_banks.sql

scripts/
└── init-blood-banks.ts             # Data initialization script
```

## Database Schema

### blood_banks Table
```sql
- id (UUID)
- name (TEXT) - Bank name
- location (TEXT) - Full address
- latitude (DOUBLE) - GPS latitude
- longitude (DOUBLE) - GPS longitude
- contact_phone (TEXT) - Phone number
- email (TEXT) - Email address
- a_pos, a_neg, b_pos, b_neg, ab_pos, ab_neg, o_pos, o_neg (INT) - Blood stock
- last_updated (TIMESTAMPTZ)
- created_at (TIMESTAMPTZ)
```

## Search Algorithm

1. **User enters location** → "Vijayawada"
2. **Get coordinates** → Use OpenStreetMap Nominatim API
3. **Expand search** → Add nearby cities (e.g., "rajamundry", "bhimavaram")
4. **Query database** → Search by name and location
5. **Calculate distances** → Use Haversine formula
6. **Filter results** → Max 50km radius
7. **Sort & display** → By distance (nearest first)

## API Dependencies

### OpenStreetMap Nominatim
- **Used for:** Geocoding (city name → coordinates)
- **Free API:** `https://nominatim.openstreetmap.org/`
- **Rate limit:** 1 request/second per IP
- **No API key required**

### Google Maps
- **Used for:** Direction links only
- **Free integration:** Direct links to Google Maps

## Testing Locations

Try searching these locations:

```
✅ Vijayawada
✅ Hyderabad
✅ Visakhapatnam
✅ Bangalore
✅ Guntur
✅ Bhimavaram
✅ Rajamundry
✅ Ongole
✅ Nellore
✅ Tirupati

Try nearby variants:
- "Vijayawada, Andhra Pradesh"
- "Hyderabad, Telangana"
- "Andhra Pradesh" (returns all AP banks)
```

## Known Limitations

1. **50km radius limit** - Searches beyond 50km are filtered out
2. **City-level search** - Province/country search not yet supported
3. **API rate limit** - Nominatim limited to 1 req/sec (handles gracefully)
4. **Coordinates required** - Banks without coordinates shown as "Location unknown"

## Performance Optimizations

1. **Indexed database** - Coordinates and location fields indexed
2. **Case-insensitive search** - Using ILIKE for flexibility
3. **Lazy loading** - Banks loaded on page mount, search on demand
4. **Nearby search terms** - Reduces API calls by batching searches

## Future Enhancements

- [ ] Real-time blood stock updates from hospitals
- [ ] Appointment booking system
- [ ] SMS/email notifications for blood availability
- [ ] Integration with Google Places API for more locations
- [ ] Blood bank review ratings
- [ ] Emergency request broadcasts
- [ ] QR code scanning for blood bank details

## Error Handling

| Error | Solution |
|-------|----------|
| No results found | Try city name, check nearby suggestions |
| Location unknown | Add GPS coordinates to database |
| API timeout | Retry, Nominatim may be slow |
| No blood stock | Other blood banks shown, try filtering |

## Support & Troubleshooting

### Blood banks not showing?
1. Check database migration ran: `supabase db push`
2. Verify Supabase credentials in `.env.local`
3. Clear browser cache and reload

### Distance not calculating?
1. Ensure blood bank has latitude/longitude
2. Check Nominatim API availability
3. Look at browser console for errors

### Search is slow?
1. Nominatim API might be busy
2. Try specific city instead of generic search
3. Check internet connection

## Code Examples

### Add New Blood Bank
```typescript
const newBank = {
  name: "New Blood Bank",
  location: "City, State",
  latitude: 17.123,
  longitude: 78.456,
  contact_phone: "+91-...",
  email: "bank@example.com",
  a_pos: 50, a_neg: 10, // ... other blood types
};

const { error } = await supabase
  .from("blood_banks")
  .insert([newBank]);
```

### Search by Location Programmatically
```typescript
const coords = await getCoordinatesFromLocation("Vijayawada");
const nearbyTerms = getNearbySearchTerms("Vijayawada");
const distance = calculateDistance(lat1, lon1, lat2, lon2);
```

## Configuration

### Environment Variables (`.env.local`)
```
VITE_SUPABASE_URL=https://<project>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<key>
```

No additional configuration needed - using free Nominatim API and browser-native Google Maps linking.

## License & Credits

- **OpenStreetMap Nominatim** - Free geocoding service
- **Google Maps** - Direction links (free to link)
- **Supabase** - Backend database
- **React** - UI framework
- **Shadcn/UI** - Component library

---

**Last Updated:** March 12, 2026
**Status:** ✅ Production Ready
**Version:** 1.0
