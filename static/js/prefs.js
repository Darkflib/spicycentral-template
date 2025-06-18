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
     * Retrieves user preferences from localStorage, merging them with defaults to ensure all required keys are present.
     * Returns default preferences if none are stored or if stored data is invalid.
     * @returns {object} The current user preferences.
     */
    function loadPreferences() {
        const stored = localStorage.getItem(PREFERENCES_KEY);
        try {
            const parsed = stored ? JSON.parse(stored) : {};
            const safe = {
                theme: ['light', 'dark', 'auto'].includes(parsed.theme)
                    ? parsed.theme
                    : DEFAULT_PREFERENCES.theme,
                layout: ['standard', 'wide', 'focused'].includes(parsed.layout)
                    ? parsed.layout
                    : DEFAULT_PREFERENCES.layout
            };
            return { ...DEFAULT_PREFERENCES, ...safe };
        } catch (e) {
            console.error("Error parsing stored preferences:", e);
            return { ...DEFAULT_PREFERENCES };
        }
    }
    }

    /**
     * Persistently stores the current user preferences in localStorage.
     */
    function savePreferences() {
        localStorage.setItem(PREFERENCES_KEY, JSON.stringify(currentPrefs));
    }

    /**
     * Applies the specified theme to the document, updating the 'data-bs-theme' attribute on the <html> element.
     * For the 'auto' option, the theme is set according to the user's OS-level dark mode preference.
     * Updates and saves the current theme preference.
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
     * Applies the specified layout to the document and saves the preference.
     * 
     * Sets the 'data-layout' attribute on the `<html>` element to control site layout appearance.
     * @param {string} layout - The layout mode to apply ('standard', 'wide', or 'focused').
     */
    function applyLayout(layout) {
        document.documentElement.setAttribute('data-layout', layout);
        // Alternatively, this attribute could be applied to document.body or a main content wrapper
        // depending on how CSS is structured to handle layout changes.
        currentPrefs.layout = layout; // Update current preferences state.
        savePreferences(); // Persist the change.
    }

    /**
     * Creates and attaches a Bootstrap Popover to the specified element, providing UI controls for changing theme and layout preferences.
     * 
     * The popover includes dropdowns for theme and layout selection, initialised to the current preferences. Changes made via the popover are applied and saved immediately.
     * 
     * @param {HTMLElement} triggerElement - The element that triggers the popover when clicked.
     * @returns {bootstrap.Popover | undefined} The Popover instance if initialised successfully, or undefined if Bootstrap Popover is unavailable.
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
