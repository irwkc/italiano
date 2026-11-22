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

По умолчанию клиент ходит на прод: `https://giacomoschiavon.ru/api/mobile/v1` (`AULA_USE_MOCK=NO`).

Макет (seed Anna/Pavel) — схема **AulaMock** или переменная окружения / аргумент:

```
AULA_USE_MOCK=YES
# или Launch Argument: -AULAUseMock
```

Демо макета: `anna@aula.test` / `aula-demo-8`.

Регистрация: приглашение + `consent: true` + письмо подтверждения, затем вход.

Live «Далее» → `POST /live/next`. Словарь → `GET /gloss`. APNs-токен → `POST /devices` (отправки push на сервере нет).

## TestFlight — что нужно от владельца

Секреты и сертификаты в репозиторий не кладём.

1. **Apple Developer Team ID** — вписать в `ios/project.yml` → `DEVELOPMENT_TEAM` (или в Xcode Signing).
2. Зарегистрировать App ID `ru.giacomoschiavon.aula` с Push Notifications и Keychain Sharing.
3. Создать приложение в App Store Connect (имя вроде **Aula Giacomo**, категория Education).
4. На Mac: войти в аккаунт Apple Developer в Xcode, выбрать Team, Archive → Distribute → App Store Connect → Upload. Для архива `aps-environment` станет `production`.
5. TestFlight: добавить тестировщиков (email учеников).
6. Шифрование: `ITSAppUsesNonExemptEncryption = false` (HTTPS).
7. Privacy: email только для входа, без трекинга. Манифест: `Aula/PrivacyInfo.xcprivacy`.
8. CI собирает симулятор без подписи. TestFlight подписывается локально.

## Шрифты

Italianno и Cormorant Garamond — SIL Open Font License, файлы OFL лежат рядом со шрифтами.
