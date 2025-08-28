// Supabase configuration
const SUPABASE_URL = 'https://dsyhomdktohejanyyysy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzeWhvbWRrdG9oZWphbnl5eXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzODkzNzEsImV4cCI6MjA3MTk2NTM3MX0.sH8eNMMmmNjwPDmmUM29mXSgIA--cQiVbmgRsjh7hm0';

// API configuration
const API_BASE_URL = 'https://data.transportation.gov/resource/2u7n-ub22.json';
const BATCH_SIZE = 1000;

class DataSyncer {
    constructor() {
        this.totalRecords = 0;
        this.processedRecords = 0;
    }

    async syncAllData() {
        console.log('Starting data sync...');
        
        try {
            // Get total record count
            await this.getTotalRecords();
            
            // Clear existing data
            await this.clearExistingData();
            
            // Sync in batches
            let offset = 0;
            while (offset < this.totalRecords) {
                await this.syncBatch(offset);
                offset += BATCH_SIZE;
                
                console.log(`Progress: ${Math.min(offset, this.totalRecords)}/${this.totalRecords} records`);
            }
            
            console.log('Data sync completed successfully!');
            
        } catch (error) {
            console.error('Data sync failed:', error);
        }
    }

    async getTotalRecords() {
        const response = await fetch(`${API_BASE_URL}?$select=count(*)`);
        const data = await response.json();
        this.totalRecords = parseInt(data[0].count);
        console.log(`Total records to sync: ${this.totalRecords}`);
    }

    async clearExistingData() {
        console.log('Clearing existing data...');
        
        const response = await fetch(`${SUPABASE_URL}/rest/v1/gtfs_agencies`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to clear existing data');
        }
    }

    async syncBatch(offset) {
        // Fetch batch from API
        const apiUrl = `${API_BASE_URL}?$limit=${BATCH_SIZE}&$offset=${offset}`;
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const records = await response.json();
        
        if (records.length === 0) {
            return;
        }

        // Transform records for Supabase
        const transformedRecords = records.map(this.transformRecord);
        
        // Insert into Supabase
        await this.insertBatch(transformedRecords);
    }

    transformRecord(record) {
        return {
            ntd_id: record.ntd_id || null,
            agency_name: record.agency_name || null,
            city: record.city || null,
            state: record.state || null,
            url: record.url || null,
            weblink: (() => {
                let weblink = record.weblink;
                if (weblink && weblink.startsWith('{')) {
                    try {
                        const parsed = JSON.parse(weblink);
                        return parsed.url || null;
                    } catch (e) {
                        return null;
                    }
                }
                return weblink;
            })(),
            mode: record.mode || null,
            tos: record.tos || null,
            reporter_type: record.reporter_type || null,
            organization_type: record.organization_type || null,
            service_area_population: record.service_area_population ? parseInt(record.service_area_population) : null,
            service_area_sq_miles: record.service_area_sq_miles ? parseFloat(record.service_area_sq_miles) : null,
            voms: record.voms ? parseInt(record.voms) : null,
            npt_id: record.npt_id || null,
            legacy_ntd_id: record.legacy_ntd_id || null,
            reporter_acronym: record.reporter_acronym || null,
            doing_business_as_name: record.doing_business_as_name || null,
            primary_uza_name: record.primary_uza_name || null,
            uza_name_list: record.uza_name_list || null
        };
    }

    async insertBatch(records) {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/gtfs_agencies`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(records)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Supabase insert failed: ${error}`);
        }
    }
}

// Usage
const syncer = new DataSyncer();

// Run sync immediately if this script is executed directly
if (typeof window === 'undefined') {
    syncer.syncAllData();
}

// Export for browser usage
if (typeof window !== 'undefined') {
    window.DataSyncer = DataSyncer;
}