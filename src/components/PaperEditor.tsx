import { useEffect, useRef } from 'react';
import { Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { Markdown } from 'tiptap-markdown';

interface Props {
  initialMarkdown: string;
  onChange: (md: string) => void;
}

interface MarkdownStorage {
  getMarkdown: () => string;
}

function readMarkdown(editor: Editor): string {
  const storage = (editor.storage as Record<string, unknown>)['markdown'];
  if (
    storage !== null &&
    typeof storage === 'object' &&
    storage !== undefined &&
    'getMarkdown' in storage &&
    typeof (storage as MarkdownStorage).getMarkdown === 'function'
  ) {
    return (storage as MarkdownStorage).getMarkdown();
  }
  return '';
}

export function PaperEditor({ initialMarkdown, onChange }: Props): JSX.Element {
  const onChangeRef = useRef<(md: string) => void>(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Markdown.configure({
        html: false,
        linkify: true,
        breaks: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
    ],
    content: initialMarkdown,
    onUpdate: ({ editor: e }) => {
      onChangeRef.current(readMarkdown(e));
    },
  });

  return <EditorContent editor={editor} className="pe-content" />;
}
