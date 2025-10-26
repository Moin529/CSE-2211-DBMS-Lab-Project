-- Movie reviews and ratings
-- Creates a simple review system tied to movies with RLS

-- Check if table exists, if not create it
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

-- Ensure roles have privileges (RLS still applies)
DO $$
BEGIN
  EXECUTE 'GRANT USAGE ON SCHEMA public TO anon, authenticated';
  EXECUTE 'GRANT SELECT ON public.movie_reviews TO anon, authenticated';
  EXECUTE 'GRANT INSERT, UPDATE, DELETE ON public.movie_reviews TO authenticated';
EXCEPTION WHEN others THEN
  NULL;
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

