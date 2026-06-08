/**
 * Doze Studio - Bootstrap Application Entry Point
 * 
 * Safe bootstrap layer that detects when the DOM has loaded 
 * and initializes the main DozeStudioAnimation controller.
 * 
 * @author Estúdio Doze
 */

(function() {
    'use strict';

    // Initialize the animation system when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new DozeStudioAnimation();
        });
    } else {
        new DozeStudioAnimation();
    }
})();
