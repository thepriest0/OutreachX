-- Create invitation_status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE invitation_status AS ENUM('pending', 'accepted', 'expired');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
    id varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    email varchar NOT NULL,
    role user_role NOT NULL,
    token varchar NOT NULL UNIQUE,
    status invitation_status DEFAULT 'pending',
    invited_by varchar NOT NULL,
    expires_at timestamp NOT NULL,
    accepted_at timestamp,
    created_at timestamp DEFAULT now(),
    CONSTRAINT invitations_invited_by_users_id_fk 
        FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE no action ON UPDATE no action
);

-- Create unique constraint on token if it doesn't exist
DO $$ BEGIN
    ALTER TABLE invitations ADD CONSTRAINT invitations_token_unique UNIQUE(token);
EXCEPTION
    WHEN duplicate_table THEN null;
END $$;
