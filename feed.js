const SUPABASE_URL = 'https://dsyhomdktohejanyyysy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzeWhvbWRrdG9oZWphbnl5eXN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzODkzNzEsImV4cCI6MjA3MVx2NTM3MX0.sH8eNMMmmNjwPDmmUM29mXSgIA--cQiVbmgRsjh7hm0';

document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
    
    const pathParts = window.location.pathname.substring(1).split('/');
    const ntdId = pathParts[0];
    const modeParam = pathParts[1];
    
    if (ntdId && modeParam) {
        loadFeed(ntdId, modeParam);
    } else {
        showError('Invalid feed URL');
    }
});

async function loadFeed(ntdId, modeParam) {
    try {
        // Parse mode and TOS from URL parameter (e.g., "cb-pt" or "mb")
        const parts = modeParam.toUpperCase().split('-');
        const mode = parts[0];
        const tos = parts[1] || null;
        
        let query = `ntd_id=eq.${ntdId}&mode=eq.${mode}`;
        if (tos) {
            query += `&tos=eq.${tos}`;
        }
        
        const url = `${SUPABASE_URL}/rest/v1/gtfs_agencies?${query}&limit=1`;
        
        const response = await fetch(url, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to load feed');
        
        const feeds = await response.json();
        
        if (feeds.length === 0) {
            showError('Feed not found');
            return;
        }
        
        const feed = feeds[0];
        displayFeedInfo(feed);
        downloadFeed(feed);
        
    } catch (error) {
        console.error('Error loading feed:', error);
        showError('Error loading feed');
    }
}

function displayFeedInfo(feed) {
    const feedTitle = document.getElementById('feedTitle');
    const feedDetails = document.getElementById('feedDetails');
    
    feedTitle.textContent = feed.agency_name.toLowerCase();
    feedDetails.textContent = `${feed.mode}${feed.tos ? '-' + feed.tos : ''} • ${[feed.city, feed.state].filter(Boolean).join(', ').toLowerCase()}`;
    
    document.title = `${feed.agency_name.toLowerCase()} ${feed.mode.toLowerCase()} gtfs | gtfs.co`;
}

function downloadFeed(feed) {
    const statusDiv = document.getElementById('downloadStatus');
    
    // Clean weblink
    let downloadUrl = feed.weblink;
    if (downloadUrl && downloadUrl.startsWith('{')) {
        try {
            downloadUrl = JSON.parse(downloadUrl).url;
        } catch (e) {
            showError('Invalid download URL');
            return;
        }
    }
    
    if (!downloadUrl) {
        showError('No download URL available');
        return;
    }
    
    statusDiv.innerHTML = `
        <div class="download-ready">
            <i data-lucide="download"></i>
            <p>starting download...</p>
            <a href="${downloadUrl}" target="_blank" class="download-link">click here if download doesn't start</a>
        </div>
    `;
    
    lucide.createIcons();
    
    // Auto-start download
    setTimeout(() => {
        window.location.href = downloadUrl;
    }, 1000);
    
    // Show completion message after delay
    setTimeout(() => {
        statusDiv.innerHTML = `
            <div class="download-complete">
                <i data-lucide="check-circle"></i>
                <p>download started</p>
                <a href="/${feed.ntd_id}" class="back-to-agency">view all feeds for ${feed.agency_name.toLowerCase()}</a>
            </div>
        `;
        lucide.createIcons();
    }, 2000);
}

function showError(message) {
    const statusDiv = document.getElementById('downloadStatus');
    statusDiv.innerHTML = `
        <div class="download-error">
            <i data-lucide="alert-circle"></i>
            <p>${message}</p>
            <a href="/" class="back-to-search">back to search</a>
        </div>
    `;
    lucide.createIcons();
}