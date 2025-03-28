# Troubleshooting "convex is not defined" Error

If you're encountering the error "Failed to connect to Convex: convex is not defined", follow these steps to resolve it:

## Common Causes

1. **Script Loading Order**: The Convex library must be loaded before any code that uses it.
2. **Network Issues**: The script might fail to load due to network connectivity problems.
3. **Content Security Policy**: Browser security settings might block the script.
4. **Script Blocker Extensions**: Browser extensions might prevent the script from loading.

## Solution Steps

### 1. Check your browser console

First, open your browser's developer tools (usually F12 or right-click and select "Inspect") and look for error messages related to script loading.

### 2. Verify the Convex script is loading

Look for network errors related to loading the Convex script in the Network tab of browser developer tools.

### 3. Try these fixes:

#### Fix 1: Use a direct CDN link with a specific version

The app has been updated to use a specific version of Convex:
```html
<script src="https://unpkg.com/convex@1.10.0/dist/browser.bundle.js"></script>
```

#### Fix 2: Disable ad blockers or script blockers

Some browser extensions might block third-party scripts. Try temporarily disabling them.

#### Fix 3: Add crossorigin attribute

If CORS is an issue, update the script tag to include a crossorigin attribute:
```html
<script src="https://unpkg.com/convex@1.10.0/dist/browser.bundle.js" crossorigin="anonymous"></script>
```

#### Fix 4: Host the script locally

Download the Convex script and host it with your application:
1. Visit https://unpkg.com/convex@1.10.0/dist/browser.bundle.js
2. Save the file to your project directory
3. Update your HTML to reference the local file:
```html
<script src="browser.bundle.js"></script>
```

#### Fix 5: Check for Content Security Policy issues

If your page has a Content Security Policy, ensure it allows scripts from unpkg.com:
```html
<meta http-equiv="Content-Security-Policy" content="script-src 'self' unpkg.com">
```

### 4. Verify the fix

After making changes, clear your browser cache and reload the page. Check the browser console to ensure there are no more errors.

## Still Having Issues?

If you're still encountering the "convex is not defined" error after trying these steps:

1. Try using a different browser
2. Check if your internet connection has any restrictions on loading external scripts
3. Test the application on a different network
4. Contact Convex support for further assistance

Remember: The Convex library must be successfully loaded before any code that uses it can run properly. 