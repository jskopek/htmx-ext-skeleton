/**
 * htmx-ext-skeleton
 *
 * An htmx extension for displaying skeleton screens during AJAX requests
 *
 * Usage:
 *   <!-- Default skeleton (uses id="skeleton") -->
 *   <div hx-ext="skeleton" hx-get="/api/data" hx-target="#content">
 *
 *   <script type="text/template" id="skeleton">
 *     <div class="skeleton-placeholder">Loading...</div>
 *   </script>
 *
 *   <!-- Custom skeleton -->
 *   <div hx-ext="skeleton" hx-get="/api/data" hx-target="#content" hx-skeleton="my-skeleton">
 *
 *   <script type="text/template" id="my-skeleton">
 *     <div class="skeleton-placeholder">Loading...</div>
 *   </script>
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
                const skeletonContent = skeletonScript.textContent || skeletonScript.innerHTML;

                // Store original content using the target element as key
                skeletonStates.set(target, originalContent);

                // Show skeleton immediately
                target.innerHTML = skeletonContent;
                target.classList.add('skeleton-loading');
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