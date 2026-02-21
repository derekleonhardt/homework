import type { TopicTag } from '@/lib/tag-utils'

interface TagChipProps {
  tag: TopicTag
}

export function TagChip({ tag }: TagChipProps) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 font-[family-name:var(--font-dm-sans)] text-[11px] leading-tight"
      style={{
        backgroundColor: `${tag.color}1A`,
        color: tag.color,
      }}
      title={tag.name}
    >
      {tag.name}
    </span>
  )
}
