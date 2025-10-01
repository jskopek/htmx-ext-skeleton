/**
 * htmx-ext-skeleton
 * An htmx extension for displaying skeleton screens during AJAX requests
 * See https://github.com/jskopek/htmx-ext-skeleton for documentation
 */
(function() {
    // Store skeleton states - use target element as key
    const skeletonStates = new Map();

    htmx.defineExtension('skeleton', {
        onEvent: function (name, evt) {
            // Handle htmx:historyRestore - this fires when back/forward button restores from cache
            if (name === 'htmx:historyRestore') {
                // Remove skeleton-loading class from any elements
                document.querySelectorAll('.skeleton-loading').forEach(el => {
                    el.classList.remove('skeleton-loading');
                });
                return;
            }

            // Handle htmx:beforeHistorySave - restore original content before caching
            if (name === 'htmx:beforeHistorySave') {
                // Find all elements with skeleton-loading class and restore their original content
                document.querySelectorAll('.skeleton-loading').forEach(target => {
                    const originalContent = skeletonStates.get(target);
                    if (originalContent) {
                        target.innerHTML = originalContent;
                        target.classList.remove('skeleton-loading');
                    }
                });
                return;
            }

            const elt = evt.detail.elt;

            // Check if element has skeleton extension enabled
            if (!elt.closest('[hx-ext*="skeleton"]')) {
                return;
            }

            // Get skeleton ID - use default "skeleton" if not specified
            const skeletonId = elt.getAttribute('hx-skeleton') || 'skeleton';

            // Get Alpine.js data if specified
            const alpineDataAttr = elt.getAttribute('hx-skeleton-alpine');

            // Get the target element
            const targetSelector = elt.getAttribute('hx-target');
            if (!targetSelector) {
                return;
            }

            const target = document.querySelector(targetSelector);
            if (!target) {
                return;
            }

            // Handle htmx:beforeRequest - show skeleton immediately
            if (name === 'htmx:beforeRequest') {
                // Find the skeleton template
                const skeletonScript = document.getElementById(skeletonId);
                if (!skeletonScript) {
                    return;
                }

                // Store the original content
                const originalContent = target.innerHTML;
                let skeletonContent = skeletonScript.textContent || skeletonScript.innerHTML;

                // Store original content using the target element as key
                skeletonStates.set(target, originalContent);

                // Show skeleton immediately
                target.innerHTML = skeletonContent;
                target.classList.add('skeleton-loading');

                // Initialize Alpine.js if data is provided and Alpine is available
                if (alpineDataAttr && window.Alpine) {
                    try {
                        const alpineData = JSON.parse(alpineDataAttr);
                        // Find or use the first child element for Alpine
                        let alpineElement = target.querySelector('[x-data]');
                        if (!alpineElement) {
                            // If no x-data element exists, use the first child
                            alpineElement = target.firstElementChild;
                        }
                        if (alpineElement) {
                            // Add x-data attribute if it doesn't exist
                            if (!alpineElement.hasAttribute('x-data')) {
                                alpineElement.setAttribute('x-data', '{}');
                            }
                            // Store the data for Alpine to pick up
                            alpineElement._x_dataStack = [alpineData];
                            // Initialize Alpine on this element
                            window.Alpine.initTree(alpineElement);
                        }
                    } catch (e) {
                        console.warn('Failed to parse hx-skeleton-alpine data:', e);
                    }
                }
            }

            // Handle htmx:beforeSwap - remove skeleton just before swapping in new content
            if (name === 'htmx:beforeSwap') {
                target.classList.remove('skeleton-loading');
                skeletonStates.delete(target);
            }

            // Handle errors - restore original content if request fails
            if (name === 'htmx:responseError' || name === 'htmx:sendError') {
                const originalContent = skeletonStates.get(target);
                if (originalContent) {
                    target.innerHTML = originalContent;
                    skeletonStates.delete(target);
                }
                target.classList.remove('skeleton-loading');
            }
        }
    });
})();