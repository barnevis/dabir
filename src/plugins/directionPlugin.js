import Plugin from './plugin.js';

/**
 * Automatically sets the text direction (RTL/LTR) for elements.
 * Optimized to handle large documents by updating only the active block on input.
 */
export class DirectionPlugin extends Plugin {
    /**
     * @param {import('../core/editor.js').DabirEditor} editor
     */
    static install(editor) {
        const updateAll = () => this.updateAllDirections(editor.element);
        const updateActive = () => this.updateActiveBlock(editor);

        // Update everything only on major changes
        editor.on('load', updateAll);
        editor.on('contentSet', updateAll);
        
        // On paste, multiple blocks might be introduced, so we check everything
        // We use requestAnimationFrame to let the DOM settle first
        editor.on('paste', () => requestAnimationFrame(updateAll));

        // CRITICAL OPTIMIZATION: Only update the specific block being edited on keypress/input
        editor.on('input', updateActive);
    }

    /**
     * Updates direction for all relevant elements in the container.
     * Should be used sparingly (e.g., load, paste).
     * @param {HTMLElement} rootElement
     */
    static updateAllDirections(rootElement) {
        requestAnimationFrame(() => {
            const elements = rootElement.querySelectorAll('div, p, h1, h2, h3, h4, li, th, td, blockquote, figcaption');
            elements.forEach(this.setDirection);
        });
    }

    /**
     * Updates direction only for the block containing the cursor.
     * This is O(1) complexity compared to O(n) of updateAllDirections.
     * @param {import('../core/editor.js').DabirEditor} editor
     */
    static updateActiveBlock(editor) {
        const sel = window.getSelection();
        if (!sel || !sel.rangeCount) return;

        const anchor = sel.anchorNode;
        if (!anchor) return;

        // Find the closest block-level element being edited
        // If anchor is text, get parent. If element, start there.
        let target = anchor.nodeType === Node.TEXT_NODE ? anchor.parentElement : anchor;

        // Traverse up until we find a block element or hit the editor root
        while (target && target !== editor.element) {
            const tagName = target.tagName;
            // List of block elements we care about
            if (['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'LI', 'TH', 'TD', 'BLOCKQUOTE', 'FIGCAPTION'].includes(tagName)) {
                this.setDirection(target);
                break;
            }
            target = target.parentElement;
        }
    }
    
    /**
     * Calculates and sets the direction for a single element.
     * @param {HTMLElement} element
     */
    static setDirection(element) {
        const text = element.textContent || '';
        
        // Optimization: If text is empty, ensure default RTL but don't run regex
        if (!text.trim()) {
             if (element.getAttribute('dir') !== 'rtl') {
                 element.setAttribute('dir', 'rtl');
             }
             return;
        }

        // Regex looks for the first Persian/Arabic char or English char
        const firstLetterMatch = text.match(/[a-zA-Z\u0600-\u06FF]/);

        if (firstLetterMatch) {
            const isRTL = /[\u0600-\u06FF]/.test(firstLetterMatch[0]);
            const newDir = isRTL ? 'rtl' : 'ltr';
            
            // DOM Write Optimization: Only touch the DOM if the value actually changes
            if (element.dir !== newDir) {
                element.dir = newDir;
            }
        }
        // If no strong direction character is found (e.g. numbers or symbols), preserve current direction
    }
}