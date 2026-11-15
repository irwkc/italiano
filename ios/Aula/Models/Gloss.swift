import Foundation

enum Gloss {
    static let table: [String: String] = [
        "a": "в / к",
        "al": "в / к (al)",
        "alle": "в / к (alle)",
        "amico": "друг",
        "andare": "идти / ехать",
        "anna": "Анна",
        "avere": "иметь",
        "bene": "хорошо",
        "biciclette": "велосипеды",
        "buono": "вкусный / хороший",
        "caffè": "кофе",
        "casa": "дом",
        "chiede": "спрашивает",
        "cinema": "кино",
        "città": "город",
        "colazione": "завтрак",
        "come": "как",
        "completa": "заполни",
        "con": "с",
        "cosa": "что",
        "di": "из / дома",
        "domani": "завтра",
        "dove": "где",
        "due": "два",
        "e": "и",
        "ogni": "каждый",
        "spazio": "пропуск",
        "è": "есть / является",
        "esco": "выхожу",
        "essere": "быть",
        "film": "фильм",
        "giusto": "правильный",
        "il": "определённый артикль",
        "in": "в",
        "io": "я",
        "italia": "Италия",
        "italiano": "итальянец / итальянский",
        "la": "определённый артикль",
        "marco": "Марко",
        "mattina": "утро",
        "mia": "моя",
        "noi": "мы",
        "o": "или",
        "per": "для / чтобы",
        "parola": "слово",
        "poi": "потом",
        "posto": "место",
        "prendi": "берёшь / заказываешь",
        "qualcuno": "кто-то",
        "rispondi": "отвечаешь",
        "rossa": "красная",
        "routine": "распорядок",
        "saluti": "приветствия / ты здороваешься",
        "sette": "семь",
        "stai": "ты (как дела)",
        "stasera": "сегодня вечером",
        "strada": "улица",
        "sveglio": "просыпаюсь",
        "una": "одна / неопределённый артикль",
        "un": "один / неопределённый артикль",
        "vedere": "видеть / смотреть",
        "venire": "приходить",
        "verbo": "глагол",
        "vespa": "веспа",
        "ciao": "привет",
        "mi": "мне / себя",
        "faccio": "делаю",
        "sono": "я есть",
        "ho": "я имею",
        "vado": "иду",
        "ha": "имеет",
        "andiamo": "идём",
        "vieni": "приходишь",
        "bar": "бар",
    ]

    static func key(_ word: String) -> String {
        word.lowercased(with: Locale(identifier: "it_IT"))
            .folding(options: .diacriticInsensitive, locale: Locale(identifier: "it_IT"))
            .precomposedStringWithCanonicalMapping
    }

    /// Keep accents for lookup first (è ≠ e), then fold.
    static func lookup(_ word: String) -> String? {
        let folded = word.lowercased(with: Locale(identifier: "it_IT")).precomposedStringWithCanonicalMapping
        if let hit = table[folded] { return hit }
        return table[key(word)]
    }

    static func splitWords(_ text: String) -> [String] {
        let pattern = "([A-Za-zÀ-ÖØ-öø-ÿ]+)"
        guard let regex = try? NSRegularExpression(pattern: pattern) else { return [text] }
        let ns = text as NSString
        var result: [String] = []
        var cursor = 0
        for match in regex.matches(in: text, range: NSRange(location: 0, length: ns.length)) {
            if match.range.location > cursor {
                result.append(ns.substring(with: NSRange(location: cursor, length: match.range.location - cursor)))
            }
            result.append(ns.substring(with: match.range))
            cursor = match.range.location + match.range.length
        }
        if cursor < ns.length {
            result.append(ns.substring(from: cursor))
        }
        return result.filter { !$0.isEmpty }
    }

    static func isWord(_ part: String) -> Bool {
        guard let regex = try? NSRegularExpression(pattern: "^[A-Za-zÀ-ÖØ-öø-ÿ]+$") else { return false }
        return regex.firstMatch(in: part, range: NSRange(location: 0, length: (part as NSString).length)) != nil
    }
}
