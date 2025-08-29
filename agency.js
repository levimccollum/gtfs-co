const SUPABASE_URL = 'https://dsyhomdktohejanyyysy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzeWhvbWRrdG9oZWphbnl5eXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzODkzNzEsImV4cCI6MjA3MTk2NTM3MX0.sH8eNMMmmNjwPDmmUM29mXSgIA--cQiVbmgRsjh7hm0';

let allFeeds = [];
let filteredFeeds = [];

document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
    
    const ntdId = window.location.pathname.substring(1);
    if (ntdId) {
        loadAgencyData(ntdId);
    }
    
    setupFilters();
    setupDownloadButtons();
});

async function loadAgencyData(ntdId) {
    try {
        const url = `${SUPABASE_URL}/rest/v1/gtfs_agencies?ntd_id=eq.${ntdId}`;
        
        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load agency data');
        
        const feeds = await response.json();
        
        if (feeds.length === 0) {
            document.getElementById('agencyName').textContent = 'Agency Not Found';
            document.getElementById('agencyLocation').textContent = `NTD ID: ${ntdId}`;
            showNoFeeds();
            return;
        }
        
        allFeeds = feeds;
        filteredFeeds = feeds;
        
        displayAgencyInfo(feeds[0]);
        populateFilters(feeds);
        displayFeeds(feeds);
        
    } catch (error) {
        console.error('Error loading agency:', error);
        showError();
    }
}

function displayAgencyInfo(agency) {
    document.getElementById('agencyName').textContent = agency.agency_name || 'Unknown Agency';
    document.getElementById('agencyLocation').textContent = 
        [agency.city, agency.state].filter(Boolean).join(', ') || 'Unknown Location';
    document.title = `${agency.agency_name.toLowerCase()} feeds | gtfs.co`;
}

function populateFilters(feeds) {
    const modes = [...new Set(feeds.map(f => f.mode).filter(Boolean))].sort();
    const serviceTypes = [...new Set(feeds.map(f => f.tos).filter(Boolean))].sort();
    
    const modeFilter = document.getElementById('modeFilter');
    const tosFilter = document.getElementById('tosFilter');
    
    modes.forEach(mode => {
        const option = document.createElement('option');
        option.value = mode;
        option.textContent = mode;
        modeFilter.appendChild(option);
    });
    
    serviceTypes.forEach(tos => {
        const option = document.createElement('option');
        option.value = tos;
        option.textContent = tos;
        tosFilter.appendChild(option);
    });
}

function setupFilters() {
    const modeFilter = document.getElementById('modeFilter');
    const tosFilter = document.getElementById('tosFilter');
    
    [modeFilter, tosFilter].forEach(filter => {
        filter.addEventListener('change', applyFilters);
    });
}

function applyFilters() {
    const modeFilter = document.getElementById('modeFilter').value;
    const tosFilter = document.getElementById('tosFilter').value;
    
    filteredFeeds = allFeeds.filter(feed => {
        const matchesMode = !modeFilter || feed.mode === modeFilter;
        const matchesTos = !tosFilter || feed.tos === tosFilter;
        return matchesMode && matchesTos;
    });
    
    displayFeeds(filteredFeeds);
}

function displayFeeds(feeds) {
    const feedsList = document.getElementById('feedsList');
    
    if (feeds.length === 0) {
        feedsList.innerHTML = '<div class="no-feeds">No feeds match the selected filters</div>';
        return;
    }
    
    feedsList.innerHTML = feeds.map(feed => {
        const cleanUrl = feed.weblink && feed.weblink.startsWith('{') 
            ? JSON.parse(feed.weblink).url 
            : feed.weblink;
            
        return `
            <div class="feed-item">
                <div class="feed-header">
                    <div>
                        <span class="feed-mode">${feed.mode || 'Unknown Mode'}</span>
                        ${feed.tos ? `<span class="feed-tos">${feed.tos}</span>` : ''}
                    </div>
                </div>
                <a href="${cleanUrl}" onclick="event.preventDefault(); window.open('${cleanUrl}', '_blank'); return false;" class="feed-url">gtfs.co/${feed.ntd_id}/${feed.mode.toLowerCase()}${feed.tos ? '-' + feed.tos.toLowerCase() : ''}</a>
                    <i data-lucide="download"></i>
                </button>
            </div>
        `;
    }).join('');
    
    lucide.createIcons();
}

function setupDownloadButtons() {
    document.getElementById('downloadDisplayed').addEventListener('click', () => {
        downloadMultiple(filteredFeeds);
    });
}

function downloadFeed(url) {
    if (!url) return;
    window.open(url, '_blank');
}

function downloadMultiple(feeds) {
    const validFeeds = feeds.filter(f => f.weblink);
    
    if (validFeeds.length === 0) {
        alert('no downloadable feeds available');
        return;
    }
    
    if (validFeeds.length > 5) {
        if (!confirm(`this will open ${validFeeds.length} download links. continue?`)) {
            return;
        }
    }
    
    validFeeds.forEach((feed, index) => {
        setTimeout(() => downloadFeed(feed.weblink), index * 500);
    });
}

function showNoFeeds() {
    document.getElementById('feedsList').innerHTML = 
        '<div class="no-feeds">no gtfs feeds found for this agency</div>';
}

function showError() {
    document.getElementById('feedsList').innerHTML = 
        '<div class="no-feeds">error loading agency data</div>';
}