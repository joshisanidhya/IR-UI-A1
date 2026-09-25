
# Hindi IR Search Engine

A Hindi information retrieval application built using a
positional inverted index in Java.

## Dataset

10,000 Hindi documents sampled from AI4Bharat IndicCorpV2.

Each line is treated as one document.

## Search operations

- Single-term search
- AND search
- OR search
- Exact phrase search
- NEAR/proximity search

## API endpoints

- GET /api/search?term=...
- GET /api/search/and?term1=...&term2=...
- GET /api/search/or?term1=...&term2=...
- GET /api/search/phrase?query=...
- GET /api/search/near?term1=...&term2=...&distance=3
- GET /api/document/1
- GET /api/stats


