export const db = instance.sys.database.postgres();

/**
 * Creates the tables the application needs and brings tables from older versions up to date.
 * Safe to run on every start.
 */
export async function ensureSchema() {
  await db`CREATE TABLE IF NOT EXISTS public.uk_ewsgit_photos_media (
    image_id SERIAL PRIMARY KEY,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    path TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    location TEXT,
    owner_id INTEGER NOT NULL,
    faces_detected BOOLEAN DEFAULT FALSE,
    objects_detected BOOLEAN DEFAULT FALSE
  )`;

  await db`CREATE TABLE IF NOT EXISTS public.uk_ewsgit_photos_albums (
    album_id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    cover_image_id INTEGER,
    owner_id INTEGER NOT NULL,
    FOREIGN KEY (cover_image_id) REFERENCES uk_ewsgit_photos_media(image_id)
  )`;

  await db`CREATE TABLE IF NOT EXISTS public.uk_ewsgit_photos_faces(
    face_id SERIAL PRIMARY KEY,
    image_id INTEGER NOT NULL,
    x INTEGER NOT NULL,
    y INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    cluster_id INTEGER,
    owner_id INTEGER NOT NULL,
    FOREIGN KEY (image_id) REFERENCES uk_ewsgit_photos_media(image_id)
  )`;

  await db`CREATE TABLE IF NOT EXISTS public.uk_ewsgit_photos_face_clusters (
    cluster_id SERIAL PRIMARY KEY,
    name TEXT DEFAULT NULL,
    representative_face_id INTEGER,
    owner_id INTEGER NOT NULL,
    FOREIGN KEY (representative_face_id) REFERENCES uk_ewsgit_photos_faces(face_id)
  )`;

  // columns added after the first release
  await db`ALTER TABLE public.uk_ewsgit_photos_media
    ADD COLUMN IF NOT EXISTS media_type TEXT NOT NULL DEFAULT 'image',
    ADD COLUMN IF NOT EXISTS size_bytes BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS favorite BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS is_screenshot BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS description TEXT,
    ADD COLUMN IF NOT EXISTS camera TEXT,
    ADD COLUMN IF NOT EXISTS exposure TEXT,
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS meta_version INTEGER NOT NULL DEFAULT 0`;

  await db`ALTER TABLE public.uk_ewsgit_photos_albums
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now()`;

  await db`CREATE TABLE IF NOT EXISTS public.uk_ewsgit_photos_album_media (
    album_id INTEGER NOT NULL REFERENCES public.uk_ewsgit_photos_albums(album_id) ON DELETE CASCADE,
    image_id INTEGER NOT NULL REFERENCES public.uk_ewsgit_photos_media(image_id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (album_id, image_id)
  )`;

  await db`CREATE TABLE IF NOT EXISTS public.uk_ewsgit_photos_shares (
    share_id SERIAL PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    owner_id INTEGER NOT NULL,
    album_id INTEGER REFERENCES public.uk_ewsgit_photos_albums(album_id) ON DELETE CASCADE,
    image_id INTEGER REFERENCES public.uk_ewsgit_photos_media(image_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CHECK ((album_id IS NULL) <> (image_id IS NULL))
  )`;

  await db`CREATE INDEX IF NOT EXISTS uk_ewsgit_photos_media_owner_timestamp ON public.uk_ewsgit_photos_media (owner_id, timestamp DESC)`;
}
