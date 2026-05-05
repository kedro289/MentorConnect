-- Файл: backend/config/seed_activity.sql
-- Добавляет заявки и чаты для новых менторов (реалистичная активность)

-- =============================================
-- ЗАЯВКИ + ЧАТЫ для новых менторов (id 13–22)
-- =============================================

-- Дмитрий Козлов (id=13) — Python/Django
INSERT INTO applications (student_id, mentor_id, status, message, created_at)
VALUES
  (23, 13, 'accepted', 'Хочу научиться Python и Django, есть базовые знания', NOW() - INTERVAL '25 days'),
  (24, 13, 'accepted', 'Мне нужна помощь с REST API и архитектурой', NOW() - INTERVAL '20 days'),
  (25, 13, 'accepted', 'Готовлюсь к техническому интервью, хочу подтянуть алгоритмы', NOW() - INTERVAL '15 days'),
  (9,  13, 'rejected', 'Интересует изучение Python', NOW() - INTERVAL '10 days')
ON CONFLICT (student_id, mentor_id) DO NOTHING;

INSERT INTO chats (student_id, mentor_id, application_id, room_name, created_at)
SELECT a.student_id, a.mentor_id, a.id, 'chat_' || a.student_id || '_13', a.created_at + INTERVAL '2 hours'
FROM applications a WHERE a.mentor_id = 13 AND a.status = 'accepted'
ON CONFLICT (student_id, mentor_id) DO NOTHING;

-- Екатерина Смирнова (id=14) — UX/UI
INSERT INTO applications (student_id, mentor_id, status, message, created_at)
VALUES
  (24, 14, 'accepted', 'Хочу перейти в UX из графического дизайна', NOW() - INTERVAL '30 days'),
  (26, 14, 'accepted', 'Нужна помощь с составлением портфолио дизайнера', NOW() - INTERVAL '22 days'),
  (23, 14, 'accepted', 'Хочу понять базовые принципы UX-исследований', NOW() - INTERVAL '18 days'),
  (27, 14, 'accepted', 'Интересует Figma и прототипирование', NOW() - INTERVAL '12 days'),
  (10, 14, 'pending',  'Хотел бы изучить UX с нуля', NOW() - INTERVAL '3 days')
ON CONFLICT (student_id, mentor_id) DO NOTHING;

INSERT INTO chats (student_id, mentor_id, application_id, room_name, created_at)
SELECT a.student_id, a.mentor_id, a.id, 'chat_' || a.student_id || '_14', a.created_at + INTERVAL '1 hours'
FROM applications a WHERE a.mentor_id = 14 AND a.status = 'accepted'
ON CONFLICT (student_id, mentor_id) DO NOTHING;

-- Михаил Петров (id=15) — ML/Data Science
INSERT INTO applications (student_id, mentor_id, status, message, created_at)
VALUES
  (25, 15, 'accepted', 'Студент-математик, хочу применить знания в ML', NOW() - INTERVAL '28 days'),
  (23, 15, 'accepted', 'Хочу стать data scientist, есть базы Python', NOW() - INTERVAL '21 days'),
  (27, 15, 'accepted', 'Интересует компьютерное зрение и нейросети', NOW() - INTERVAL '14 days'),
  (10, 15, 'rejected', 'Хочу изучить машинное обучение', NOW() - INTERVAL '7 days')
ON CONFLICT (student_id, mentor_id) DO NOTHING;

INSERT INTO chats (student_id, mentor_id, application_id, room_name, created_at)
SELECT a.student_id, a.mentor_id, a.id, 'chat_' || a.student_id || '_15', a.created_at + INTERVAL '3 hours'
FROM applications a WHERE a.mentor_id = 15 AND a.status = 'accepted'
ON CONFLICT (student_id, mentor_id) DO NOTHING;

-- Анна Волкова (id=16) — React/Frontend
INSERT INTO applications (student_id, mentor_id, status, message, created_at)
VALUES
  (27, 16, 'accepted', 'Знаю JS, хочу углубиться в React и TypeScript', NOW() - INTERVAL '26 days'),
  (23, 16, 'accepted', 'Нужна помощь с оптимизацией React-приложения', NOW() - INTERVAL '19 days'),
  (25, 16, 'accepted', 'Хочу научиться писать чистый TypeScript', NOW() - INTERVAL '11 days'),
  (9,  16, 'pending',  'Интересует современный frontend стек', NOW() - INTERVAL '2 days')
ON CONFLICT (student_id, mentor_id) DO NOTHING;

INSERT INTO chats (student_id, mentor_id, application_id, room_name, created_at)
SELECT a.student_id, a.mentor_id, a.id, 'chat_' || a.student_id || '_16', a.created_at + INTERVAL '4 hours'
FROM applications a WHERE a.mentor_id = 16 AND a.status = 'accepted'
ON CONFLICT (student_id, mentor_id) DO NOTHING;

-- Сергей Новиков (id=17) — DevOps
INSERT INTO applications (student_id, mentor_id, status, message, created_at)
VALUES
  (23, 17, 'accepted', 'Хочу настроить CI/CD для своего проекта', NOW() - INTERVAL '24 days'),
  (27, 17, 'accepted', 'Нужна помощь с Docker и Kubernetes', NOW() - INTERVAL '17 days'),
  (25, 17, 'accepted', 'Хочу сдать CKA, нужен ментор по k8s', NOW() - INTERVAL '10 days'),
  (10, 17, 'accepted', 'Интересуют облачные технологии AWS', NOW() - INTERVAL '5 days'),
  (24, 17, 'pending',  'Хочу разобраться с DevOps практиками', NOW() - INTERVAL '1 day')
ON CONFLICT (student_id, mentor_id) DO NOTHING;

INSERT INTO chats (student_id, mentor_id, application_id, room_name, created_at)
SELECT a.student_id, a.mentor_id, a.id, 'chat_' || a.student_id || '_17', a.created_at + INTERVAL '1 hours 30 minutes'
FROM applications a WHERE a.mentor_id = 17 AND a.status = 'accepted'
ON CONFLICT (student_id, mentor_id) DO NOTHING;

-- Ольга Лебедева (id=18) — Маркетинг/SEO
INSERT INTO applications (student_id, mentor_id, status, message, created_at)
VALUES
  (26, 18, 'accepted', 'Хочу перейти в digital-маркетинг из продаж', NOW() - INTERVAL '23 days'),
  (24, 18, 'accepted', 'Нужна помощь с SEO для моего блога', NOW() - INTERVAL '16 days'),
  (9,  18, 'accepted', 'Хочу настроить Яндекс.Директ для малого бизнеса', NOW() - INTERVAL '9 days'),
  (23, 18, 'pending',  'Интересует контент-маркетинг', NOW() - INTERVAL '4 days')
ON CONFLICT (student_id, mentor_id) DO NOTHING;

INSERT INTO chats (student_id, mentor_id, application_id, room_name, created_at)
SELECT a.student_id, a.mentor_id, a.id, 'chat_' || a.student_id || '_18', a.created_at + INTERVAL '5 hours'
FROM applications a WHERE a.mentor_id = 18 AND a.status = 'accepted'
ON CONFLICT (student_id, mentor_id) DO NOTHING;

-- Павел Соколов (id=19) — iOS/Swift
INSERT INTO applications (student_id, mentor_id, status, message, created_at)
VALUES
  (27, 19, 'accepted', 'JS-разработчик, хочу попробовать iOS разработку', NOW() - INTERVAL '27 days'),
  (25, 19, 'accepted', 'Начал учить Swift, нужна помощь с архитектурой', NOW() - INTERVAL '20 days'),
  (23, 19, 'accepted', 'Хочу выпустить своё первое приложение в App Store', NOW() - INTERVAL '13 days'),
  (26, 19, 'rejected', 'Интересует мобильная разработка', NOW() - INTERVAL '6 days')
ON CONFLICT (student_id, mentor_id) DO NOTHING;

INSERT INTO chats (student_id, mentor_id, application_id, room_name, created_at)
SELECT a.student_id, a.mentor_id, a.id, 'chat_' || a.student_id || '_19', a.created_at + INTERVAL '2 hours 30 minutes'
FROM applications a WHERE a.mentor_id = 19 AND a.status = 'accepted'
ON CONFLICT (student_id, mentor_id) DO NOTHING;

-- Наталья Морозова (id=20) — Product Management
INSERT INTO applications (student_id, mentor_id, status, message, created_at)
VALUES
  (24, 20, 'accepted', 'Хочу перейти из разработки в продакт-менеджмент', NOW() - INTERVAL '22 days'),
  (26, 20, 'accepted', 'Нужна помощь с подготовкой к PM-собеседованию', NOW() - INTERVAL '15 days'),
  (9,  20, 'pending',  'Интересует продуктовая аналитика', NOW() - INTERVAL '5 days')
ON CONFLICT (student_id, mentor_id) DO NOTHING;

INSERT INTO chats (student_id, mentor_id, application_id, room_name, created_at)
SELECT a.student_id, a.mentor_id, a.id, 'chat_' || a.student_id || '_20', a.created_at + INTERVAL '6 hours'
FROM applications a WHERE a.mentor_id = 20 AND a.status = 'accepted'
ON CONFLICT (student_id, mentor_id) DO NOTHING;

-- Виктор Попов (id=21) — Кибербезопасность
INSERT INTO applications (student_id, mentor_id, status, message, created_at)
VALUES
  (25, 21, 'accepted', 'Хочу изучить пентестинг и сдать OSCP', NOW() - INTERVAL '29 days'),
  (27, 21, 'accepted', 'Интересует CTF и веб-уязвимости', NOW() - INTERVAL '22 days'),
  (23, 21, 'accepted', 'Хочу разобраться в основах сетевой безопасности', NOW() - INTERVAL '15 days'),
  (10, 21, 'accepted', 'Хочу перейти в ИБ из системного администрирования', NOW() - INTERVAL '8 days'),
  (9,  21, 'pending',  'Интересует кибербезопасность для разработчиков', NOW() - INTERVAL '2 days')
ON CONFLICT (student_id, mentor_id) DO NOTHING;

INSERT INTO chats (student_id, mentor_id, application_id, room_name, created_at)
SELECT a.student_id, a.mentor_id, a.id, 'chat_' || a.student_id || '_21', a.created_at + INTERVAL '45 minutes'
FROM applications a WHERE a.mentor_id = 21 AND a.status = 'accepted'
ON CONFLICT (student_id, mentor_id) DO NOTHING;

-- Юлия Захарова (id=22) — Java/Spring Boot
INSERT INTO applications (student_id, mentor_id, status, message, created_at)
VALUES
  (23, 22, 'accepted', 'Хочу освоить Spring Boot для backend разработки', NOW() - INTERVAL '26 days'),
  (25, 22, 'accepted', 'Нужна помощь с микросервисами на Java', NOW() - INTERVAL '19 days'),
  (27, 22, 'accepted', 'Готовлюсь к собеседованию в крупную компанию', NOW() - INTERVAL '12 days'),
  (10, 22, 'rejected', 'Хочу изучить Java с нуля', NOW() - INTERVAL '5 days')
ON CONFLICT (student_id, mentor_id) DO NOTHING;

INSERT INTO chats (student_id, mentor_id, application_id, room_name, created_at)
SELECT a.student_id, a.mentor_id, a.id, 'chat_' || a.student_id || '_22', a.created_at + INTERVAL '3 hours 30 minutes'
FROM applications a WHERE a.mentor_id = 22 AND a.status = 'accepted'
ON CONFLICT (student_id, mentor_id) DO NOTHING;

-- =============================================
-- Пересчёт рейтингов для всех менторов
-- =============================================
SELECT recalculate_mentor_rating(user_id) FROM mentor_profiles;
