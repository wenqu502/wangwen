import { describe, it, expect } from 'vitest'
import { mockChatStream } from './client'
import type { AIChatOptions } from './types'

describe('mockChatStream', () => {
  async function collectStream(options: AIChatOptions) {
    const chunks: string[] = []
    let toolCall: { name: string; args: Record<string, unknown> } | undefined
    for await (const chunk of mockChatStream(options)) {
      const delta = chunk.choices[0]?.delta
      if (delta?.content) {
        chunks.push(delta.content)
      }
      if (delta?.tool_calls) {
        const tc = delta.tool_calls[0]
        if (tc.function?.name) {
          toolCall = {
            name: tc.function.name,
            args: JSON.parse(tc.function.arguments || '{}'),
          }
        }
      }
    }
    return { text: chunks.at(-1) || '', toolCall }
  }

  it('should generate different characters for different inputs', async () => {
    const r1 = await collectStream({ messages: [{ role: 'user', content: '创建一个古风剑修' }] })
    const r2 = await collectStream({ messages: [{ role: 'user', content: '创建一个科幻机甲驾驶员' }] })

    expect(r1.toolCall).toBeDefined()
    expect(r2.toolCall).toBeDefined()
    expect(r1.toolCall!.name).toBe('createCharacter')
    expect(r2.toolCall!.name).toBe('createCharacter')

    const char1 = r1.toolCall!.args as { name: string; abilities: string[] }
    const char2 = r2.toolCall!.args as { name: string; abilities: string[] }

    expect(char1.name).not.toBe(char2.name)
    expect(r1.text).toContain('古风')
    expect(r2.text).toContain('科幻')
  })

  it('should generate plot node for 剧情 input', async () => {
    const r = await collectStream({ messages: [{ role: 'user', content: '帮我写一个大纲' }] })
    expect(r.toolCall).toBeDefined()
    expect(r.toolCall!.name).toBe('createPlotNode')
    const node = r.toolCall!.args as { title: string }
    expect(node.title.length).toBeGreaterThan(0)
  })

  it('should generate system for 体系 input', async () => {
    const r = await collectStream({ messages: [{ role: 'user', content: '设计一个魔法体系' }] })
    expect(r.toolCall).toBeDefined()
    expect(r.toolCall!.name).toBe('createSystem')
    const sys = r.toolCall!.args as { name: string }
    expect(sys.name.length).toBeGreaterThan(0)
  })

  it('should record idea for 灵感 input', async () => {
    const r = await collectStream({ messages: [{ role: 'user', content: '记录一个灵感：主角其实是反派的儿子' }] })
    expect(r.toolCall).toBeDefined()
    expect(r.toolCall!.name).toBe('createIdea')
    const idea = r.toolCall!.args as { content: string }
    expect(idea.content).toContain('主角其实是反派的儿子')
  })

  it('should return guide text for unmatched input', async () => {
    const r = await collectStream({ messages: [{ role: 'user', content: '你好' }] })
    expect(r.toolCall).toBeUndefined()
    expect(r.text).toContain('织文')
    expect(r.text).toContain('演示模式')
  })
})
