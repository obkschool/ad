// Script to ensure Convex is properly loaded
(function() {
    // Check if Convex is already loaded
    if (typeof convex !== 'undefined') {
        console.log('Convex is already loaded, continuing...');
        return;
    }
    
    console.log('Loading Convex library...');
    
    // Create a script element to load Convex
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/convex@1.10.0/dist/browser.bundle.js';
    script.async = false; // We want this to load synchronously
    
    // Handle successful load
    script.onload = function() {
        console.log('Convex library loaded successfully!');
        if (typeof convex === 'undefined') {
            console.error('Convex is still undefined after loading. This might be a browser security issue.');
        }
    };
    
    // Handle loading error
    script.onerror = function() {
        console.error('Failed to load Convex library. Please check your internet connection and try again.');
        alert('Failed to load required libraries. Please refresh the page or check your internet connection.');
    };
    
    // Add the script to the document
    document.head.appendChild(script);
})(); 