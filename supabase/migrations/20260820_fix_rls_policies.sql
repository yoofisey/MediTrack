-- Fix overly permissive RLS policies on gamification tables
-- These were allowing any authenticated user to write to any row

-- Drop the overly permissive policies
DROP POLICY IF EXISTS "Service insert badges" ON user_badges;
DROP POLICY IF EXISTS "Service upsert points" ON user_points;
DROP POLICY IF EXISTS "Service update points" ON user_points;
DROP POLICY IF EXISTS "Service upsert user challenges" ON user_challenges;
DROP POLICY IF EXISTS "Service update user challenges" ON user_challenges;

-- User badges: users can only insert their own badges
CREATE POLICY "Auth insert own badges" ON user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User points: users can only modify their own points
CREATE POLICY "Auth upsert own points" ON user_points FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth update own points" ON user_points FOR UPDATE
  USING (auth.uid() = user_id);

-- User challenges: users can only modify their own challenges
CREATE POLICY "Auth upsert own challenges" ON user_challenges FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth update own challenges" ON user_challenges FOR UPDATE
  USING (auth.uid() = user_id);

-- Add UPDATE policy for community_posts (users can update their own posts, e.g. reactions)
CREATE POLICY "Auth update own posts" ON community_posts FOR UPDATE
  USING (auth.uid() = user_id);
