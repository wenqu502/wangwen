import { db } from '@/db'

export async function exportWork(workId: string) {
    const work = await db.works.get(workId)
    if (!work) {
        throw new Error('作品不存在')
    }

    const [characters, plotNodes, relations, systems, ideas] = await Promise.all([
        db.characters.where('workId').equals(workId).toArray(),
        db.plotNodes.where('workId').equals(workId).toArray(),
        db.relations.where('workId').equals(workId).toArray(),
        db.systems.where('workId').equals(workId).toArray(),
        db.ideas.where('workId').equals(workId).toArray(),
    ])

    const payload = {
        meta: {
            exportedAt: new Date().toISOString(),
            version: '0.1.0',
            workName: work.name,
        },
        work,
        characters,
        plotNodes,
        relations,
        systems,
        ideas,
    }

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `织文_${work.name}_${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
}
