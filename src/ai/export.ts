import type { Conversation, ConversationMessage, ExportFormat } from './types'

function formatTimestamp(ts: number): string {
  const d = new Date(ts)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function messageToText(msg: ConversationMessage): string {
  const roleLabel = msg.role === 'user' ? '用户' : msg.role === 'assistant' ? 'AI' : msg.role === 'system' ? '系统' : '工具'
  const time = formatTimestamp(msg.timestamp)
  return `[${time}] ${roleLabel}:\n${msg.content}`
}

function messageToMarkdown(msg: ConversationMessage): string {
  const roleLabel = msg.role === 'user' ? '👤 用户' : msg.role === 'assistant' ? '🤖 AI' : msg.role === 'system' ? '⚙️ 系统' : '🔧 工具'
  const time = formatTimestamp(msg.timestamp)
  return `### ${roleLabel} — ${time}\n\n${msg.content}\n`
}

function branchToText(branch: { name: string; messages: ConversationMessage[] }): string {
  if (branch.messages.length === 0) return ''
  const header = `\n=== ${branch.name} ===\n`
  const body = branch.messages.map(messageToText).join('\n\n')
  return header + body
}

function branchToMarkdown(branch: { name: string; messages: ConversationMessage[] }): string {
  if (branch.messages.length === 0) return ''
  const header = `## 📌 ${branch.name}\n`
  const body = branch.messages.map(messageToMarkdown).join('\n')
  return header + body
}

export function exportConversation(conversation: Conversation, format: ExportFormat): string {
  const activeBranch = conversation.branches.find((b) => b.id === conversation.activeBranchId)
  const otherBranches = conversation.branches.filter((b) => b.id !== conversation.activeBranchId)

  if (format === 'text') {
    let output = `会话标题: ${conversation.title}\n`
    output += `导出时间: ${formatTimestamp(Date.now())}\n`
    output += `所属作品: ${conversation.workId}\n`
    output += '='.repeat(40) + '\n'

    if (activeBranch) {
      output += branchToText(activeBranch)
    }

    if (otherBranches.length > 0) {
      output += '\n\n--- 其他分支 ---\n'
      for (const branch of otherBranches) {
        output += branchToText(branch)
      }
    }

    return output
  }

  // markdown
  let output = `# ${conversation.title}\n\n`
  output += `> 导出时间: ${formatTimestamp(Date.now())}\n`
  output += `> 所属作品: ${conversation.workId}\n\n`
  output += '---\n\n'

  if (activeBranch) {
    output += branchToMarkdown(activeBranch)
  }

  if (otherBranches.length > 0) {
    output += '\n## 其他分支\n\n'
    for (const branch of otherBranches) {
      output += branchToMarkdown(branch)
    }
  }

  return output
}

export function downloadExport(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export function getExportFilename(conversation: Conversation, format: ExportFormat): string {
  const ext = format === 'markdown' ? 'md' : 'txt'
  const safeTitle = conversation.title.replace(/[\\/:*?"<>|]/g, '_')
  const date = new Date().toISOString().slice(0, 10)
  return `${safeTitle}_${date}.${ext}`
}
