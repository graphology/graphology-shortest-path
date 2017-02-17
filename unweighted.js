/**
 * Graphology Unweighted Shortest Path
 * ====================================
 *
 * Basic algorithms to find the shortest paths between nodes in a graph
 * whose edges are not weighted.
 */
var isGraph = require('graphology-utils/is-graph');

/**
 * Function attempting to find the shortest path in a graph between
 * given source & target or `null` if such a path does not exist.
 *
 * @param  {Graph}      graph  - Target graph.
 * @param  {any}        source - Source node.
 * @param  {any}        target - Target node.
 * @return {array|null}        - Found path or `null`.
 *
 * @throws {Error} - Will throw if given graph is invalid.
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
    getPredecessors = getSuccessors = graph.neighbors.bind(graph);
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

          if (!predecessor[neighbor]) {
            forwardFringe.push(neighbor);
            predecessor[neighbor] = node;
          }

          if (successor[neighbor]) {

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

          if (!successor[neighbor]) {
            reverseFringe.push(neighbor);
            successor[neighbor] = node;
          }

          if (predecessor[neighbor]) {

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
 * Exporting.
 */
var main = {};
main.bidirectional = bidirectional;

module.exports = main;
