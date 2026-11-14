# Mobile API v1 (ученик / iOS)

Базовый URL: `https://giacomoschiavon.ru/api/mobile/v1`

Авторизация ученика тем же способом, что и веб-кабинет `/aula`: email + пароль после приглашения и подтверждения почты. Ответы и тела — JSON (`Content-Type: application/json`).

## Статус эндпоинтов

| Метод | Путь | Статус | Примечание |
|-------|------|--------|------------|
| POST | `/auth/login` | ✅ | rate limit IP+email |
| POST | `/auth/refresh` | ✅ | rotation refresh |
| POST | `/auth/logout` | ✅ | revoke refresh |
| POST | `/auth/register` | ✅ | инвайт + **consent** + confirm email |
| GET | `/me` | ✅ | |
| GET | `/lessons` | ✅ | + `meetUrl` |
| GET | `/homework` | ✅ | `lessonId` / `scope=all` |
| PUT | `/homework/{assignmentId}` | ✅ | прогресс / проверка |
| GET | `/live` | ✅ | |
| PATCH | `/live` | ✅ | только picks/selected/checked (+rev) |
| POST | `/live/next` | ✅ | «Далее» как на вебе |
| GET | `/gloss` | ✅ | `?q=` как `/aula/api/gloss` |
| POST | `/devices` | ✅ | APNs upsert |
| DELETE | `/devices` | ✅ | снять регистрацию |
| GET | `/health` | ✅ | liveness v1 |
| — | Push send (APNs) | ❌ | нет ключей на сервере |

Служебный health приложения (флаги конфига без значений секретов): `GET /api/health`.

## Аутентификация

| Заголовок | Значение |
|-----------|----------|
| `Authorization` | `Bearer <accessToken>` |

- **Access token** — короткоживущий (15 мин), HMAC-подпись `SESSION_SECRET`.
- **Refresh token** — непрозрачный, хранится на сервере в виде хэша, можно отозвать (`logout`). Срок 30 дней; при `refresh` — rotation.
- После `logout` refresh недействителен; access истекает сам.

Публичные эндпоинты (без Bearer): `POST /auth/login`, `POST /auth/refresh`, `POST /auth/register`, `GET /health`.

## Формат ошибок

```json
{
  "error": {
    "code": "unauthorized",
    "message": "Нужен вход."
  }
}
```

| HTTP | `code` | Когда |
|------|--------|--------|
| 400 | `validation_error` | Невалидное тело / параметры |
| 401 | `unauthorized` | Нет/просрочен access |
| 401 | `invalid_credentials` | Неверный email/пароль |
| 401 | `email_unverified` | Почта не подтверждена |
| 403 | `forbidden` | Чужие данные |
| 404 | `not_found` | Ресурс не найден |
| 409 | `conflict` | Конфликт (live rev устарел, email занят) |
| 429 | `rate_limited` | Слишком много попыток |
| 500 | `server_error` | Внутренняя ошибка |

Поле `message` — человекочитаемый текст (RU), пригодный для UI.

На `409` для live тело дополнительно содержит актуальный `LiveState` (поля рядом с `error`).

## Модели

### StudentProfile

```json
{
  "id": "st-…",
  "name": "Anna",
  "email": "anna@example.com",
  "emailVerifiedAt": "2026-11-14T12:00:00.000Z"
}
```

### AuthTokens

```json
{
  "accessToken": "…",
  "refreshToken": "…",
  "expiresIn": 900,
  "tokenType": "Bearer",
  "student": { "id": "st-…", "name": "Anna", "email": "anna@example.com", "emailVerifiedAt": "…" }
}
```

`expiresIn` — секунды жизни access token.

### Lesson

```json
{
  "id": "l-…",
  "title": "Lezione",
  "startsAt": "2026-11-20T13:00:00.000Z",
  "endsAt": "2026-11-20T14:00:00.000Z"
}
```

### PublicActivity

Ответы (ключи) **не** отдаются ученику. Поле `image` — **абсолютный URL** (через `APP_URL`), либо `null`.

Quiz:

```json
{
  "id": "quiz-ciao",
  "type": "quiz",
  "title": "Saluti",
  "topic": "Saluti",
  "prompt": "Come saluti…?",
  "options": ["Ciao!", "…"],
  "image": "https://giacomoschiavon.ru/sketch/aula-quaderno.jpg"
}
```

Cloze:

```json
{
  "id": "cloze-mattina",
  "type": "cloze",
  "title": "La routine",
  "topic": "Routine",
  "prompt": "Completa…",
  "text": "Ogni mattina ____ sveglio…",
  "bank": ["mi", "faccio", "…"],
  "image": null
}
```

### HomeworkItem

```json
{
  "id": "as-…",
  "lessonId": "l-…",
  "kind": "homework",
  "activity": { "…PublicActivity…" },
  "progress": {
    "picks": { "0": "mi" },
    "checked": true,
    "correct": false,
    "updatedAt": "2026-11-14T15:00:00.000Z"
  }
}
```

`progress` может быть `null`.

### LiveState

```json
{
  "studentId": "st-…",
  "activityId": "quiz-ciao",
  "queue": [{ "id": "quiz-ciao", "title": "Saluti" }],
  "index": 0,
  "picks": {},
  "selected": null,
  "checked": false,
  "rev": 3,
  "activity": { "…PublicActivity или null…" },
  "meetUrl": "https://meet.google.com/…",
  "done": false,
  "hasNext": true,
  "atEnd": false
}
```

### Device

```json
{
  "id": "dev-…",
  "platform": "ios",
  "apnsToken": "abcdef…",
  "updatedAt": "2026-11-14T16:00:00.000Z"
}
```

Отправка push **не** реализована, пока нет APNs-ключей. Регистрация токена только сохраняется.

### Gloss

```json
{ "text": "друг" }
```

---

## Эндпоинты

### `POST /auth/login` ✅

Вход ученика (как `/aula/login`).

**Rate limit:** 20 / мин на IP (+ ключ по email).

Request:

```json
{ "email": "anna@example.com", "password": "secret123" }
```

Response `200`: `AuthTokens`

Ошибки: `validation_error`, `invalid_credentials`, `email_unverified`, `rate_limited`.

### `POST /auth/refresh` ✅

Обмен refresh → новая пара токенов (старый refresh отзывается, rotation).

Request:

```json
{ "refreshToken": "…" }
```

Response `200`: `AuthTokens`

Ошибки: `unauthorized`, `validation_error`.

### `POST /auth/logout` ✅

Отзыв текущей сессии (refresh). Принимает Bearer **и/или** тело с `refreshToken`.

Request (опционально):

```json
{ "refreshToken": "…" }
```

Response `200`:

```json
{ "ok": true }
```

### `POST /auth/register` ✅

Регистрация по инвайту (как `/aula/invite/[token]`). После успеха нужно подтвердить email по ссылке из письма (веб). Мобильный логин до подтверждения вернёт `email_unverified`.

**Rate limit:** 10 / мин на IP.

Request:

```json
{
  "inviteToken": "…",
  "name": "Anna",
  "email": "anna@example.com",
  "password": "secret123",
  "consent": true
}
```

- Пароль ≥ 8 символов.
- `consent` обязателен (`true` / `"yes"` / `"true"`). Без согласия — `validation_error` (то же правило, что веб-форма).

Response `201`:

```json
{
  "ok": true,
  "message": "Проверьте почту — пришло письмо со ссылкой подтверждения.",
  "email": "anna@example.com"
}
```

Ошибки: `validation_error`, `conflict` (email занят / инвайт использован / истёк), `not_found` (инвайт), `rate_limited`.

### `GET /me` ✅

Профиль текущего ученика.

Response `200`: `StudentProfile`

### `GET /lessons` ✅

Расписание ученика (свои уроки), сортировка по `startsAt`.

Response `200`:

```json
{ "lessons": [ { "…Lesson…" } ], "meetUrl": "https://…" }
```

### `GET /homework` ✅

Домашние задания. Query:

| Параметр | Описание |
|----------|----------|
| `lessonId` | Опционально. Без него — урок по эвристике веба |
| `scope` | `all` — все homework ученика |

Без `lessonId` и без `scope=all`: выбирается урок по той же эвристике, что веб `/aula/me/compiti` (ближайший с ДЗ / ближайший / последний).

Response `200`:

```json
{
  "lessonId": "l-…",
  "lessons": [ { "…Lesson…" } ],
  "items": [ { "…HomeworkItem…" } ]
}
```

### `PUT /homework/{assignmentId}` ✅

Сохранить прогресс (как server action на вебе). Только свои assignment.

Request:

```json
{
  "picks": { "quiz-ciao": "0" },
  "checked": true
}
```

Для quiz ключ в `picks` — `activityId`, значение — индекс варианта строкой. Для cloze ключи `"0"`, `"1"`, … — слова из bank.

Response `200`:

```json
{
  "ok": true,
  "correct": true,
  "progress": { "picks": {}, "checked": true, "correct": true, "updatedAt": "…" }
}
```

Если `checked: false`, поле `correct` в progress — `false` (черновик).

### `GET /live` ✅

Текущая live-сессия ученика + `meetUrl`.

Response `200`: `LiveState`

### `PATCH /live` ✅

Обновить ответы ученика в live. Только поля: `picks`, `selected`, `checked`, опционально `rev` (optimistic concurrency).

Request:

```json
{
  "picks": { "quiz-ciao": "0" },
  "selected": null,
  "checked": false,
  "rev": 3
}
```

Если передан `rev` и он меньше серверного — `409 conflict`, в теле актуальный `LiveState` (+ `error`).

Response `200`: `LiveState`

Ученик **не** может менять очередь / `activityId` / `index` через PATCH. Для «Далее» — `POST /live/next`.

### `POST /live/next` ✅

Сдвинуть очередь на следующий элемент (паритет с кнопкой «Далее» на вебе).

Request (опционально):

```json
{ "rev": 3 }
```

- Если есть следующий элемент — `index + 1`, сброс picks/selected/checked, `rev++`.
- Если очередь на конце — без мутации, `done: true`.

Response `200`: `LiveState`  
Ошибки: `unauthorized`, `conflict` (устаревший `rev`).

### `GET /gloss` ✅

Словарь / перевод (как `/aula/api/gloss`). Требует Bearer.

Query: `q` — слово.

Response `200`: `{ "text": "…" }`  
Пустой `q` → `{ "text": "" }`.  
**Rate limit:** 60 / мин на IP.

### `POST /devices` ✅

Зарегистрировать APNs device token (upsert по токену).

Request:

```json
{
  "platform": "ios",
  "apnsToken": "hex-or-base64-token",
  "appVersion": "1.0.0"
}
```

Response `200`:

```json
{ "device": { "…Device…" } }
```

Пуши не отправляются без ключей APNs на сервере.

### `DELETE /devices` ✅

Снять регистрацию.

Request:

```json
{ "apnsToken": "…" }
```

или

```json
{ "deviceId": "dev-…" }
```

Response `200`: `{ "ok": true }`

### `GET /health` ✅

Проверка живости mobile API (без auth).

Response `200`: `{ "ok": true, "version": "v1" }`

---

## Примеры curl

```bash
# login
curl -sS -X POST https://giacomoschiavon.ru/api/mobile/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"anna@example.com","password":"secret123"}'

# profile
curl -sS https://giacomoschiavon.ru/api/mobile/v1/me \
  -H "authorization: Bearer $ACCESS"

# homework
curl -sS 'https://giacomoschiavon.ru/api/mobile/v1/homework?scope=all' \
  -H "authorization: Bearer $ACCESS"

# live next
curl -sS -X POST https://giacomoschiavon.ru/api/mobile/v1/live/next \
  -H "authorization: Bearer $ACCESS" \
  -H 'content-type: application/json' \
  -d '{"rev":3}'

# gloss
curl -sS 'https://giacomoschiavon.ru/api/mobile/v1/gloss?q=amico' \
  -H "authorization: Bearer $ACCESS"

# refresh
curl -sS -X POST https://giacomoschiavon.ru/api/mobile/v1/auth/refresh \
  -H 'content-type: application/json' \
  -d "{\"refreshToken\":\"$REFRESH\"}"
```

## Безопасность (контракт)

- Доступ только к данным `studentId` из access token (IDOR запрещён).
- Rate limit на login/register/gloss.
- Пароли и refresh хранятся только как хэши.
- Ответы заданий (answer keys) не отдаются в PublicActivity.
- Картинки заданий — абсолютные URL на тот же origin (`APP_URL`).
- CORS для native app не требуется (не браузер); при необходимости webview — отдельно.

## Env для владельца

См. `docs/aula-ops.md` и `.env.example`:

- `SESSION_SECRET` — длинная случайная строка (подписи cookie + mobile tokens)
- `APP_URL=https://giacomoschiavon.ru`
- `SMTP_*` — иначе письма подтверждения не уходят
- APNs (позже): ключ/team/bundle — для отправки push, не для регистрации токена
