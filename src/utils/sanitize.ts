/**
 * XSS 输入净化工具 (P1-006)
 *
 * 用于净化 AI 返回的 HTML 内容，防止 XSS 攻击。
 * 设计原则：白名单策略，只允许已知安全的标签和属性。
 *
 * 防护措施：
 * 1. 标签白名单：只允许基础排版标签
 * 2. 属性白名单：只允许 href/target/rel/class
 * 3. URL 协议过滤：禁止 javascript:, data:, vbscript: 等危险协议
 * 4. 事件处理器过滤：移除所有 on* 属性
 * 5. CSS 表达式过滤：防止 style 中的 expression()
 */

const ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'code', 'pre', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'hr']
const ALLOWED_ATTRS = ['href', 'target', 'rel', 'class']
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:']

/** 危险协议黑名单 */
const DANGEROUS_PROTOCOLS = ['javascript:', 'data:', 'vbscript:', 'file:', 'about:']

/** 危险 CSS 模式 */
const DANGEROUS_CSS = ['expression', 'javascript:', 'vbscript:', 'data:', '@import']

function sanitizeHref(href: string): string {
  const trimmed = href.trim().toLowerCase()

  // 绝对禁止危险协议（不依赖 URL 解析，先做前缀匹配）
  for (const protocol of DANGEROUS_PROTOCOLS) {
    if (trimmed.startsWith(protocol)) return ''
  }

  // 允许的相对路径
  if (
    trimmed.startsWith('#') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('./')
  ) {
    return href
  }

  // 允许的协议
  try {
    const url = new URL(href)
    if (ALLOWED_PROTOCOLS.includes(url.protocol)) return href
  } catch {
    // 非有效 URL
  }

  return ''
}

/** 检查属性名是否是事件处理器 */
function isEventHandler(attrName: string): boolean {
  return attrName.toLowerCase().startsWith('on')
}

/** 检查 CSS 值是否包含危险内容 */
function isDangerousCss(value: string): boolean {
  const lower = value.toLowerCase()
  return DANGEROUS_CSS.some((pattern) => lower.includes(pattern))
}

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
      const attrName = attr.name.toLowerCase()
      // 禁止事件处理器 (onclick, onerror, onload 等)
      if (isEventHandler(attrName)) {
        node!.removeAttribute(attr.name)
        return
      }
      // 禁止 style 属性中的危险 CSS
      if (attrName === 'style' && isDangerousCss(attr.value)) {
        node!.removeAttribute(attr.name)
        return
      }
      if (!ALLOWED_ATTRS.includes(attrName)) {
        node!.removeAttribute(attr.name)
      }
    })

    // 对 a 标签添加安全属性
    if (tagName === 'a') {
      const href = node.getAttribute('href')
      if (href) {
        node.setAttribute('href', sanitizeHref(href))
      }
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
