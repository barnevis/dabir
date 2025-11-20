
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
        this.debouncedSave();
        this.editor.events.emit('input');
    }

    /**
     * Cleans up event listeners and timers.
     */
    destroy() {
        this.element.removeEventListener('input', this.boundHandle);
        if (this.debouncedSave && typeof this.debouncedSave.cancel === 'function') {
            this.debouncedSave.cancel();
        }
    }
}
