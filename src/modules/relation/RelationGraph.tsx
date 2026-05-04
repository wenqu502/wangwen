import { useEffect, useRef } from 'react'
import type { Character, RelationEdge } from '@/types'

interface RelationGraphProps {
  characters: Character[]
  edges: RelationEdge[]
  onSelectCharacter?: (id: string) => void
}

export function RelationGraph({ characters, edges, onSelectCharacter }: RelationGraphProps) {
  const containerRef = useRefRef<HTMLDivElement>(null)
  const networkRef = useRef<any>(null)

  useEffect(() => {
    if (!containerRef.current) return

    let destroyed = false

    import('vis-network/standalone').then((vis) => {
      if (destroyed) return

      const nodes = new vis.DataSet(
        characters.map((c) => ({
          id: c.id,
          label: c.name,
          shape: 'dot',
          size: 20,
          color: {
            background: '#e0e7ff',
            border: '#4756ff',
            highlight: { background: '#c7d2fe', border: '#4756ff' },
          },
          font: { size: 14, color: '#1d2129' },
        }))
      )

      const visEdges = new vis.DataSet(
        edges.map((e) => ({
          from: e.sourceId,
          to: e.targetId,
          label: e.type,
          arrows: 'to',
          color: e.isHidden ? { color: '#c9cdd4', opacity: 0.5 } : { color: '#86909c' },
          dashes: e.isHidden,
          font: { size: 10, color: '#4e5969' },
        }))
      )

      const options = {
        nodes: {
          borderWidth: 2,
          shadow: true,
        },
        edges: {
          width: 2,
          smooth: { type: 'continuous' },
        },
        physics: {
          enabled: true,
          barnesHut: {
            gravitationalConstant: -3000,
            centralGravity: 0.3,
            springLength: 150,
            springConstant: 0.04,
          },
        },
        interaction: {
          hover: true,
          tooltipDelay: 200,
        },
      }

      const network = new vis.Network(containerRef.current, { nodes, edges: visEdges }, options)
      networkRef.current = network

      network.on('click', (params: any) => {
        if (params.nodes.length > 0 && onSelectCharacter) {
          onSelectCharacter(params.nodes[0])
        }
      })
    })

    return () => {
      destroyed = true
      if (networkRef.current) {
        networkRef.current.destroy()
        networkRef.current = null
      }
    }
  }, [characters, edges, onSelectCharacter])

  return <div ref={containerRef} className="w-full h-full" />
}
