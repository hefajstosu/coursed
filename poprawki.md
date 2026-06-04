# Poprawki — braki funkcjonalne coursed.pl

Lista funkcjonalności brakujących w serwisie typu agregator opinii o kursach.
Pozycje wykonywane po kolei. Status: `[ ]` do zrobienia · `[x]` zrobione.

Legenda priorytetów: 🔴 bloker launchu · 🟠 rdzeń produktu · 🟡 zaangażowanie · 🟢 strona podażowa · ⚪ drobne UX.

---

## 🔴 Compliance / prawne (blokery launchu — nie były na ROADMAP)

- [x] **1. Polityka prywatności (RODO)** — strona `/polityka-prywatnosci` + link w stopce. ⚠️ uzupełnić dane operatora ([NAZWA/ADRES/NIP]) i zweryfikować u prawnika.
- [x] **2. Regulamin serwisu** — strona `/regulamin` + link w stopce. ⚠️ uzupełnić dane operatora i zweryfikować u prawnika.
- [x] **3. Cookie consent** — baner `CookieConsent` (cookies niezbędne), zapis w localStorage, zamontowany w root layout.
- [x] **4. Usuwanie konta + eksport danych (RODO)** — `deleteAccount` (kaskada + recompute) + `/api/me/export` (JSON) + sekcja „Konto i dane" w `/profil`. Konta EDITOR/ADMIN usuwa admin.

## 🟠 Rdzeń review-site

- [x] **5. Zweryfikowana opinia** — `Review.verified/verifiedAt`, akcja `setReviewVerified` (EDITOR/ADMIN, audit), badge „Zweryfikowana" na opinii + toggle w `/admin/opinie`. ℹ️ MVP: weryfikuje redakcja; self-serve upload dowodu = follow-up.
- [x] **6. Rozkład ocen (histogram 1–10)** — `getRatingDistribution` + `RatingHistogram` w aside karty kursu.
- [x] **7. Paginacja opinii** — `getCourseReviews({ sort, page })` z limitem 10/str., sort „Najtrafniejsze/Najnowsze", `Pagination` + `#opinie`.
- [x] **8. Odpowiedź redakcji/platformy na opinię** — model `ReviewResponse`, akcje upsert/delete (EDITOR/ADMIN), blok pod opinią + inline form. ℹ️ odpowiedzi twórców czekają na #15.
- [x] **9. Oceny wielokryterialne** — `Rating.valueContent/Instructor/Worth` (opcjonalne), agregacja w `cachedRatings.aspects`, inputy w ReviewForm, wyświetlanie w RatingDisplay.

## 🟡 Zaangażowanie i retencja (część na ROADMAP)

- [ ] **10. Powiadomienia e-mail** — moderacja, decyzja zgłoszenia, weryfikacja krytyka (ROADMAP A).
- [ ] **11. Obserwowanie kursu / watchlist** — „powiadom o nowej opinii", zakładki.
- [ ] **12. Newsletter / subskrypcja kategorii** — (ROADMAP D / longterm).
- [ ] **13. Profile publiczne userów** `/u/{slug}` — (ROADMAP D).
- [ ] **14. Porównywarka kursów** `/porownaj` — (ROADMAP D).

## 🟢 Strona podażowa

- [ ] **15. Konta twórców / „przejmij listing"** — dashboard platformy/twórcy, statystyki, odpowiedzi na opinie.

## ⚪ Drobne UX / moderacja

- [ ] **16. Ban/zawieszenie użytkownika** — stan „zbanowany" blokujący pisanie.
- [ ] **17. Autocomplete w wyszukiwarce.**
- [ ] **18. Wskaźnik „edytowano" przy opinii.**
- [ ] **19. Sekcje „najgorętsze opinie" i „polecane przez redakcję" na home** — (ROADMAP D).
