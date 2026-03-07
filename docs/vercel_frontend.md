# 🚀 Деплой фронтенда на Vercel

## Предварительные требования

- Бэкенд уже задеплоен на Render: `https://security-check-api.onrender.com`
- Код фронтенда находится в папке `frontend/` и закоммичен в GitHub

---

## Шаг 1: Зарегистрируйтесь/войдите на Vercel

Перейдите на [vercel.com](https://vercel.com) → **Sign up with GitHub**

---

## Шаг 2: Создайте новый проект

1. Dashboard → **Add New...** → **Project**
2. Выберите ваш репозиторий из списка
3. Нажмите **Import**

---

## Шаг 3: Настройте проект

В разделе **Configure Project** заполните:

| Поле | Значение |
|---|---|
| **Framework Preset** | `Vite` (определится автоматически) |
| **Root Directory** | `frontend` ← нажмите Edit и укажите |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

> **Важно:** обязательно укажите Root Directory = `frontend`, иначе Vercel будет искать `package.json` в корне репо.

---

## Шаг 4: Добавьте переменную окружения

В разделе **Environment Variables** добавьте:

| Name | Value |
|---|---|
| `VITE_API_URL` | `https://security-check-api.onrender.com` |

> Без этой переменной фронтенд не будет знать адрес бэкенда.

---

## Шаг 5: Задеплойте

Нажмите **Deploy**. Vercel:
1. Установит зависимости: `npm install`
2. Соберёт проект: `npm run build`
3. Опубликует папку `dist/`

Через ~1 минуту фронтенд будет доступен по адресу вида:
```
https://check-object-demo.vercel.app
```

---

## Шаг 6: Обновите FRONTEND_URL на Render

После деплоя скопируйте URL Vercel и обновите бэкенд:

1. [dashboard.render.com](https://dashboard.render.com) → ваш сервис
2. **Environment** → найдите `FRONTEND_URL`
3. Замените значение на ваш URL Vercel, например:
   ```
   https://check-object-demo.vercel.app
   ```
4. Нажмите **Save** — Render автоматически перезапустит сервис

---

## Шаг 7: Проверьте работу

Откройте ваш Vercel URL в браузере:
- Должна отобразиться страница входа
- Введите `ADMIN_USERNAME` / `ADMIN_PASSWORD` из настроек Render
- Должна открыться форма чек-листа

---

## ⚠️ Важные замечания

- При каждом `git push` в `main` Vercel автоматически пересобирает фронтенд
- Если фронтенд не достучится до бэкенда — проверьте `VITE_API_URL` и `FRONTEND_URL` на Render
- Переменные `VITE_*` встраиваются в сборку на этапе build, а не в runtime

---

## 🔧 Частые ошибки

### ❌ Белый экран / пустая страница
**Причина:** Vercel собирает из корня репо, не из `frontend/`  
**Решение:** Settings → General → Root Directory = `frontend`

### ❌ "Failed to fetch" / CORS ошибка
**Причина:** `VITE_API_URL` не задан или `FRONTEND_URL` на Render не совпадает с URL Vercel  
**Решение:** Проверьте обе переменные

### ❌ "401 Unauthorized"
**Причина:** Неверный логин/пароль — они берутся из `ADMIN_USERNAME`/`ADMIN_PASSWORD` на Render  
**Решение:** Проверьте переменные в Render → Environment
