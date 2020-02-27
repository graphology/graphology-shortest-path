/**
 * Graphology Unweighted Shortest Path
 * ====================================
 *
 * Basic algorithms to find the shortest paths between nodes in a graph
 * whose edges are not weighted.
 */
var isGraph = require('graphology-utils/is-graph'),
    Queue = require('mnemonist/queue'),
    PointerVector = require('mnemonist/vector').PointerVector,
    typed = require('mnemonist/utils/typed-arrays');

/**
 * Function attempting to find the shortest path in a graph between
 * given source & target or `null` if such a path does not exist.
 *
 * @param  {Graph}      graph  - Target graph.
 * @param  {any}        source - Source node.
 * @param  {any}        target - Target node.
 * @return {array|null}        - Found path or `null`.
 */
function bidirectional(graph, source, target) {
  if (!isGraph(graph))
    throw new Error('graphology-shortest-path: invalid graphology instance.');

  if (arguments.length < 3)
    throw new Error('graphology-shortest-path: invalid number of arguments. Expecting at least 3.');

  if (!graph.hasNode(source))
    throw new Error('graphology-shortest-path: the "' + source + '" source node does not exist in the given graph.');

  if (!graph.hasNode(target))
    throw new Error('graphology-shortest-path: the "' + target + '" target node does not exist in the given graph.');

  source = '' + source;
  target = '' + target;

  // TODO: do we need a self loop to go there?
  if (source === target) {
    return [source];
  }

  // Binding functions
  var getPredecessors = graph.inboundNeighbors.bind(graph),
      getSuccessors = graph.outboundNeighbors.bind(graph);

  var predecessor = {},
      successor = {};

  // Predecessor & successor
  predecessor[source] = null;
  successor[target] = null;

  // Fringes
  var forwardFringe = [source],
      reverseFringe = [target],
      currentFringe,
      node,
      neighbors,
      neighbor,
      i,
      j,
      l,
      m;

  var found = false;

  outer:
  while (forwardFringe.length && reverseFringe.length) {
    if (forwardFringe.length <= reverseFringe.length) {
      currentFringe = forwardFringe;
      forwardFringe = [];

      for (i = 0, l = currentFringe.length; i < l; i++) {
        node = currentFringe[i];
        neighbors = getSuccessors(node);

        for (j = 0, m = neighbors.length; j < m; j++) {
          neighbor = neighbors[j];

          if (!(neighbor in predecessor)) {
            forwardFringe.push(neighbor);
            predecessor[neighbor] = node;
          }

          if (neighbor in successor) {

            // Path is found!
            found = true;
            break outer;
          }
        }
      }
    }
    else {
      currentFringe = reverseFringe;
      reverseFringe = [];

      for (i = 0, l = currentFringe.length; i < l; i++) {
        node = currentFringe[i];
        neighbors = getPredecessors(node);

        for (j = 0, m = neighbors.length; j < m; j++) {
          neighbor = neighbors[j];

          if (!(neighbor in successor)) {
            reverseFringe.push(neighbor);
            successor[neighbor] = node;
          }

          if (neighbor in predecessor) {

            // Path is found!
            found = true;
            break outer;
          }
        }
      }
    }
  }

  if (!found)
    return null;

  var path = [];

  while (neighbor) {
    path.unshift(neighbor);
    neighbor = predecessor[neighbor];
  }

  neighbor = successor[path[path.length - 1]];

  while (neighbor) {
    path.push(neighbor);
    neighbor = successor[neighbor];
  }

  return path.length ? path : null;
}

/**
 * Function attempting to find the shortest path in the graph between the
 * given source node & all the other nodes.
 *
 * @param  {Graph}  graph  - Target graph.
 * @param  {any}    source - Source node.
 * @return {object}        - The map of found paths.
 */

// TODO: cutoff option
function singleSource(graph, source) {
  if (!isGraph(graph))
    throw new Error('graphology-shortest-path: invalid graphology instance.');

  if (arguments.length < 2)
    throw new Error('graphology-shortest-path: invalid number of arguments. Expecting at least 2.');

  if (!graph.hasNode(source))
    throw new Error('graphology-shortest-path: the "' + source + '" source node does not exist in the given graph.');

  source = '' + source;

  var nextLevel = {},
      paths = {},
      currentLevel,
      neighbors,
      v,
      w,
      i,
      l;

  nextLevel[source] = true;
  paths[source] = [source];

  while (Object.keys(nextLevel).length) {
    currentLevel = nextLevel;
    nextLevel = {};

    for (v in currentLevel) {
      neighbors = graph.outboundNeighbors(v);

      for (i = 0, l = neighbors.length; i < l; i++) {
        w = neighbors[i];

        if (!paths[w]) {
          paths[w] = paths[v].concat(w);
          nextLevel[w] = true;
        }
      }
    }
  }

  return paths;
}

/**
 * Main polymorphic function taking either only a source or a
 * source/target combo.
 *
 * @param  {Graph}  graph      - Target graph.
 * @param  {any}    source     - Source node.
 * @param  {any}    [target]   - Target node.
 * @return {array|object|null} - The map of found paths.
 */
function shortestPath(graph, source, target) {
  if (arguments.length < 3)
    return singleSource(graph, source);

  return bidirectional(graph, source, target);
}

/**
 * Function using Ulrik Brandes' method to map single source shortest paths
 * from selected node.
 *
 * [Reference]:
 * Ulrik Brandes: A Faster Algorithm for Betweenness Centrality.
 * Journal of Mathematical Sociology 25(2):163-177, 2001.
 *
 * @param  {Graph}  graph      - Target graph.
 * @param  {any}    source     - Source node.
 * @return {array}             - [Stack, Paths, Sigma]
 */
function brandes(graph, source) {
  source = '' + source;

  var S = [],
      P = {},
      sigma = {};

  var nodes = graph.nodes(),
      Dv,
      sigmav,
      neighbors,
      v,
      w,
      i,
      j,
      l,
      m;

  for (i = 0, l = nodes.length; i < l; i++) {
    v = nodes[i];
    P[v] = [];
    sigma[v] = 0;
  }

  var D = {};

  sigma[source] = 1;
  D[source] = 0;

  var queue = Queue.of(source);

  while (queue.size) {
    v = queue.dequeue();
    S.push(v);

    Dv = D[v];
    sigmav = sigma[v];

    neighbors = graph.outboundNeighbors(v);

    for (j = 0, m = neighbors.length; j < m; j++) {
      w = neighbors[j];

      if (!(w in D)) {
        queue.enqueue(w);
        D[w] = Dv + 1;
      }

      if (D[w] === Dv + 1) {
        sigma[w] += sigmav;
        P[w].push(v);
      }
    }
  }

  return [S, P, sigma];
}

function OutboundNeighborhoodIndex(graph) {
  var PointerArray = typed.getPointerArray(graph.order);

  this.neighborhood = new PointerVector(graph.directedSize + graph.undirectedSize * 2);
  this.starts = new PointerArray(graph.order);
  this.lengths = new PointerArray(graph.order);
  this.nodes = graph.nodes();

  // TODO: it may be possible to drop this index
  this.ids = {};

  var i, l, j, m, node, neighbors, neighbor;

  for (i = 0, l = graph.order; i < l; i++)
    this.ids[this.nodes[i]] = i;

  for (i = 0, l = graph.order; i < l; i++) {
    node = this.nodes[i];
    neighbors = graph.outboundNeighbors(node);

    this.starts[i] = this.neighborhood.length;
    this.lengths[i] = neighbors.length;

    for (j = 0, m = neighbors.length; j < m; j++) {
      neighbor = neighbors[j];
      this.neighborhood.push(this.ids[neighbor]);
    }
  }
}

OutboundNeighborhoodIndex.prototype.bounds = function(node) {
  var idx = this.ids[node];

  return [this.starts[idx], this.lengths[idx]];
};

// var Graph = require('graphology');
// var graph = new Graph();
// graph.mergeEdge(1, 2);
// graph.mergeEdge(2, 3);
// graph.mergeEdge(2, 1);
// graph.mergeEdge(4, 5);

// var index = new OutboundNeighborhoodIndex(graph);
// console.log(index);

// graph.forEachNode(node => {
//   var bounds = index.bounds(node);

//   console.log(node, bounds);
//   var A = index.neighborhood.array;
//   var neighbors = A.slice(bounds[0], bounds[0] + bounds[1]);
//   console.log(neighbors);
// });

function createIndexedBrandes(graph) {
  var neighborhoodIndex = new OutboundNeighborhoodIndex(graph);
  var N = neighborhoodIndex.neighborhood.array;

  var sigma = {},
      P = {};

  // TODO: transform S in FixedStack
  // TODO: more aggressive indexation relying on indices without objects

  return function(source) {
    source = '' + source;

    var S = [];

    var Dv,
        sigmav,
        bounds,
        start,
        length,
        v,
        w,
        j,
        m;

    for (v in neighborhoodIndex.ids) {
      P[v] = [];
      sigma[v] = 0;
    }

    var D = {};

    sigma[source] = 1;
    D[source] = 0;

    var queue = Queue.of(source);

    while (queue.size) {
      v = queue.dequeue();
      S.push(v);

      Dv = D[v];
      sigmav = sigma[v];

      bounds = neighborhoodIndex.bounds(v);
      start = bounds[0];
      length = bounds[1];

      for (j = start, m = start + length; j < m; j++) {
        w = neighborhoodIndex.nodes[N[j]];

        if (!(w in D)) {
          queue.enqueue(w);
          D[w] = Dv + 1;
        }

        if (D[w] === Dv + 1) {
          sigma[w] += sigmav;
          P[w].push(v);
        }
      }
    }

    return [S, P, sigma];
  };
}

/**
 * Exporting.
 */
shortestPath.bidirectional = bidirectional;
shortestPath.singleSource = singleSource;
shortestPath.brandes = brandes;
shortestPath.createIndexedBrandes = createIndexedBrandes;

module.exports = shortestPath;
