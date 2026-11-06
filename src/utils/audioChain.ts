/**
 * Routing of the processing chain (pure helpers, no Web Audio needed).
 *
 * Chain: source → [19 EQ filters] → [dynamics compressor] → master gain
 *
 * Everything behind the master gain (analyser, speaker monitor, recorder
 * taps) is not part of the chain and is never touched here, so a recording
 * keeps running while the routing changes (EQ/compressor bypass, device
 * switch, playlist ↔ live input).
 */

/**
 * The part of the AudioNode interface the chain needs. Tests pass plain
 * fakes, so nothing here depends on the Web Audio classes themselves.
 */
export interface ChainNode {
  connect(destination: ChainNode): unknown
  disconnect(): void
}

export interface ChainRouting<N extends ChainNode = ChainNode> {
  /** file player or live input */
  source: N
  /** EQ filters, lowest band first */
  eqFilters?: N[]
  dynamicsNode?: N | null
  gainNode?: N | null
  eqBypass?: boolean
  dynamicsEnabled?: boolean
}

/**
 * The nodes of the chain in signal order for the given routing.
 */
export function processingChainOrder<N extends ChainNode>({
  source,
  eqFilters = [],
  dynamicsNode = null,
  gainNode = null,
  eqBypass = false,
  dynamicsEnabled = true,
}: ChainRouting<N>): N[] {
  const order: N[] = [source]
  if (!eqBypass) order.push(...eqFilters)
  if (dynamicsEnabled && dynamicsNode) order.push(dynamicsNode)
  if (gainNode) order.push(gainNode)
  return order
}

/**
 * Wire the chain nodes in the given order.
 *
 * Before connecting, every node except the last one – and every node in
 * `staleNodes` (parts of the chain that the current routing bypasses) – is
 * disconnected from all its outputs. Edges of an earlier routing must not
 * survive: a filter still feeding the compressor while the compressor is
 * bypassed would sum a second copy of the signal into output and recording.
 *
 * The last node (master gain) keeps its outputs untouched.
 */
export function connectProcessingChain<N extends ChainNode>(
  order: N[],
  staleNodes: Array<N | null | undefined> = []
): void {
  const toDetach = new Set<N | null | undefined>([...order.slice(0, -1), ...staleNodes])
  for (const node of toDetach) disconnectAll(node)
  for (let i = 0; i < order.length - 1; i++) {
    order[i].connect(order[i + 1])
  }
}

function disconnectAll(node: ChainNode | null | undefined): void {
  if (!node) return
  try {
    node.disconnect()
  } catch {
    // not connected
  }
}
