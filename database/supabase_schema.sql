-- CineVerse Database Schema for Supabase
-- This schema includes all tables needed for the movie booking application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- USERS AND AUTHENTICATION
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    phone_number TEXT,
    avatar_url TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- =====================================================
-- MOVIES AND CONTENT
-- =====================================================

-- Genres table
CREATE TABLE public.genres (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Movies table
CREATE TABLE public.movies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tmdb_id INTEGER UNIQUE,
    title TEXT NOT NULL,
    overview TEXT,
    poster_path TEXT,
    backdrop_path TEXT,
    release_date DATE,
    original_language TEXT,
    tagline TEXT,
    vote_average DECIMAL(3,1),
    vote_count INTEGER,
    runtime INTEGER,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Movie genres junction table
CREATE TABLE public.movie_genres (
    id SERIAL PRIMARY KEY,
    movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
    genre_id INTEGER REFERENCES public.genres(id) ON DELETE CASCADE,
    UNIQUE(movie_id, genre_id)
);

-- Cast members table
CREATE TABLE public.cast_members (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    profile_path TEXT,
    tmdb_id INTEGER UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Movie cast junction table
CREATE TABLE public.movie_cast (
    id SERIAL PRIMARY KEY,
    movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
    cast_id INTEGER REFERENCES public.cast_members(id) ON DELETE CASCADE,
    character_name TEXT,
    order_index INTEGER,
    UNIQUE(movie_id, cast_id)
);

-- Trailers table
CREATE TABLE public.trailers (
    id SERIAL PRIMARY KEY,
    movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
    title TEXT,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CINEMA INFRASTRUCTURE
-- =====================================================

-- Cinema halls table
CREATE TABLE public.cinema_halls (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    features JSONB,
    description TEXT,
    seat_layout JSONB NOT NULL, -- Stores row configuration
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SHOWS AND SCHEDULING
-- =====================================================

-- Shows table
CREATE TABLE public.shows (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
    cinema_hall_id UUID REFERENCES public.cinema_halls(id) ON DELETE CASCADE,
    show_date DATE NOT NULL,
    show_time TIME NOT NULL,
    show_datetime TIMESTAMP WITH TIME ZONE NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- BOOKINGS AND RESERVATIONS
-- =====================================================

-- Bookings table
CREATE TABLE public.bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    show_id UUID REFERENCES public.shows(id) ON DELETE CASCADE,
    booking_reference TEXT UNIQUE NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    booking_status TEXT DEFAULT 'pending', -- pending, confirmed, cancelled, completed
    payment_status TEXT DEFAULT 'pending', -- pending, paid, failed, refunded
    payment_method TEXT,
    payment_reference TEXT,
    booked_seats JSONB NOT NULL, -- Array of seat numbers
    special_requests TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seat reservations table (for real-time seat locking)
CREATE TABLE public.seat_reservations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    show_id UUID REFERENCES public.shows(id) ON DELETE CASCADE,
    seat_number TEXT NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    reservation_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(show_id, seat_number)
);

-- =====================================================
-- USER PREFERENCES AND FAVORITES
-- =====================================================

-- User favorites table
CREATE TABLE public.user_favorites (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    movie_id UUID REFERENCES public.movies(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, movie_id)
);

-- =====================================================
-- NOTIFICATIONS AND COMMUNICATIONS
-- =====================================================

-- Notifications table
CREATE TABLE public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- info, success, warning, error
    is_read BOOLEAN DEFAULT FALSE,
    related_entity_type TEXT, -- booking, movie, show, etc.
    related_entity_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ANALYTICS AND REPORTING
-- =====================================================

-- Booking analytics table
CREATE TABLE public.booking_analytics (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    total_bookings INTEGER DEFAULT 0,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_users INTEGER DEFAULT 0,
    active_shows INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(date)
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_admin ON public.users(is_admin);

-- Movies indexes
CREATE INDEX idx_movies_tmdb_id ON public.movies(tmdb_id);
CREATE INDEX idx_movies_status ON public.movies(status);
CREATE INDEX idx_movies_release_date ON public.movies(release_date);
CREATE INDEX idx_movies_vote_average ON public.movies(vote_average);

-- Shows indexes
CREATE INDEX idx_shows_movie_id ON public.shows(movie_id);
CREATE INDEX idx_shows_cinema_hall_id ON public.shows(cinema_hall_id);
CREATE INDEX idx_shows_datetime ON public.shows(show_datetime);
CREATE INDEX idx_shows_status ON public.shows(status);

-- Bookings indexes
CREATE INDEX idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX idx_bookings_show_id ON public.bookings(show_id);
CREATE INDEX idx_bookings_status ON public.bookings(booking_status);
CREATE INDEX idx_bookings_payment_status ON public.bookings(payment_status);
CREATE INDEX idx_bookings_created_at ON public.bookings(created_at);

-- Seat reservations indexes
CREATE INDEX idx_seat_reservations_show_id ON public.seat_reservations(show_id);
CREATE INDEX idx_seat_reservations_expires ON public.seat_reservations(reservation_expires_at);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(is_read);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.movies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seat_reservations ENABLE ROW LEVEL SECURITY;

-- Movies policies
CREATE POLICY "Movies are viewable by everyone" ON public.movies
    FOR SELECT USING (true);

CREATE POLICY "Only admins can insert/update/delete movies" ON public.movies
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Shows policies
CREATE POLICY "Shows are viewable by everyone" ON public.shows
    FOR SELECT USING (true);

CREATE POLICY "Only admins can insert/update/delete shows" ON public.shows
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- Bookings policies
CREATE POLICY "Users can view their own bookings" ON public.bookings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookings" ON public.bookings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" ON public.bookings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all bookings" ON public.bookings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND is_admin = TRUE
        )
    );

-- User favorites policies
CREATE POLICY "Users can view their own favorites" ON public.user_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own favorites" ON public.user_favorites
    FOR ALL USING (auth.uid() = user_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Seat reservations policies
CREATE POLICY "Users can view seat reservations" ON public.seat_reservations
    FOR SELECT USING (true);

CREATE POLICY "Users can create seat reservations" ON public.seat_reservations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own seat reservations" ON public.seat_reservations
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_movies_updated_at BEFORE UPDATE ON public.movies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cinema_halls_updated_at BEFORE UPDATE ON public.cinema_halls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shows_updated_at BEFORE UPDATE ON public.shows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate booking reference
CREATE OR REPLACE FUNCTION generate_booking_reference()
RETURNS TEXT AS $$
BEGIN
    RETURN 'BK' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired seat reservations
CREATE OR REPLACE FUNCTION clean_expired_reservations()
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.seat_reservations 
    WHERE reservation_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- SAMPLE DATA INSERTION
-- =====================================================

-- Insert sample genres
INSERT INTO public.genres (name, description) VALUES
('Action', 'High-energy films with exciting sequences'),
('Adventure', 'Journey-based films with exploration themes'),
('Comedy', 'Humorous and entertaining films'),
('Drama', 'Serious, character-driven narratives'),
('Fantasy', 'Imaginative worlds with magical elements'),
('Horror', 'Scary and suspenseful films'),
('Romance', 'Love and relationship-focused films'),
('Sci-Fi', 'Science fiction and futuristic themes'),
('Thriller', 'Suspenseful and tension-filled films'),
('Family', 'Suitable for all ages');

-- Insert sample cinema halls
INSERT INTO public.cinema_halls (name, capacity, features, description, seat_layout) VALUES
('Star Cineplex', 126, '["Dolby Atmos", "4K Projection", "Recliner Seats"]', 'Premium viewing experience with state-of-the-art sound and visual technology', '{"rows": ["A", "B", "C", "D", "E", "F", "G"], "seatsPerRow": [18, 18, 18, 18, 18, 18, 18]}'),
('Blockbuster Cinema', 98, '["Dolby Digital", "3D Ready", "Premium Seating"]', 'Comfortable mid-size hall perfect for intimate movie experiences', '{"rows": ["A", "B", "C", "D", "E", "F"], "seatsPerRow": [16, 16, 16, 16, 17, 17]}'),
('Shimanto Sambhar', 156, '["Dolby Atmos", "4K Laser Projection", "Premium Recliners"]', 'Our largest hall with the most advanced technology and maximum comfort', '{"rows": ["A", "B", "C", "D", "E", "F", "G", "H"], "seatsPerRow": [20, 20, 20, 20, 20, 20, 20, 16]}'),
('Sony Cinema Hall', 84, '["Dolby Digital", "2K Projection", "Standard Seating"]', 'Cozy hall with excellent viewing angles and comfortable seating', '{"rows": ["A", "B", "C", "D", "E", "F"], "seatsPerRow": [14, 14, 14, 14, 14, 14]}'),
('Lions Cinema', 112, '["Dolby Atmos", "4K Projection", "Premium Seating", "3D Ready"]', 'Versatile hall supporting both 2D and 3D formats with premium audio', '{"rows": ["A", "B", "C", "D", "E", "F", "G"], "seatsPerRow": [16, 16, 16, 16, 16, 16, 16]}');

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for movie details with genres
CREATE VIEW movie_details AS
SELECT 
    m.*,
    ARRAY_AGG(g.name) as genres
FROM public.movies m
LEFT JOIN public.movie_genres mg ON m.id = mg.movie_id
LEFT JOIN public.genres g ON mg.genre_id = g.id
GROUP BY m.id;

-- View for show details with movie and hall info
CREATE VIEW show_details AS
SELECT 
    s.*,
    m.title as movie_title,
    m.poster_path,
    m.runtime,
    ch.name as hall_name,
    ch.capacity as hall_capacity
FROM public.shows s
JOIN public.movies m ON s.movie_id = m.id
JOIN public.cinema_halls ch ON s.cinema_hall_id = ch.id;

-- View for booking details with user and show info
CREATE VIEW booking_details AS
SELECT 
    b.*,
    u.display_name as user_name,
    u.email as user_email,
    m.title as movie_title,
    s.show_datetime,
    ch.name as hall_name
FROM public.bookings b
JOIN public.users u ON b.user_id = u.id
JOIN public.shows s ON b.show_id = s.id
JOIN public.movies m ON s.movie_id = m.id
JOIN public.cinema_halls ch ON s.cinema_hall_id = ch.id;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.users IS 'User profiles extending Supabase auth';
COMMENT ON TABLE public.movies IS 'Movie catalog with TMDB integration';
COMMENT ON TABLE public.shows IS 'Movie showtimes and scheduling';
COMMENT ON TABLE public.bookings IS 'User ticket bookings and reservations';
COMMENT ON TABLE public.cinema_halls IS 'Cinema infrastructure and seating layouts';
COMMENT ON TABLE public.seat_reservations IS 'Real-time seat locking for booking process';
COMMENT ON TABLE public.user_favorites IS 'User favorite movies tracking';
COMMENT ON TABLE public.notifications IS 'User notification system';
COMMENT ON TABLE public.booking_analytics IS 'Daily booking and revenue analytics'; 