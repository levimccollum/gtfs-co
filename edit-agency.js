const form = document.getElementById('agencyForm');
const emailInput = document.getElementById('agency_email');
const urlInputs = document.querySelectorAll('input[type="url"]');
const textInputs = document.querySelectorAll('input[type="text"]');
const telInput = document.getElementById('agency_phone');
const timezoneSelect = document.getElementById('agency_timezone');

// Validation functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function isValidURL(url) {
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname;
        return domain.includes('.') && domain.length > 3;
    } catch (e) {
        return false;
    }
}

function isValidLanguage(lang) {
    const langRegex = /^[a-z]{2,3}(-[A-Z]{2})?$/;
    return langRegex.test(lang);
}

function isValidPhone(phone) {
    const digitsOnly = phone.replace(/\D/g, '');
    return digitsOnly.length === 10;
}

// Generic validation function
function validateInput(input) {
    const value = input.value.trim();
    let isValid = false;
    
    if (!value) {
        resetInputStyling(input);
        return;
    }
    
    switch(input.id) {
        case 'agency_id':
        case 'agency_name':
            isValid = value.length > 0;
            break;
        case 'agency_timezone':
            isValid = value !== ""; // Valid if any option is selected
            break;
        case 'agency_lang':
            isValid = isValidLanguage(value);
            break;
        case 'agency_phone':
            isValid = isValidPhone(value);
            break;
        case 'agency_email':
            isValid = isValidEmail(value);
            break;
        case 'agency_url':
        case 'agency_fare_url':
            isValid = isValidURL(value);
            break;
    }
    
    if (isValid) {
        input.classList.add('valid');
        input.style.borderColor = '';
        input.style.backgroundColor = '';
    } else {
        input.classList.remove('valid');
        input.style.borderColor = '#dc2626';
        input.style.backgroundColor = '#fef2f2';
    }
}

function resetInputStyling(input) {
    input.classList.remove('valid');
    if (input.classList.contains('required')) {
        input.style.borderColor = '#fca5a5';
    } else {
        input.style.borderColor = '#e5e7eb';
    }
    input.style.backgroundColor = '#fafafa';
}

// Timezone dropdown validation
timezoneSelect.addEventListener('change', function() {
    validateInput(this);
});

// Apply validation to text inputs and email
[...textInputs, emailInput, telInput].forEach(input => {
    input.addEventListener('blur', function() {
        validateInput(this);
    });
    
    input.addEventListener('input', function() {
        if (this.style.borderColor === 'rgb(220, 38, 38)') {
            resetInputStyling(this);
        }
        this.classList.remove('valid');
    });
});

// Phone number formatting and restrictions
telInput.addEventListener('input', function() {
    let value = this.value.replace(/\D/g, '');
    
    if (value.length > 10) {
        value = value.slice(0, 10);
    }
    
    if (value.length >= 6) {
        value = `(${value.slice(0, 3)}) ${value.slice(3, 6)}-${value.slice(6)}`;
    } else if (value.length >= 3) {
        value = `(${value.slice(0, 3)}) ${value.slice(3)}`;
    } else if (value.length > 0) {
        value = `(${value}`;
    }
    
    this.value = value;
    
    if (this.style.borderColor === 'rgb(220, 38, 38)') {
        resetInputStyling(this);
    }
    this.classList.remove('valid');
});

telInput.addEventListener('keydown', function(e) {
    if ([8, 9, 27, 13, 46].indexOf(e.keyCode) !== -1 ||
        (e.keyCode === 65 && e.ctrlKey === true) ||
        (e.keyCode === 67 && e.ctrlKey === true) ||
        (e.keyCode === 86 && e.ctrlKey === true) ||
        (e.keyCode === 88 && e.ctrlKey === true)) {
        return;
    }
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
        e.preventDefault();
    }
});

// URL handling (existing code)
urlInputs.forEach(urlInput => {
    const originalPlaceholder = urlInput.getAttribute('placeholder');
    
    urlInput.addEventListener('focus', function() {
        this.setAttribute('placeholder', '');
        
        if (this.value === '') {
            this.value = 'https://';
            this.setSelectionRange(this.value.length, this.value.length);
        }
    });
    
    urlInput.addEventListener('blur', function() {
        const url = this.value.trim();
        
        if (url === 'https://' || url === 'http://' || url === '') {
            this.value = '';
            this.setAttribute('placeholder', originalPlaceholder);
            resetInputStyling(this);
        } else {
            validateInput(this);
        }
    });
    
    urlInput.addEventListener('input', function() {
        this.setAttribute('placeholder', '');
        
        if (this.value && !this.value.startsWith('https://') && !this.value.startsWith('http://')) {
            const withoutProtocol = this.value.replace(/^(https?:\/\/)?/, '');
            this.value = 'https://' + withoutProtocol;
        }
        
        if (this.style.borderColor === 'rgb(220, 38, 38)') {
            resetInputStyling(this);
        }
        this.classList.remove('valid');
    });
});

// Form submission validation
form.addEventListener('submit', function(e) {
    let hasErrors = false;
    
    [...textInputs, emailInput, telInput, timezoneSelect, ...urlInputs].forEach(input => {
        const value = input.value.trim();
        if (value) {
            validateInput(input);
            if (!input.classList.contains('valid')) {
                hasErrors = true;
            }
        }
    });
    
    if (hasErrors) {
        e.preventDefault();
        alert('Please fix the errors in the form.');
    }
});

// Export functionality
const exportButton = document.querySelector('.btn-export');

exportButton.addEventListener('click', function() {
    // Get all form values
    const formData = {
        agency_id: document.getElementById('agency_id').value.trim(),
        agency_name: document.getElementById('agency_name').value.trim(),
        agency_url: document.getElementById('agency_url').value.trim(),
        agency_timezone: document.getElementById('agency_timezone').value.trim(),
        agency_lang: document.getElementById('agency_lang').value.trim(),
        agency_phone: document.getElementById('agency_phone').value.trim(),
        agency_fare_url: document.getElementById('agency_fare_url').value.trim(),
        agency_email: document.getElementById('agency_email').value.trim()
    };
    
    // Create CSV header
    const headers = 'agency_id,agency_name,agency_url,agency_timezone,agency_lang,agency_phone,agency_fare_url,agency_email';
    
    // Create CSV row with form data
    const row = [
        formData.agency_id,
        formData.agency_name,
        formData.agency_url,
        formData.agency_timezone,
        formData.agency_lang,
        formData.agency_phone,
        formData.agency_fare_url,
        formData.agency_email
    ].join(',');
    
    // Combine header and data
    const csvContent = headers + '\n' + row;
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'agency.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
});

// Next button functionality
const nextButton = document.querySelector('.btn-next');

nextButton.addEventListener('click', function() {
    // Validate required fields before proceeding
    let hasRequiredFieldErrors = false;
    const requiredFields = document.querySelectorAll('.required');
    
    requiredFields.forEach(field => {
        if (!field.value.trim()) {
            hasRequiredFieldErrors = true;
            field.style.borderColor = '#dc2626';
            field.style.backgroundColor = '#fef2f2';
        }
    });
    
    if (hasRequiredFieldErrors) {
        alert('Please fill in all required fields before proceeding.');
        return;
    }
    
    // If validation passes, proceed to next step
    alert('Moving to next step: Routes editor'); // Replace with actual navigation
    // window.location.href = 'routes.html'; // Uncomment when you have the next page
});

// Initialize Lucide icons
lucide.createIcons();