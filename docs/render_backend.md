# 🚀 Деплой бэкенда на Render.com

## Шаг 1: Подготовьте репозиторий на GitHub

Render разворачивает код из GitHub. Если репозитория ещё нет:

```bash
# В папке check-video выполните:
git init
git add .
git commit -m "initial commit"
```

Создайте репозиторий на [github.com](https://github.com), затем:

```bash
git remote add origin https://github.com/ВАШ_ЛОГИН/ВАШ_РЕПО.git
git push -u origin main
```

> **Важно:** файл `backend/.gitignore` уже исключает `.env` и `checks.db` — они не попадут в репозиторий ✅

---

## Шаг 2: Создайте Web Service на Render.com

1. Войдите в [dashboard.render.com](https://dashboard.render.com)
2. Нажмите **New +** → **Web Service**
3. Подключите GitHub и выберите репозиторий
4. Заполните настройки:

| Поле | Значение |
|---|---|
| **Name** | `security-check-api` |
| **Region** | Frankfurt (EU Central) |
| **Branch** | `main` |
| **Root Directory** | `backend` ← относительный путь от корня репо, НЕ абсолютный |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Plan** | `Free` |

---

## Шаг 3: Добавьте переменные окружения

В разделе **Environment Variables** добавьте:

| Key | Value |
|---|---|
| `ADMIN_USERNAME` | ваш логин |
| `ADMIN_PASSWORD` | надёжный пароль |
| `FRONTEND_URL` | `*` (потом заменить URL Vercel) |

---

## Шаг 4: Задеплойте

Нажмите **Create Web Service**. Через 2–3 минуты API будет доступен:

```
https://security-check-api.onrender.com
```

---

## Шаг 5: Проверьте работу

```
# Health check
https://security-check-api.onrender.com/health
# → {"status": "ok"}

# Swagger документация
https://security-check-api.onrender.com/docs
```

---

## Шаг 6: Обновите FRONTEND_URL

После деплоя фронтенда на Vercel вернитесь в Render:
- **Environment** → измените `FRONTEND_URL` на реальный URL Vercel  
  (например: `https://security-check.vercel.app`)
- Render автоматически перезапустит сервис

---

## ⚠️ Важные замечания

- **Free план** «засыпает» после 15 мин неактивности — первый запрос займёт ~30 сек
- При каждом `git push` в `main` Render автоматически пересобирает сервис (CI/CD из коробки)

---

## 🔧 Частые ошибки при деплое

### ❌ "No such file or directory" / "Module not found"
**Причина:** Render не нашёл `main.py` — значит Root Directory указан неверно.  
**Решение:** Поле **Root Directory** = `backend` (без слешей, без абсолютного пути).  
Render сам подставляет этот путь относительно корня репозитория.  
Структура репо:
```
/ (корень репо)
├── backend/       ← Root Directory = "backend"
│   ├── main.py
│   └── requirements.txt
└── frontend/
```

### ❌ "uvicorn: command not found"
**Причина:** `requirements.txt` не установился.  
**Решение:** Проверьте, что Build Command = `pip install -r requirements.txt` и файл находится в папке `backend/`.

### ❌ "Address already in use" / порт не слушается
**Причина:** Start Command запускает uvicorn на фиксированном порту.  
**Решение:** Обязательно используйте `$PORT` в команде:
```
uvicorn main:app --host 0.0.0.0 --port $PORT
```

### ❌ Ошибка CORS на фронтенде
**Причина:** `FRONTEND_URL` не совпадает с реальным URL Vercel.  
**Решение:** В Render → Environment → установите корректный `FRONTEND_URL`, например:
```
https://my-app.vercel.app
```

### ✅ Как смотреть логи при ошибке
В Render Dashboard → ваш сервис → вкладка **Logs** — там полный вывод build и runtime.

