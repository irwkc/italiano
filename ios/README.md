# Aula — кабинет ученика (iOS)

Нативное SwiftUI-приложение для учеников Джакомо Скьявона. Преподавательских функций нет.

Bundle ID: `ru.giacomoschiavon.aula`  
Категория: Education  
Минимум: iOS 17, только iPhone.

## Сборка

Нужны Xcode 16+ и [XcodeGen](https://github.com/yonaskolb/XcodeGen).

```bash
cd ios
brew install xcodegen
xcodegen generate
open Aula.xcodeproj
```

Проект `.xcodeproj` в git не хранится — его генерирует `project.yml`.

Контракт: `docs/mobile-api.md` в `main` (`/api/mobile/v1`, Bearer access + refresh). HTTP-клиент уже размечен под него (`Aula/API/HTTPAulaClient.swift`).

Серверные эндпоинты в контракте ещё помечены ⏳, поэтому по умолчанию `AULA_USE_MOCK=YES`. Когда бэкенд включит API — `AULA_USE_MOCK: NO` в `project.yml`. Демо-вход макета:

- `anna@aula.test` / `aula-demo-8` — живой Live и домашние
- `pavel@aula.test` / `aula-demo-8` — пустая Live-очередь

База: `AULA_API_BASE_URL` = `https://giacomoschiavon.ru/api/mobile/v1`.

Регистрация: экран «Регистрация по приглашению» (`POST /auth/register`) + подтверждение почты в письме (веб), затем вход.

## TestFlight — что нужно от владельца

Секреты и сертификаты в репозиторий не кладём.

1. **Apple Developer Team ID** — вписать в `ios/project.yml` → `DEVELOPMENT_TEAM` (или в Xcode Signing).
2. Зарегистрировать App ID `ru.giacomoschiavon.aula` (Keychain Sharing можно включить).
3. Создать приложение в App Store Connect (имя вроде **Aula Giacomo**, категория Education).
4. На Mac: войти в аккаунт Apple Developer в Xcode, выбрать Team, Archive → Distribute → App Store Connect → Upload.
5. В App Store Connect → TestFlight добавить тестировщиков (email учеников). Сборка появится после обработки (~10 минут).
6. Шифрование: в Info.plist стоит `ITSAppUsesNonExemptEncryption = false` (HTTPS). Если появится своё шифрование — обновить форму.
7. Privacy Nutrition Labels: email только для входа, без трекинга. Манифест: `Aula/PrivacyInfo.xcprivacy`.
8. CI (`.github/workflows/ios.yml`) собирает симулятор **без** подписи. Для TestFlight подпись делается локально у владельца.

Опционально позже: GitHub secrets `APP_STORE_CONNECT_API_KEY_*` для автоматической загрузки — не настраивал.

## Шрифты

Italianno и Cormorant Garamond — SIL Open Font License, файлы OFL лежат рядом со шрифтами.
