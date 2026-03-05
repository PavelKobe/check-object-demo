# 🛡️ Security Check Demo — Чек-лист безопасности универмага

Демо-приложение для оценки работы службы безопасности универмагов.

**Стек:** React + Vite (JS) · FastAPI (Python 3.10+) · SQLite3 · HTTP Basic Auth

---

## 🚀 Быстрый запуск (локально)

### 1. Backend

```powershell
cd security-demo/backend

# Установить зависимости
pip install -r requirements.txt

# Создать .env из шаблона
copy .env.example .env

# Запустить сервер
uvicorn main:app --reload --port 8000
```

Swagger UI доступен по адресу: **http://localhost:8000/docs**

> `checks.db` создаётся автоматически при первом запуске.

### 2. Frontend

```powershell
cd security-demo/frontend

# Установить зависимости
npm install

# Запустить dev-сервер
npm run dev
```

Приложение доступно по адресу: **http://localhost:5173**

#### Учётные данные по умолчанию
| Поле    | Значение        |
|---------|-----------------|
| Логин   | `admin`         |
| Пароль  | `securepass123` |

---

## ☁️ Деплой

### Backend → Render.com

1. Зарегистрируйтесь на [render.com](https://render.com)
2. Создайте **New Web Service** → укажите папку `backend/`
3. Настройки:
   - **Runtime:** Python 3
   - **Build command:** `pip install -r requirements.txt`
   - **Start command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Добавьте переменные окружения в раздел **Environment**:
   ```
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=ваш_надёжный_пароль
   FRONTEND_URL=https://ваш-проект.vercel.app
   ```
5. Дождитесь деплоя — скопируйте URL вида `https://имя.onrender.com`

> ⚠️ На бесплатном тарифе Render засыпает после 15 мин неактивности — первый запрос может занять ~30 сек.

---

### Frontend → Vercel

1. Зарегистрируйтесь на [vercel.com](https://vercel.com)
2. **New Project** → импортируйте репозиторий (или загрузите папку `frontend/`)
3. Укажите **Root Directory:** `frontend`
4. Добавьте переменную окружения:
   ```
   VITE_API_URL=https://ваше-приложение.onrender.com
   ```
5. Нажмите **Deploy** — Vercel автоматически запустит `npm run build`

---

## 🔧 Настройка CORS

В `backend/.env` укажите адрес вашего фронтенда:

```env
FRONTEND_URL=https://ваш-проект.vercel.app
```

Backend автоматически читает это значение и добавляет в список разрешённых origins.

---

## 📊 Логика расчёта

| Блок | Название | Вес |
|------|----------|-----|
| 1 | Общие критерии безопасности | 15% |
| 2 | % присутствия сотрудников ЧОП | 15% |
| 3 | КПП (входные группы) | 15% |
| 4 | Кассы | 10% |
| 5 | Инкасса | 10% |
| 6 | Двери (СКУД) | 5% |
| 7 | ЧОП — внешний вид | 15% |
| 8 | Мониторка | 15% |

**Итоговая категория:**
| Балл | Категория |
|------|-----------|
| 90–100% | ✅ Отлично |
| 76–89% | 🟦 Хорошо |
| 50–75% | 🟡 Удовлетворительно |
| 0–49% | 🔴 Неудовлетворительно |

---

## 📡 API Эндпоинты

| Метод | URL | Описание |
|-------|-----|----------|
| `POST` | `/api/checks` | Отправить результат проверки |
| `GET` | `/api/checks` | Получить последние 50 проверок |
| `GET` | `/health` | Проверка работоспособности |

Все эндпоинты защищены **HTTP Basic Auth**.

---

## 📁 Структура проекта

```
security-demo/
├── roadmap.md
├── README.md
├── backend/
│   ├── main.py          ← FastAPI + расчёт
│   ├── auth.py          ← Basic Auth
│   ├── database.py      ← SQLite (checks.db)
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── index.html
    ├── .env             ← VITE_API_URL (локально)
    ├── .env.example
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
