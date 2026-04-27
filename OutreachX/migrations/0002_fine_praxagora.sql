-- Create invitation_status enum only if it doesn't exist
DO $$ BEGIN
    CREATE TYPE "public"."invitation_status" AS ENUM('pending', 'accepted', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

-- Create invitations table directly since user_invitations might not exist
CREATE TABLE IF NOT EXISTS "invitations" (
    "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "email" varchar NOT NULL,
    "role" "user_role" NOT NULL,
    "token" varchar NOT NULL,
    "status" "invitation_status" DEFAULT 'pending',
    "invited_by" varchar NOT NULL,
    "expires_at" timestamp NOT NULL,
    "accepted_at" timestamp,
    "created_at" timestamp DEFAULT now()
);--> statement-breakpoint

-- Add constraints safely
DO $$ BEGIN
    ALTER TABLE "invitations" ADD CONSTRAINT "invitations_token_unique" UNIQUE("token");
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint

DO $$ BEGIN
    ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_users_id_fk" 
        FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;