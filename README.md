# gtfs.co

A minimalist web application for searching and downloading GTFS (General Transit Feed Specification) feeds from US transit agencies.

## Features

- **Live Search**: Search agencies by name, city, or state with real-time results
- **Agency Pages**: Direct access via `gtfs.co/[ntd-id]` format  
- **Feed Filtering**: Filter by transit mode and service type
- **Bulk Downloads**: Download all feeds for an agency or filtered selection
- **Clean URLs**: Pretty URLs like `gtfs.co/40028/mb-do` for individual feeds
- **Direct Downloads**: One-click downloading without page navigation

## Tech Stack

- **Frontend**: HTML, CSS, Vanilla JavaScript
- **Database**: Supabase (PostgreSQL)
- **Hosting**: Netlify
- **Icons**: Lucide
- **Analytics**: Umami

## Project Structure

```
gtfs-co/
├── index.html          # Landing page with search
├── agency.html         # Agency detail page
├── feed.html           # Feed download page
├── styles.css          # Unified styles
├── script.js           # Search functionality
├── agency.js           # Agency page logic
├── feed.js             # Feed download logic
├── sync-node.js        # Data sync script
├── netlify.toml        # Routing configuration
└── .gitignore          # Git ignore file
```

## Setup

### Prerequisites

- Node.js (for data sync)
- Supabase account
- Netlify account
- GitHub repository

### Database Setup

1. Create a Supabase project
2. Run the table creation SQL:

```sql
CREATE TABLE gtfs_agencies (
    id SERIAL PRIMARY KEY,
    ntd_id TEXT,
    agency_name TEXT,
    city TEXT,
    state TEXT,
    url TEXT,
    weblink TEXT,
    mode TEXT,
    tos TEXT,
    reporter_type TEXT,
    organization_type TEXT,
    service_area_population INTEGER,
    service_area_sq_miles DECIMAL,
    voms INTEGER,
    npt_id TEXT,
    legacy_ntd_id TEXT,
    reporter_acronym TEXT,
    doing_business_as_name TEXT,
    primary_uza_name TEXT,
    uza_name_list TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create search index
CREATE INDEX idx_gtfs_agencies_search ON gtfs_agencies USING GIN (
    to_tsvector('english', COALESCE(agency_name, '') || ' ' || 
                           COALESCE(city, '') || ' ' || 
                           COALESCE(state, ''))
);

-- Create index on ntd_id
CREATE INDEX idx_gtfs_agencies_ntd_id ON gtfs_agencies (ntd_id);

-- Enable RLS and create policies
ALTER TABLE gtfs_agencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON gtfs_agencies FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON gtfs_agencies FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete" ON gtfs_agencies FOR DELETE USING (true);
```

### Environment Configuration

Update Supabase credentials in JavaScript files:
- `script.js`
- `agency.js` 
- `feed.js`
- `sync-node.js`

### Data Sync

Populate the database with USDOT API data:

```bash
node sync-node.js
```

This fetches ~1,554 records from `https://data.transportation.gov/resource/2u7n-ub22.json` and processes JSON weblinks into clean URLs.

### Deployment

1. Push to GitHub
2. Connect Netlify to your repository
3. Deploy with build settings:
   - Build command: (leave blank)
   - Publish directory: `.`

The `netlify.toml` handles routing:
- `/:ntdid/:mode` → `feed.html` (direct downloads)
- `/:ntdid` → `agency.html` (agency pages)

## API Reference

### Data Source
- **USDOT National Transit Database**: https://data.transportation.gov/resource/2u7n-ub22.json
- **Documentation**: https://dev.socrata.com/foundry/data.transportation.gov/5ti2-5uiv

### URL Patterns
- **Search**: `gtfs.co`
- **Agency**: `gtfs.co/40028` (Lee County)
- **Feed**: `gtfs.co/40028/mb-do` (Lee County Motor Bus - Directly Operated)

## Development

### Local Development

1. Clone repository
2. Open with live server (VS Code Live Server, etc.)
3. Test search and navigation

### Data Updates

Re-run the sync script to refresh data:

```bash
node sync-node.js
```

The script automatically handles:
- JSON weblink parsing
- Duplicate removal (if unique constraints exist)
- Progress tracking
- Error handling

### Analytics

Umami analytics configured for:
- Page views
- Search interactions
- Download events

## Contributing

1. Fork the repository
2. Create feature branch
3. Test thoroughly
4. Submit pull request

## License

GPL-3.0 License - see LICENSE file for details

## Acknowledgments

- **USDOT**: For providing the National Transit Database API
- **Transit Agencies**: For maintaining GTFS feeds
- **GTFS Community**: For establishing the specification

## Support

For issues or questions:
- Open GitHub issue
- Check GTFS.org documentation
- Review USDOT API documentation