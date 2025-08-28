// Node.js version of data sync
const https = require('https');

const SUPABASE_URL = 'https://dsyhomdktohejanyyysy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzeWhvbWRrdG9oZWphbnl5eXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzODkzNzEsImV4cCI6MjA3MTk2NTM3MX0.sH8eNMMmmNjwPDmmUM29mXSgIA--cQiVbmgRsjh7hm0';
const API_BASE_URL = 'https://data.transportation.gov/resource/2u7n-ub22.json';
const BATCH_SIZE = 1000;

async function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const req = https.request(url, options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({
                        ok: true,
                        json: () => Promise.resolve(JSON.parse(data)),
                        text: () => Promise.resolve(data)
                    });
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });
        
        req.on('error', reject);
        
        if (options.body) {
            req.write(options.body);
        }
        
        req.end();
    });
}

async function syncData() {
    console.log('🚀 Starting GTFS data sync...');
    
    try {
        // Get total count
        console.log('📊 Getting total record count...');
        const countResponse = await makeRequest(`${API_BASE_URL}?$select=count(*)`);
        const countData = await countResponse.json();
        const totalRecords = parseInt(countData[0].count);
        console.log(`📈 Total records: ${totalRecords}`);
        
        // Clear existing data
        console.log('🗑️ Clearing existing data...');
        await makeRequest(`${SUPABASE_URL}/rest/v1/gtfs_agencies?id=gt.0`, {
            method: 'DELETE',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
            }
        });
        
        // Sync in batches
        let offset = 0;
        while (offset < totalRecords) {
            console.log(`📥 Fetching batch: ${offset}-${Math.min(offset + BATCH_SIZE, totalRecords)}`);
            
            const response = await makeRequest(`${API_BASE_URL}?$limit=${BATCH_SIZE}&$offset=${offset}`);
            const records = await response.json();
            
            if (records.length === 0) break;
            
            // Transform records
            const transformed = records.map(record => ({
                ntd_id: record.ntd_id || null,
                agency_name: record.agency_name || null,
                city: record.city || null,
                state: record.state || null,
                url: record.url || null,
                weblink: record.weblink || null,
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
            }));
            
            // Insert to Supabase
            await makeRequest(`${SUPABASE_URL}/rest/v1/gtfs_agencies`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_ANON_KEY,
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify(transformed)
            });
            
            offset += BATCH_SIZE;
            console.log(`✅ Progress: ${Math.min(offset, totalRecords)}/${totalRecords}`);
        }
        
        console.log('🎉 Data sync completed successfully!');
        
    } catch (error) {
        console.error('❌ Sync failed:', error.message);
    }
}

syncData();