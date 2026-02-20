# Backend Implementation Guide: Location & Filtering

The frontend now supports global location detection and country-based content filtering. To ensure everything works correctly, please implement or verify the following in the backend:

## 1. Location Detection
- **Endpoint**: `GET /api/locations/detect`
- **Responsibility**: Should detect the user's country via IP (or handle a provided X-Forwarded-For header).
- **Required Response**:
```json
{
  "country": {
    "id": "UUID",
    "name": "Chile",
    "language_code": "es",
    "type": "country"
  }
}
```

## 2. Hierarchical Location Data
- **Endpoint**: `GET /api/locations/countries`
  - Returns a list of all supported countries.
- **Endpoint**: `GET /api/locations/children/:id`
  - When a Country ID is provided, returns its Regions.
  - When a Region ID is provided, returns its Communes/Cities.

## 3. Content Filtering by Country
Update the following listing endpoints to support a `country_id` query parameter:

### Services
- **Endpoint**: `GET /api/services`
- **Parameter**: `country_id` (UUID)
- **Logic**: If `country_id` is provided, return ONLY services belonging to that country. If the user has a `location_id` (commune) filter, it should still work within that country.

### Muro de Datos (Posts)
- **Endpoint**: `GET /api/posts`
- **Parameter**: `country_id` (UUID)
- **Logic**: Only show posts from the specified country.

## 4. Internationalization Support
- Ensure that the `country` object returned by `detect` always includes a valid `language_code` (e.g., "es", "en", "pt") that matches the filenames in the frontend `public/locales/` directory.

---
**Verification**: Frontend code in `LocationContext.tsx`, `Services.tsx`, and `Wall.tsx` is already sending these parameters.
