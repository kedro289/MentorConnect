-- Файл: backend/config/rating_schema.sql
-- Расширение схемы для системы объективного рейтинга MentorConnect

-- 1. Новые поля в mentor_profiles
ALTER TABLE mentor_profiles
  ADD COLUMN IF NOT EXISTS rating_score    DECIMAL(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_reviews  DECIMAL(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_activity DECIMAL(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_sessions DECIMAL(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS rating_response DECIMAL(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_rating_update TIMESTAMP;

-- 2. Функция пересчёта рейтинга ментора
--    Формула: (О×0.40) + (А×0.25) + (З×0.20) + (В×0.15)
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
  -- О: Байесовское среднее отзывов (формула IMDb)
  -- 10 виртуальных отзывов со средней 3.0 защищают от накрутки
  SELECT COUNT(*), COALESCE(AVG(rating), 0)
  INTO v_count, v_avg
  FROM reviews WHERE mentor_id = p_mentor_id;
  v_reviews_score := (v_count * v_avg + 10 * 3.0) / (v_count + 10);

  -- А: Активность — доля принятых заявок × 5
  SELECT COALESCE(
    COUNT(*) FILTER (WHERE status = 'accepted')::NUMERIC /
    NULLIF(COUNT(*), 0) * 5,
    2.5)
  INTO v_activity_score
  FROM applications WHERE mentor_id = p_mentor_id;

  -- З: Завершённые сессии — нормализация до 5 (макс при 10+ чатах)
  SELECT LEAST(COUNT(*)::NUMERIC / 10, 1) * 5
  INTO v_sessions_score
  FROM chats WHERE mentor_id = p_mentor_id;

  -- В: Время ответа — от подачи заявки до создания чата (принятия)
  --    Ответ за 1 час ≈ 5 баллов, за 5+ дней ≈ 0 баллов
  SELECT COALESCE(
    GREATEST(0::NUMERIC, 5 - AVG(
      EXTRACT(EPOCH FROM (c.created_at - a.created_at)) / 3600.0
    ) / 24.0 * 5),
    2.5)
  INTO v_response_score
  FROM applications a
  JOIN chats c ON c.application_id = a.id
  WHERE a.mentor_id = p_mentor_id;

  -- Итоговый взвешенный рейтинг (не более 5.0)
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
END;
$$ LANGUAGE plpgsql;

-- 3. Триггерная обёртка (вызывается из всех трёх триггеров)
CREATE OR REPLACE FUNCTION trigger_recalc_mentor_rating()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM recalculate_mentor_rating(NEW.mentor_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Триггер: пересчёт при новом/обновлённом отзыве
DROP TRIGGER IF EXISTS trigger_recalc_on_review ON reviews;
CREATE TRIGGER trigger_recalc_on_review
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW EXECUTE FUNCTION trigger_recalc_mentor_rating();

-- 5. Триггер: пересчёт при изменении статуса заявки
DROP TRIGGER IF EXISTS trigger_recalc_on_application ON applications;
CREATE TRIGGER trigger_recalc_on_application
AFTER UPDATE OF status ON applications
FOR EACH ROW EXECUTE FUNCTION trigger_recalc_mentor_rating();

-- 6. Триггер: пересчёт при создании нового чата
DROP TRIGGER IF EXISTS trigger_recalc_on_chat ON chats;
CREATE TRIGGER trigger_recalc_on_chat
AFTER INSERT ON chats
FOR EACH ROW EXECUTE FUNCTION trigger_recalc_mentor_rating();

-- 7. Первичный пересчёт рейтинга для всех существующих менторов
SELECT recalculate_mentor_rating(user_id) FROM mentor_profiles;
