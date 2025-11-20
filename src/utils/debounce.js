
/**
 * Creates a debounced function that delays invoking func until after wait milliseconds have elapsed
 * since the last time the debounced function was invoked.
 * @param {Function} func The function to debounce.
 * @param {number} wait The number of milliseconds to delay.
 * @returns {Function} Returns the new debounced function with a .cancel() method.
 */
export function debounce(func, wait) {
    let timeout;
    
    const executedFunction = function(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };

    executedFunction.cancel = () => {
        clearTimeout(timeout);
    };

    return executedFunction;
}
