/**
 * Graphology Indexed Brandes Routine
 * ===================================
 *
 * Indexed version of the famous Brandes routine aiming at computing
 * betweenness centrality efficiently.
 */
var FixedDeque = require('mnemonist/fixed-deque'),
    FixedStack = require('mnemonist/fixed-stack'),
    neighborhoodIndices = require('graphology-indices/neighborhood/outbound');

var OutboundNeighborhoodIndex = neighborhoodIndices.OutboundNeighborhoodIndex;

exports.createUnweightedIndexedBrandes = function createUnweightedIndexedBrandes(graph) {
  var neighborhoodIndex = new OutboundNeighborhoodIndex(graph);

  var neighborhood = neighborhoodIndex.neighborhood,
      starts = neighborhoodIndex.starts,
      stops = neighborhoodIndex.stops;

  var order = graph.order;

  var S = new FixedStack(Array, order),
      sigma = new Uint32Array(order),
      P = new Array(order),
      D = new Int32Array(order);

  var Q = new FixedDeque(Uint32Array, order);

  return function(sourceIndex) {
    var Dv,
        sigmav,
        start,
        stop,
        j,
        v,
        w;

    for (v = 0; v < order; v++) {
      P[v] = [];
      sigma[v] = 0;
      D[v] = -1;
    }

    sigma[sourceIndex] = 1;
    D[sourceIndex] = 0;

    Q.push(sourceIndex);

    while (Q.size !== 0) {
      v = Q.shift();
      S.push(v);

      Dv = D[v];
      sigmav = sigma[v];

      start = starts[v];
      stop = stops[v];

      for (j = start; j < stop; j++) {
        w = neighborhood[j];

        if (D[w] === -1) {
          Q.push(w);
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
};
