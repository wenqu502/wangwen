// 角色模块专用类型
// 注意：全局类型定义在 src/types/index.ts
// 此处仅放模块内部扩展类型

export interface CharacterFilter {
  search?: string
  tags?: string[]
  status?: string[]
}

export interface CharacterFormData {
  name: string
  aliases: string
  tags: string[]
  appearance: string
  personalityKeywords: string[]
  personalitySurface: string
  personalityInner: string
  personalityStressResponse: string
  background: string
  trauma?: string
  goals?: string
  arc?: string
  quotes: string[]
  abilities: string[]
  status: 'alive' | 'dead' | 'missing' | 'sealed'
}
