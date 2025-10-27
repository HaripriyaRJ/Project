/*
  # URL Shortener and QR Code Generator Schema

  ## Overview
  This migration sets up the complete database schema for a URL shortening and QR code generation application with user authentication.

  ## 1. New Tables
  
  ### `profiles`
  - `id` (uuid, primary key) - References auth.users(id)
  - `username` (text, unique) - User's display name
  - `email` (text) - User's email address
  - `created_at` (timestamptz) - Account creation timestamp
  
  ### `shortened_urls`
  - `id` (uuid, primary key) - Unique identifier
  - `user_id` (uuid, foreign key) - References profiles(id)
  - `original_url` (text) - The original long URL
  - `short_code` (text, unique) - The shortened URL code
  - `clicks` (integer) - Number of times the link was accessed
  - `created_at` (timestamptz) - Creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ## 2. Security
  
  ### Row Level Security (RLS)
  - Enable RLS on both `profiles` and `shortened_urls` tables
  
  ### Profiles Policies
  - Users can read their own profile
  - Users can update their own profile
  - Users can insert their own profile
  
  ### Shortened URLs Policies
  - Users can view their own shortened URLs
  - Users can create new shortened URLs
  - Users can update their own shortened URLs
  - Users can delete their own shortened URLs
  - Anyone can read shortened URLs by short_code (for redirects)

  ## 3. Indexes
  - Index on `short_code` for fast lookups during redirects
  - Index on `user_id` for efficient user queries

  ## 4. Functions
  - Trigger function to automatically create user profile on signup
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create shortened_urls table
CREATE TABLE IF NOT EXISTS shortened_urls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  original_url text NOT NULL,
  short_code text UNIQUE NOT NULL,
  clicks integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shortened_urls_short_code ON shortened_urls(short_code);
CREATE INDEX IF NOT EXISTS idx_shortened_urls_user_id ON shortened_urls(user_id);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shortened_urls ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Shortened URLs policies
CREATE POLICY "Users can view own URLs"
  ON shortened_urls FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone can read URLs by short code"
  ON shortened_urls FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Users can create URLs"
  ON shortened_urls FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own URLs"
  ON shortened_urls FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own URLs"
  ON shortened_urls FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function to handle user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();