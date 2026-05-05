-- Файл: backend/config/rating_history.sql
-- Таблица истории изменений рейтинга и обновление функции пересчёта

-- 1. Таблица истории
CREATE TABLE IF NOT EXISTS rating_history (
  id              SERIAL PRIMARY KEY,
  mentor_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
  rating_score    DECIMAL(3,2),
  rating_reviews  DECIMAL(3,2),
  rating_activity DECIMAL(3,2),
  rating_sessions DECIMAL(3,2),
  rating_response DECIMAL(3,2),
  reason          VARCHAR(100),
  recorded_at     TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rating_history_mentor ON rating_history(mentor_id);
CREATE INDEX IF NOT EXISTS idx_rating_history_date   ON rating_history(recorded_at);

-- 2. Обновлённая функция: записывает в историю после UPDATE
CREATE OR REPLACE FUNCTION recalculate_mentor_rating(p_mentor_id INTEGER)
RETURNS void AS $$
DECLARE
  v_reviews_score  NUMERIC;
  v_activity_score NUMERIC;
  v_sessions_score NUMERIC;
  v_response_score NUMERIC;
  v_total          NUMERIC;
  v_count          INTEGER;
  v_avg            NUMERIC;
BEGIN
  -- О: Байесовское среднее отзывов
  SELECT COUNT(*), COALESCE(AVG(rating), 0)
  INTO v_count, v_avg
  FROM reviews WHERE mentor_id = p_mentor_id;
  v_reviews_score := (v_count * v_avg + 10 * 3.0) / (v_count + 10);

  -- А: Активность
  SELECT COALESCE(
    COUNT(*) FILTER (WHERE status = 'accepted')::NUMERIC /
    NULLIF(COUNT(*), 0) * 5, 2.5)
  INTO v_activity_score
  FROM applications WHERE mentor_id = p_mentor_id;

  -- З: Завершённые сессии
  SELECT LEAST(COUNT(*)::NUMERIC / 10, 1) * 5
  INTO v_sessions_score
  FROM chats WHERE mentor_id = p_mentor_id;

  -- В: Время ответа
  SELECT COALESCE(
    GREATEST(0::NUMERIC, 5 - AVG(
      EXTRACT(EPOCH FROM (c.created_at - a.created_at)) / 3600.0
    ) / 24.0 * 5), 2.5)
  INTO v_response_score
  FROM applications a
  JOIN chats c ON c.application_id = a.id
  WHERE a.mentor_id = p_mentor_id;

  -- Итоговый взвешенный рейтинг
  v_total := (v_reviews_score  * 0.40) +
             (v_activity_score * 0.25) +
             (v_sessions_score * 0.20) +
             (v_response_score * 0.15);

  UPDATE mentor_profiles SET
    rating_score       = ROUND(LEAST(v_total, 5.0), 2),
    rating_reviews     = ROUND(v_reviews_score,  2),
    rating_activity    = ROUND(v_activity_score, 2),
    rating_sessions    = ROUND(v_sessions_score, 2),
    rating_response    = ROUND(v_response_score, 2),
    last_rating_update = NOW()
  WHERE user_id = p_mentor_id;

  -- Запись в историю
  INSERT INTO rating_history
    (mentor_id, rating_score, rating_reviews, rating_activity, rating_sessions, rating_response, reason)
  VALUES (
    p_mentor_id,
    ROUND(LEAST(v_total, 5.0), 2),
    ROUND(v_reviews_score,  2),
    ROUND(v_activity_score, 2),
    ROUND(v_sessions_score, 2),
    ROUND(v_response_score, 2),
    'recalculate'
  );
END;
$$ LANGUAGE plpgsql;

-- 3. Пересчитать рейтинги с записью начальных точек в историю
SELECT recalculate_mentor_rating(user_id) FROM mentor_profiles;
