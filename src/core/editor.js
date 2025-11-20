import EventEmitter from './eventEmitter.js';
import Storage from './storage.js';
import Selection from './selection.js';
import { MarkdownParser } from '../parsers/markdownParser.js';
import { HtmlParser } from '../parsers/htmlParser.js';
import { KeyboardHandler } from '../handlers/keyboardHandler.js';
import { MouseHandler } from '../handlers/mouseHandler.js';
import { ClipboardHandler } from '../handlers/clipboardHandler.js';
import { InputHandler } from '../handlers/inputHandler.js';
import { Renderer } from '../renderers/renderer.js';

/**
 * @typedef {object} DabirOptions
 * @property {string} [placeholder='اینجا بنویسید...'] - متنی که در هنگام خالی بودن ویرایشگر نمایش داده می‌شود.
 * @property {object} [storage] - تنظیمات مربوط به ذخیره‌سازی محلی.
 * @property {boolean} [storage.enabled=true] - فعال یا غیرفعال کردن ذخیره‌سازی خودکار.
 * @property {string} [storage.key='dabir-content'] - کلید منحصر به فرد برای ذخیره‌سازی در localStorage.
 * @property {Array<import('../plugins/plugin.js').Plugin>} [plugins=[]] - آرایه‌ای از کلاس‌های پلاگین برای فعال‌سازی.
 */

/**
 * کلاس اصلی ویرایشگر دبیر.
 * @class DabirEditor
 */
export class DabirEditor {
    /**
     * یک نمونه جدید از ویرایشگر دبیر ایجاد می‌کند.
     * @param {string} selector - سلکتور CSS برای المان ویرایشگر.
     * @param {DabirOptions} [options={}] - گزینه‌های پیکربندی برای ویرایشگر.
     */
    constructor(selector, options = {}) {
        /**
         * المان اصلی ویرایشگر.
         * @type {HTMLElement}
         */
        this.element = document.querySelector(selector);
        if (!this.element) {
            throw new Error(`Dabir.js: Element with selector "${selector}" not found.`);
        }

        /**
         * گزینه‌های پیکربندی ویرایشگر.
         * @type {DabirOptions}
         */
        this.options = {
            placeholder: 'اینجا بنویسید...',
            storage: { enabled: true, key: 'dabir-content' },
            plugins: [],
            ...options
        };
        
        /**
         * Flag to prevent double destruction.
         * @type {boolean}
         */
        this.isDestroyed = false;

        /**
         * سیستم مدیریت رویدادها.
         * @type {EventEmitter}
         */
        this.events = new EventEmitter();

        /**
         * ماژول مدیریت ذخیره‌سازی محلی.
         * @type {Storage}
         */
        this.storage = new Storage(this.options.storage);

        /**
         * ماژول مدیریت انتخاب متن (Selection).
         * @type {Selection}
         */
        this.selection = new Selection(this);

        /**
         * ماژول رندر و به‌روزرسانی DOM.
         * @type {Renderer}
         */
        this.renderer = new Renderer(this);
        
        /**
         * پارسر مارک‌داون به HTML.
         * @type {MarkdownParser}
         */
        this.parser = new MarkdownParser(this);

        /**
         * پارسر HTML به مارک‌داون.
         * @type {HtmlParser}
         */
        this.htmlParser = new HtmlParser(this);

        /**
         * مدیریت‌کننده رویدادهای ورودی.
         * @type {InputHandler}
         */
        this.inputHandler = new InputHandler(this);

        /**
         * مدیریت‌کننده رویدادهای کیبورد.
         * @type {KeyboardHandler}
         */
        this.keyboardHandler = new KeyboardHandler(this);

        /**
         * مدیریت‌کننده رویدادهای ماوس.
         * @type {MouseHandler}
         */
        this.mouseHandler = new MouseHandler(this);

        /**
         * مدیریت‌کننده رویدادهای کلیپ‌بورد.
         * @type {ClipboardHandler}
         */
        this.clipboardHandler = new ClipboardHandler(this);

        /**
         * مجموعه‌ای از پلاگین‌های نصب‌شده.
         * @type {Map<string, object>}
         */
        this.plugins = new Map();
        
        this._init();
    }

    /**
     * ویرایشگر را راه‌اندازی می‌کند.
     * @private
     */
    _init() {
        this.element.classList.add('dabir-editor');
        this.element.setAttribute('contenteditable', 'true');
        this.element.setAttribute('data-placeholder', this.options.placeholder);
        
        this._loadContent();
        this._initPlugins();
        
        this.events.emit('ready');
    }

    /**
     * محتوای ذخیره‌شده را بارگذاری می‌کند.
     * @private
     */
    _loadContent() {
        const savedContent = this.storage.load();
        if (savedContent) {
            this.element.innerHTML = savedContent;
        } else {
            this.element.innerHTML = '<div><br></div>';
        }
        this.events.emit('load', this);
    }
    
    /**
     * محتوای فعلی ویرایشگر را در حافظه محلی ذخیره می‌کند.
     */
    saveContent() {
        if (this.isDestroyed || !this.element) return;
        try {
            const html = this.element.innerHTML;
            this.storage.save(html);
            this.events.emit('change', { html, markdown: this.getMarkdown() });
        } catch (error) {
            console.error('Dabir.js Error: Failed to save content.', error);
        }
    }
    
    /**
     * پلاگین‌های مشخص‌شده در تنظیمات را راه‌اندازی می‌کند.
     * @private
     */
    _initPlugins() {
        if (Array.isArray(this.options.plugins)) {
            this.options.plugins.forEach(Plugin => this.use(Plugin));
        }
    }

    /**
     * یک پلاگین را ثبت و نصب می‌کند.
     * @param {import('../plugins/plugin.js').Plugin} Plugin - کلاس پلاگین برای نصب.
     * @param {object} [options={}] - گزینه‌های پیکربندی برای پلاگین.
     */
    use(Plugin, options = {}) {
        if (this.isDestroyed) return;
        try {
            if (this.plugins.has(Plugin.name)) return;
            const pluginApi = Plugin.install(this, options);
            this.plugins.set(Plugin.name, pluginApi || {});
        } catch (error) {
            console.error(`Dabir.js Error: Failed to install plugin "${Plugin.name || 'Unknown'}".`, error);
        }
    }
    
    /**
     * یک شنونده برای یک رویداد ثبت می‌کند.
     * @param {string} event - نام رویداد (مانند 'change', 'ready').
     * @param {Function} listener - تابع callback که در زمان وقوع رویداد فراخوانی می‌شود.
     */
    on(event, listener) {
        if (this.isDestroyed) return;
        this.events.on(event, listener);
    }

    /**
     * محتوای ویرایشگر را به صورت مارک‌داون دریافت می‌کند.
     * @returns {string} محتوای ویرایشگر به فرمت مارک‌داون.
     */
    getMarkdown() {
        if (this.isDestroyed) return '';
        try {
            return this.htmlParser.parse(this.element);
        } catch (error) {
            console.error('Dabir.js Error: Failed to generate Markdown.', error);
            return '';
        }
    }

    /**
     * محتوای ویرایشگر را به صورت HTML دریافت می‌کند.
     * @returns {string} محتوای ویرایشگر به فرمت HTML.
     */
    getHTML() {
        if (this.isDestroyed) return '';
        return this.element.innerHTML;
    }

    /**
     * محتوای ویرایشگر را تنظیم می‌کند.
     * @param {string} content - محتوایی که باید تنظیم شود.
     * @param {'markdown'|'html'} [format='markdown'] - فرمت محتوای ورودی.
     */
    setContent(content, format = 'markdown') {
        if (this.isDestroyed) return;
        try {
            const html = format === 'markdown' ? this.parser.parse(content) : content;
            this.element.innerHTML = html;
            this.events.emit('contentSet');
        } catch (error) {
            console.error('Dabir.js Error: Failed to set content.', error);
        }
    }

    /**
     * ویرایشگر را تخریب کرده و تمام منابع، شنونده‌ها و تایمرها را آزاد می‌کند.
     * این متد برای جلوگیری از نشت حافظه ضروری است.
     */
    destroy() {
        if (this.isDestroyed) return;
        this.isDestroyed = true;

        // 1. Destroy handlers (check existence before call)
        if (this.inputHandler) this.inputHandler.destroy();
        if (this.keyboardHandler) this.keyboardHandler.destroy();
        if (this.mouseHandler) this.mouseHandler.destroy();
        if (this.clipboardHandler) this.clipboardHandler.destroy();

        // 2. Allow plugins to cleanup
        
        // Cleanup stored API instances if they have a destroy method
        if (this.plugins) {
            this.plugins.forEach((pluginApi, name) => {
                try {
                    if (pluginApi && typeof pluginApi.destroy === 'function') {
                        pluginApi.destroy();
                    }
                } catch (error) {
                    console.error(`Dabir.js Error: Error destroying plugin "${name}".`, error);
                }
            });
            this.plugins.clear();
        }

        // Cleanup static classes
        if (this.options && this.options.plugins) {
            this.options.plugins.forEach(Plugin => {
                try {
                    if (typeof Plugin.destroy === 'function') {
                        Plugin.destroy(this);
                    }
                } catch (error) {
                    console.error(`Dabir.js Error: Error destroying static plugin "${Plugin.name}".`, error);
                }
            });
        }

        // 3. Clear internal event listeners
        if (this.events) this.events.clear();

        // 4. Cleanup DOM
        if (this.element) {
            this.element.removeAttribute('contenteditable');
            this.element.classList.remove('dabir-editor');
        }

        // 5. Clear references
        this.element = null;
        this.storage = null;
        this.selection = null;
        this.renderer = null;
        this.parser = null;
        this.htmlParser = null;
        this.inputHandler = null;
        this.keyboardHandler = null;
        this.mouseHandler = null;
        this.clipboardHandler = null;
        this.plugins = null;
        this.events = null;
        this.options = null;
    }
}