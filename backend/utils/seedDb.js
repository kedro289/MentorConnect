/*
 * Файл: backend/utils/seedDb.js
 * Отвечает за: наполнение БД тестовыми данными.
 * Используется в: npm run seed.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function seed() {
  // Применить схему если таблиц нет
  const { rows } = await pool.query(
    "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='users'"
  );
  if (parseInt(rows[0].count, 10) === 0) {
    const schema = fs.readFileSync(path.join(__dirname, '../config/schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('Схема применена');
  }

  // Очистить старые seed-данные
  await pool.query(`
    DELETE FROM reviews WHERE student_id IN (SELECT id FROM users WHERE email LIKE '%@example.com');
    DELETE FROM messages WHERE sender_id IN (SELECT id FROM users WHERE email LIKE '%@example.com');
    DELETE FROM chats WHERE student_id IN (SELECT id FROM users WHERE email LIKE '%@example.com')
                        OR mentor_id IN (SELECT id FROM users WHERE email LIKE '%@example.com');
    DELETE FROM applications WHERE student_id IN (SELECT id FROM users WHERE email LIKE '%@example.com')
                               OR mentor_id IN (SELECT id FROM users WHERE email LIKE '%@example.com');
    DELETE FROM offers WHERE mentor_id IN (SELECT id FROM users WHERE email LIKE '%@example.com');
    DELETE FROM mentor_profiles WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@example.com');
    DELETE FROM student_profiles WHERE user_id IN (SELECT id FROM users WHERE email LIKE '%@example.com');
    DELETE FROM users WHERE email LIKE '%@example.com';
  `);

  // Создать пользователей
  const password123 = await bcrypt.hash('123456', 10);
  const passwordAdmin = await bcrypt.hash('admin123', 10);

  const student1 = await pool.query(
    `INSERT INTO users (email, password_hash, role) VALUES ($1,$2,'student') RETURNING id`,
    ['student@example.com', password123]
  );
  const student2 = await pool.query(
    `INSERT INTO users (email, password_hash, role) VALUES ($1,$2,'student') RETURNING id`,
    ['student2@example.com', password123]
  );
  const mentor = await pool.query(
    `INSERT INTO users (email, password_hash, role) VALUES ($1,$2,'mentor') RETURNING id`,
    ['mentor@example.com', password123]
  );
  const admin = await pool.query(
    `INSERT INTO users (email, password_hash, role) VALUES ($1,$2,'admin') RETURNING id`,
    ['admin@example.com', passwordAdmin]
  );

  const s1Id = student1.rows[0].id;
  const s2Id = student2.rows[0].id;
  const mId  = mentor.rows[0].id;

  // Профили студентов
  await pool.query(
    `INSERT INTO student_profiles (user_id, full_name, phone, interests, bio)
     VALUES ($1,'Иван Студентов','+7 900 111-22-33','JavaScript, Python','Хочу стать fullstack-разработчиком')`,
    [s1Id]
  );
  await pool.query(
    `INSERT INTO student_profiles (user_id, full_name, phone, interests, bio)
     VALUES ($1,'Мария Учебникова','+7 900 444-55-66','Data Science','Изучаю машинное обучение')`,
    [s2Id]
  );

  // Профиль ментора
  await pool.query(
    `INSERT INTO mentor_profiles
       (user_id, full_name, bio, expertise, experience_years, experience_text,
        portfolio_links, price_type, price_amount, available_schedule)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      mId,
      'Алексей Менторов',
      '10 лет опыта в веб-разработке. Работал в крупных IT-компаниях, веду собственные проекты.',
      ['JavaScript', 'Node.js', 'React', 'PostgreSQL'],
      10,
      'Senior Developer в Яндекс (5 лет), Tech Lead в стартапе (3 года), фриланс (2 года)',
      ['https://github.com/mentor-example', 'https://portfolio-example.com'],
      'paid',
      1500.00,
      'Пн-Пт 18:00-21:00, Сб 10:00-16:00',
    ]
  );

  // Предложения ментора
  await pool.query(
    `INSERT INTO offers (mentor_id, title, description, category, price_type, price_amount)
     VALUES ($1,'JavaScript с нуля до джуна','Полный курс JS: основы, ES6+, async/await, работа с API','JavaScript','paid',800)`,
    [mId]
  );
  await pool.query(
    `INSERT INTO offers (mentor_id, title, description, category, price_type, price_amount)
     VALUES ($1,'Node.js и Express backend','Создание REST API, работа с PostgreSQL, JWT аутентификация','Node.js','paid',1200)`,
    [mId]
  );
  await pool.query(
    `INSERT INTO offers (mentor_id, title, description, category, price_type, price_amount)
     VALUES ($1,'Бесплатная консультация','30 минут на разбор вашего кода или вопроса','Консультация','free',0)`,
    [mId]
  );

  // Заявки (обе принятые)
  const app1 = await pool.query(
    `INSERT INTO applications (student_id, mentor_id, status, message)
     VALUES ($1,$2,'accepted','Хочу изучить Node.js, есть базовые знания JS') RETURNING id`,
    [s1Id, mId]
  );
  const app2 = await pool.query(
    `INSERT INTO applications (student_id, mentor_id, status, message)
     VALUES ($1,$2,'accepted','Ищу ментора по JavaScript') RETURNING id`,
    [s2Id, mId]
  );

  // Чаты
  await pool.query(
    `INSERT INTO chats (student_id, mentor_id, application_id, room_name)
     VALUES ($1,$2,$3,$4)`,
    [s1Id, mId, app1.rows[0].id, `chat_${app1.rows[0].id}`]
  );
  await pool.query(
    `INSERT INTO chats (student_id, mentor_id, application_id, room_name)
     VALUES ($1,$2,$3,$4)`,
    [s2Id, mId, app2.rows[0].id, `chat_${app2.rows[0].id}`]
  );

  // Отзывы (триггер автоматически обновит avg_rating)
  await pool.query(
    `INSERT INTO reviews (student_id, mentor_id, rating, comment)
     VALUES ($1,$2,5,'Отличный ментор! Всё объясняет понятно, помог разобраться с async/await.')`,
    [s1Id, mId]
  );
  await pool.query(
    `INSERT INTO reviews (student_id, mentor_id, rating, comment)
     VALUES ($1,$2,4,'Хороший специалист, даёт практические задания. Рекомендую.')`,
    [s2Id, mId]
  );

  console.log('✅ Seed завершён успешно');
  console.log('  student@example.com  / 123456  (student)');
  console.log('  student2@example.com / 123456  (student)');
  console.log('  mentor@example.com   / 123456  (mentor)');
  console.log('  admin@example.com    / admin123 (admin)');
  await pool.end();
}

seed().catch(err => {
  console.error('❌ Ошибка seed:', err.message);
  process.exit(1);
});
