/**
 * Message trimming utilities for chat application
 * Trims only outer blocks of whitespace/newlines while preserving internal formatting
 */

export function trimMessageBlock(content: string): string {
  if (!content || typeof content !== 'string') return ''
  
  // Split into lines
  const lines = content.split(/\r?\n/)
  
  // Trim leading empty lines
  let startIndex = 0
  while (startIndex < lines.length && lines[startIndex].trim() === '') {
    startIndex++
  }
  
  // Trim trailing empty lines
  let endIndex = lines.length - 1
  while (endIndex > startIndex && lines[endIndex].trim() === '') {
    endIndex--
  }
  
  // Join remaining lines with original newlines
  if (startIndex > endIndex) return ''
  
  const trimmedLines = lines.slice(startIndex, endIndex + 1)
  return trimmedLines.join('\n')
}

/**
 * Enhanced trim for HTML content - preserves structure but removes outer whitespace blocks
 */
export function trimHtmlMessageBlock(html: string): string {
  if (!html) return ''
  
  // Quick text content check first
  const textContent = html.replace(/<[^>]*>/g, '').trim()
  if (!textContent) return ''
  
  // Parse HTML and trim outer whitespace blocks from text nodes
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = html
  
  // Recursive trim function for text nodes
  function trimTextNodes(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = (node as Text).data
      const trimmed = trimMessageBlock(text)
      ;(node as Text).data = trimmed
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      ;(node as Element).childNodes.forEach(trimTextNodes)
    }
  }
  
  trimTextNodes(tempDiv)
  
  // Clean up empty elements
  const walker = document.createTreeWalker(tempDiv, NodeFilter.SHOW_ELEMENT)
  let currentNode: Element | null = null
  while (currentNode = walker.nextNode() as Element | null) {
    if (currentNode.children.length === 0 && !currentNode.textContent?.trim()) {
      currentNode.remove()
    }
  }
  
  return tempDiv.innerHTML
}

/**
 * Simple start/end whitespace trim (preserves ALL internal spaces/newlines)
 * Exact match for user requirement: only trims absolute start/end chars
 */
export function simpleTrimStartEnd(content: string): string {
  return content ? content.trimStart().trimEnd() : ''
}

/**
 * Legacy trim alias for minimal disruption
 */
export const trimMessage = simpleTrimStartEnd

