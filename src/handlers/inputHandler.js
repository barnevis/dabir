import { debounce } from '../utils/debounce.js';

/**
 * Handles the 'input' event on the editor.
 */
export class InputHandler {
    /**
     * @param {import('../core/editor.js').DabirEditor} editor
     */
    constructor(editor) {
        this.editor = editor;
        this.element = editor.element;

        this.debouncedSave = debounce(() => this.editor.saveContent(), 250);
        
        // Bind and store the handler to be able to remove it later
        this.boundHandle = this.handle.bind(this);
        this.element.addEventListener('input', this.boundHandle);
    }

    handle() {
        try {
            this.debouncedSave();
            this.editor.events.emit('input');
        } catch (error) {
            console.error('Dabir.js Error: InputHandler crashed.', error);
        }
    }

    /**
     * Cleans up event listeners and timers.
     */
    destroy() {
        // 1. Stop timer
        if (this.debouncedSave && typeof this.debouncedSave.cancel === 'function') {
            this.debouncedSave.cancel();
        }

        // 2. Remove listener if element exists
        if (this.element) {
            this.element.removeEventListener('input', this.boundHandle);
        }

        // 3. Clear references
        this.editor = null;
        this.element = null;
        this.debouncedSave = null;
        this.boundHandle = null;
    }
}