import React from 'react';

type FormattedAiTextProps = {
  text: string;
  className?: string;
};

type InlinePart = {
  content: string;
  bold: boolean;
};

type ParagraphBlock = {
  type: 'paragraph';
  text: string;
};

type ListBlock = {
  type: 'ordered-list' | 'unordered-list';
  items: string[];
};

type TextBlock = ParagraphBlock | ListBlock;

const normalizeText = (value: string) =>
  value
    .replace(/\r\n/g, '\n')
    .replace(/([:!?])\s+(\d+\.\s+)/g, '$1\n$2')
    .replace(/([a-z)])\s+(\d+\.\s+)/gi, '$1\n$2')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const parseInline = (text: string): InlinePart[] => {
  const parts: InlinePart[] = [];
  const pattern = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ content: text.slice(lastIndex, match.index), bold: false });
    }

    parts.push({ content: match[1], bold: true });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ content: text.slice(lastIndex), bold: false });
  }

  return parts.length > 0 ? parts : [{ content: text, bold: false }];
};

const buildBlocks = (value: string): TextBlock[] => {
  const normalized = normalizeText(value);
  if (!normalized) {
    return [];
  }

  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  const blocks: TextBlock[] = [];

  for (const line of lines) {
    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      const lastBlock = blocks[blocks.length - 1];
      if (lastBlock?.type === 'ordered-list') {
        lastBlock.items.push(orderedMatch[1]);
      } else {
        blocks.push({ type: 'ordered-list', items: [orderedMatch[1]] });
      }
      continue;
    }

    const unorderedMatch = line.match(/^[-*]\s+(.+)$/);
    if (unorderedMatch) {
      const lastBlock = blocks[blocks.length - 1];
      if (lastBlock?.type === 'unordered-list') {
        lastBlock.items.push(unorderedMatch[1]);
      } else {
        blocks.push({ type: 'unordered-list', items: [unorderedMatch[1]] });
      }
      continue;
    }

    blocks.push({ type: 'paragraph', text: line });
  }

  return blocks;
};

const renderInline = (text: string) =>
  parseInline(text).map((part, index) =>
    part.bold ? (
      <strong key={`${part.content}-${index}`} className="font-semibold text-[#F7F7F7]">
        {part.content}
      </strong>
    ) : (
      <React.Fragment key={`${part.content}-${index}`}>{part.content}</React.Fragment>
    ),
  );

export const FormattedAiText: React.FC<FormattedAiTextProps> = ({ text, className }) => {
  const blocks = buildBlocks(text);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className={className ?? ''}>
      {blocks.map((block, index) => {
        if (block.type === 'ordered-list') {
          return (
            <ol key={`ordered-${index}`} className="ml-5 list-decimal space-y-2">
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>{renderInline(item)}</li>
              ))}
            </ol>
          );
        }

        if (block.type === 'unordered-list') {
          return (
            <ul key={`unordered-${index}`} className="ml-5 list-disc space-y-2">
              {block.items.map((item, itemIndex) => (
                <li key={`${item}-${itemIndex}`}>{renderInline(item)}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={`paragraph-${index}`} className={index > 0 ? 'mt-3' : undefined}>
            {renderInline((block as ParagraphBlock).text)}
          </p>
        );
      })}
    </div>
  );
};
