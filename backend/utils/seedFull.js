/*
 * Файл: backend/utils/seedFull.js
 * Отвечает за: наполнение БД реалистичными профилями менторов и студентов.
 * Запуск: node backend/utils/seedFull.js
 */

require('dotenv').config();
const bcrypt = require('bcrypt');
const pool   = require('../config/db');

const PASS = '123456';

const MENTORS = [
  {
    email: 'kozlov@mentorconnect.ru',
    full_name: 'Дмитрий Козлов',
    bio: 'Senior Backend-разработчик с 8-летним опытом в Python и Django. Работал в Яндексе и нескольких стартапах. Помогу разобраться с архитектурой REST API, базами данных и деплоем на облако.',
    expertise: ['Python', 'Django', 'PostgreSQL', 'Docker', 'REST API'],
    experience_years: 8,
    experience_text: 'Яндекс — Senior Python Developer (3 года). До этого — backend в финтех-стартапе, затем собственные проекты. Ментором занимаюсь 2 года, выпустил 12 студентов.',
    price_type: 'paid', price_amount: 2500,
    available_schedule: 'Пн–Пт 19:00–22:00, выходные — гибко',
    portfolio_links: ['https://github.com/kozlov-dev'],
    reviews: [
      { rating: 5, comment: 'Дмитрий объясняет сложные вещи очень доступно. За 2 месяца я с нуля научился писать полноценные REST API. Рекомендую!', stars: 5 },
      { rating: 5, comment: 'Отличный ментор! Реальные задачи из практики, код-ревью после каждого занятия. Нашёл работу через 3 месяца после начала обучения.', stars: 5 },
      { rating: 4, comment: 'Хороший специалист, глубоко знает Python. Иногда занятия затягиваются, но контент стоит времени.', stars: 4 },
    ],
    offers: [
      { title: 'Python с нуля до джуна', description: 'Полный курс: синтаксис, ООП, работа с БД, REST API на Django. Финальный проект — полноценный backend.', category: 'Python', price_type: 'paid', price_amount: 2500 },
      { title: 'Подготовка к техническому интервью', description: 'Алгоритмы, структуры данных, системный дизайн. Mock-интервью с разбором ошибок.', category: 'Python', price_type: 'paid', price_amount: 3000 },
    ],
  },
  {
    email: 'smirnova@mentorconnect.ru',
    full_name: 'Екатерина Смирнова',
    bio: 'UX/UI-дизайнер с 6-летним опытом. Работала с продуктами с аудиторией от 100 тысяч пользователей. Специализируюсь на исследованиях пользователей, прототипировании и дизайн-системах.',
    expertise: ['UX Design', 'UI Design', 'Figma', 'User Research', 'Prototyping'],
    experience_years: 6,
    experience_text: 'Lead UX Designer в крупном e-commerce. Веду дизайн от идеи до релиза. Провела более 200 пользовательских интервью. Ментором работаю бесплатно — хочу развивать комьюнити дизайнеров.',
    price_type: 'free', price_amount: null,
    available_schedule: 'Вт, Чт 18:00–20:00, Сб 11:00–15:00',
    portfolio_links: ['https://behance.net/ekaterina-smirnova'],
    reviews: [
      { rating: 5, comment: 'Катя — невероятный ментор! Даёт задания из реальной практики, не просто теорию. После 3 месяцев работы со мной я устроилась джуниор-дизайнером.', stars: 5 },
      { rating: 5, comment: 'Бесплатно и при этом очень качественно. Объясняет принципы UX так, что сразу понятно, как применять на практике.', stars: 5 },
      { rating: 5, comment: 'Лучший ментор по дизайну! Разобрали мой портфолио по косточкам, дала конкретные советы. Кейсы стали намного сильнее.', stars: 5 },
    ],
    offers: [
      { title: 'UX с нуля: от исследования до прототипа', description: 'Учимся проводить интервью, строить User Journey Map, делать wireframes и интерактивные прототипы в Figma.', category: 'UX Design', price_type: 'free', price_amount: null },
      { title: 'Ревью портфолио дизайнера', description: 'Разбираем ваши кейсы, находим слабые места и улучшаем подачу. Подготовка к собеседованиям.', category: 'UI Design', price_type: 'free', price_amount: null },
    ],
  },
  {
    email: 'petrov.ml@mentorconnect.ru',
    full_name: 'Михаил Петров',
    bio: 'Data Scientist и ML-инженер с 10-летним опытом. Кандидат технических наук. Работал над задачами компьютерного зрения, NLP и рекомендательными системами. Автор 3 научных публикаций.',
    expertise: ['Machine Learning', 'Python', 'TensorFlow', 'Data Science', 'NLP', 'Computer Vision'],
    experience_years: 10,
    experience_text: 'Главный ML-инженер в Сбере (4 года). Ранее — исследователь в ВШЭ. Веду курсы по ML в Stepik. Помог 20+ студентам войти в профессию.',
    price_type: 'paid', price_amount: 3000,
    available_schedule: 'Пн, Ср, Пт 20:00–22:00',
    portfolio_links: ['https://kaggle.com/misha-petrov', 'https://habr.com/ru/users/mpetrov'],
    reviews: [
      { rating: 5, comment: 'Михаил — настоящий эксперт. Объяснил нейронные сети так, что наконец дошло! Дипломная работа по ML получилась на отлично.', stars: 5 },
      { rating: 4, comment: 'Очень глубокие знания. Иногда уходит в академизм, но если попросить — объяснит попроще. В целом очень доволен.', stars: 4 },
      { rating: 5, comment: 'За 4 месяца с нуля дошли до написания своей нейросети. Михаил всегда на связи, отвечает даже в выходные.', stars: 5 },
    ],
    offers: [
      { title: 'Machine Learning: от теории к практике', description: 'Линейная алгебра, статистика, sklearn, первые модели. Решаем реальные задачи с Kaggle.', category: 'Machine Learning', price_type: 'paid', price_amount: 3000 },
      { title: 'Deep Learning и нейронные сети', description: 'PyTorch, CNN, RNN, Transformer. Финальный проект — ваша собственная нейросеть.', category: 'Machine Learning', price_type: 'paid', price_amount: 3500 },
    ],
  },
  {
    email: 'volkova.fe@mentorconnect.ru',
    full_name: 'Анна Волкова',
    bio: 'Frontend-разработчик с 5-летним опытом. Специализируюсь на React, TypeScript и производительности веб-приложений. Опыт в крупных продуктовых командах и стартапах.',
    expertise: ['React', 'TypeScript', 'JavaScript', 'Next.js', 'CSS', 'Redux'],
    experience_years: 5,
    experience_text: 'Senior Frontend в Mail.ru Group (2 года). Разрабатываю высоконагруженные веб-приложения. Спикер на Frontend Conf 2023. Ментором работаю год.',
    price_type: 'paid', price_amount: 2000,
    available_schedule: 'Вт–Чт 19:00–21:30, Сб 12:00–16:00',
    portfolio_links: ['https://github.com/volkova-anna-fe'],
    reviews: [
      { rating: 5, comment: 'Аня объясняет React hooks так понятно! Наконец разобрался с useEffect и useCallback. Очень терпелива с вопросами.', stars: 5 },
      { rating: 5, comment: 'Профессионал своего дела. Научила писать чистый TypeScript, делать код-ревью и думать о производительности.', stars: 5 },
    ],
    offers: [
      { title: 'React + TypeScript с нуля', description: 'Компоненты, хуки, контекст, роутинг. Пишем полноценное SPA с авторизацией и работой с API.', category: 'React', price_type: 'paid', price_amount: 2000 },
      { title: 'Оптимизация React-приложений', description: 'Memo, useMemo, useCallback, ленивая загрузка, Profiler. Реальные задачи на оптимизацию.', category: 'React', price_type: 'paid', price_amount: 2500 },
    ],
  },
  {
    email: 'novikov.devops@mentorconnect.ru',
    full_name: 'Сергей Новиков',
    bio: 'DevOps-инженер с 7-летним опытом. Строю CI/CD пайплайны, настраиваю Kubernetes-кластеры и облачную инфраструктуру на AWS/GCP. Помогу автоматизировать всё, что можно автоматизировать.',
    expertise: ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Terraform', 'Linux', 'GitLab CI'],
    experience_years: 7,
    experience_text: 'Ведущий DevOps в Авито (3 года). Построил инфраструктуру для сервисов с нагрузкой 50k RPS. Сертифицированный специалист AWS и Kubernetes.',
    price_type: 'paid', price_amount: 2800,
    available_schedule: 'Пн–Пт 20:00–22:00',
    portfolio_links: [],
    reviews: [
      { rating: 5, comment: 'Сергей — гуру DevOps. За 2 месяца настроили полный CI/CD для моего проекта. Docker и Kubernetes перестали быть страшными словами.', stars: 5 },
      { rating: 4, comment: 'Много даёт за одно занятие, иногда сложно усвоить. Но домашние задания помогают закрепить. Результат — отличный.', stars: 4 },
      { rating: 5, comment: 'Лучший ментор по DevOps! Объясняет на реальных примерах, даёт доступ к своим тестовым стендам. Нашёл работу после 3 месяцев.', stars: 5 },
    ],
    offers: [
      { title: 'Docker и Docker Compose', description: 'Контейнеризация приложений, многоконтейнерные сборки, сети, volumes. Практика на реальных проектах.', category: 'DevOps', price_type: 'paid', price_amount: 2800 },
      { title: 'Kubernetes для разработчиков', description: 'Pods, Deployments, Services, Ingress, ConfigMaps. Деплой полного стека в k8s-кластер.', category: 'DevOps', price_type: 'paid', price_amount: 3200 },
    ],
  },
  {
    email: 'lebedeva.marketing@mentorconnect.ru',
    full_name: 'Ольга Лебедева',
    bio: 'Интернет-маркетолог и SEO-специалист с 4-летним опытом. Вывела 50+ сайтов в ТОП Яндекса и Google. Специализируюсь на контент-маркетинге, таргетированной рекламе и аналитике.',
    expertise: ['SEO', 'Контент-маркетинг', 'Яндекс.Директ', 'Google Ads', 'SMM', 'Аналитика'],
    experience_years: 4,
    experience_text: 'Head of Marketing в e-commerce стартапе. Увеличила органический трафик в 5 раз за год. Веду блог о digital-маркетинге, 15k подписчиков.',
    price_type: 'paid', price_amount: 1500,
    available_schedule: 'Пн, Ср, Пт 18:00–20:00, Сб — весь день',
    portfolio_links: ['https://t.me/lebedeva_marketing'],
    reviews: [
      { rating: 5, comment: 'Оля помогла разобраться в SEO за 2 месяца. Мой сайт поднялся с 50-й на 3-ю позицию в Яндексе. Очень практичные советы!', stars: 5 },
      { rating: 4, comment: 'Хорошо объясняет аналитику. Настроили вместе Яндекс.Метрику и научилась читать данные. Немного хотелось бы больше про рекламу.', stars: 4 },
    ],
    offers: [
      { title: 'SEO с нуля: продвижение сайта', description: 'Семантика, оптимизация страниц, работа со ссылками, технический аудит. Практика на вашем сайте.', category: 'Маркетинг', price_type: 'paid', price_amount: 1500 },
      { title: 'Таргетированная реклама ВКонтакте', description: 'Настройка аудиторий, создание креативов, A/B-тесты, оптимизация бюджета.', category: 'Маркетинг', price_type: 'paid', price_amount: 1800 },
    ],
  },
  {
    email: 'sokolov.ios@mentorconnect.ru',
    full_name: 'Павел Соколов',
    bio: 'iOS-разработчик с 6-летним опытом. Выпустил 8 приложений в App Store, несколько с аудиторией 100k+. Специализируюсь на Swift, SwiftUI и архитектурных паттернах.',
    expertise: ['iOS', 'Swift', 'SwiftUI', 'Xcode', 'UIKit', 'CoreData'],
    experience_years: 6,
    experience_text: 'Lead iOS Developer в fintech-компании. Мои приложения суммарно набрали 1M+ загрузок. Ментором работаю 1.5 года, выпустил 8 студентов.',
    price_type: 'paid', price_amount: 2200,
    available_schedule: 'Вт, Чт, Сб 19:00–21:00',
    portfolio_links: ['https://apps.apple.com/developer/pavel-sokolov'],
    reviews: [
      { rating: 5, comment: 'Павел — отличный ментор по iOS. Объяснил SwiftUI так, что теперь пишу интерфейсы быстро и с удовольствием. Первое приложение уже в App Store!', stars: 5 },
      { rating: 5, comment: 'Реально помог с архитектурой. Раньше пихал всё в ViewController, теперь знаю про MVVM и Coordinator. Код стал чище в разы.', stars: 5 },
      { rating: 4, comment: 'Хороший ментор, глубоко знает iOS. Иногда задания слишком сложные для моего уровня, но в этом и смысл роста.', stars: 4 },
    ],
    offers: [
      { title: 'iOS-разработка на Swift с нуля', description: 'Основы Swift, UIKit, AutoLayout, работа с API, CoreData. Финальный проект — приложение в App Store.', category: 'iOS', price_type: 'paid', price_amount: 2200 },
      { title: 'SwiftUI: современный iOS-интерфейс', description: 'Декларативный UI, State, Binding, NavigationStack, анимации. Переписываем UIKit-проект на SwiftUI.', category: 'iOS', price_type: 'paid', price_amount: 2500 },
    ],
  },
  {
    email: 'morozova.pm@mentorconnect.ru',
    full_name: 'Наталья Морозова',
    bio: 'Product Manager с 5-летним опытом в B2C и B2B продуктах. Работала с продуктами с DAU 500k+. Помогу разобраться в продуктовом мышлении, метриках и работе с командами.',
    expertise: ['Product Management', 'Agile', 'Scrum', 'Аналитика', 'Roadmap', 'A/B тесты'],
    experience_years: 5,
    experience_text: 'Senior PM в Ozon (2 года). Запустила 5 крупных фич, каждая из которых увеличивала GMV на 2-7%. Спикер на ProductSense 2022.',
    price_type: 'paid', price_amount: 1800,
    available_schedule: 'Пн–Пт 18:30–20:30',
    portfolio_links: [],
    reviews: [
      { rating: 5, comment: 'Наташа помогла мне перейти из разработки в продакт-менеджмент. Отличное понимание что важно для PM-собеседований и как готовиться к ним.', stars: 5 },
      { rating: 4, comment: 'Очень полезные занятия по метрикам и аналитике. Научилась строить воронки и находить точки роста в продукте.', stars: 4 },
    ],
    offers: [
      { title: 'Старт в Product Management', description: 'Продуктовое мышление, метрики, работа с командой, приоритизация задач. Практика на реальных кейсах.', category: 'Product Management', price_type: 'paid', price_amount: 1800 },
      { title: 'Подготовка к PM-собеседованию', description: 'Разбираем типичные вопросы, кейсы и задачи на метрики. Mock-интервью с обратной связью.', category: 'Product Management', price_type: 'paid', price_amount: 2000 },
    ],
  },
  {
    email: 'popov.security@mentorconnect.ru',
    full_name: 'Виктор Попов',
    bio: 'Специалист по кибербезопасности с 9-летним опытом. Провёл сотни пентестов и аудитов безопасности. Сертификаты OSCP, CEH, CISSP. Помогу войти в мир ИБ или подготовиться к сертификации.',
    expertise: ['Кибербезопасность', 'Penetration Testing', 'Linux', 'Сети', 'CTF', 'Python'],
    experience_years: 9,
    experience_text: 'Руководитель отдела ИБ в крупном банке. Провёл 300+ пентестов. Преподаю на курсах Positive Technologies. Участник и организатор CTF-соревнований.',
    price_type: 'paid', price_amount: 3500,
    available_schedule: 'Сб–Вс 12:00–18:00, будни — по договорённости',
    portfolio_links: [],
    reviews: [
      { rating: 5, comment: 'Виктор — настоящий профессионал в ИБ. Прошли от основ сетей до реального пентеста. Сдал OSCP с первого раза!', stars: 5 },
      { rating: 5, comment: 'Отличный ментор для тех, кто хочет в кибербезопасность. Практика на настоящих уязвимостях, задачи из реальных CTF. Очень ценно!', stars: 5 },
      { rating: 4, comment: 'Глубокие знания, но материала очень много. Нужно быть готовым много учиться самостоятельно. Виктор всегда помогает разобраться.', stars: 4 },
    ],
    offers: [
      { title: 'Введение в кибербезопасность', description: 'Основы сетей, Linux, OWASP Top 10, первые шаги в пентестинге. Практика на Hack The Box.', category: 'Кибербезопасность', price_type: 'paid', price_amount: 3500 },
      { title: 'Подготовка к OSCP', description: 'Методология пентеста, эксплуатация уязвимостей, написание отчётов. Практика на реальных машинах.', category: 'Кибербезопасность', price_type: 'paid', price_amount: 4000 },
    ],
  },
  {
    email: 'zakharova.java@mentorconnect.ru',
    full_name: 'Юлия Захарова',
    bio: 'Java-разработчик с 7-летним опытом. Специализируюсь на Spring Boot, микросервисной архитектуре и высоконагруженных системах. Работала в банковском и enterprise-секторе.',
    expertise: ['Java', 'Spring Boot', 'Microservices', 'Kafka', 'PostgreSQL', 'Docker'],
    experience_years: 7,
    experience_text: 'Senior Java Developer в Тинькофф (4 года). Разрабатываю микросервисы для процессинга платежей. Ментором работаю 1.5 года.',
    price_type: 'paid', price_amount: 2600,
    available_schedule: 'Пн, Ср, Пт 19:30–21:30, Сб — гибко',
    portfolio_links: ['https://github.com/zakharova-java'],
    reviews: [
      { rating: 5, comment: 'Юля — прекрасный ментор! Разобрались со Spring Boot буквально за месяц. Теперь понимаю архитектуру и могу сама разобраться с документацией.', stars: 5 },
      { rating: 5, comment: 'Очень структурированный подход. Сначала теория, потом практика, потом код-ревью. За 4 месяца вырос до мидла.', stars: 5 },
      { rating: 4, comment: 'Хороший ментор по Java enterprise-стеку. Материал сложный, но Юля всегда поможет разобраться. Рекомендую тем, кто готов работать.', stars: 4 },
    ],
    offers: [
      { title: 'Java для начинающих', description: 'ООП, коллекции, многопоточность, работа с БД. Практика на реальных задачах.', category: 'Java', price_type: 'paid', price_amount: 2600 },
      { title: 'Spring Boot: REST API за 2 месяца', description: 'Spring MVC, JPA, Security, тесты. Финальный проект — микросервис с авторизацией.', category: 'Java', price_type: 'paid', price_amount: 3000 },
    ],
  },
];

const STUDENTS = [
  {
    email: 'kuznetsov@student.ru',
    full_name: 'Артём Кузнецов',
    phone: '+7 (916) 234-56-78',
    interests: 'Backend-разработка, Python, базы данных, архитектура ПО',
    bio: 'Изучаю программирование полгода. Хочу стать backend-разработчиком. Прошёл базовые курсы по Python, сейчас ищу ментора для систематизации знаний.',
  },
  {
    email: 'fedorova@student.ru',
    full_name: 'Мария Фёдорова',
    phone: '+7 (903) 456-78-90',
    interests: 'UX/UI дизайн, Figma, пользовательские исследования, прототипирование',
    bio: 'Графический дизайнер с 2-летним опытом, хочу перейти в digital-продукты. Уже умею работать в Figma, хочу углубиться в UX-исследования.',
  },
  {
    email: 'orlov@student.ru',
    full_name: 'Иван Орлов',
    phone: '+7 (921) 567-89-01',
    interests: 'Data Science, машинное обучение, Python, аналитика данных',
    bio: 'Студент-математик 4-го курса. Хочу применить знания математики в ML. Уже знаю Python на базовом уровне, читал документацию sklearn.',
  },
  {
    email: 'gromova@student.ru',
    full_name: 'Светлана Громова',
    phone: '+7 (985) 678-90-12',
    interests: 'Интернет-маркетинг, SEO, таргетированная реклама, SMM',
    bio: 'Менеджер по продажам, хочу перейти в digital-маркетинг. Есть базовое понимание контекстной рекламы, ищу ментора для структурирования знаний.',
  },
  {
    email: 'zaitsev@student.ru',
    full_name: 'Андрей Зайцев',
    phone: '+7 (926) 789-01-23',
    interests: 'iOS разработка, Swift, мобильные приложения, SwiftUI',
    bio: 'Разработчик на JavaScript с 1-летним опытом. Хочу попробовать мобильную разработку. Купил MacBook, начал изучать Swift — ищу опытного ментора.',
  },
];

async function run() {
  const hash = await bcrypt.hash(PASS, 10);
  console.log('Пароль захеширован. Начинаю вставку данных...\n');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Вставляем менторов
    const mentorIds = [];
    for (const m of MENTORS) {
      // users
      const uRes = await client.query(
        `INSERT INTO users (email, password_hash, role)
         VALUES ($1, $2, 'mentor')
         ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
         RETURNING id`,
        [m.email, hash]
      );
      const uid = uRes.rows[0].id;
      mentorIds.push(uid);

      // mentor_profiles
      await client.query(
        `INSERT INTO mentor_profiles
           (user_id, full_name, bio, expertise, experience_years, experience_text,
            portfolio_links, price_type, price_amount, available_schedule)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (user_id) DO UPDATE SET
           full_name=EXCLUDED.full_name, bio=EXCLUDED.bio`,
        [
          uid, m.full_name, m.bio, m.expertise, m.experience_years,
          m.experience_text, m.portfolio_links, m.price_type,
          m.price_amount, m.available_schedule,
        ]
      );

      // offers
      for (const o of m.offers) {
        await client.query(
          `INSERT INTO offers (mentor_id, title, description, category, price_type, price_amount)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [uid, o.title, o.description, o.category, o.price_type, o.price_amount]
        );
      }

      console.log(`✅ Ментор: ${m.full_name} (id=${uid})`);
    }

    // Вставляем студентов
    const studentIds = [];
    for (const s of STUDENTS) {
      const uRes = await client.query(
        `INSERT INTO users (email, password_hash, role)
         VALUES ($1, $2, 'student')
         ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
         RETURNING id`,
        [s.email, hash]
      );
      const uid = uRes.rows[0].id;
      studentIds.push(uid);

      await client.query(
        `INSERT INTO student_profiles (user_id, full_name, phone, interests, bio)
         VALUES ($1,$2,$3,$4,$5)
         ON CONFLICT (user_id) DO UPDATE SET full_name=EXCLUDED.full_name`,
        [uid, s.full_name, s.phone, s.interests, s.bio]
      );

      console.log(`✅ Студент: ${s.full_name} (id=${uid})`);
    }

    // Вставляем отзывы
    // Каждый ментор получает отзывы от разных студентов
    // Используем student_ids из STUDENTS плюс существующих (id 9, 10)
    const allStudentIds = [9, 10, ...studentIds];

    for (let mi = 0; mi < MENTORS.length; mi++) {
      const mentorId = mentorIds[mi];
      const mentorReviews = MENTORS[mi].reviews;

      for (let ri = 0; ri < mentorReviews.length; ri++) {
        const studentId = allStudentIds[ri % allStudentIds.length];
        const rev = mentorReviews[ri];

        // Пропускаем если такой отзыв уже существует (UNIQUE student_id + mentor_id)
        await client.query(
          `INSERT INTO reviews (student_id, mentor_id, rating, comment)
           VALUES ($1,$2,$3,$4)
           ON CONFLICT (student_id, mentor_id) DO NOTHING`,
          [studentId, mentorId, rev.rating, rev.comment]
        );
      }
    }

    console.log('\n✅ Отзывы добавлены');

    await client.query('COMMIT');
    console.log('\n✅ Транзакция завершена успешно');

    // Пересчитываем рейтинги для всех новых менторов
    console.log('\nПересчитываю рейтинги...');
    for (const mid of mentorIds) {
      await pool.query('SELECT recalculate_mentor_rating($1)', [mid]);
    }
    // и старый ментор тоже
    await pool.query('SELECT recalculate_mentor_rating(11)');
    console.log('✅ Рейтинги пересчитаны');

    // Итоговая статистика
    const stats = await pool.query(`
      SELECT mp.full_name, mp.rating_score, mp.rating_reviews,
             mp.price_type, mp.price_amount, mp.total_reviews
      FROM mentor_profiles mp
      ORDER BY mp.rating_score DESC
    `);
    console.log('\n📊 Менторы по рейтингу:');
    stats.rows.forEach((r, i) => {
      const price = r.price_type === 'free' ? 'бесплатно' : `${r.price_amount} ₽`;
      console.log(`  ${i+1}. ${r.full_name.padEnd(25)} score=${r.rating_score}  reviews=${r.total_reviews}  ${price}`);
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Ошибка:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(e => { console.error(e); process.exit(1); });
