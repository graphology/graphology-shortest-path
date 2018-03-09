/**
 * Graphology Dijkstra Shortest Path
 * ==================================
 *
 * Graphology implementation of Dijkstra shortest path for weighted graphs.
 */
var isGraph = require('graphology-utils/is-graph'),
    Heap = require('mnemonist/heap');

/**
 * Defaults.
 */
var DEFAULTS = {
  weightAttribute: 'weight'
};

/**
 * Multisource Dijkstra shortest path abstract function. This function is the
 * basis of the algorithm that every other will use.
 *
 * Note that this implementation was basically copied from networkx.
 * TODO: it might be more performant to use a dedicated objet for the heap's
 * items.
 *
 * @param  {Graph}  graph           - The graphology instance.
 * @param  {array}  sources         - A list of sources.
 * @param  {string} weightAttribute - Name of the weight attribute.
 * @param  {number} cutoff          - Maximum depth of the search.
 * @param  {string} target          - Optional target to reach.
 * @param  {object} paths           - Optional paths object to maintain.
 * @return {object}                 - Returns the paths.
 */
function dijkstraHeapComparator(a, b) {
  if (a[0] > b[0])
    return 1;
  if (a[0] < b[0])
    return -1;

  if (a[1] > b[1])
    return 1;
  if (a[1] < b[1])
    return -1;

  if (a[2] > b[2])
    return 1;
  if (a[2] < b[2])
    return -1;

  return 0;
}

function abstractDijkstraMultisource(
  graph,
  sources,
  weightAttribute,
  cutoff,
  target,
  paths
) {

  if (!isGraph(graph))
    throw new Error('graphology-shortest-path/dijkstra: invalid graphology instance.');

  if (target && !graph.hasNode(target))
    throw new Error('graphology-shortest-path/dijkstra: the "' + target + '" target node does not exist in the given graph.');

  weightAttribute = weightAttribute || DEFAULTS.weightAttribute;

  // Building necessary functions
  var getWeight = function(n) {
    return graph.getEdgeAttribute(n, weightAttribute);
  };

  var distances = {},
      seen = {},
      fringe = new Heap(dijkstraHeapComparator);

  var count = 0,
      edges,
      item,
      cost,
      v,
      u,
      e,
      d,
      i,
      j,
      l,
      m;

  for (i = 0, l = sources.length; i < l; i++) {
    v = sources[i];
    seen[v] = 0;
    fringe.push([0, count++, v]);

    if (paths)
      paths[v] = [v];
  }

  while (fringe.size) {
    item = fringe.pop();
    d = item[0];
    v = item[2];

    if (v in distances)
      continue;

    distances[v] = d;

    if (v === target)
      break;

    edges = graph
      .undirectedEdges(v)
      .concat(graph.outEdges(v));

    for (j = 0, m = edges.length; j < m; j++) {
      e = edges[j];
      u = graph.opposite(v, e);
      cost = getWeight(e) + distances[v];

      if (cutoff && cost > cutoff)
        continue;

      if (u in distances && cost < distances[u]) {
        throw Error('graphology-shortest-path/dijkstra: contradictory paths found. Do some of your edges have a negative weight?');
      }

      else if (!(u in seen) || cost < seen[u]) {
        seen[u] = cost;
        fringe.push([cost, count++, u]);

        if (paths)
          paths[u] = paths[v].concat(u);
      }
    }
  }

  return distances;
}

/**
 * Single source Dijkstra shortest path between given node & other nodes in
 * the graph.
 *
 * @param  {Graph}  graph           - The graphology instance.
 * @param  {string} source          - Source node.
 * @param  {string} weightAttribute - Name of the weight attribute.
 * @return {object}                 - An object of found paths.
 */
function singleSourceDijkstra(graph, source, weightAttribute) {
  var paths = {};

  abstractDijkstraMultisource(
    graph,
    [source],
    weightAttribute,
    0,
    null,
    paths
  );

  return paths;
}

/**
 * Exporting.
 */
var m = {};
m.singleSource = singleSourceDijkstra;

module.exports = m;
