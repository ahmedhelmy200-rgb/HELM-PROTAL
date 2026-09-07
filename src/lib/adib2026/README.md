# ADIB 2026 statement import audit

## Sources

- Statement A: 2026-03-01 through 2026-05-29.
- Statement B: 2026-06-05 through 2026-09-02.
- Target account: HELM office ADIB account ending in `0173`.

## Double-count prevention

HELM already contains an aggregate ADIB summary covering 2026-01-01 through 2026-05-01. For that reason:

- Detailed income and expenses are inserted only for transactions dated **after 2026-05-01**.
- Named client payments from March-April are still attached to the relevant client records as payment history, but are not inserted again into income totals.
- Self deposits, confirmed internal transfers, and returned-cheque principal movements are excluded from operating income/expense.
- Bank refunds remain separate from client collections.
- Unnamed incoming transfers are stored as `تحصيل غير مسند`; no client identity is invented.
- Every imported accounting row and client payment receives a stable ADIB marker so subsequent runs skip it.

## Reconciled detailed totals after 2026-05-01

- Expense rows: **374**
- Expenses: **AED 45,282.89**
- Income rows: **27**
- Income: **AED 31,290.85**
- Net detailed movement: **AED -13,992.04**
- Confirmed internal/self-transfer rows excluded from operating totals: **38**

Income includes:

- Named client collections: **18 rows / AED 26,303.00**
- Unassigned incoming transfers: **8 rows / AED 4,968.00**
- Refunds: **1 row / AED 19.85**

## Named client payment history in both statements

There are **32 named payment rows totaling AED 47,322.50** across 15 bank sender names. These rows are attached to client records with exact statement date, amount and bank reference.

| Bank sender | Payments | Total AED |
|---|---:|---:|
| BDAYT ALKHIR TRADING LLC | 7 | 20,218.00 |
| MOHAMED ABDELGHANY MOHAMED A ABDIN | 3 | 9,850.00 |
| BTISSAM EL AZZABI | 1 | 4,000.00 |
| MOSTAFA SOBHY ABDELGHANYSAYED AHMED | 1 | 3,000.00 |
| MINA REDA HALIM MIKHAEL YOUSSEF | 5 | 2,255.00 |
| Samar Osama El Abed | 1 | 1,999.50 |
| RANIA ISMAIL ABDELHAI MOHAMED ASSI | 1 | 1,000.00 |
| Sherif Ashraf Abouelhamd Elsayed | 1 | 1,000.00 |
| MOHAMED MAHMOUD ABDELAZIZ NASEF | 5 | 900.00 |
| ABDELKADER FAROUK ALI H HEWEIDI | 2 | 800.00 |
| MOHAMED SEDDIK ELBASEL GABER ELNAGD | 1 | 600.00 |
| Karim Mohamed Shaker Mohamed Shendi | 1 | 500.00 |
| SHERIN MAGDI ALI ELFADALI | 1 | 500.00 |
| WAHAT ALARABYA TRVEL TOUR SPS LLC | 1 | 500.00 |
| Mohamed Sherif Elbahy Elmetwalli Elkashlan | 1 | 200.00 |

## Runtime behavior

`adibStatementSeed2026.js` runs for authenticated staff accounts. It:

1. Matches bank sender names against current clients using normalized English/Arabic aliases.
2. Creates a client only when no confirmed match exists; it does not invent phone, email, ID or nationality.
3. Appends each confirmed payment to the client's notes using `[ADIB-PAYMENT:<id>]`.
4. Inserts post-cutoff income rows using stable IDs and `[ADIB-TXN:<id>]` markers.
5. Inserts post-cutoff expense rows with the same stable transaction marker.
6. Re-runs safely: existing markers/composite bank identities are skipped rather than duplicated.
