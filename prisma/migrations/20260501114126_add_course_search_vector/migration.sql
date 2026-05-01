-- Pełnotekstowe wyszukiwanie kursów (Postgres FTS)
-- Słownik 'simple' — bez stemmingu, tolerancyjny dla polskich form i nazw własnych.

-- Kolumna tsvector
ALTER TABLE "Course" ADD COLUMN "searchVector" tsvector;

-- Funkcja licząca wektor z ważeniem pól
CREATE OR REPLACE FUNCTION course_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('simple', coalesce(NEW."title", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW."shortDescription", '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW."authorName", '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW."platformName", '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(NEW."description", '')), 'D');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: aktualizuj wektor przed insertem i przy zmianie pól tekstowych
CREATE TRIGGER course_search_vector_trigger
BEFORE INSERT OR UPDATE OF "title", "shortDescription", "authorName", "platformName", "description"
ON "Course"
FOR EACH ROW EXECUTE FUNCTION course_search_vector_update();

-- Indeks GIN
CREATE INDEX "Course_searchVector_idx" ON "Course" USING GIN ("searchVector");

-- Backfill istniejących wierszy (no-op update wywołuje trigger)
UPDATE "Course" SET "title" = "title";
