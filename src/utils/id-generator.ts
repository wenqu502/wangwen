let counter = 0
const timestamp = Date.now()

export function generateId(prefix: string): string {
  counter++
  return `${prefix}_${timestamp}_${counter}`
}

export function generateWorkId(): string {
  return generateId('work')
}

export function generateCharacterId(): string {
  return generateId('char')
}

export function generateNodeId(): string {
  return generateId('node')
}

export function generateRelationId(): string {
  return generateId('rel')
}

export function generateSystemId(): string {
  return generateId('sys')
}

export function generateIdeaId(): string {
  return generateId('idea')
}

export function generateConversationId(): string {
  return generateId('conv')
}

export function generateMessageId(): string {
  return generateId('msg')
}

export function generateBranchId(): string {
  return generateId('branch')
}
