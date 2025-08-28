// Initialize Lucide icons
document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
});

// Search functionality
const searchInput = document.getElementById('agencySearch');
const searchResults = document.getElementById('searchResults');
const loadingIndicator = document.getElementById('loadingIndicator');
const resultsList = document.getElementById('resultsList');

let searchTimeout;

if (searchInput) {
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        
        // Clear previous timeout
        clearTimeout(searchTimeout);
        
        if (query.length < 2) {
            hideResults();
            return;
        }
        
        // Show loading state
        showLoading();
        
        // Debounce search
        searchTimeout = setTimeout(() => {
            performSearch(query);
        }, 300);
    });
    
    // Hide results when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.search-container')) {
            hideResults();
        }
    });
}

function showLoading() {
    searchResults.style.display = 'block';
    loadingIndicator.style.display = 'flex';
    resultsList.style.display = 'none';
}

function hideResults() {
    searchResults.style.display = 'none';
}

function showResults() {
    loadingIndicator.style.display = 'none';
    resultsList.style.display = 'block';
}

async function performSearch(query) {
    try {
        const SUPABASE_URL = 'https://dsyhomdktohejanyyysy.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzeWhvbWRrdG9oZWphbnl5eXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzODkzNzEsImV4cCI6MjA3MTk2NTM3MX0.sH8eNMMmmNjwPDmmUM29mXSgIA--cQiVbmgRsjh7hm0';
        
        const searchQuery = encodeURIComponent(`%${query}%`);
        const url = `${SUPABASE_URL}/rest/v1/gtfs_agencies?or=(agency_name.ilike.${searchQuery},city.ilike.${searchQuery},state.ilike.${searchQuery})&select=ntd_id,agency_name,city,state&limit=50`;

        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Search failed');
        }
        
        const results = await response.json();
        displayResults(results);
        
    } catch (error) {
        console.error('Search error:', error);
        displayError();
    }
}

function displayResults(results) {
    showResults();
    
    // Remove duplicates by ntd_id
    const unique = results.filter((agency, index, self) => 
        index === self.findIndex(a => a.ntd_id === agency.ntd_id)
    );
    
    if (unique.length === 0) {
        resultsList.innerHTML = '<div class="result-item">No agencies found</div>';
        return;
    }
    
    resultsList.innerHTML = unique.slice(0, 10).map(agency => {
        const ntdId = agency.ntd_id || 'N/A';
        const agencyName = agency.agency_name || 'Unknown Agency';
        const location = [agency.city, agency.state].filter(Boolean).join(', ') || 'Unknown Location';
        
        return `
            <a href="/${ntdId}" class="result-item">
                <div class="result-agency-name">${agencyName}</div>
                <div class="result-details">
                    ${location}
                    <span class="result-ntd-id">${ntdId}</span>
                </div>
            </a>
        `;
    }).join('');
}

function displayError() {
    showResults();
    resultsList.innerHTML = '<div class="result-item">Error searching agencies. Please try again.</div>';
}

// Handle direct URL access (for agency pages)
function handleDirectAccess() {
    const path = window.location.pathname;
    const ntdId = path.substring(1); // Remove leading slash
    
    if (ntdId && ntdId !== 'index.html' && !ntdId.includes('.')) {
        // This is likely an NTD ID, redirect or load agency data
        loadAgencyPage(ntdId);
    }
}

function loadAgencyPage(ntdId) {
    // TODO: Implement agency page loading
    console.log('Loading agency page for NTD ID:', ntdId);
}

// Initialize on page load
handleDirectAccess();