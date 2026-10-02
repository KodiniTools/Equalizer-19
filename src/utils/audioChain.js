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
 * The nodes of the chain in signal order for the given routing.
 *
 * @param {object} routing
 * @param {AudioNode} routing.source           file player or live input
 * @param {AudioNode[]} [routing.eqFilters]    EQ filters, lowest band first
 * @param {AudioNode|null} [routing.dynamicsNode]
 * @param {AudioNode|null} [routing.gainNode]
 * @param {boolean} [routing.eqBypass]
 * @param {boolean} [routing.dynamicsEnabled]
 * @returns {AudioNode[]}
 */
export function processingChainOrder({
  source,
  eqFilters = [],
  dynamicsNode = null,
  gainNode = null,
  eqBypass = false,
  dynamicsEnabled = true,
}) {
  const order = [source]
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
 *
 * @param {AudioNode[]} order
 * @param {AudioNode[]} [staleNodes]
 */
export function connectProcessingChain(order, staleNodes = []) {
  const toDetach = new Set([...order.slice(0, -1), ...staleNodes])
  for (const node of toDetach) disconnectAll(node)
  for (let i = 0; i < order.length - 1; i++) {
    order[i].connect(order[i + 1])
  }
}

function disconnectAll(node) {
  if (!node) return
  try {
    node.disconnect()
  } catch (_e) {
    // not connected
  }
}
