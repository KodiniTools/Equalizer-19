import { test } from 'node:test'
import assert from 'node:assert/strict'
import { processingChainOrder, connectProcessingChain } from '../src/utils/audioChain.js'

// ---- Fake AudioNodes: record outgoing edges ---------------------------------
function node(name) {
  return {
    name,
    outputs: new Set(),
    connect(target) {
      this.outputs.add(target)
      return target
    },
    disconnect() {
      this.outputs.clear()
    },
  }
}

function graph() {
  const source = node('source')
  const eqFilters = Array.from({ length: 19 }, (_, i) => node(`eq${i}`))
  const dynamicsNode = node('dynamics')
  const gainNode = node('gain')
  return { source, eqFilters, dynamicsNode, gainNode }
}

const names = (nodes) => nodes.map((n) => n.name)
const outs = (n) => [...n.outputs].map((t) => t.name)

function wire(g, routing = {}) {
  const order = processingChainOrder({ ...g, ...routing })
  connectProcessingChain(order, [...g.eqFilters, g.dynamicsNode])
  return order
}

// ---- processingChainOrder ----------------------------------------------------
test('full chain: source → 19 EQ filters → dynamics → gain', () => {
  const g = graph()
  const order = processingChainOrder(g)
  assert.deepEqual(names(order), ['source', ...names(g.eqFilters), 'dynamics', 'gain'])
})

test('EQ bypass removes the filters, dynamics bypass removes the compressor', () => {
  const g = graph()
  assert.deepEqual(names(processingChainOrder({ ...g, eqBypass: true })), [
    'source',
    'dynamics',
    'gain',
  ])
  assert.deepEqual(names(processingChainOrder({ ...g, dynamicsEnabled: false })), [
    'source',
    ...names(g.eqFilters),
    'gain',
  ])
  assert.deepEqual(names(processingChainOrder({ ...g, eqBypass: true, dynamicsEnabled: false })), [
    'source',
    'gain',
  ])
})

test('missing gain/dynamics nodes are skipped', () => {
  const g = graph()
  const order = processingChainOrder({ source: g.source, eqFilters: g.eqFilters })
  assert.deepEqual(names(order), ['source', ...names(g.eqFilters)])
})

// ---- connectProcessingChain ----------------------------------------------------
test('connects every node to its successor exactly once', () => {
  const g = graph()
  const order = wire(g)
  for (let i = 0; i < order.length - 1; i++) {
    assert.deepEqual(outs(order[i]), [order[i + 1].name], `${order[i].name} → next`)
  }
})

test('bypassing the compressor leaves no stale edge into it', () => {
  const g = graph()
  wire(g)
  wire(g, { dynamicsEnabled: false })

  const last = g.eqFilters.at(-1)
  assert.deepEqual(outs(last), ['gain'])
  assert.deepEqual(outs(g.dynamicsNode), [], 'bypassed compressor is detached')
})

test('re-enabling the compressor removes the direct EQ → gain edge (no doubled signal)', () => {
  const g = graph()
  wire(g)
  wire(g, { dynamicsEnabled: false })
  wire(g, { dynamicsEnabled: true })

  const last = g.eqFilters.at(-1)
  assert.deepEqual(outs(last), ['dynamics'])
  assert.deepEqual(outs(g.dynamicsNode), ['gain'])
})

test('EQ bypass detaches the filters; re-enabling restores the full chain', () => {
  const g = graph()
  wire(g, { eqBypass: true })
  assert.deepEqual(outs(g.source), ['dynamics'])
  g.eqFilters.forEach((f) => assert.deepEqual(outs(f), [], `${f.name} detached`))

  wire(g, { eqBypass: false })
  assert.deepEqual(outs(g.source), ['eq0'])
  assert.deepEqual(outs(g.eqFilters.at(-1)), ['dynamics'])
})

test('the gain node keeps its outputs (recorder/analyser taps survive rebuilds)', () => {
  const g = graph()
  const recorder = node('recorder')
  const analyser = node('analyser')
  g.gainNode.connect(recorder)
  g.gainNode.connect(analyser)

  wire(g)
  wire(g, { eqBypass: true })
  wire(g, { eqBypass: false, dynamicsEnabled: false })
  wire(g)

  assert.deepEqual(outs(g.gainNode).sort(), ['analyser', 'recorder'])
})

test('a live input source gets the same chain as file playback', () => {
  const g = graph()
  const live = node('mediaStreamSource')
  wire(g)
  const order = wire({ ...g, source: live })

  assert.deepEqual(names(order), ['mediaStreamSource', ...names(g.eqFilters), 'dynamics', 'gain'])
  assert.deepEqual(outs(live), ['eq0'])
})
