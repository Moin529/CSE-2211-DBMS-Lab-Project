# CineVerse Database Schema

This directory contains the complete Supabase database schema for the CineVerse movie booking application.

## 🗄️ Database Overview

The CineVerse database is designed to handle all aspects of a modern movie booking system, including:

- **User Management**: Authentication, profiles, and preferences
- **Movie Catalog**: Movies, genres, cast, and trailers
- **Cinema Infrastructure**: Halls, seating layouts, and features
- **Show Scheduling**: Movie showtimes and availability
- **Booking System**: Ticket reservations and payments
- **Analytics**: Booking statistics and revenue tracking
- **Notifications**: User communication system

## 🚀 Quick Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note down your project URL and anon key

### 2. Run the Schema

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase_schema.sql`
4. Execute the script

### 3. Configure Authentication

1. Go to **Authentication > Settings**
2. Configure your preferred auth providers (Email, Google, etc.)
3. Set up email templates if needed

## 📊 Database Tables

### Core Tables

| Table | Description | Key Features |
|-------|-------------|--------------|
| `users` | User profiles | Extends Supabase auth, admin flags |
| `movies` | Movie catalog | TMDB integration, ratings, metadata |
| `genres` | Movie genres | Categorization system |
| `cinema_halls` | Cinema infrastructure | Seating layouts, features |
| `shows` | Movie showtimes | Scheduling, pricing |
| `bookings` | Ticket reservations | Payment tracking, seat management |
| `seat_reservations` | Real-time seat locking | Prevents double booking |

### Junction Tables

| Table | Purpose |
|-------|---------|
| `movie_genres` | Links movies to genres |
| `movie_cast` | Links movies to cast members |
| `user_favorites` | Links users to favorite movies |

### Supporting Tables

| Table | Purpose |
|-------|---------|
| `cast_members` | Actor/crew information |
| `trailers` | Movie trailers and videos |
| `notifications` | User notification system |
| `booking_analytics` | Daily statistics |

## 🔐 Security Features

### Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

- **Users**: Can only access their own data
- **Admins**: Can access all data
- **Public**: Movies and shows are publicly viewable
- **Bookings**: Users can only see their own bookings

### Authentication Integration

- Extends Supabase's built-in authentication
- Supports multiple auth providers
- Automatic user profile creation

## 📈 Views for Common Queries

The schema includes several views for efficient data retrieval:

### `movie_details`
Combines movies with their genres for easy display.

### `show_details`
Shows with movie and hall information for booking pages.

### `booking_details`
Complete booking information with user and show details.

## 🔧 Functions and Triggers

### Automatic Updates
- `update_updated_at_column()`: Automatically updates timestamps

### Utility Functions
- `generate_booking_reference()`: Creates unique booking references
- `clean_expired_reservations()`: Removes expired seat reservations

## 📋 Sample Data

The schema includes sample data for:

- **Genres**: 10 common movie genres
- **Cinema Halls**: 5 halls with different configurations

## 🎯 Key Features

### Real-time Seat Management
- Seat reservations with expiration times
- Prevents double booking during checkout
- Automatic cleanup of expired reservations

### Flexible Seating Layouts
- JSON-based seat configuration
- Supports different hall layouts
- Easy to modify and extend

### Comprehensive Booking System
- Multiple booking statuses
- Payment tracking
- Special requests support

### Analytics Ready
- Daily booking statistics
- Revenue tracking
- User activity monitoring

## 🔄 Data Flow

### Booking Process
1. User selects movie and show
2. System creates seat reservations (5-minute expiry)
3. User selects seats and confirms booking
4. System creates booking record
5. Seat reservations are converted to booked seats

### Movie Management
1. Admin adds movie to catalog
2. Links movie to genres and cast
3. Creates shows with pricing
4. Users can browse and book

## 🛠️ API Integration

### Supabase Client Setup

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseKey)
```

### Common Queries

#### Get Movies with Genres
```javascript
const { data: movies } = await supabase
  .from('movie_details')
  .select('*')
  .eq('status', 'active')
```

#### Get User Bookings
```javascript
const { data: bookings } = await supabase
  .from('booking_details')
  .select('*')
  .eq('user_id', userId)
```

#### Create Booking
```javascript
const { data, error } = await supabase
  .from('bookings')
  .insert({
    user_id: userId,
    show_id: showId,
    booking_reference: generateBookingRef(),
    total_amount: amount,
    booked_seats: selectedSeats
  })
```

## 📊 Performance Optimizations

### Indexes
- Strategic indexes on frequently queried columns
- Composite indexes for complex queries
- Full-text search capabilities

### Query Optimization
- Views for common joins
- Efficient JSONB operations
- Optimized date/time queries

## 🔍 Monitoring and Maintenance

### Regular Tasks
- Clean expired seat reservations
- Update booking analytics
- Monitor performance metrics

### Backup Strategy
- Supabase automatic backups
- Point-in-time recovery
- Data export capabilities

## 🚨 Important Notes

### Seat Reservation Expiry
- Seat reservations expire after 5 minutes
- Implement cleanup job for expired reservations
- Consider extending expiry for payment processing

### Booking References
- Unique booking references are auto-generated
- Format: `BKYYYYMMDD####`
- Ensure uniqueness across concurrent bookings

### Admin Access
- Set `is_admin = true` for admin users
- Admins can access all data and functions
- Regular users have restricted access

## 🔗 Related Files

- `supabase_schema.sql`: Complete database schema
- `migrations/`: Database migration files (if needed)
- `seeds/`: Sample data files (if needed)

## 📞 Support

For database-related issues:

1. Check Supabase documentation
2. Review RLS policies
3. Verify authentication setup
4. Test queries in SQL editor

## 🔄 Version History

- **v1.0**: Initial schema with core functionality
- **v1.1**: Added analytics and notifications
- **v1.2**: Enhanced security and performance

---

This database schema provides a solid foundation for the CineVerse application with room for future enhancements and scaling. 