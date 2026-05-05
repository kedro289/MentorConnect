-- Таблица избранных менторов (студент → ментор)
CREATE TABLE IF NOT EXISTS favorites (
  id         SERIAL PRIMARY KEY,
  student_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  mentor_id  INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, mentor_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_student ON favorites(student_id);
