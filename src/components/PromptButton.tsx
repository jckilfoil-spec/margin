import { Sparkles } from 'lucide-react';

import { randomPrompt } from '../prompts';
import { useMargin } from '../store';

export function PromptButton(): JSX.Element {
  const editor = useMargin((s) => s.editor);

  function ask(): void {
    if (editor === null) return;
    const prompt = randomPrompt();
    editor
      .chain()
      .focus()
      .insertContent({
        type: 'blockquote',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: `Prompt: ${prompt}` }],
          },
        ],
      })
      .run();
  }

  return (
    <button
      type="button"
      className="pb-btn"
      onClick={ask}
      disabled={editor === null}
      aria-label="Insert a reflection prompt"
    >
      <span className="pb-icon">
        <Sparkles size={14} aria-hidden="true" />
      </span>
      <span className="pb-text">Prompt please!</span>
    </button>
  );
}
