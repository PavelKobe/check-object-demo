# 🗺 Roadmap — Security Check Demo

## Статус: ✅ MVP реализован

---

## ✅ Шаг 1: Анализ и планирование
- [x] Прочитаны бизнес-требования (`docs/business requirements.md`)
- [x] Определён технический стек: FastAPI + React + Vite + SQLite
- [x] Составлен `implementation_plan.md`
- [x] Спроектирована логика расчёта по 8 блокам

---

## ✅ Шаг 2: Backend (FastAPI)
- [x] `database.py` — инициализация SQLite, CRUD
- [x] `auth.py` — HTTP Basic Auth из `.env`
- [x] `main.py` — FastAPI app, CORS, эндпоинты, логика расчёта
- [x] `requirements.txt`
- [x] `.env.example`

---

## ✅ Шаг 3: Frontend (React + Vite)
- [x] Инициализация Vite проекта
- [x] `src/api.js` — fetch-хелперы с Basic Auth
- [x] `src/App.jsx` — экран логина + основная страница
- [x] `src/components/CheckForm.jsx` — форма чек-листа (все 8 блоков)
- [x] `src/components/ScoreResult.jsx` — отображение результата
- [x] `src/components/CheckHistory.jsx` — история проверок
- [x] `src/index.css` — современный дизайн (dark mode)

---

## ✅ Шаг 4: Документация
- [x] `README.md` — запуск локально, деплой Vercel + Render

---

## 🔜 Шаг 5: Деплой (выполняется заказчиком)
- [ ] Backend → Render.com (free tier)
- [ ] Frontend → Vercel (бесплатно)
- [ ] Настройка `VITE_API_URL` в Vercel → URL из Render
- [ ] Настройка env vars на Render: `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `FRONTEND_URL`

---

## Файловая архитектура

```
security-demo/
├── roadmap.md                   ← этот файл
├── README.md                    ← инструкции
├── backend/
│   ├── main.py                  ← FastAPI app + расчёт
│   ├── auth.py                  ← Basic Auth
│   ├── database.py              ← SQLite (checks.db)
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── api.js
        └── components/
            ├── CheckForm.jsx
            ├── ScoreResult.jsx
            └── CheckHistory.jsx
```
