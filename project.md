# coursed.pl — opis projektu

## Założenie projektu
coursed.pl to portal internetowy służący do oceniania i opiniowania kursów online oraz offline przez zwykłych użytkowników i zweryfikowanych krytyków / redakcję. Projekt opiera się na modelu katalogowym podobnym do serwisów filmowych i recenzenckich, gdzie każdy obiekt ma własną kartę, zestaw ocen oraz sekcję opinii użytkowników i ekspertów.

Główną wartością serwisu ma być zebranie w jednym miejscu rozproszonych opinii o kursach, które dziś najczęściej znajdują się bezpośrednio na marketplace’ach, w rankingach, katalogach lub niszowych serwisach z recenzjami.

## Cel produktu
Celem projektu jest stworzenie wiarygodnego portalu, który pomaga użytkownikowi znaleźć dobry kurs, porównać go z innymi oraz ocenić jego jakość na podstawie opinii społeczności i opinii eksperckich. Taki kierunek odpowiada luce rynkowej, ponieważ istnieją strony z ocenami kursów lub platform edukacyjnych, ale nadal brakuje jednego silnego, neutralnego serwisu agregującego oceny różnych kursów w modelu „IMDb / Filmweb dla kursów”.

## Typy ocenianych obiektów
Serwis obejmuje:

- kursy online,
- kursy offline,
- w przyszłości opcjonalnie kursy hybrydowe.

Podstawową jednostką katalogową jest pojedynczy kurs jako konkretny produkt edukacyjny. Już na etapie planowania warto przyjąć, że ten sam kurs może w praktyce występować w różnych wersjach, edycjach, językach, modelach sprzedaży lub formach uczestnictwa, dlatego model danych powinien przewidywać taką możliwość.

## Model ocen
Każdy kurs posiada trzy poziomy ocen:

- ocenę użytkowników,
- ocenę krytyków / redakcji,
- ocenę ogólną.

Ocena ogólna jest najważniejszą oceną prezentowaną w interfejsie i stanowi średnią 50/50 z oceny użytkowników oraz oceny krytyków, niezależnie od liczby opinii w każdej z tych grup. Rozdzielenie warstwy eksperckiej i społecznościowej zwiększa czytelność produktu i jego wiarygodność.

Dla uniknięcia niejasności projekt przewiduje również reguły brzegowe:

- jeśli istnieją oba typy ocen, wyświetlana jest pełna ocena ogólna,
- jeśli istnieje tylko jeden typ ocen, serwis powinien to wyraźnie komunikować,
- jeśli opinii jest zbyt mało, kurs może otrzymać oznaczenie „za mało ocen”.

## Skala ocen i opinie
Użytkownik wystawia ocenę liczbową oraz może dodać tekstową opinię do kursu. Na tym etapie projekt zakłada skalę 0–10, natomiast warstwa wizualna może prezentować wynik w formie gwiazdek lub innego komponentu ratingowego, o ile pozostanie spójna z logiką skali głównej.

Na stronie pojedynczego kursu opinie powinny być filtrowalne według typu:

- wszystkie,
- opinie użytkowników,
- opinie krytyków.

Wartościowym rozszerzeniem, przewidzianym już na etapie projektu, jest możliwość oznaczania opinii jako pomocnej oraz zgłaszania treści naruszających zasady serwisu, ponieważ platformy opinii bez warstwy kontroli jakości są szczególnie podatne na spam i manipulację.

## Dodatkowe wymiary oceny
Poza oceną ogólną projekt może w przyszłości przewidywać bardziej szczegółowy model oceny kursów. Oceny cząstkowe pomagają użytkownikowi zrozumieć nie tylko „jak dobry” jest kurs, ale też „w czym dokładnie” jest dobry.

Przykładowe oceny szczegółowe:

- jakość merytoryczna,
- praktyczność materiału,
- stosunek jakości do ceny,
- aktualność treści,
- organizacja kursu,
- jakość wsparcia lub społeczności.

Nie jest to konieczne w MVP, ale warto przewidzieć tę możliwość w strukturze projektu już teraz.

## Dane każdego kursu
Każdy kurs powinien posiadać co najmniej następujące informacje:

- tytuł,
- okładkę graficzną,
- krótki opis,
- autora / twórcę kursu.

Rozszerzony zestaw danych, rekomendowany na etapie planowania, obejmuje również:

- platformę lub stronę sprzedaży,
- oficjalny link do kursu,
- cenę lub model cenowy,
- język kursu,
- poziom zaawansowania,
- formę kursu: online / offline / hybrydowy,
- datę ostatniej aktualizacji,
- informację o certyfikacie,
- lokalizację, jeśli kurs odbywa się offline.

Taki zestaw pól zwiększa wartość filtrów, porównań oraz landing pages kategorii, a także poprawia użyteczność serwisu dla użytkownika szukającego konkretnego typu kursu.

## Kategorie i struktura katalogu
Portal ma działać jako katalog kursów z kategoriami i podkategoriami. Przykładowe obszary to kursy maturalne, kryptowaluty, nieruchomości, biznes, języki czy programowanie. Rozwinięcie kategorii w menu oraz osobne listingi z filtrowaniem są zgodne z logiką serwisów katalogowych i wspierają zarówno UX, jak i widoczność organiczną.

W dłuższej perspektywie każda ważniejsza kategoria i podkategoria powinna funkcjonować jako osobna, indeksowalna strona docelowa, a nie tylko filtr techniczny. To tworzy dobrą bazę pod SEO i rozbudowę redakcyjnych zestawień tematycznych.

## Publiczna część serwisu
Część publiczna powinna obejmować:

- stronę główną,
- strony kategorii i podkategorii,
- listingi kursów z filtrowaniem i sortowaniem,
- strony pojedynczych kursów,
- formularz zgłoszenia kursu do dodania,
- sekcję blogową / redakcyjną.

W przyszłości sensownym rozszerzeniem mogą być również profile autorów, profile platform edukacyjnych oraz zestawienia redakcyjne typu „najlepsze kursy z danej kategorii”. Tego typu treści są naturalnym rozwinięciem modelu katalogowego i pomagają budować ruch z wyszukiwarki.

## Panel administratora
Panel administracyjny powinien umożliwiać:

- dodawanie i edycję kursów,
- moderację komentarzy i opinii,
- obsługę requestów o dodanie kursu,
- dodawanie wpisów blogowych,
- zarządzanie krytykami / redakcją,
- scalanie duplikatów kursów,
- obsługę zgłoszeń nadużyć,
- podstawowy audyt zmian.

To rozszerzenie względem pierwotnego planu jest istotne, ponieważ realny serwis opinii szybko zaczyna potrzebować nie tylko dodawania treści, ale też narzędzi do kontroli jakości i porządkowania katalogu.

## Wiarygodność i moderacja
Wiarygodność opinii jest jednym z najważniejszych fundamentów projektu. Serwis z recenzjami bez mechanizmów weryfikacji i zgłoszeń nadużyć może łatwo stracić wartość przez spam, fikcyjne komentarze i próby manipulacji ocenami.

Dlatego projekt powinien od początku przewidywać:

- rozróżnienie opinii zwykłych i zweryfikowanych,
- możliwość zgłaszania opinii,
- politykę moderacji,
- możliwość oznaczania statusu „zweryfikowany zakup / udział” w przyszłości,
- jasne zasady nadawania statusu „zweryfikowany krytyk”.

## Widget / embed
Serwis ma udostępniać możliwość osadzania oceny kursu na stronie właściciela kursu, np. poprzez iframe lub widget. To dobry kierunek zarówno wizerunkowo, jak i produktowo, ponieważ pozwala budować rozpoznawalność marki oraz tworzyć zewnętrzne punkty styku z serwisem.

Docelowo taki widget może prezentować:

- ocenę ogólną,
- liczbę opinii,
- ewentualnie status wiarygodności,
- link prowadzący do pełnej strony kursu w serwisie.

## SEO i content
Projekt ma naturalny potencjał SEO, ponieważ łączy katalog obiektów z blogiem i treściami poradnikowymi. Połączenie stron kursów, stron kategorii oraz contentu redakcyjnego może zbudować mocną strukturę linkowania wewnętrznego i szerokie pokrycie intencji wyszukiwania.

Warto od początku przewidzieć:

- indeksowalne strony kursów,
- indeksowalne strony kategorii i podkategorii,
- sekcję blogową wspierającą katalog,
- powiązania między kursami, kategoriami i artykułami,
- redakcyjne rankingi i zestawienia tematyczne.

## Potencjalna monetyzacja
Monetyzacja może zostać wdrożona później, ale już teraz warto ją przewidzieć na poziomie koncepcji produktu. Najbezpieczniejsze modele to te, które nie naruszają zaufania do systemu ocen, ponieważ wiarygodność będzie głównym aktywem serwisu.

Potencjalne kierunki monetyzacji:

- programy afiliacyjne do stron sprzedaży kursów,
- płatne profile premium dla twórców kursów,
- płatny widget / badge do osadzania na stronach twórców,
- sponsorowane zestawienia redakcyjne z wyraźnym oznaczeniem,
- model lead generation B2B,
- płatny dostęp do danych, statystyk lub alertów dla twórców i firm.

Najbardziej obiecujące na dalszym etapie wydają się afiliacja, profile premium i widget reputacyjny, ponieważ są spójne z charakterem serwisu katalogowo-opiniującego i mogą być wdrażane bez bezpośredniego ingerowania w sam mechanizm oceny.

## Zakres MVP
Na poziomie MVP projekt można zawęzić do najważniejszych funkcji:

- katalog kursów,
- strony pojedynczych kursów,
- oceny użytkowników,
- oceny krytyków,
- komentarze tekstowe,
- filtrowanie opinii,
- request o dodanie kursu,
- panel admina do zarządzania katalogiem i moderacją,
- podstawowe strony kategorii,
- prosty blog redakcyjny.

Takie podejście pozwala rozpocząć projekt od zwartego, zrozumiałego produktu i dopiero później rozbudowywać go o oceny cząstkowe, profile autorów, weryfikację zakupu, zaawansowane rankingi i dodatkowe modele monetyzacji.

## Podsumowanie kierunku
coursed.pl ma potencjał, by stać się wyspecjalizowanym portalem opinii o kursach, łączącym katalog kursów, społecznościowy system ocen oraz redakcyjną warstwę ekspercką. Najważniejsze doprecyzowania przed etapem technicznym dotyczą definicji ocenianego obiektu, reguł oceny ogólnej, wiarygodności opinii, zakresu metadanych kursu oraz struktury kategorii i SEO.
