import type { Message, ReactionSummary } from '~/types/message'

export function trimMessageBlock(content: string): string {
  if (!content || typeof content !== 'string') return ''

  const lines = content.split(/\r?\n/)

  let startIndex = 0
  while (startIndex < lines.length && lines[startIndex]?.trim() === '') {
    startIndex++
  }

  let endIndex = lines.length - 1
  while (endIndex > startIndex && lines[endIndex]?.trim() === '') {
    endIndex--
  }

  if (startIndex > endIndex) return ''

  return lines.slice(startIndex, endIndex + 1).join('\n')
}

export function trimHtmlMessageBlock(html: string): string {
  if (!html) return ''

  const textContent = html.replace(/<[^>]*>/g, '').trim()
  if (!textContent) return ''

  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html

  function trimTextNodes(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      ;(node as Text).data = trimMessageBlock((node as Text).data)
      return
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      ;(node as Element).childNodes.forEach(trimTextNodes)
    }
  }

  trimTextNodes(tempDiv)

  const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_ELEMENT)
  let currentNode = walker.nextNode() as Element | null
  while (currentNode) {
    if (currentNode.children.length === 0 && !currentNode.textContent?.trim()) {
      currentNode.remove()
    }

    currentNode = walker.nextNode() as Element | null
  }

  return tempDiv.innerHTML
}

export function simpleTrimStartEnd(content: string): string {
  return content ? content.trimStart().trimEnd() : ''
}

export const trimMessage = simpleTrimStartEnd

export function normalizeDateValue(value: unknown): string | null {
  if (!value) return null
  if (typeof value === 'string') return value

  if (typeof value === 'object' && value !== null && '$date' in value) {
    const dateValue = (value as { $date?: unknown }).$date
    return typeof dateValue === 'string' ? dateValue : null
  }

  return null
}

export function formatLocalForBackend(date?: Date): string | undefined {
  if (!date) return undefined

  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

export function looksLikeUserId(value?: string | null): boolean {
  return Boolean(value && /^[a-f0-9]{24}$/i.test(value))
}

export function canEditMessage(message: Message, currentUserId: string): boolean {
  return message.sender_id === currentUserId
}

export function canDeleteMessage(message: Message, currentUserId: string): boolean {
  return message.sender_id === currentUserId
}

export function deduplicateReactions(reactions: ReactionSummary[] = [], currentUserId?: string): ReactionSummary[] {
  if (!reactions.length) return reactions

  const userReactionMap = new Map<string, string>()

  reactions.forEach((reaction) => {
    reaction.reacted_by?.forEach((userId) => {
      userReactionMap.set(userId, reaction.emoji)
    })
  })

  const deduplicatedMap = new Map<string, ReactionSummary>()

  reactions.forEach((reaction) => {
    const reactedBy = reaction.reacted_by?.filter(userId => userReactionMap.get(userId) === reaction.emoji) || []
    if (!reactedBy.length) return

    deduplicatedMap.set(reaction.emoji, {
      emoji: reaction.emoji,
      count: reactedBy.length,
      reacted_by_me: currentUserId ? reactedBy.includes(currentUserId) : !!reaction.reacted_by_me,
      reacted_by: reactedBy
    })
  })

  return Array.from(deduplicatedMap.values())
}
