/**
 * یک کلاس ساده برای مدیریت و انتشار رویدادها جهت ارتباطات داخلی.
 * @class EventEmitter
 */
export default class EventEmitter {
    constructor() {
        /**
         * @private
         * @type {Map<string, Array<Function>>}
         */
        this.events = new Map();
    }

    /**
     * برای یک رویداد ثبت‌نام (subscribe) می‌کند.
     * @param {string} event - نام رویداد.
     * @param {Function} listener - تابع callback که باید اجرا شود.
     */
    on(event, listener) {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        this.events.get(event).push(listener);
    }

    /**
     * یک رویداد را منتشر (emit) می‌کند.
     * @param {string} event - نام رویداد.
     * @param  {...any} args - آرگومان‌هایی که به شنونده‌ها پاس داده می‌شوند.
     */
    emit(event, ...args) {
        if (this.events.has(event)) {
            this.events.get(event).forEach(listener => {
                try {
                    listener(...args);
                } catch (error) {
                    console.error(`Dabir.js Error: Exception in event listener for "${event}"`, error);
                }
            });
        }
    }

    /**
     * تمام شنونده‌های رویداد را پاک می‌کند.
     */
    clear() {
        this.events.clear();
    }
}