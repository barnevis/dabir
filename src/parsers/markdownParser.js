import { parseBlock } from './blockParser.js';
import { parseInline } from './inlineParser.js';

/**
 * Converts a Markdown string to an HTML string.
 */
export class MarkdownParser {
    /**
     * @param {import('../core/editor.js').DabirEditor} editor
     */
    constructor(editor) {
        this.editor = editor;
    }
    /**
     * Parses a markdown string into HTML.
     * @param {string} markdown
     * @returns {string}
     */
    parse(markdown) {
        if (!markdown) return '<div><br></div>';
        
        const lines = markdown.split('\n');
        let html = '';
        let paragraphLines = [];

        const flushParagraph = () => {
            if (paragraphLines.length > 0) {
                html += `<div>${parseInline(paragraphLines.join('\n'))}</div>`;
                paragraphLines = [];
            }
        };

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];

            let blockParsed = false;
            // Allow plugins to parse blocks first
            for (const pluginName of this.editor.plugins.keys()) {
                try {
                    const plugin = this.editor.plugins.get(pluginName);
                    if (plugin && plugin.markdownBlockParser) {
                        const result = plugin.markdownBlockParser(lines, i, this);
                        if (result) {
                            flushParagraph();
                            html += result.html;
                            i = result.lastIndex;
                            blockParsed = true;
                            break;
                        }
                    }
                } catch (error) {
                    console.error(`Dabir.js Error: Plugin "${pluginName}" crashed during markdown block parsing.`, 
                        `Line content: "${line.substring(0, 50)}..."`, error);
                    // Continue to next plugin or default parser
                }
            }
            if (blockParsed) continue;

            try {
                const blockResult = parseBlock(lines, i);
                if (blockResult) {
                    flushParagraph();
                    html += blockResult.html;
                    i = blockResult.lastIndex;
                } else if (line.trim() === '') {
                    flushParagraph();
                } else {
                    paragraphLines.push(line);
                }
            } catch (error) {
                 console.error(`Dabir.js Error: Core block parser crashed on line ${i}.`, error);
                 // Fallback: treat as plain text
                 paragraphLines.push(line);
            }
        }

        flushParagraph();
        
        if (!html) {
            return '<div><br></div>';
        }
        
        return html;
    }
}