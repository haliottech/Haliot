-- First, drop any existing constraints that might conflict
DO $$ 
BEGIN
    -- Drop existing constraints if they exist
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'research_posts_user_id_fkey' 
               AND table_name = 'research_posts') THEN
        ALTER TABLE public.research_posts DROP CONSTRAINT research_posts_user_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'comments_user_id_fkey' 
               AND table_name = 'comments') THEN
        ALTER TABLE public.comments DROP CONSTRAINT comments_user_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'comments_post_id_fkey' 
               AND table_name = 'comments') THEN
        ALTER TABLE public.comments DROP CONSTRAINT comments_post_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'likes_user_id_fkey' 
               AND table_name = 'likes') THEN
        ALTER TABLE public.likes DROP CONSTRAINT likes_user_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
               WHERE constraint_name = 'likes_post_id_fkey' 
               AND table_name = 'likes') THEN
        ALTER TABLE public.likes DROP CONSTRAINT likes_post_id_fkey;
    END IF;
END $$;

-- Now add the foreign key constraints properly
ALTER TABLE public.research_posts
ADD CONSTRAINT research_posts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.comments
ADD CONSTRAINT comments_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.comments
ADD CONSTRAINT comments_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.research_posts(id) ON DELETE CASCADE;

ALTER TABLE public.likes
ADD CONSTRAINT likes_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.likes
ADD CONSTRAINT likes_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.research_posts(id) ON DELETE CASCADE;