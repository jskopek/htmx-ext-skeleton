/**
 * htmx-ext-skeleton
 * An htmx extension for displaying skeleton screens during AJAX requests
 * See https://github.com/jskopek/htmx-ext-skeleton for documentation
 */
(function() {
    // Store original content before skeleton - key is a unique ID per request
    const originalContentStore = new Map();
    // Track the currently active skeleton (if any) - don't restore this one in beforeHistorySave
    let currentlyLoadingSkeletonId = null;

    // Set up global event listeners for swap/history events (these need to be global)
    document.body.addEventListener('htmx:beforeSwap', function(evt) {
        const swapTarget = evt.detail.target;
        if (swapTarget && swapTarget.classList.contains('skeleton-loading')) {
            swapTarget.classList.remove('skeleton-loading');
        }
        currentlyLoadingSkeletonId = null; // Request completed
    });

    document.body.addEventListener('htmx:afterSwap', function(evt) {
        const swapTarget = evt.detail.target;
        if (swapTarget) {
            const skeletonInstanceId = swapTarget.getAttribute('data-skeleton-id');
            if (skeletonInstanceId) {
                // Clean up after successful swap
                originalContentStore.delete(skeletonInstanceId);
                swapTarget.removeAttribute('data-skeleton-id');
            }
        }
    });

    document.body.addEventListener('htmx:beforeHistorySave', function() {
        // Restore original content before htmx saves the DOM snapshot
        // This prevents the skeleton from being cached in history
        // BUT: don't restore the currently loading skeleton - that would make it disappear!
        document.querySelectorAll('[data-skeleton-id]').forEach(target => {
            const id = target.getAttribute('data-skeleton-id');
            const original = id && originalContentStore.get(id);

            // Only restore if this is NOT the currently loading skeleton
            if (original && id !== currentlyLoadingSkeletonId) {
                target.innerHTML = original;
                target.classList.remove('skeleton-loading');
                originalContentStore.delete(id);
                target.removeAttribute('data-skeleton-id');
            }
        });
    });

    document.body.addEventListener('htmx:historyRestore', function() {
        // Remove skeleton-loading class from any elements (safety cleanup)
        document.querySelectorAll('.skeleton-loading').forEach(el => {
            el.classList.remove('skeleton-loading');
        });
    });

    htmx.defineExtension('skeleton', {
        onEvent: function (name, evt) {
            const elt = evt.detail.elt;

            // Check if element has skeleton extension enabled
            if (!elt.closest('[hx-ext*="skeleton"]')) {
                return;
            }

            // Get skeleton selector - use default "#skeleton" if not specified
            const skeletonSelector = elt.getAttribute('hx-skeleton') || '#skeleton';

            // Get Alpine.js data if specified
            const alpineDataAttr = elt.getAttribute('hx-skeleton-alpine');

            // Get the target element - priority: hx-skeleton-target, hx-target, htmx default
            let target;
            const skeletonTargetSelector = elt.getAttribute('hx-skeleton-target');

            if (skeletonTargetSelector) {
                // Use hx-skeleton-target if specified
                target = document.querySelector(skeletonTargetSelector);
            } else {
                const hxTargetSelector = elt.getAttribute('hx-target');
                if (hxTargetSelector) {
                    // Use hx-target if specified
                    target = document.querySelector(hxTargetSelector);
                } else {
                    // Use htmx's default target resolution
                    target = htmx.closest(elt, htmx.config.defaultSwapTarget) || elt;
                }
            }

            if (!target) {
                return;
            }

            // Handle htmx:beforeRequest - show skeleton immediately
            if (name === 'htmx:beforeRequest') {
                // Find the skeleton template using querySelector
                const skeletonScript = document.querySelector(skeletonSelector);
                if (!skeletonScript) {
                    return;
                }

                // Store the original content
                const originalContent = target.innerHTML;
                let skeletonContent = skeletonScript.textContent || skeletonScript.innerHTML;

                // Store original content with target element reference
                // Use a data attribute to track this specific skeleton instance
                const skeletonInstanceId = 'skeleton-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
                target.setAttribute('data-skeleton-id', skeletonInstanceId);
                originalContentStore.set(skeletonInstanceId, originalContent);

                // Track this as the currently loading skeleton
                currentlyLoadingSkeletonId = skeletonInstanceId;

                // Show skeleton immediately
                target.innerHTML = skeletonContent;
                target.classList.add('skeleton-loading');

                // If Alpine.js data is provided, update the Alpine component after initialization
                if (alpineDataAttr && window.Alpine) {
                    try {
                        const alpineData = JSON.parse(alpineDataAttr);

                        // Find the Alpine element in the target
                        const alpineElement = target.querySelector('[x-data]');
                        if (!alpineElement) {
                            console.warn('hx-skeleton-alpine requires the skeleton template to have an element with x-data attribute');
                            return;
                        }

                        // Wait for Alpine to initialize, then update the data
                        // Use nextTick to ensure Alpine has initialized the component
                        window.Alpine.nextTick(() => {
                            // Get the Alpine component's $data and update it
                            const component = window.Alpine.$data(alpineElement);
                            if (component) {
                                Object.assign(component, alpineData);
                            }
                        });
                    } catch (e) {
                        console.warn('Failed to apply hx-skeleton-alpine data:', e);
                    }
                }
            }

            // Handle errors - restore original content if request fails
            if (name === 'htmx:responseError' || name === 'htmx:sendError') {
                const skeletonId = target.getAttribute('data-skeleton-id');
                if (skeletonId) {
                    const originalContent = originalContentStore.get(skeletonId);
                    if (originalContent) {
                        target.innerHTML = originalContent;
                        originalContentStore.delete(skeletonId);
                    }
                    target.removeAttribute('data-skeleton-id');
                }
                target.classList.remove('skeleton-loading');
            }
        }
    });
})();