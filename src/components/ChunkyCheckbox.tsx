// The signature interaction. See DESIGN.md → "The chunky checkbox spec".
//
// We extend TipTap's TaskItem with a React node view so we can render an
// SVG check that overshoots the box bounds. The 32x32 SVG is centered on
// the 24x24 box (4px overflow each side). Toggling animates the stroke
// drawing in via stroke-dashoffset.

import { useEffect, useRef } from 'react';
import TaskItem from '@tiptap/extension-task-item';
import {
  NodeViewContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  type NodeViewProps,
} from '@tiptap/react';

const CHECK_PATH = 'M 4 18 L 13 26 L 30 4';

function ChunkyCheckboxView({ node, updateAttributes }: NodeViewProps): JSX.Element {
  const checked = Boolean(node.attrs['checked']);
  const pathRef = useRef<SVGPathElement | null>(null);

  useEffect(() => {
    const path = pathRef.current;
    if (path === null) return;
    const len = path.getTotalLength();
    path.style.strokeDasharray = String(len);
    // Going checked → unchecked moves offset back to len (hides the stroke);
    // unchecked → checked moves offset to 0 (reveals it). The CSS transition
    // animates between those two values.
    path.style.strokeDashoffset = checked ? '0' : String(len);
  }, [checked]);

  function toggle(e: React.MouseEvent<HTMLButtonElement>): void {
    e.preventDefault();
    e.stopPropagation();
    updateAttributes({ checked: !checked });
  }

  return (
    <NodeViewWrapper
      as="li"
      className="cb-li"
      data-checked={checked ? 'true' : 'false'}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        className="cb-box"
        onClick={toggle}
        // Prevent the editor from stealing focus / shifting the caret when
        // the user clicks the box.
        onMouseDown={(e) => e.preventDefault()}
        contentEditable={false}
      >
        <svg
          className="cb-svg"
          width="32"
          height="32"
          viewBox="0 0 32 32"
          aria-hidden="true"
        >
          <path
            ref={pathRef}
            className="cb-path"
            d={CHECK_PATH}
          />
        </svg>
      </button>
      <NodeViewContent as="div" className="cb-content" />
    </NodeViewWrapper>
  );
}

export const ChunkyTaskItem = TaskItem.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ChunkyCheckboxView);
  },
});
