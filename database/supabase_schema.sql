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

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();


-- Sample Data for CineVerse Database
-- This script populates the database with sample data for testing and development

-- =====================================================
-- SAMPLE MOVIES
-- =====================================================

INSERT INTO public.movies (tmdb_id, title, overview, poster_path, backdrop_path, release_date, original_language, tagline, vote_average, vote_count, runtime, status) VALUES
(324544, 'In the Lost Lands', 'A queen sends the powerful and feared sorceress Gray Alys to the ghostly wilderness of the Lost Lands in search of a magical power, where she and her guide, the drifter Boyce, must outwit and outfight both man and demon.', 'https://image.tmdb.org/t/p/original/dDlfjR7gllmr8HTeN6rfrYhTdwX.jpg', 'https://image.tmdb.org/t/p/original/op3qmNhvwEvyT7UFyPbIfQmKriB.jpg', '2025-02-27', 'en', 'She seeks the power to free her people.', 6.4, 15000, 102, 'active'),

(1232546, 'Until Dawn', 'One year after her sister Melanie mysteriously disappeared, Clover and her friends head into the remote valley where she vanished in search of answers. Exploring an abandoned visitor center, they find themselves stalked by a masked killer and horrifically murdered one by one...only to wake up and find themselves back at the beginning of the same evening.', 'https://image.tmdb.org/t/p/original/juA4IWO52Fecx8lhAsxmDgy3M3.jpg', 'https://image.tmdb.org/t/p/original/icFWIk1KfkWLZnugZAJEDauNZ94.jpg', '2025-04-23', 'en', 'Every night a different nightmare.', 6.4, 18000, 103, 'active'),

(552524, 'Lilo & Stitch', 'The wildly funny and touching story of a lonely Hawaiian girl and the fugitive alien who helps to mend her broken family.', 'https://image.tmdb.org/t/p/original/mKKqV23MQ0uakJS8OCE2TfV5jNS.jpg', 'https://image.tmdb.org/t/p/original/7Zx3wDG5bBtcfk8lcnCWDOLM4Y4.jpg', '2025-05-17', 'en', 'Hold on to your coconuts.', 7.1, 27500, 108, 'active'),

(668489, 'Havoc', 'When a drug heist swerves lethally out of control, a jaded cop fights his way through a corrupt city''s criminal underworld to save a politician''s son.', 'https://image.tmdb.org/t/p/original/ubP2OsF3GlfqYPvXyLw9d78djGX.jpg', 'https://image.tmdb.org/t/p/original/65MVgDa6YjSdqzh7YOA04mYkioo.jpg', '2025-04-25', 'en', 'No law. Only disorder.', 6.5, 35960, 107, 'active'),

(950387, 'A Minecraft Movie', 'Four misfits find themselves struggling with ordinary problems when they are suddenly pulled through a mysterious portal into the Overworld: a bizarre, cubic wonderland that thrives on imagination. To get back home, they''ll have to master this world while embarking on a magical quest with an unexpected, expert crafter, Steve.', 'https://image.tmdb.org/t/p/original/yFHHfHcUgGAxziP1C3lLt0q2T4s.jpg', 'https://image.tmdb.org/t/p/original/2Nti3gYAX513wvhp8IiLL6ZDyOm.jpg', '2025-03-31', 'en', 'Be there and be square.', 6.5, 15225, 95, 'active'),

(1234567, 'Avatar 2', 'Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri and the army of the Na''vi race to protect their home.', 'https://image.tmdb.org/t/p/original/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg', 'https://image.tmdb.org/t/p/original/5a4JdoXwV0E7upJsQTVxFJU4pe7.jpg', '2022-12-16', 'en', 'Return to Pandora.', 7.6, 23569, 192, 'active');

-- =====================================================
-- SAMPLE CAST MEMBERS
-- =====================================================

INSERT INTO public.cast_members (name, profile_path, tmdb_id) VALUES
('Milla Jovovich', 'https://image.tmdb.org/t/p/original/usWnHCzbADijULREZYSJ0qfM00y.jpg', 1234),
('Dave Bautista', 'https://image.tmdb.org/t/p/original/snk6JiXOOoRjPtHU5VMoy6qbd32.jpg', 5678),
('Arly Jover', 'https://image.tmdb.org/t/p/original/zmznPrQ9GSZwcOIUT0c3GyETwrP.jpg', 9012),
('Amara Okereke', 'https://image.tmdb.org/t/p/original/nTSPtzWu6deZTJtWXHUpACVznY4.jpg', 3456),
('Fraser James', 'https://image.tmdb.org/t/p/original/mGAPQG2OKTgdKFkp9YpvCSqcbgY.jpg', 7890),
('Sam Worthington', 'https://image.tmdb.org/t/p/original/7d6cdxZbF5eLz2Yg9lhhqgUCEkj.jpg', 1111),
('Zoe Saldana', 'https://image.tmdb.org/t/p/original/ofNrWiA2KDdqiNxFTLp51HcXUl9.jpg', 2222),
('Sigourney Weaver', 'https://image.tmdb.org/t/p/original/8i6ZDkX1TNRrJoMekNjOGJNWPhp.jpg', 3333);

-- =====================================================
-- LINK MOVIES TO GENRES
-- =====================================================

-- Get movie and genre IDs
DO $$
DECLARE
    action_id INTEGER;
    adventure_id INTEGER;
    comedy_id INTEGER;
    drama_id INTEGER;
    fantasy_id INTEGER;
    horror_id INTEGER;
    family_id INTEGER;
    sci_fi_id INTEGER;
    thriller_id INTEGER;
    crime_id INTEGER;
    
    lost_lands_id UUID;
    until_dawn_id UUID;
    lilo_stitch_id UUID;
    havoc_id UUID;
    minecraft_id UUID;
    avatar_id UUID;
BEGIN
    -- Get genre IDs
    SELECT id INTO action_id FROM public.genres WHERE name = 'Action';
    SELECT id INTO adventure_id FROM public.genres WHERE name = 'Adventure';
    SELECT id INTO comedy_id FROM public.genres WHERE name = 'Comedy';
    SELECT id INTO drama_id FROM public.genres WHERE name = 'Drama';
    SELECT id INTO fantasy_id FROM public.genres WHERE name = 'Fantasy';
    SELECT id INTO horror_id FROM public.genres WHERE name = 'Horror';
    SELECT id INTO family_id FROM public.genres WHERE name = 'Family';
    SELECT id INTO sci_fi_id FROM public.genres WHERE name = 'Sci-Fi';
    SELECT id INTO thriller_id FROM public.genres WHERE name = 'Thriller';
    SELECT id INTO crime_id FROM public.genres WHERE name = 'Crime';
    
    -- Get movie IDs
    SELECT id INTO lost_lands_id FROM public.movies WHERE title = 'In the Lost Lands';
    SELECT id INTO until_dawn_id FROM public.movies WHERE title = 'Until Dawn';
    SELECT id INTO lilo_stitch_id FROM public.movies WHERE title = 'Lilo & Stitch';
    SELECT id INTO havoc_id FROM public.movies WHERE title = 'Havoc';
    SELECT id INTO minecraft_id FROM public.movies WHERE title = 'A Minecraft Movie';
    SELECT id INTO avatar_id FROM public.movies WHERE title = 'Avatar 2';
    
    -- Link movies to genres
    INSERT INTO public.movie_genres (movie_id, genre_id) VALUES
    (lost_lands_id, action_id),
    (lost_lands_id, fantasy_id),
    (lost_lands_id, adventure_id),
    
    (until_dawn_id, horror_id),
    (until_dawn_id, thriller_id),
    
    (lilo_stitch_id, family_id),
    (lilo_stitch_id, comedy_id),
    (lilo_stitch_id, sci_fi_id),
    
    (havoc_id, action_id),
    (havoc_id, crime_id),
    (havoc_id, thriller_id),
    
    (minecraft_id, family_id),
    (minecraft_id, comedy_id),
    (minecraft_id, adventure_id),
    (minecraft_id, fantasy_id),
    
    (avatar_id, action_id),
    (avatar_id, adventure_id),
    (avatar_id, sci_fi_id);
END $$;

-- =====================================================
-- LINK MOVIES TO CAST
-- =====================================================

DO $$
DECLARE
    milla_id INTEGER;
    dave_id INTEGER;
    arly_id INTEGER;
    amara_id INTEGER;
    fraser_id INTEGER;
    sam_id INTEGER;
    zoe_id INTEGER;
    sigourney_id INTEGER;
    
    lost_lands_id UUID;
    until_dawn_id UUID;
    lilo_stitch_id UUID;
    havoc_id UUID;
    minecraft_id UUID;
    avatar_id UUID;
BEGIN
    -- Get cast member IDs
    SELECT id INTO milla_id FROM public.cast_members WHERE name = 'Milla Jovovich';
    SELECT id INTO dave_id FROM public.cast_members WHERE name = 'Dave Bautista';
    SELECT id INTO arly_id FROM public.cast_members WHERE name = 'Arly Jover';
    SELECT id INTO amara_id FROM public.cast_members WHERE name = 'Amara Okereke';
    SELECT id INTO fraser_id FROM public.cast_members WHERE name = 'Fraser James';
    SELECT id INTO sam_id FROM public.cast_members WHERE name = 'Sam Worthington';
    SELECT id INTO zoe_id FROM public.cast_members WHERE name = 'Zoe Saldana';
    SELECT id INTO sigourney_id FROM public.cast_members WHERE name = 'Sigourney Weaver';
    
    -- Get movie IDs
    SELECT id INTO lost_lands_id FROM public.movies WHERE title = 'In the Lost Lands';
    SELECT id INTO until_dawn_id FROM public.movies WHERE title = 'Until Dawn';
    SELECT id INTO lilo_stitch_id FROM public.movies WHERE title = 'Lilo & Stitch';
    SELECT id INTO havoc_id FROM public.movies WHERE title = 'Havoc';
    SELECT id INTO minecraft_id FROM public.movies WHERE title = 'A Minecraft Movie';
    SELECT id INTO avatar_id FROM public.movies WHERE title = 'Avatar 2';
    
    -- Link movies to cast
    INSERT INTO public.movie_cast (movie_id, cast_id, character_name, order_index) VALUES
    (lost_lands_id, milla_id, 'Gray Alys', 1),
    (lost_lands_id, dave_id, 'Boyce', 2),
    (lost_lands_id, arly_id, 'Queen', 3),
    
    (until_dawn_id, amara_id, 'Clover', 1),
    (until_dawn_id, fraser_id, 'Detective', 2),
    
    (havoc_id, dave_id, 'Cop', 1),
    (havoc_id, milla_id, 'Criminal', 2),
    
    (avatar_id, sam_id, 'Jake Sully', 1),
    (avatar_id, zoe_id, 'Neytiri', 2),
    (avatar_id, sigourney_id, 'Dr. Grace Augustine', 3);
END $$;

-- =====================================================
-- SAMPLE TRAILERS
-- =====================================================

DO $$
DECLARE
    lost_lands_id UUID;
    until_dawn_id UUID;
    avatar_id UUID;
BEGIN
    SELECT id INTO lost_lands_id FROM public.movies WHERE title = 'In the Lost Lands';
    SELECT id INTO until_dawn_id FROM public.movies WHERE title = 'Until Dawn';
    SELECT id INTO avatar_id FROM public.movies WHERE title = 'Avatar 2';
    
    INSERT INTO public.trailers (movie_id, title, video_url, thumbnail_url, duration) VALUES
    (lost_lands_id, 'In the Lost Lands - Official Trailer', 'https://www.youtube.com/watch?v=WpW36ldAqnM', 'https://img.youtube.com/vi/WpW36ldAqnM/maxresdefault.jpg', 150),
    (until_dawn_id, 'Until Dawn - Official Trailer', 'https://www.youtube.com/watch?v=-sAOWhvheK8', 'https://img.youtube.com/vi/-sAOWhvheK8/maxresdefault.jpg', 180),
    (avatar_id, 'Avatar 2 - Official Trailer', 'https://www.youtube.com/watch?v=1pHDWnXmK7Y', 'https://img.youtube.com/vi/1pHDWnXmK7Y/maxresdefault.jpg', 200);
END $$;

-- =====================================================
-- SAMPLE SHOWS
-- =====================================================

DO $$
DECLARE
    lost_lands_id UUID;
    until_dawn_id UUID;
    lilo_stitch_id UUID;
    havoc_id UUID;
    minecraft_id UUID;
    avatar_id UUID;
    
    hall1_id UUID;
    hall2_id UUID;
    hall3_id UUID;
    hall4_id UUID;
BEGIN
    -- Get movie IDs
    SELECT id INTO lost_lands_id FROM public.movies WHERE title = 'In the Lost Lands';
    SELECT id INTO until_dawn_id FROM public.movies WHERE title = 'Until Dawn';
    SELECT id INTO lilo_stitch_id FROM public.movies WHERE title = 'Lilo & Stitch';
    SELECT id INTO havoc_id FROM public.movies WHERE title = 'Havoc';
    SELECT id INTO minecraft_id FROM public.movies WHERE title = 'A Minecraft Movie';
    SELECT id INTO avatar_id FROM public.movies WHERE title = 'Avatar 2';
    
    -- Get hall IDs
    SELECT id INTO hall1_id FROM public.cinema_halls WHERE name = 'Star Cineplex';
    SELECT id INTO hall2_id FROM public.cinema_halls WHERE name = 'Blockbuster Cinema';
    SELECT id INTO hall3_id FROM public.cinema_halls WHERE name = 'Shimanto Sambhar';
    SELECT id INTO hall4_id FROM public.cinema_halls WHERE name = 'Sony Cinema Hall';
    
    -- Insert shows for next 7 days
    INSERT INTO public.shows (movie_id, cinema_hall_id, show_date, show_time, show_datetime, price, status) VALUES
    -- Today
    (lost_lands_id, hall1_id, CURRENT_DATE, '09:00:00', CURRENT_DATE + INTERVAL '9 hours', 29.99, 'active'),
    (lost_lands_id, hall1_id, CURRENT_DATE, '12:00:00', CURRENT_DATE + INTERVAL '12 hours', 29.99, 'active'),
    (lost_lands_id, hall1_id, CURRENT_DATE, '15:00:00', CURRENT_DATE + INTERVAL '15 hours', 29.99, 'active'),
    (until_dawn_id, hall2_id, CURRENT_DATE, '10:00:00', CURRENT_DATE + INTERVAL '10 hours', 24.99, 'active'),
    (until_dawn_id, hall2_id, CURRENT_DATE, '13:00:00', CURRENT_DATE + INTERVAL '13 hours', 24.99, 'active'),
    (lilo_stitch_id, hall3_id, CURRENT_DATE, '11:00:00', CURRENT_DATE + INTERVAL '11 hours', 19.99, 'active'),
    (lilo_stitch_id, hall3_id, CURRENT_DATE, '14:00:00', CURRENT_DATE + INTERVAL '14 hours', 19.99, 'active'),
    
    -- Tomorrow
    (havoc_id, hall1_id, CURRENT_DATE + INTERVAL '1 day', '09:00:00', CURRENT_DATE + INTERVAL '1 day 9 hours', 27.99, 'active'),
    (havoc_id, hall1_id, CURRENT_DATE + INTERVAL '1 day', '12:00:00', CURRENT_DATE + INTERVAL '1 day 12 hours', 27.99, 'active'),
    (minecraft_id, hall2_id, CURRENT_DATE + INTERVAL '1 day', '10:00:00', CURRENT_DATE + INTERVAL '1 day 10 hours', 22.99, 'active'),
    (minecraft_id, hall2_id, CURRENT_DATE + INTERVAL '1 day', '13:00:00', CURRENT_DATE + INTERVAL '1 day 13 hours', 22.99, 'active'),
    (avatar_id, hall3_id, CURRENT_DATE + INTERVAL '1 day', '11:00:00', CURRENT_DATE + INTERVAL '1 day 11 hours', 34.99, 'active'),
    (avatar_id, hall3_id, CURRENT_DATE + INTERVAL '1 day', '14:00:00', CURRENT_DATE + INTERVAL '1 day 14 hours', 34.99, 'active'),
    
    -- Day after tomorrow
    (lost_lands_id, hall4_id, CURRENT_DATE + INTERVAL '2 days', '09:00:00', CURRENT_DATE + INTERVAL '2 days 9 hours', 29.99, 'active'),
    (until_dawn_id, hall4_id, CURRENT_DATE + INTERVAL '2 days', '12:00:00', CURRENT_DATE + INTERVAL '2 days 12 hours', 24.99, 'active'),
    (lilo_stitch_id, hall4_id, CURRENT_DATE + INTERVAL '2 days', '15:00:00', CURRENT_DATE + INTERVAL '2 days 15 hours', 19.99, 'active');
END $$;

-- =====================================================
-- SAMPLE BOOKING ANALYTICS
-- =====================================================

-- Insert analytics for the last 7 days
INSERT INTO public.booking_analytics (date, total_bookings, total_revenue, total_users, active_shows) VALUES
(CURRENT_DATE - INTERVAL '6 days', 45, 1250.50, 38, 12),
(CURRENT_DATE - INTERVAL '5 days', 52, 1420.75, 41, 12),
(CURRENT_DATE - INTERVAL '4 days', 38, 980.25, 32, 12),
(CURRENT_DATE - INTERVAL '3 days', 67, 1850.00, 55, 12),
(CURRENT_DATE - INTERVAL '2 days', 73, 2100.50, 58, 12),
(CURRENT_DATE - INTERVAL '1 day', 89, 2450.75, 72, 12),
(CURRENT_DATE, 42, 1150.25, 35, 12);

-- =====================================================
-- SAMPLE NOTIFICATIONS
-- =====================================================

-- Note: These will be created when users are added to the system
-- Sample notification template for reference
-- INSERT INTO public.notifications (user_id, title, message, type, related_entity_type, related_entity_id) VALUES
-- (user_id, 'Booking Confirmed', 'Your booking for Avatar 2 has been confirmed!', 'success', 'booking', booking_id);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify the data was inserted correctly
SELECT 'Movies' as table_name, COUNT(*) as count FROM public.movies
UNION ALL
SELECT 'Cast Members', COUNT(*) FROM public.cast_members
UNION ALL
SELECT 'Movie Genres', COUNT(*) FROM public.movie_genres
UNION ALL
SELECT 'Movie Cast', COUNT(*) FROM public.movie_cast
UNION ALL
SELECT 'Trailers', COUNT(*) FROM public.trailers
UNION ALL
SELECT 'Shows', COUNT(*) FROM public.shows
UNION ALL
SELECT 'Booking Analytics', COUNT(*) FROM public.booking_analytics;

-- Show sample movie with genres
SELECT 
    m.title,
    m.vote_average,
    ARRAY_AGG(g.name) as genres
FROM public.movies m
LEFT JOIN public.movie_genres mg ON m.id = mg.movie_id
LEFT JOIN public.genres g ON mg.genre_id = g.id
GROUP BY m.id, m.title, m.vote_average
ORDER BY m.vote_average DESC;

-- Show upcoming shows
SELECT 
    m.title,
    ch.name as hall_name,
    s.show_datetime,
    s.price
FROM public.shows s
JOIN public.movies m ON s.movie_id = m.id
JOIN public.cinema_halls ch ON s.cinema_hall_id = ch.id
WHERE s.show_datetime > NOW()
ORDER BY s.show_datetime
LIMIT 10; 


-- STEP 1: First, sign up normally with your email at the main site
-- Go to http://localhost:5173 and create a regular account
-- Use any valid email (e.g., your real email or admin@example.com)

-- STEP 2: Run this SQL in your Supabase SQL Editor to make yourself admin:

UPDATE public.users 
SET is_admin = true, 
    display_name = 'Admin User'
WHERE email = 'admin@cineverse.com';

-- STEP 3: Log in with your account and navigate to /admin

-- Disable Email Verification and Allow Any Email Signups
-- Run this in your Supabase SQL Editor

-- 1. Disable email confirmations in auth settings
-- Go to Supabase Dashboard → Authentication → Settings
-- Turn OFF "Enable email confirmations"

-- 2. Update RLS policies to allow any user to insert into users table
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Allow users to update their own profile without email verification
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- 4. Create a function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Update auth settings to allow any email domain
-- This is done in the Supabase Dashboard, not via SQL
-- Go to: Authentication → Settings → Email Templates
-- Set "Confirm signup" to disabled or customize as needed

-- Instructions for Supabase Dashboard:
-- 1. Go to Authentication → Settings
-- 2. Turn OFF "Enable email confirmations"
-- 3. Turn OFF "Enable email change confirmations" 
-- 4. Save changes 

-------------------------------------------------------------------------------

-- Fix RLS Policies to Avoid Infinite Recursion
-- Run this in your Supabase SQL Editor

-- 1. Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;

-- 2. Create simplified policies that avoid recursion
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Create a simple admin check policy (no recursion)
CREATE POLICY "Allow admin access" ON public.users
    FOR SELECT USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM auth.users 
            WHERE auth.users.id = auth.uid() 
            AND auth.users.raw_user_meta_data->>'is_admin' = 'true'
        )
    );

-- 4. Update the handle_new_user function to avoid recursion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, display_name, created_at, updated_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    now(),
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Ensure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Alternative: Temporarily disable RLS for testing (uncomment if needed)
-- ALTER TABLE public.users DISABLE ROW LEVEL SECURITY; 

-- Movie reviews and ratings
-- Creates a simple review system tied to movies with RLS

CREATE TABLE IF NOT EXISTS public.movie_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    movie_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, movie_id)
);

-- If your movies are stored in public.movie_details, add FK to that table
DO $$
DECLARE
    movie_details_is_base_table BOOLEAN := FALSE;
    movies_exists BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'movie_details' AND table_type = 'BASE TABLE'
    ) INTO movie_details_is_base_table;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'movies' AND table_type = 'BASE TABLE'
    ) INTO movies_exists;

    IF movie_details_is_base_table THEN
        BEGIN
            ALTER TABLE public.movie_reviews
            ADD CONSTRAINT fk_movie_reviews_movie
            FOREIGN KEY (movie_id) REFERENCES public.movie_details(id) ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN NULL; END;
    ELSIF movies_exists THEN
        BEGIN
            ALTER TABLE public.movie_reviews
            ADD CONSTRAINT fk_movie_reviews_movie
            FOREIGN KEY (movie_id) REFERENCES public.movies(id) ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN NULL; END;
    ELSE
        RAISE NOTICE 'Neither public.movie_details nor public.movies base table found. Skipping FK.';
    END IF;
END $$;

-- Enable RLS
ALTER TABLE public.movie_reviews ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Reviews are viewable by everyone" ON public.movie_reviews
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own reviews" ON public.movie_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON public.movie_reviews
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON public.movie_reviews
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger to keep updated_at fresh
CREATE OR REPLACE FUNCTION public.update_movie_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_movie_reviews_updated_at ON public.movie_reviews;
CREATE TRIGGER trg_update_movie_reviews_updated_at
BEFORE UPDATE ON public.movie_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_movie_reviews_updated_at();

-- Ensure roles have privileges (RLS still applies)
DO $$
BEGIN
  EXECUTE 'GRANT USAGE ON SCHEMA public TO anon, authenticated';
  EXECUTE 'GRANT SELECT ON public.movie_reviews TO anon, authenticated';
  EXECUTE 'GRANT INSERT, UPDATE, DELETE ON public.movie_reviews TO authenticated';
EXCEPTION WHEN others THEN
  NULL;
END $$;

-- Add RLS policy for users table to allow reading display_name and email for reviews
DO $$
BEGIN
  -- Only add if users table exists and RLS is enabled
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    -- Add policy to allow reading user info for reviews
    EXECUTE 'CREATE POLICY "Allow reading user info for reviews" ON public.users FOR SELECT USING (true)';
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'movie_reviews'
  ) THEN
    CREATE TABLE public.movie_reviews (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        movie_id UUID NOT NULL,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        review TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, movie_id)
    );
    
    RAISE NOTICE 'Created movie_reviews table';
  ELSE
    RAISE NOTICE 'movie_reviews table already exists';
  END IF;
END $$;

-- Add RLS policy for users table to allow reading user info for reviews
DO $$
BEGIN
  -- Only add if users table exists and RLS is enabled
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) THEN
    -- Drop existing policy if it exists
    EXECUTE 'DROP POLICY IF EXISTS "Allow reading user info for reviews" ON public.users';
    
    -- Add policy to allow reading user info for reviews
    EXECUTE 'CREATE POLICY "Allow reading user info for reviews" ON public.users FOR SELECT USING (true)';
    
    -- Ensure RLS is enabled on users table
    EXECUTE 'ALTER TABLE public.users ENABLE ROW LEVEL SECURITY';
    
    RAISE NOTICE 'Added RLS policy for users table';
  ELSE
    RAISE NOTICE 'Users table not found, skipping RLS policy';
  END IF;
EXCEPTION WHEN others THEN
  RAISE NOTICE 'Error setting up users table RLS: %', SQLERRM;
END $$;


   DELETE FROM public.movie_reviews;
   DELETE FROM public.movie_cast;
   DELETE FROM public.movie_genres;
   DELETE FROM public.trailers;
   DELETE FROM public.shows;
   DELETE FROM public.cast_members;
   DELETE FROM public.movies;


-- Sample Data for CineVerse Database
-- This script populates the database with sample data for testing and development

-- =====================================================
-- SAMPLE MOVIES
-- =====================================================

INSERT INTO public.movies (tmdb_id, title, overview, poster_path, backdrop_path, release_date, original_language, tagline, vote_average, vote_count, runtime, status) VALUES
(324544, 'In the Lost Lands', 'A queen sends the powerful and feared sorceress Gray Alys to the ghostly wilderness of the Lost Lands in search of a magical power, where she and her guide, the drifter Boyce, must outwit and outfight both man and demon.', 'https://image.tmdb.org/t/p/original/dDlfjR7gllmr8HTeN6rfrYhTdwX.jpg', 'https://image.tmdb.org/t/p/original/op3qmNhvwEvyT7UFyPbIfQmKriB.jpg', '2025-02-27', 'en', 'She seeks the power to free her people.', 6.4, 15000, 102, 'active'),

(1232546, 'Until Dawn', 'One year after her sister Melanie mysteriously disappeared, Clover and her friends head into the remote valley where she vanished in search of answers. Exploring an abandoned visitor center, they find themselves stalked by a masked killer and horrifically murdered one by one...only to wake up and find themselves back at the beginning of the same evening.', 'https://image.tmdb.org/t/p/original/juA4IWO52Fecx8lhAsxmDgy3M3.jpg', 'https://image.tmdb.org/t/p/original/icFWIk1KfkWLZnugZAJEDauNZ94.jpg', '2025-04-23', 'en', 'Every night a different nightmare.', 6.4, 18000, 103, 'active'),

(552524, 'Lilo & Stitch', 'The wildly funny and touching story of a lonely Hawaiian girl and the fugitive alien who helps to mend her broken family.', 'https://image.tmdb.org/t/p/original/mKKqV23MQ0uakJS8OCE2TfV5jNS.jpg', 'https://image.tmdb.org/t/p/original/7Zx3wDG5bBtcfk8lcnCWDOLM4Y4.jpg', '2025-05-17', 'en', 'Hold on to your coconuts.', 7.1, 27500, 108, 'active'),

(668489, 'Havoc', 'When a drug heist swerves lethally out of control, a jaded cop fights his way through a corrupt city''s criminal underworld to save a politician''s son.', 'https://image.tmdb.org/t/p/original/ubP2OsF3GlfqYPvXyLw9d78djGX.jpg', 'https://image.tmdb.org/t/p/original/65MVgDa6YjSdqzh7YOA04mYkioo.jpg', '2025-04-25', 'en', 'No law. Only disorder.', 6.5, 35960, 107, 'active'),

(950387, 'A Minecraft Movie', 'Four misfits find themselves struggling with ordinary problems when they are suddenly pulled through a mysterious portal into the Overworld: a bizarre, cubic wonderland that thrives on imagination. To get back home, they''ll have to master this world while embarking on a magical quest with an unexpected, expert crafter, Steve.', 'https://image.tmdb.org/t/p/original/yFHHfHcUgGAxziP1C3lLt0q2T4s.jpg', 'https://image.tmdb.org/t/p/original/2Nti3gYAX513wvhp8IiLL6ZDyOm.jpg', '2025-03-31', 'en', 'Be there and be square.', 6.5, 15225, 95, 'active'),

(1234567, 'Avatar 2', 'Jake Sully lives with his newfound family formed on the extrasolar moon Pandora. Once a familiar threat returns to finish what was previously started, Jake must work with Neytiri and the army of the Na''vi race to protect their home.', 'https://image.tmdb.org/t/p/original/t6HIqrRAclMCA60NsSmeqe9RmNV.jpg', 'https://image.tmdb.org/t/p/original/8I37NtDffNV7AZlDa7uDvvqhovU.jpg', '2022-12-16', 'en', 'Return to Pandora.', 7.6, 23569, 192, 'active'),

(1234568, 'The Dark Knight', 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.', 'https://image.tmdb.org/t/p/original/qJ2tW6WMUDux911r6m7haRef0WH.jpg', 'https://image.tmdb.org/t/p/original/hkBaDkMWbLaf8B1lsWsKX7Ew3Xq.jpg', '2008-07-18', 'en', 'Why So Serious?', 9.0, 30000, 152, 'active'),

(1234569, 'Inception', 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.', 'https://image.tmdb.org/t/p/original/9gk7adHYeDvHkCSEqAvQNLV5Uge.jpg', 'https://image.tmdb.org/t/p/original/s3TBrRGB1iav7gFOCNx3H31MoES.jpg', '2010-07-16', 'en', 'Your mind is the scene of the crime.', 8.8, 25000, 148, 'active'),

(1234570, 'Interstellar', 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity''s survival.', 'https://image.tmdb.org/t/p/original/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg', 'https://image.tmdb.org/t/p/original/nCbkOyOMTEwlEV0LtCOvCnwEONA.jpg', '2014-11-07', 'en', 'Mankind was born on Earth. It was never meant to die here.', 8.6, 22000, 169, 'active'),

(1234571, 'The Shawshank Redemption', 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.', 'https://image.tmdb.org/t/p/original/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg', 'https://image.tmdb.org/t/p/original/kXfqcdQKsToO0OUXHcrrNCHDBzO.jpg', '1994-09-23', 'en', 'Fear can hold you prisoner. Hope can set you free.', 9.3, 28000, 142, 'active'),

(1234572, 'Pulp Fiction', 'The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.', 'https://image.tmdb.org/t/p/original/fIE3lAGcZDV1G6XM5KmuWnNsPp1.jpg', 'https://media.themoviedb.org/t/p/w533_and_h300_bestv2/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg', '1994-10-14', 'en', 'Just because you are a character doesn''t mean you have character.', 8.9, 20000, 154, 'active'),

(1234573, 'The Matrix', 'A computer programmer discovers that reality as he knows it is a simulation created by machines, and joins a rebellion to break free.', 'https://www.themoviedb.org/t/p/w600_and_h900_bestv2/p96dm7sCMn4VYAStA6siNz30G1r.jpg', 'https://media.themoviedb.org/t/p/w533_and_h300_bestv2/8K9qHeM6G6QjQN0C5XKFGvK5lzM.jpg', '1999-03-31', 'en', 'Welcome to the Real World.', 8.7, 24000, 136, 'active'),

(1234574, 'Forrest Gump', 'The presidencies of Kennedy and Johnson, the Vietnam War, the Watergate scandal and other historical events unfold from the perspective of an Alabama man with an IQ of 75.', 'https://image.tmdb.org/t/p/original/arw2vcBveWOVZr6pxd9XTd1TdQa.jpg', 'https://media.themoviedb.org/t/p/w533_and_h300_bestv2/67HggiWaP9ZLv5sPYmyRV37yAJM.jpg', '1994-07-06', 'en', 'The world will never be the same once you''ve seen it through the eyes of Forrest Gump.', 8.8, 26000, 142, 'active'),

(1234575, 'The Lord of the Rings: The Fellowship of the Ring', 'A meek Hobbit from the Shire and eight companions set out on a journey to destroy the powerful One Ring and save Middle-earth from the Dark Lord Sauron.', 'https://image.tmdb.org/t/p/original/6oom5QYQ2yQTMJIbnvbkBL9cHo6.jpg', 'https://media.themoviedb.org/t/p/w533_and_h300_bestv2/a0lfia8tk8ifkrve0Tn8wkISUvs.jpg', '2001-12-19', 'en', 'One ring to rule them all.', 8.8, 27000, 178, 'active'),

(1234576, 'Fight Club', 'An insomniac office worker and a devil-may-care soapmaker form an underground fight club that evolves into something much, much more.', 'https://image.tmdb.org/t/p/original/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg', 'https://image.tmdb.org/t/p/original/52AfXWuXCHn3UjD17rBruA9f5qb.jpg', '1999-10-15', 'en', 'Mischief. Mayhem. Soap.', 8.8, 23000, 139, 'active'),

(1234577, 'Superman', 'Clark Kent, a young journalist who feels alienated by a world that may not be ready for him, embarks on a journey to find where he came from and what he was sent here to do.', 'https://www.themoviedb.org/t/p/w600_and_h900_bestv2/ombsmhYUqR4qqOLOxAyr5V8hbyv.jpg', 'https://media.themoviedb.org/t/p/w533_and_h300_bestv2/eU7IfdWq8KQy0oNd4kKXS0QUR08.jpg', '2025-07-11', 'en', 'Truth, Justice, and a Better Tomorrow.', 8.5, 18500, 145, 'active');

-- =====================================================
-- SAMPLE CAST MEMBERS
-- =====================================================
INSERT INTO public.cast_members (name, profile_path, tmdb_id) VALUES
('Milla Jovovich', 'https://image.tmdb.org/t/p/original/usWnHCzbADijULREZYSJ0qfM00y.jpg', 1234),
('Dave Bautista', 'https://image.tmdb.org/t/p/original/snk6JiXOOoRjPtHU5VMoy6qbd32.jpg', 5678),
('Arly Jover', 'https://image.tmdb.org/t/p/original/zmznPrQ9GSZwcOIUT0c3GyETwrP.jpg', 9012),
('Amara Okereke', 'https://image.tmdb.org/t/p/original/nTSPtzWu6deZTJtWXHUpACVznY4.jpg', 3456),
('Fraser James', 'https://image.tmdb.org/t/p/original/mGAPQG2OKTgdKFkp9YpvCSqcbgY.jpg', 7890),
('Sam Worthington', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/mflBcox36s9ZPbsZPVOuhf6axaJ.jpg', 1111),
('Zoe Saldana', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/iOVbUH20il632nj2v01NCtYYeSg.jpg', 2222),
('Sigourney Weaver', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/wTSnfktNBLd6kwQxgvkqYw6vEon.jpg', 3333),

('Christian Bale', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/7Pxez9J8fuPd2Mn9kex13YALrCQ.jpg', 4444),
('Heath Ledger', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/p2z2bURSg7nuMsN9P2s61e2RvNz.jpg', 5555),
('Aaron Eckhart', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/u5JjnRMr9zKEVvOP7k3F6gdcwT6.jpg', 6666),
('Michael Caine', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/bVZRMlpjTAO2pJK6v90buFgVbSW.jpg', 6667),
('Maggie Gyllenhaal', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/vsfkWdYWmA9CpzMHTJzrFxlDnEZ.jpg', 6668),
('Gary Oldman', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/2v9FVVBUrrkW2m3QOcYkuhq9A6o.jpg', 6669),
('Monique Gabriela Curnen', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/lJgLQs7cfM49m8VzVviwxIByz76.jpg', 6670),
('Ron Dean', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/mgqdr4VFrTVZatkki2suNLYxeDG.jpg', 6671),
('Cillian Murphy', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/llkbyWKwpfowZ6C8peBjIV9jj99.jpg', 6672),

('Jack Black', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/59IhgCtiWI5yTfzPhsjzg7GjCjm.jpg', 7777),
('Jason Momoa', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/3troAR6QbSb6nUFMDu61YCCWLKa.jpg', 8888),
('Sebastian Eugene Hansen', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/40HNkoB3RKPMPgLhTyKQU6kG0sc.jpg', 9999),

('Leonardo DiCaprio', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/wo2hJpn04vbtmh0B9utCFdsQhxM.jpg', 7000),
('Joseph Gordon-Levitt', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/4U9G4YwTlIEbAymBaseltS38eH4.jpg', 8000),
('Ellen Page', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/eCeFgzS8dYHnMfWQT0oQitCrsSz.jpg', 9000),

('Matthew McConaughey', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/lCySuYjhXix3FzQdS4oceDDrXKI.jpg', 1010),
('Anne Hathaway', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/s6tflSD20MGz04ZR2R1lZvhmC4Y.jpg', 2020),
('Jessica Chastain', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/xRvRzxiiHhgUErl0yf9w8WariRE.jpg', 3030),

('Tim Robbins', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/djLVFETFTvPyVUdrd7aLVykobof.jpg', 4040),
('Morgan Freeman', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/jPsLqiYGSofU4s6BjrxnefMfabb.jpg', 5050),
('Bob Gunton', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/ulbVvuBToBN3aCGcV028hwO0MOP.jpg', 6060),
('William Sadler', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/rWeb2kjYCA7V9MC9kRwRpm57YoY.jpg', 6061),
('Clancy Brown', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/1JeBRNG7VS7r64V9lOvej9bZXW5.jpg', 6062),
('Gil Bellows', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/eCOIv2nSGnWTHdn88NoMyNOKWyR.jpg', 6063),
('James Whitmore', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/nYMAbkfwFIgKK84vnLoQctI6vHg.jpg', 6064),
('Mark Rolston', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/hcrNRIptYMRXgkJ9k76BlQu6DQp.jpg', 6065),


('John Travolta', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/ap8eEYfBKTLixmVVpRlq4NslDD5.jpg', 7070),
('Samuel L. Jackson', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/AiAYAqwpM5xmiFrAIeQvUXDCVvo.jpg', 8080),
('Uma Thurman', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/sBgAZWi3o4FsnaTvnTNtK6jpQcF.jpg', 9090),

('Keanu Reeves', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/8RZLOyYGsoRe9p44q3xin9QkMHv.jpg', 1110),
('Laurence Fishburne', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/2GbXERENPpl5MmlqOLlPVaVtifD.jpg', 2220),
('Carrie-Anne Moss', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/gc7JwuLDD0kXHUlGx5vWzdlqSIT.jpg', 3330),

('Tom Hanks', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/oFvZoKI6lvU03n4YoNGAll9rkas.jpg', 4440),
('Robin Wright', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/d3rIv0y2p0jMsQ7ViR7O1606NZa.jpg', 5550),
('Gary Sinise', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/olRjiV8ZhBixQiTvrGwXhpVXxsV.jpg', 6660),
('Sally Field', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/5fBK36MdmdwQQMuP0W70rXADXih.jpg', 6661),
('Mykelti Williamson', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/dR16zD9AjnHWbeN5OVmJWE0vSax.jpg', 6662),
('Michael Conners Humphreys', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/irYRs3COggVHg91jL3CrlCIWmnx.jpg', 6663),
('Hanna Hall', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/xkZ2Hwz1QLXvQCgGlWgVgx00Rtd.jpg', 6664),
('Haley Joel Osment', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/2rnMTQB9Q3vLtmRyyUaenVwSgfY.jpg', 6665),

('Elijah Wood', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/7UKRbJBNG7mxBl2QQc5XsAh6F8B.jpg', 7770),
('Ian McKellen', 'https://media.themoviedb.org/t/p/w138_and_h175_face/5cnnnpnJG6TiYUSS7qgJheUZgnv.jpg', 8880),
('Viggo Mortensen', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/vH5gVSpHAMhDaFWfh0Q7BG61O1y.jpg', 9990),

('Brad Pitt', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/9OfnD7lxgIj3BNQpJFnwxnwl6w5.jpg', 1001),
('Edward Norton', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/8nytsqL59SFJTVYVrN72k6qkGgJ.jpg', 2002),
('Helena Bonham Carter', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/hJMbNSPJ2PCahsP3rNEU39C8GWU.jpg', 3003),
('Meat Loaf', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/3RZkBrS57qz8ghK774ibzM9RKu6.jpg', 3004),
('Jared Leto', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/qGUp4jRAsGAJ43ZgRGrCsRYYOYy.jpg', 3005),
('Zach Grenier', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/5tYfKlpLXAHK5zRJh3etOjQT4xT.jpg', 3006),
('Holt McCallany', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/76IatZbn36wZGp05FrDwDG8a1bk.jpg', 3007),
('Eion Bailey', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/4LXWx3UcJDUpx7to7X0dysJciWc.jpg', 3008),

('David Corenswet', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/qB0hBMu4wU1nPrqtdUQP3sQeN5t.jpg', 4004),
('Rachel Brosnahan', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/1f9NK43gWrXN2uMmYMlennB7jCC.jpg', 5005),
('Nicholas Hoult', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/laeAYQVBV9U3DkJ1B4Cn1XhpT8P.jpg', 6006),
('Edi Gathegi', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/dt8yMyycDlzxkjhmuuJJ4tXDbp4.jpg', 6007),
('Nathan Fillion', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/aW6vCxkUZtwb6iH2Wf88Uq0XNVv.jpg', 6008),
('Isabela Merced', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/5R1oi4PH7GXWETJS8SbSo673gJt.jpg', 6009),
('María Gabriela de Faría', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/1GtHCXOOf3t0B8i6Jb1etXQUBdD.jpg', 6010),
('Skyler Gisondo', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/vyalCuJUUP7Ht1vMWZQzhOrscXV.jpg', 6011),
('Alan Tudyk', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/jUuUbPuMGonFT5E2pcs4alfqaCN.jpg', 6012),

('Deirdre Mullins', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/lJm89neuiVlYISEqNpGZA5kTAnP.jpg', 3056),
('Sebastian Stankiewicz', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/hLN0Ca09KwQOFLZLPIEzgTIbqqg.jpg', 3057),
('Tue Lunding', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/qY4W0zfGBYzlCyCC0QDJS1Muoa0.jpg', 3058),

('Sean Astin', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/ywH1VvdwqlcnuwUVr0pV0HUZJQA.jpg', 3059),
('Ian Holm', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/cOJDgvgj4nMec6Inzj1H5nugTO5.jpg', 3060),
('Liv Tyler', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/aYlqS4wYuNCiN9wmvDwKRAE9BQ9.jpg', 3061),
('Christopher Lee', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/4zPu5YaRPbhrcp9aVjXQDjpfwPC.jpg', 3062),
('Sean Bean', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/kTjiABk3TJ3yI0Cto5RsvyT6V3o.jpg', 3063),
('Billy Boyd', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/uiWlsIOakNnUgda21PJF9wswzEJ.jpg', 3064),
('Dominic Monaghan', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/lOWmAvBu6evsj9MCcIHqy7Sg3iZ.jpg', 3065),

('Ella Rubin', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/8AKz6wWvokDM4N4tMGIoyv0wYsl.jpg', 3066),
('Maia Mitchell', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/4gxrYpXlUyHebEEouwLT6BgPo65.jpg', 3067),
('Peter Storemare', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/1rtpuUqBV29jDc1huUhtjGDbEwn.jpg', 3068),
('Michael Cimino', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/jZeicDN4rlQ4uMxI1UWTeM57FFa.jpg', 3069),
('Odessa Azion', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/meS7AUhkbybFiDtQyeczQ6rxO0F.jpg', 3070),
('Ji-young Yoo', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/4jgtqpNWhMx8XOKQ9qQJvDdzbxG.jpg', 3071),
('Belmont Cameli', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/yJwjcWwDdHkCeTLGgbKkSJdXXVc.jpg', 3072),
('Zsófia Temesvári', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/taN3JTo9LacpllSA3pEw43U5Drk.jpg', 3073),
('Lotta Losten', 'https://media.themoviedb.org/t/p/w300_and_h450_bestv2/k6C2tAU9EvFpBlLx9O2fKEVRFwx.jpg', 3074);

-- =====================================================
-- LINK MOVIES TO GENRES
-- =====================================================

-- Get movie and genre IDs
DO $$
DECLARE
    action_id INTEGER;
    adventure_id INTEGER;
    comedy_id INTEGER;
    drama_id INTEGER;
    fantasy_id INTEGER;
    horror_id INTEGER;
    family_id INTEGER;
    sci_fi_id INTEGER;
    thriller_id INTEGER;
    crime_id INTEGER;
    
    lost_lands_id UUID;
    until_dawn_id UUID;
    lilo_stitch_id UUID;
    havoc_id UUID;
    minecraft_id UUID;
    avatar_id UUID;
    dark_knight_id UUID;
    inception_id UUID;
    interstellar_id UUID;
    shawshank_id UUID;
    pulp_fiction_id UUID;
    matrix_id UUID;
    forrest_gump_id UUID;
    lotr_id UUID;
    fight_club_id UUID;
    superman_id UUID;
BEGIN
    -- Get genre IDs
    SELECT id INTO action_id FROM public.genres WHERE name = 'Action';
    SELECT id INTO adventure_id FROM public.genres WHERE name = 'Adventure';
    SELECT id INTO comedy_id FROM public.genres WHERE name = 'Comedy';
    SELECT id INTO drama_id FROM public.genres WHERE name = 'Drama';
    SELECT id INTO fantasy_id FROM public.genres WHERE name = 'Fantasy';
    SELECT id INTO horror_id FROM public.genres WHERE name = 'Horror';
    SELECT id INTO family_id FROM public.genres WHERE name = 'Family';
    SELECT id INTO sci_fi_id FROM public.genres WHERE name = 'Sci-Fi';
    SELECT id INTO thriller_id FROM public.genres WHERE name = 'Thriller';
    SELECT id INTO crime_id FROM public.genres WHERE name = 'Crime';
    
    -- Get movie IDs
    SELECT id INTO lost_lands_id FROM public.movies WHERE title = 'In the Lost Lands';
    SELECT id INTO until_dawn_id FROM public.movies WHERE title = 'Until Dawn';
    SELECT id INTO lilo_stitch_id FROM public.movies WHERE title = 'Lilo & Stitch';
    SELECT id INTO havoc_id FROM public.movies WHERE title = 'Havoc';
    SELECT id INTO minecraft_id FROM public.movies WHERE title = 'A Minecraft Movie';
    SELECT id INTO avatar_id FROM public.movies WHERE title = 'Avatar 2';
    SELECT id INTO dark_knight_id FROM public.movies WHERE title = 'The Dark Knight';
    SELECT id INTO inception_id FROM public.movies WHERE title = 'Inception';
    SELECT id INTO interstellar_id FROM public.movies WHERE title = 'Interstellar';
    SELECT id INTO shawshank_id FROM public.movies WHERE title = 'The Shawshank Redemption';
    SELECT id INTO pulp_fiction_id FROM public.movies WHERE title = 'Pulp Fiction';
    SELECT id INTO matrix_id FROM public.movies WHERE title = 'The Matrix';
    SELECT id INTO forrest_gump_id FROM public.movies WHERE title = 'Forrest Gump';
    SELECT id INTO lotr_id FROM public.movies WHERE title = 'The Lord of the Rings: The Fellowship of the Ring';
    SELECT id INTO fight_club_id FROM public.movies WHERE title = 'Fight Club';
    SELECT id INTO superman_id FROM public.movies WHERE title = 'Superman';
    
    -- Link movies to genres
    INSERT INTO public.movie_genres (movie_id, genre_id) VALUES
    (lost_lands_id, action_id),
    (lost_lands_id, fantasy_id),
    (lost_lands_id, adventure_id),
    
    (until_dawn_id, horror_id),
    (until_dawn_id, thriller_id),
    
    (lilo_stitch_id, family_id),
    (lilo_stitch_id, comedy_id),
    (lilo_stitch_id, sci_fi_id),
    
    (havoc_id, action_id),
    (havoc_id, crime_id),
    (havoc_id, thriller_id),
    
    (minecraft_id, family_id),
    (minecraft_id, comedy_id),
    (minecraft_id, adventure_id),
    (minecraft_id, fantasy_id),
    
    (avatar_id, action_id),
    (avatar_id, adventure_id),
    (avatar_id, sci_fi_id),

    (superman_id, action_id),
    (superman_id, adventure_id),
    (superman_id, sci_fi_id);



    -- Link The Dark Knight to genres
    SELECT id INTO dark_knight_id FROM public.movies WHERE title = 'The Dark Knight';
    INSERT INTO public.movie_genres (movie_id, genre_id) VALUES
    (dark_knight_id, action_id),
    (dark_knight_id, crime_id),
    (dark_knight_id, drama_id);

    -- Link Inception to genres
    SELECT id INTO inception_id FROM public.movies WHERE title = 'Inception';
    INSERT INTO public.movie_genres (movie_id, genre_id) VALUES
    (inception_id, sci_fi_id),
    (inception_id, action_id),
    (inception_id, thriller_id);

    -- Link Interstellar to genres
    SELECT id INTO interstellar_id FROM public.movies WHERE title = 'Interstellar';
    INSERT INTO public.movie_genres (movie_id, genre_id) VALUES
    (interstellar_id, sci_fi_id),
    (interstellar_id, adventure_id),
    (interstellar_id, drama_id);

    -- Link The Shawshank Redemption to genres
    SELECT id INTO shawshank_id FROM public.movies WHERE title = 'The Shawshank Redemption';
    INSERT INTO public.movie_genres (movie_id, genre_id) VALUES
    (shawshank_id, drama_id),
    (shawshank_id, crime_id);

    -- Link Pulp Fiction to genres
    SELECT id INTO pulp_fiction_id FROM public.movies WHERE title = 'Pulp Fiction';
    INSERT INTO public.movie_genres (movie_id, genre_id) VALUES
    (pulp_fiction_id, crime_id),
    (pulp_fiction_id, drama_id);

    -- Link The Matrix to genres
    SELECT id INTO matrix_id FROM public.movies WHERE title = 'The Matrix';
    INSERT INTO public.movie_genres (movie_id, genre_id) VALUES
    (matrix_id, sci_fi_id),
    (matrix_id, action_id);

    -- Link Forrest Gump to genres
    SELECT id INTO forrest_gump_id FROM public.movies WHERE title = 'Forrest Gump';
    INSERT INTO public.movie_genres (movie_id, genre_id) VALUES
    (forrest_gump_id, drama_id),
    (forrest_gump_id, comedy_id);

    -- Link The Lord of the Rings to genres
    SELECT id INTO lotr_id FROM public.movies WHERE title = 'The Lord of the Rings: The Fellowship of the Ring';
    INSERT INTO public.movie_genres (movie_id, genre_id) VALUES
    (lotr_id, fantasy_id),
    (lotr_id, adventure_id),
    (lotr_id, drama_id);

    -- Link Fight Club to genres
    SELECT id INTO fight_club_id FROM public.movies WHERE title = 'Fight Club';
    INSERT INTO public.movie_genres (movie_id, genre_id) VALUES
    (fight_club_id, drama_id),
    (fight_club_id, thriller_id);


END $$;

-- =====================================================
-- LINK MOVIES TO CAST
-- =====================================================


DO $$
DECLARE
    milla_id INTEGER;
    dave_id INTEGER;
    arly_id INTEGER;
    amara_id INTEGER;
    fraser_id INTEGER;
    sam_id INTEGER;
    zoe_id INTEGER;
    sigourney_id INTEGER;
    christian_bale_id INTEGER;
    heath_ledger_id INTEGER;
    aaron_eckhart_id INTEGER;
    leonardo_dicaprio_id INTEGER;
    joseph_gordon_levitt_id INTEGER;
    ellen_page_id INTEGER;
    matthew_mcconaughey_id INTEGER;
    anne_hathaway_id INTEGER;
    jessica_chastain_id INTEGER;
    tim_robbins_id INTEGER;
    morgan_freeman_id INTEGER;
    bob_gunton_id INTEGER;
    john_travolta_id INTEGER;
    samuel_l_jackson_id INTEGER;
    uma_thurman_id INTEGER;
    keanu_reeves_id INTEGER;
    laurence_fishburne_id INTEGER;
    carrie_anne_moss_id INTEGER;
    tom_hanks_id INTEGER;
    robin_wright_id INTEGER;
    gary_sinise_id INTEGER;
    elijah_wood_id INTEGER;
    ian_mckellen_id INTEGER;
    viggo_mortensen_id INTEGER;
    brad_pitt_id INTEGER;
    edward_norton_id INTEGER;
    helena_bonham_carter_id INTEGER;
    david_corenswet_id INTEGER;
    rachel_brosnahan_id INTEGER;
    nicholas_hoult_id INTEGER;
    deirdre_mullins_id INTEGER;
    sebastian_stankiewicz_id INTEGER;
    tue_lunding_id INTEGER;
    sean_astin_id INTEGER;
    ian_holm_id INTEGER;
    liv_tyler_id INTEGER;
    christopher_lee_id INTEGER;
    sean_bean_id INTEGER;
    billy_boyd_id INTEGER;
    dominic_monaghan_id INTEGER;
    meat_loaf_id INTEGER;
    jared_leto_id INTEGER;
    zach_grenier_id INTEGER;
    holt_mccallany_id INTEGER;
    eion_bailey_id INTEGER;
    edi_gathegi_id INTEGER;
    nathan_fillion_id INTEGER;
    isabela_merced_id INTEGER;
    maria_gabriela_de_faria_id INTEGER;
    skyler_gisondo_id INTEGER;
    alan_tudyk_id INTEGER;
    michael_caine_id INTEGER;
    maggie_gyllenhaal_id INTEGER;
    gary_oldman_id INTEGER;
    monique_gabriela_curnen_id INTEGER;
    ron_dean_id INTEGER;
    cillian_murphy_id INTEGER;
    ella_rubin_id INTEGER;
    maia_mitchell_id INTEGER;
    peter_storemare_id INTEGER;
    michael_cimino_id INTEGER;
    odessa_azion_id INTEGER;
    ji_young_yoo_id INTEGER;
    belmont_cameli_id INTEGER;
    zsofia_temesvari_id INTEGER;
    lotta_losten_id INTEGER;
    sally_field_id INTEGER;
    mykelti_williamson_id INTEGER;
    michael_conners_humphreys_id INTEGER;
    hanna_hall_id INTEGER;
    haley_joel_osment_id INTEGER;
    jack_black_id INTEGER;
    jason_momoa_id INTEGER;
    sebastian_eugene_hansen_id INTEGER;
    
    lost_lands_id UUID;
    until_dawn_id UUID;
    lilo_stitch_id UUID;
    havoc_id UUID;
    minecraft_id UUID;
    avatar_id UUID;
    dark_knight_id UUID;
    inception_id UUID;
    interstellar_id UUID;
    shawshank_id UUID;
    pulp_fiction_id UUID;
    matrix_id UUID;
    forrest_gump_id UUID;
    lotr_id UUID;
    fight_club_id UUID;
    superman_id UUID;
BEGIN
    -- Get cast member IDs
    SELECT id INTO milla_id FROM public.cast_members WHERE name = 'Milla Jovovich';
    SELECT id INTO dave_id FROM public.cast_members WHERE name = 'Dave Bautista';
    SELECT id INTO arly_id FROM public.cast_members WHERE name = 'Arly Jover';
    SELECT id INTO amara_id FROM public.cast_members WHERE name = 'Amara Okereke';
    SELECT id INTO fraser_id FROM public.cast_members WHERE name = 'Fraser James';
    SELECT id INTO sam_id FROM public.cast_members WHERE name = 'Sam Worthington';
    SELECT id INTO zoe_id FROM public.cast_members WHERE name = 'Zoe Saldana';
    SELECT id INTO sigourney_id FROM public.cast_members WHERE name = 'Sigourney Weaver';
    SELECT id INTO christian_bale_id FROM public.cast_members WHERE name = 'Christian Bale';
    SELECT id INTO heath_ledger_id FROM public.cast_members WHERE name = 'Heath Ledger';
    SELECT id INTO aaron_eckhart_id FROM public.cast_members WHERE name = 'Aaron Eckhart';
    SELECT id INTO jack_black_id FROM public.cast_members WHERE name = 'Jack Black';
    SELECT id INTO jason_momoa_id FROM public.cast_members WHERE name = 'Jason Momoa';
    SELECT id INTO sebastian_eugene_hansen_id FROM public.cast_members WHERE name = 'Sebastian Eugene Hansen';
    SELECT id INTO leonardo_dicaprio_id FROM public.cast_members WHERE name = 'Leonardo DiCaprio';
    SELECT id INTO joseph_gordon_levitt_id FROM public.cast_members WHERE name = 'Joseph Gordon-Levitt';
    SELECT id INTO ellen_page_id FROM public.cast_members WHERE name = 'Ellen Page';
    SELECT id INTO matthew_mcconaughey_id FROM public.cast_members WHERE name = 'Matthew McConaughey';
    SELECT id INTO anne_hathaway_id FROM public.cast_members WHERE name = 'Anne Hathaway';
    SELECT id INTO jessica_chastain_id FROM public.cast_members WHERE name = 'Jessica Chastain';
    SELECT id INTO tim_robbins_id FROM public.cast_members WHERE name = 'Tim Robbins';
    SELECT id INTO morgan_freeman_id FROM public.cast_members WHERE name = 'Morgan Freeman';
    SELECT id INTO bob_gunton_id FROM public.cast_members WHERE name = 'Bob Gunton';
    SELECT id INTO john_travolta_id FROM public.cast_members WHERE name = 'John Travolta';
    SELECT id INTO samuel_l_jackson_id FROM public.cast_members WHERE name = 'Samuel L. Jackson';
    SELECT id INTO uma_thurman_id FROM public.cast_members WHERE name = 'Uma Thurman';
    SELECT id INTO keanu_reeves_id FROM public.cast_members WHERE name = 'Keanu Reeves';
    SELECT id INTO laurence_fishburne_id FROM public.cast_members WHERE name = 'Laurence Fishburne';
    SELECT id INTO carrie_anne_moss_id FROM public.cast_members WHERE name = 'Carrie-Anne Moss';
    SELECT id INTO tom_hanks_id FROM public.cast_members WHERE name = 'Tom Hanks';
    SELECT id INTO robin_wright_id FROM public.cast_members WHERE name = 'Robin Wright';
    SELECT id INTO gary_sinise_id FROM public.cast_members WHERE name = 'Gary Sinise';
    SELECT id INTO elijah_wood_id FROM public.cast_members WHERE name = 'Elijah Wood';
    SELECT id INTO ian_mckellen_id FROM public.cast_members WHERE name = 'Ian McKellen';
    SELECT id INTO viggo_mortensen_id FROM public.cast_members WHERE name = 'Viggo Mortensen';
    SELECT id INTO brad_pitt_id FROM public.cast_members WHERE name = 'Brad Pitt';
    SELECT id INTO edward_norton_id FROM public.cast_members WHERE name = 'Edward Norton';
    SELECT id INTO helena_bonham_carter_id FROM public.cast_members WHERE name = 'Helena Bonham Carter';
    SELECT id INTO david_corenswet_id FROM public.cast_members WHERE name = 'David Corenswet';
    SELECT id INTO rachel_brosnahan_id FROM public.cast_members WHERE name = 'Rachel Brosnahan';
    SELECT id INTO nicholas_hoult_id FROM public.cast_members WHERE name = 'Nicholas Hoult';
    SELECT id INTO deirdre_mullins_id FROM public.cast_members WHERE name = 'Deirdre Mullins';
    SELECT id INTO sebastian_stankiewicz_id FROM public.cast_members WHERE name = 'Sebastian Stankiewicz';
    SELECT id INTO tue_lunding_id FROM public.cast_members WHERE name = 'Tue Lunding';
    SELECT id INTO sean_astin_id FROM public.cast_members WHERE name = 'Sean Astin';
    SELECT id INTO ian_holm_id FROM public.cast_members WHERE name = 'Ian Holm';
    SELECT id INTO liv_tyler_id FROM public.cast_members WHERE name = 'Liv Tyler';
    SELECT id INTO christopher_lee_id FROM public.cast_members WHERE name = 'Christopher Lee';
    SELECT id INTO sean_bean_id FROM public.cast_members WHERE name = 'Sean Bean';
    SELECT id INTO billy_boyd_id FROM public.cast_members WHERE name = 'Billy Boyd';
    SELECT id INTO dominic_monaghan_id FROM public.cast_members WHERE name = 'Dominic Monaghan';
    SELECT id INTO meat_loaf_id FROM public.cast_members WHERE name = 'Meat Loaf';
    SELECT id INTO jared_leto_id FROM public.cast_members WHERE name = 'Jared Leto';
    SELECT id INTO zach_grenier_id FROM public.cast_members WHERE name = 'Zach Grenier';
    SELECT id INTO holt_mccallany_id FROM public.cast_members WHERE name = 'Holt McCallany';
    SELECT id INTO eion_bailey_id FROM public.cast_members WHERE name = 'Eion Bailey';
    SELECT id INTO edi_gathegi_id FROM public.cast_members WHERE name = 'Edi Gathegi';
    SELECT id INTO nathan_fillion_id FROM public.cast_members WHERE name = 'Nathan Fillion';
    SELECT id INTO isabela_merced_id FROM public.cast_members WHERE name = 'Isabela Merced';
    SELECT id INTO maria_gabriela_de_faria_id FROM public.cast_members WHERE name = 'María Gabriela de Faría';
    SELECT id INTO skyler_gisondo_id FROM public.cast_members WHERE name = 'Skyler Gisondo';
    SELECT id INTO alan_tudyk_id FROM public.cast_members WHERE name = 'Alan Tudyk';
    SELECT id INTO ella_rubin_id FROM public.cast_members WHERE name = 'Ella Rubin';
    SELECT id INTO maia_mitchell_id FROM public.cast_members WHERE name = 'Maia Mitchell';
    SELECT id INTO peter_storemare_id FROM public.cast_members WHERE name = 'Peter Storemare';
    SELECT id INTO michael_cimino_id FROM public.cast_members WHERE name = 'Michael Cimino';
    SELECT id INTO odessa_azion_id FROM public.cast_members WHERE name = 'Odessa Azion';
    SELECT id INTO ji_young_yoo_id FROM public.cast_members WHERE name = 'Ji-young Yoo';
    SELECT id INTO belmont_cameli_id FROM public.cast_members WHERE name = 'Belmont Cameli';
    SELECT id INTO zsofia_temesvari_id FROM public.cast_members WHERE name = 'Zsófia Temesvári';
    SELECT id INTO lotta_losten_id FROM public.cast_members WHERE name = 'Lotta Losten';
    SELECT id INTO sally_field_id FROM public.cast_members WHERE name = 'Sally Field';
    SELECT id INTO mykelti_williamson_id FROM public.cast_members WHERE name = 'Mykelti Williamson';
    SELECT id INTO michael_conners_humphreys_id FROM public.cast_members WHERE name = 'Michael Conners Humphreys';
    SELECT id INTO hanna_hall_id FROM public.cast_members WHERE name = 'Hanna Hall';
    SELECT id INTO haley_joel_osment_id FROM public.cast_members WHERE name = 'Haley Joel Osment';
    
    
         -- Get movie IDs
     SELECT id INTO lost_lands_id FROM public.movies WHERE title = 'In the Lost Lands';
     SELECT id INTO until_dawn_id FROM public.movies WHERE title = 'Until Dawn';
     SELECT id INTO lilo_stitch_id FROM public.movies WHERE title = 'Lilo & Stitch';
     SELECT id INTO havoc_id FROM public.movies WHERE title = 'Havoc';
     SELECT id INTO minecraft_id FROM public.movies WHERE title = 'A Minecraft Movie';
     SELECT id INTO avatar_id FROM public.movies WHERE title = 'Avatar 2';
     SELECT id INTO dark_knight_id FROM public.movies WHERE title = 'The Dark Knight';
     SELECT id INTO inception_id FROM public.movies WHERE title = 'Inception';
     SELECT id INTO interstellar_id FROM public.movies WHERE title = 'Interstellar';
     SELECT id INTO shawshank_id FROM public.movies WHERE title = 'The Shawshank Redemption';
     SELECT id INTO pulp_fiction_id FROM public.movies WHERE title = 'Pulp Fiction';
     SELECT id INTO matrix_id FROM public.movies WHERE title = 'The Matrix';
     SELECT id INTO forrest_gump_id FROM public.movies WHERE title = 'Forrest Gump';
     SELECT id INTO lotr_id FROM public.movies WHERE title = 'The Lord of the Rings: The Fellowship of the Ring';
     SELECT id INTO fight_club_id FROM public.movies WHERE title = 'Fight Club';
     SELECT id INTO superman_id FROM public.movies WHERE title = 'Superman';
    
         -- Link movies to cast
     INSERT INTO public.movie_cast (movie_id, cast_id, character_name, order_index) VALUES
     -- Lilo & Stitch cast (8 members)
     (lilo_stitch_id, amara_id, 'Lilo', 1),
     (lilo_stitch_id, fraser_id, 'Stitch', 2),
     (lilo_stitch_id, milla_id, 'Nani', 3),
     (lilo_stitch_id, dave_id, 'David', 4),
     (lilo_stitch_id, arly_id, 'Cobra Bubbles', 5),
     (lilo_stitch_id, christian_bale_id, 'Jumba', 6),
     (lilo_stitch_id, heath_ledger_id, 'Pleakley', 7),
     (lilo_stitch_id, aaron_eckhart_id, 'Captain Gantu', 8),
     
     -- A Minecraft Movie cast (9 members)
     (minecraft_id, leonardo_dicaprio_id, 'Steve', 1),
     (minecraft_id, joseph_gordon_levitt_id, 'Alex', 2),
     (minecraft_id, ellen_page_id, 'Emma', 3),
     (minecraft_id, matthew_mcconaughey_id, 'Villager', 4),
     (minecraft_id, anne_hathaway_id, 'Enderman', 5),
     (minecraft_id, jessica_chastain_id, 'Creeper', 6),
     (minecraft_id, tim_robbins_id, 'Zombie', 7),
     (minecraft_id, morgan_freeman_id, 'Skeleton', 8),
     (minecraft_id, bob_gunton_id, 'Ender Dragon', 9),
     
     -- In the Lost Lands cast (8 members)
     (lost_lands_id, milla_id, 'Gray Alys', 1),
     (lost_lands_id, dave_id, 'Boyce', 2),
     (lost_lands_id, arly_id, 'Queen', 3),
     (lost_lands_id, amara_id, 'Princess', 4),
     (lost_lands_id, fraser_id, 'Guard Captain', 5),
     (lost_lands_id, deirdre_mullins_id, 'Mara', 6),
     (lost_lands_id, sebastian_stankiewicz_id, 'Rose', 7),
     (lost_lands_id, tue_lunding_id, 'The Hammer', 8),
     
     -- Until Dawn cast (9 members)
     (until_dawn_id, ella_rubin_id, 'Clover Paul', 1),
     (until_dawn_id, maia_mitchell_id, 'Melanie Paul', 2),
     (until_dawn_id, peter_storemare_id, 'Dr. Alan Hill', 3),
     (until_dawn_id, michael_cimino_id, 'Max', 4),
     (until_dawn_id, odessa_azion_id, 'Nina Riley', 5),
     (until_dawn_id, ji_young_yoo_id, 'Megan', 6),
     (until_dawn_id, belmont_cameli_id, 'Abe', 7),
     (until_dawn_id, zsofia_temesvari_id, 'Wendigo Melanie Paul', 8),
     (until_dawn_id, lotta_losten_id, 'Reporter', 9),
     
     -- Havoc cast (8 members)
     (havoc_id, dave_id, 'Cop', 1),
     (havoc_id, milla_id, 'Criminal', 2),
     (havoc_id, morgan_freeman_id, 'Police Chief', 3),
     (havoc_id, bob_gunton_id, 'Corrupt Official', 4),
     (havoc_id, john_travolta_id, 'Drug Lord', 5),
     (havoc_id, samuel_l_jackson_id, 'Partner Cop', 6),
     (havoc_id, uma_thurman_id, 'Witness', 7),
     (havoc_id, keanu_reeves_id, 'Undercover Agent', 8),
     
     -- Avatar 2 cast (10 members)
     (avatar_id, sam_id, 'Jake Sully', 1),
     (avatar_id, zoe_id, 'Neytiri', 2),
     (avatar_id, sigourney_id, 'Dr. Grace Augustine', 3),
     (avatar_id, laurence_fishburne_id, 'Colonel Quaritch', 4),
     (avatar_id, carrie_anne_moss_id, 'Dr. Norm Spellman', 5),
     (avatar_id, tom_hanks_id, 'Parker Selfridge', 6),
     (avatar_id, robin_wright_id, 'Dr. Max Patel', 7),
     (avatar_id, gary_sinise_id, 'General Ardmore', 8),
     (avatar_id, elijah_wood_id, 'Spider', 9),
     (avatar_id, ian_mckellen_id, 'Tonowari', 10),

     -- The Dark Knight cast (10 members)
     (dark_knight_id, christian_bale_id, 'Bruce Wayne / Batman', 1),
     (dark_knight_id, heath_ledger_id, 'Joker', 2),
     (dark_knight_id, aaron_eckhart_id, 'Harvey Dent', 3),
     (dark_knight_id, morgan_freeman_id, 'Lucius Fox', 4),
     (dark_knight_id, michael_caine_id, 'Alfred Pennyworth', 5),
     (dark_knight_id, maggie_gyllenhaal_id, 'Rachel Dawes', 6),
     (dark_knight_id, gary_oldman_id, 'Gordon', 7),
     (dark_knight_id, monique_gabriela_curnen_id, 'Ramirez', 8),
     (dark_knight_id, ron_dean_id, 'Wuertz', 9),
     (dark_knight_id, cillian_murphy_id, 'Scarecrow', 10),

     -- Inception cast (9 members)
     (inception_id, leonardo_dicaprio_id, 'Cobb', 1),
     (inception_id, joseph_gordon_levitt_id, 'Arthur', 2),
     (inception_id, ellen_page_id, 'Ariadne', 3),
     (inception_id, tom_hanks_id, 'Saito', 4),
     (inception_id, robin_wright_id, 'Mal', 5),
     (inception_id, gary_sinise_id, 'Eames', 6),
     (inception_id, elijah_wood_id, 'Yusuf', 7),
     (inception_id, ian_mckellen_id, 'Robert Fischer', 8),
     (inception_id, viggo_mortensen_id, 'Maurice Fischer', 9),

     -- Interstellar cast (10 members)
     (interstellar_id, matthew_mcconaughey_id, 'Cooper', 1),
     (interstellar_id, anne_hathaway_id, 'Brand', 2),
     (interstellar_id, jessica_chastain_id, 'Murph', 3),
     (interstellar_id, tim_robbins_id, 'Professor Brand', 4),
     (interstellar_id, morgan_freeman_id, 'Dr. Mann', 5),
     (interstellar_id, bob_gunton_id, 'NASA Director', 6),
     (interstellar_id, john_travolta_id, 'Romilly', 7),
     (interstellar_id, samuel_l_jackson_id, 'Doyle', 8),
     (interstellar_id, uma_thurman_id, 'Amelia Brand', 9),
     (interstellar_id, keanu_reeves_id, 'TARS', 10),

     -- The Shawshank Redemption cast (8 members)
     (shawshank_id, tim_robbins_id, 'Andy Dufresne', 1),
     (shawshank_id, morgan_freeman_id, 'Ellis Boyd "Red" Redding', 2),
     (shawshank_id, bob_gunton_id, 'Warden Norton', 3),
     (shawshank_id, john_travolta_id, 'Captain Hadley', 4),
     (shawshank_id, samuel_l_jackson_id, 'Heywood', 5),
     (shawshank_id, uma_thurman_id, 'Brooks Hatlen', 6),
     (shawshank_id, keanu_reeves_id, 'Tommy Williams', 7),
     (shawshank_id, laurence_fishburne_id, 'Bogs Diamond', 8),

     -- Pulp Fiction cast (9 members)
     (pulp_fiction_id, john_travolta_id, 'Vincent Vega', 1),
     (pulp_fiction_id, samuel_l_jackson_id, 'Jules Winnfield', 2),
     (pulp_fiction_id, uma_thurman_id, 'Mia Wallace', 3),
     (pulp_fiction_id, keanu_reeves_id, 'Butch Coolidge', 4),
     (pulp_fiction_id, laurence_fishburne_id, 'Marsellus Wallace', 5),
     (pulp_fiction_id, carrie_anne_moss_id, 'Fabienne', 6),
     (pulp_fiction_id, tom_hanks_id, 'Winston Wolfe', 7),
     (pulp_fiction_id, robin_wright_id, 'Jody', 8),
     (pulp_fiction_id, gary_sinise_id, 'Lance', 9),

     -- The Matrix cast (10 members)
     (matrix_id, keanu_reeves_id, 'Neo', 1),
     (matrix_id, laurence_fishburne_id, 'Morpheus', 2),
     (matrix_id, carrie_anne_moss_id, 'Trinity', 3),
     (matrix_id, tom_hanks_id, 'Agent Smith', 4),
     (matrix_id, robin_wright_id, 'Oracle', 5),
     (matrix_id, gary_sinise_id, 'Cypher', 6),
     (matrix_id, elijah_wood_id, 'Mouse', 7),
     (matrix_id, ian_mckellen_id, 'Tank', 8),
     (matrix_id, viggo_mortensen_id, 'Apoc', 9),
     (matrix_id, brad_pitt_id, 'Switch', 10),

     -- Forrest Gump cast (8 members)
     (forrest_gump_id, tom_hanks_id, 'Forrest Gump', 1),
     (forrest_gump_id, robin_wright_id, 'Jenny Curran', 2),
     (forrest_gump_id, gary_sinise_id, 'Lieutenant Dan', 3),
     (forrest_gump_id, sally_field_id, 'Mrs. Gump', 4),
     (forrest_gump_id, mykelti_williamson_id, 'Bubba Blue', 5),
     (forrest_gump_id, michael_conners_humphreys_id, 'Young Forrest Gump', 6),
     (forrest_gump_id, hanna_hall_id, 'Young Jenny Curran', 7),
     (forrest_gump_id, haley_joel_osment_id, 'Forrest Junior', 8),

     -- The Lord of the Rings cast (10 members)
     (lotr_id, elijah_wood_id, 'Frodo Baggins', 1),
     (lotr_id, ian_mckellen_id, 'Gandalf', 2),
     (lotr_id, viggo_mortensen_id, 'Aragorn', 3),
     (lotr_id, sean_astin_id, 'Sam', 4),
     (lotr_id, ian_holm_id, 'Bilbo', 5),
     (lotr_id, liv_tyler_id, 'Arwen', 6),
     (lotr_id, christopher_lee_id, 'Saruman', 7),
     (lotr_id, sean_bean_id, 'Boromir', 8),
     (lotr_id, billy_boyd_id, 'Pippin', 9),
     (lotr_id, dominic_monaghan_id, 'Merry', 10),

     -- Fight Club cast (8 members)
     (fight_club_id, brad_pitt_id, 'Tyler Durden', 1),
     (fight_club_id, edward_norton_id, 'Narrator', 2),
     (fight_club_id, helena_bonham_carter_id, 'Marla Singer', 3),
     (fight_club_id, meat_loaf_id, 'Robert Paulson', 4),
     (fight_club_id, jared_leto_id, 'Angel Face', 5),
     (fight_club_id, zach_grenier_id, 'Richard Chesler', 6),
     (fight_club_id, holt_mccallany_id, 'The Mechanic', 7),
     (fight_club_id, eion_bailey_id, 'Ricky', 8),

     -- Superman cast (9 members)
     (superman_id, david_corenswet_id, 'Clark Kent / Superman', 1),
     (superman_id, rachel_brosnahan_id, 'Lois Lane', 2),
     (superman_id, nicholas_hoult_id, 'Lex Luthor', 3),
     (superman_id, edi_gathegi_id, 'Mr. Terrific', 4),
     (superman_id, nathan_fillion_id, 'Guy Gardner', 5),
     (superman_id, isabela_merced_id, 'Hawkgirl', 6),
     (superman_id, maria_gabriela_de_faria_id, 'The Engineer', 7),
     (superman_id, skyler_gisondo_id, 'Jimmy Olsen', 8),
     (superman_id, alan_tudyk_id, 'Gary', 9);
END $$;


-- =====================================================
-- SAMPLE TRAILERS
-- =====================================================

DO $$
DECLARE
    lost_lands_id UUID;
    until_dawn_id UUID;
    avatar_id UUID;
    superman_id UUID;
BEGIN
    SELECT id INTO lost_lands_id FROM public.movies WHERE title = 'In the Lost Lands';
    SELECT id INTO until_dawn_id FROM public.movies WHERE title = 'Until Dawn';
    SELECT id INTO avatar_id FROM public.movies WHERE title = 'Avatar 2';
    SELECT id INTO superman_id FROM public.movies WHERE title = 'Superman';
    
    INSERT INTO public.trailers (movie_id, title, video_url, thumbnail_url, duration) VALUES
    (lost_lands_id, 'In the Lost Lands - Official Trailer', 'https://www.youtube.com/watch?v=WpW36ldAqnM', 'https://img.youtube.com/vi/WpW36ldAqnM/maxresdefault.jpg', 150),
    (until_dawn_id, 'Until Dawn - Official Trailer', 'https://www.youtube.com/watch?v=-sAOWhvheK8', 'https://img.youtube.com/vi/-sAOWhvheK8/maxresdefault.jpg', 180),
    (avatar_id, 'Avatar 2 - Official Trailer', 'https://www.youtube.com/watch?v=1pHDWnXmK7Y', 'https://img.youtube.com/vi/1pHDWnXmK7Y/maxresdefault.jpg', 200),
    (superman_id, 'Superman - Official Trailer', 'https://www.youtube.com/watch?v=T6DJcgm3wNY', 'https://img.youtube.com/vi/T6DJcgm3wNY/maxresdefault.jpg', 220);
END $$;

-- =====================================================
-- SAMPLE SHOWS
-- =====================================================

DO $$
DECLARE
    lost_lands_id UUID;
    until_dawn_id UUID;
    lilo_stitch_id UUID;
    havoc_id UUID;
    minecraft_id UUID;
    avatar_id UUID;
    dark_knight_id UUID;
    inception_id UUID;
    interstellar_id UUID;
    shawshank_id UUID;
    pulp_fiction_id UUID;
    matrix_id UUID;
    forrest_gump_id UUID;
    lotr_id UUID;
    fight_club_id UUID;
    superman_id UUID;
    
    hall1_id UUID;
    hall2_id UUID;
    hall3_id UUID;
    hall4_id UUID;
BEGIN
    -- Get movie IDs
    SELECT id INTO lost_lands_id FROM public.movies WHERE title = 'In the Lost Lands';
    SELECT id INTO until_dawn_id FROM public.movies WHERE title = 'Until Dawn';
    SELECT id INTO lilo_stitch_id FROM public.movies WHERE title = 'Lilo & Stitch';
    SELECT id INTO havoc_id FROM public.movies WHERE title = 'Havoc';
    SELECT id INTO minecraft_id FROM public.movies WHERE title = 'A Minecraft Movie';
    SELECT id INTO avatar_id FROM public.movies WHERE title = 'Avatar 2';
    SELECT id INTO dark_knight_id FROM public.movies WHERE title = 'The Dark Knight';
    SELECT id INTO inception_id FROM public.movies WHERE title = 'Inception';
    SELECT id INTO interstellar_id FROM public.movies WHERE title = 'Interstellar';
    SELECT id INTO shawshank_id FROM public.movies WHERE title = 'The Shawshank Redemption';
    SELECT id INTO pulp_fiction_id FROM public.movies WHERE title = 'Pulp Fiction';
    SELECT id INTO matrix_id FROM public.movies WHERE title = 'The Matrix';
    SELECT id INTO forrest_gump_id FROM public.movies WHERE title = 'Forrest Gump';
    SELECT id INTO lotr_id FROM public.movies WHERE title = 'The Lord of the Rings: The Fellowship of the Ring';
    SELECT id INTO fight_club_id FROM public.movies WHERE title = 'Fight Club';
    SELECT id INTO superman_id FROM public.movies WHERE title = 'Superman';
    
    -- Get hall IDs
    SELECT id INTO hall1_id FROM public.cinema_halls WHERE name = 'Star Cineplex';
    SELECT id INTO hall2_id FROM public.cinema_halls WHERE name = 'Blockbuster Cinema';
    SELECT id INTO hall3_id FROM public.cinema_halls WHERE name = 'Shimanto Sambhar';
    SELECT id INTO hall4_id FROM public.cinema_halls WHERE name = 'Sony Cinema Hall';
    
    -- Insert shows for next 7 days
    INSERT INTO public.shows (movie_id, cinema_hall_id, show_date, show_time, show_datetime, price, status) VALUES
    -- Today
    (lost_lands_id, hall1_id, CURRENT_DATE, '09:00:00', CURRENT_DATE + INTERVAL '9 hours', 29.99, 'active'),
    (lost_lands_id, hall1_id, CURRENT_DATE, '12:00:00', CURRENT_DATE + INTERVAL '12 hours', 29.99, 'active'),
    (lost_lands_id, hall1_id, CURRENT_DATE, '15:00:00', CURRENT_DATE + INTERVAL '15 hours', 29.99, 'active'),
    (until_dawn_id, hall2_id, CURRENT_DATE, '10:00:00', CURRENT_DATE + INTERVAL '10 hours', 24.99, 'active'),
    (until_dawn_id, hall2_id, CURRENT_DATE, '13:00:00', CURRENT_DATE + INTERVAL '13 hours', 24.99, 'active'),
    (lilo_stitch_id, hall3_id, CURRENT_DATE, '11:00:00', CURRENT_DATE + INTERVAL '11 hours', 19.99, 'active'),
    (lilo_stitch_id, hall3_id, CURRENT_DATE, '14:00:00', CURRENT_DATE + INTERVAL '14 hours', 19.99, 'active'),
    
    -- Tomorrow
    (havoc_id, hall1_id, CURRENT_DATE + INTERVAL '1 day', '09:00:00', CURRENT_DATE + INTERVAL '1 day 9 hours', 27.99, 'active'),
    (havoc_id, hall1_id, CURRENT_DATE + INTERVAL '1 day', '12:00:00', CURRENT_DATE + INTERVAL '1 day 12 hours', 27.99, 'active'),
    (minecraft_id, hall2_id, CURRENT_DATE + INTERVAL '1 day', '10:00:00', CURRENT_DATE + INTERVAL '1 day 10 hours', 22.99, 'active'),
    (minecraft_id, hall2_id, CURRENT_DATE + INTERVAL '1 day', '13:00:00', CURRENT_DATE + INTERVAL '1 day 13 hours', 22.99, 'active'),
    (avatar_id, hall3_id, CURRENT_DATE + INTERVAL '1 day', '11:00:00', CURRENT_DATE + INTERVAL '1 day 11 hours', 34.99, 'active'),
    (avatar_id, hall3_id, CURRENT_DATE + INTERVAL '1 day', '14:00:00', CURRENT_DATE + INTERVAL '1 day 14 hours', 34.99, 'active'),
    
    -- Day after tomorrow
    (lost_lands_id, hall4_id, CURRENT_DATE + INTERVAL '2 days', '09:00:00', CURRENT_DATE + INTERVAL '2 days 9 hours', 29.99, 'active'),
    (until_dawn_id, hall4_id, CURRENT_DATE + INTERVAL '2 days', '12:00:00', CURRENT_DATE + INTERVAL '2 days 12 hours', 24.99, 'active'),
    (lilo_stitch_id, hall4_id, CURRENT_DATE + INTERVAL '2 days', '15:00:00', CURRENT_DATE + INTERVAL '2 days 15 hours', 19.99, 'active'),

    -- Day 3
    (dark_knight_id, hall1_id, CURRENT_DATE + INTERVAL '3 days', '09:00:00', CURRENT_DATE + INTERVAL '3 days 9 hours', 32.99, 'active'),
    (inception_id, hall2_id, CURRENT_DATE + INTERVAL '3 days', '10:00:00', CURRENT_DATE + INTERVAL '3 days 10 hours', 29.99, 'active'),
    (interstellar_id, hall3_id, CURRENT_DATE + INTERVAL '3 days', '11:00:00', CURRENT_DATE + INTERVAL '3 days 11 hours', 31.99, 'active'),

    -- Day 4
    (shawshank_id, hall1_id, CURRENT_DATE + INTERVAL '4 days', '09:00:00', CURRENT_DATE + INTERVAL '4 days 9 hours', 26.99, 'active'),
    (pulp_fiction_id, hall2_id, CURRENT_DATE + INTERVAL '4 days', '10:00:00', CURRENT_DATE + INTERVAL '4 days 10 hours', 28.99, 'active'),
    (matrix_id, hall3_id, CURRENT_DATE + INTERVAL '4 days', '11:00:00', CURRENT_DATE + INTERVAL '4 days 11 hours', 30.99, 'active'),

    -- Day 5
    (forrest_gump_id, hall1_id, CURRENT_DATE + INTERVAL '5 days', '09:00:00', CURRENT_DATE + INTERVAL '5 days 9 hours', 27.99, 'active'),
    (lotr_id, hall2_id, CURRENT_DATE + INTERVAL '5 days', '10:00:00', CURRENT_DATE + INTERVAL '5 days 10 hours', 33.99, 'active'),
    (fight_club_id, hall3_id, CURRENT_DATE + INTERVAL '5 days', '11:00:00', CURRENT_DATE + INTERVAL '5 days 11 hours', 29.99, 'active'),
    (superman_id, hall4_id, CURRENT_DATE + INTERVAL '5 days', '12:00:00', CURRENT_DATE + INTERVAL '5 days 12 hours', 39.99, 'active');
END $$;

-- =====================================================
-- SAMPLE BOOKING ANALYTICS
-- =====================================================

-- Insert analytics for the last 7 days
INSERT INTO public.booking_analytics (date, total_bookings, total_revenue, total_users, active_shows) VALUES
(CURRENT_DATE - INTERVAL '6 days', 45, 1250.50, 38, 12),
(CURRENT_DATE - INTERVAL '5 days', 52, 1420.75, 41, 12),
(CURRENT_DATE - INTERVAL '4 days', 38, 980.25, 32, 12),
(CURRENT_DATE - INTERVAL '3 days', 67, 1850.00, 55, 12),
(CURRENT_DATE - INTERVAL '2 days', 73, 2100.50, 58, 12),
(CURRENT_DATE - INTERVAL '1 day', 89, 2450.75, 72, 12),
(CURRENT_DATE, 42, 1150.25, 35, 12);

-- =====================================================
-- SAMPLE NOTIFICATIONS
-- =====================================================

-- Note: These will be created when users are added to the system
-- Sample notification template for reference
-- INSERT INTO public.notifications (user_id, title, message, type, related_entity_type, related_entity_id) VALUES
-- (user_id, 'Booking Confirmed', 'Your booking for Avatar 2 has been confirmed!', 'success', 'booking', booking_id);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Verify the data was inserted correctly
SELECT 'Movies' as table_name, COUNT(*) as count FROM public.movies
UNION ALL
SELECT 'Cast Members', COUNT(*) FROM public.cast_members
UNION ALL
SELECT 'Movie Genres', COUNT(*) FROM public.movie_genres
UNION ALL
SELECT 'Movie Cast', COUNT(*) FROM public.movie_cast
UNION ALL
SELECT 'Trailers', COUNT(*) FROM public.trailers
UNION ALL
SELECT 'Shows', COUNT(*) FROM public.shows
UNION ALL
SELECT 'Booking Analytics', COUNT(*) FROM public.booking_analytics;

-- Show sample movie with genres
SELECT 
    m.title,
    m.vote_average,
    ARRAY_AGG(g.name) as genres
FROM public.movies m
LEFT JOIN public.movie_genres mg ON m.id = mg.movie_id
LEFT JOIN public.genres g ON mg.genre_id = g.id
GROUP BY m.id, m.title, m.vote_average
ORDER BY m.vote_average DESC;

-- Show upcoming shows
SELECT 
    m.title,
    ch.name as hall_name,
    s.show_datetime,
    s.price
FROM public.shows s
JOIN public.movies m ON s.movie_id = m.id
JOIN public.cinema_halls ch ON s.cinema_hall_id = ch.id
WHERE s.show_datetime > NOW()
ORDER BY s.show_datetime
LIMIT 10; 
