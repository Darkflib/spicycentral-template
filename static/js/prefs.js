// static/js/prefs.js
// Manages user preferences for theme (light/dark/auto) and layout (standard/wide/focused).
// Preferences are saved to localStorage and applied on page load.
// Includes functionality for a Bootstrap popover to change settings.

(function() {
    'use strict'; // Enforces stricter parsing and error handling in JavaScript.

    // Key used to store preferences in localStorage.
    const PREFERENCES_KEY = 'sitePreferences';
    // Default preferences if none are found in localStorage or if parsing fails.
    const DEFAULT_PREFERENCES = {
        theme: 'auto',      // Options: 'light', 'dark', 'auto'
        layout: 'standard'  // Options: 'standard', 'wide', 'focused'
    };

    // Load current preferences from localStorage or use defaults.
    let currentPrefs = loadPreferences();

    /**
     * Loads preferences from localStorage.
     * If no preferences are stored, or if they are malformed, returns default preferences.
     * @returns {object} The loaded or default preferences.
     */
    function loadPreferences() {
        const stored = localStorage.getItem(PREFERENCES_KEY);
        try {
            // Merge stored preferences with defaults to ensure all keys are present.
            return stored ? { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) } : { ...DEFAULT_PREFERENCES };
        } catch (e) {
            console.error("Error parsing stored preferences:", e);
            return { ...DEFAULT_PREFERENCES }; // Return defaults on error.
        }
    }

    /**
     * Saves the current preferences object to localStorage.
     */
    function savePreferences() {
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(currentPrefs));
    }

    /**
     * Applies the selected theme to the document.
     * Sets the 'data-bs-theme' attribute on the <html> element.
     * For 'auto' theme, it respects the user's OS-level preference.
     * @param {string} theme - The theme to apply ('light', 'dark', or 'auto').
     */
    function applyTheme(theme) {
        if (theme === 'auto') {
            // Check OS preference for dark mode.
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.documentElement.setAttribute('data-bs-theme', prefersDark ? 'dark' : 'light');
        } else {
            document.documentElement.setAttribute('data-bs-theme', theme);
        }
        currentPrefs.theme = theme; // Update current preferences state.
        savePreferences(); // Persist the change.
    }

    /**
     * Applies the selected layout to the document.
     * Sets the 'data-layout' attribute on the <html> element.
     * @param {string} layout - The layout to apply ('standard', 'wide', or 'focused').
     */
    function applyLayout(layout) {
        document.documentElement.setAttribute('data-layout', layout);
        // Alternatively, this attribute could be applied to document.body or a main content wrapper
        // depending on how CSS is structured to handle layout changes.
        currentPrefs.layout = layout; // Update current preferences state.
        savePreferences(); // Persist the change.
    }

    /**
     * Creates and initializes a Bootstrap Popover for changing preferences.
     * The popover's content is dynamically generated with controls for theme and layout.
     * @param {HTMLElement} triggerElement - The HTML element that will trigger the popover.
     * @returns {bootstrap.Popover | undefined} The Popover instance, or undefined if Bootstrap Popover component is not available.
     */
    function createPreferencesPopover(triggerElement) {
        if (!window.bootstrap || !window.bootstrap.Popover) {
            console.error("Bootstrap Popover component is not loaded. Ensure Bootstrap JS is included.");
            return; // Exit if Popover component is missing.
        }

        // Create the HTML content for the popover.
        const popoverContent = document.createElement('div');
        popoverContent.classList.add('p-2'); // Bootstrap padding class.
        popoverContent.innerHTML = `
            <h5>Preferences</h5>
            <div class="mb-2">
                <label for="themeSelectPopover" class="form-label form-label-sm">Theme</label>
                <select class="form-select form-select-sm" id="themeSelectPopover">
                    <option value="auto">Auto</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                </select>
            </div>
            <div>
                <label for="layoutSelectPopover" class="form-label form-label-sm">Layout</label>
                <select class="form-select form-select-sm" id="layoutSelectPopover">
                    <option value="standard">Standard</option>
                    <option value="wide">Wide</option>
                    <option value="focused">Focused</option>
                </select>
            </div>
            <!-- TODO: (prefs.js) Add more preference options here, e.g., font size, animations. -->
        `;

        const themeSelect = popoverContent.querySelector('#themeSelectPopover');
        const layoutSelect = popoverContent.querySelector('#layoutSelectPopover');

        // Set initial values of select elements to reflect current preferences.
        themeSelect.value = currentPrefs.theme;
        layoutSelect.value = currentPrefs.layout;

        // Add event listeners to apply changes immediately when an option is selected.
        themeSelect.addEventListener('change', (e) => applyTheme(e.target.value));
        layoutSelect.addEventListener('change', (e) => applyLayout(e.target.value));

        // Initialize and return the Bootstrap Popover.
        return new bootstrap.Popover(triggerElement, {
            content: popoverContent,    // The HTML content created above.
            html: true,                 // Allows HTML in the content.
            placement: 'bottom',        // Preferred placement of the popover.
            trigger: 'click',           // Open/close on click. 'focus' could also be used for accessibility.
            title: 'Display Settings'   // Optional title for the popover.
        });
    }

    // Apply initial preferences as soon as the script loads.
    // This is done after the FOUC-prevention script in base.html,
    // ensuring JS-driven logic (like 'auto' theme based on media query) is correctly applied.
    applyTheme(currentPrefs.theme);
    applyLayout(currentPrefs.layout);

    // Listen for changes in the OS's color scheme.
    // If the theme is set to 'auto', this will update the site theme dynamically.
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', event => {
        if (currentPrefs.theme === 'auto') {
            // Re-apply the 'auto' theme logic, which will detect the new OS preference.
            document.documentElement.setAttribute('data-bs-theme', event.matches ? 'dark' : 'light');
        }
    });

    // Expose a public interface on the window object to allow initialization from HTML.
    window.sitePreferences = {
        /**
         * Initializes the preferences popover on a given trigger element.
         * @param {string} triggerSelector - A CSS selector for the popover trigger button.
         */
        initPopover: function(triggerSelector) {
            const triggerElement = document.querySelector(triggerSelector);
            if (triggerElement) {
                createPreferencesPopover(triggerElement);
            } else {
                console.warn(`Popover trigger element '${triggerSelector}' not found.`);
            }
        },
        // Expose core functions if direct manipulation is ever needed (though typically managed by popover).
        applyTheme,
        applyLayout
    };

    // Automatically initialize the popover for an element with a specific ID when the DOM is fully loaded.
    // This is a common pattern for components that need to be activated after the page structure is ready.
    document.addEventListener('DOMContentLoaded', () => {
        const popoverButton = document.getElementById('preferencesPopoverButton');
        if (popoverButton) {
            window.sitePreferences.initPopover('#preferencesPopoverButton');
        }
    });

})(); // End of IIFE
