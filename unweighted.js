/**
 * Graphology Unweighted Shortest Path
 * ====================================
 *
 * Basic algorithms to find the shortest paths between nodes in a graph
 * whose edges are not weighted.
 */
var isGraph = require('graphology-utils/is-graph'),
    Queue = require('mnemonist/queue');

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
  var getPredecessors,
      getSuccessors;

  // TODO: move outside this function
  if (graph.type === 'mixed') {
    getPredecessors = function(node) {
      var result = graph.inNeighbors(node);

      result.push.apply(result, graph.undirectedNeighbors(node));
      return result;
    };

    getSuccessors = function(node) {
      var result = graph.outNeighbors(node);

      result.push.apply(result, graph.undirectedNeighbors(node));
      return result;
    };
  }
  else if (graph.type === 'directed') {
    getPredecessors = graph.inNeighbors.bind(graph);
    getSuccessors = graph.outNeighbors.bind(graph);
  }
  else {
    getPredecessors = getSuccessors = graph.undirectedNeighbors.bind(graph);
  }

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

          if (!(successor in neighbor)) {
            reverseFringe.push(neighbor);
            successor[neighbor] = node;
          }

          if (neighbor in predecessor) {

            // Path is found!
            break outer;
          }
        }
      }
    }
  }

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
      neighbors = graph.outNeighbors(v);
      neighbors.push.apply(neighbors, graph.undirectedNeighbors(v));

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

    neighbors = graph
      .undirectedNeighbors(v)
      .concat(graph.outNeighbors(v));

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

/**
 * Exporting.
 */
shortestPath.bidirectional = bidirectional;
shortestPath.singleSource = singleSource;
shortestPath.brandes = brandes;

module.exports = shortestPath;
