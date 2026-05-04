/**
 * XSS 输入净化工具
 * 用于净化 AI 返回的 HTML 内容，防止 XSS 攻击
 */

const ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'hr']
const ALLOWED_ATTRS = ['href', 'target', 'rel', 'class']

/**
 * 净化 HTML 字符串，移除危险标签和属性
 */
export function sanitizeHtml(html: string): string {
  if (!html) return ''

  const temp = document.createElement('div')
  temp.innerHTML = html

  const walker = document.createTreeWalker(temp, NodeFilter.SHOW_ELEMENT)
  const nodesToRemove: Element[] = []

  let node: Element | null
  while ((node = walker.nextNode() as Element | null)) {
    const tagName = node.tagName.toLowerCase()

    if (!ALLOWED_TAGS.includes(tagName)) {
      nodesToRemove.push(node)
      continue
    }

    // 清理不允许的属性
    Array.from(node.attributes).forEach((attr) => {
      if (!ALLOWED_ATTRS.includes(attr.name.toLowerCase())) {
        node!.removeAttribute(attr.name)
      }
    })

    // 对 a 标签添加安全属性
    if (tagName === 'a') {
      node.setAttribute('target', '_blank')
      node.setAttribute('rel', 'noopener noreferrer')
    }
  }

  nodesToRemove.forEach((n) => {
    const parent = n.parentNode
    if (parent) {
      while (n.firstChild) {
        parent.insertBefore(n.firstChild, n)
      }
      parent.removeChild(n)
    }
  })

  return temp.innerHTML
}

/**
 * 净化纯文本，转义 HTML 特殊字符
 */
export function sanitizeText(text: string): string {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
