/**
 * Graphology Dijkstra Shortest Path Unit Tests
 * =============================================
 */
var assert = require('assert'),
    library = require('../dijkstra.js'),
    graphology = require('graphology');

var UndirectedGraph = graphology.UndirectedGraph;

var EDGES = [
  [1, 2, 1],
  [1, 8, 3],
  [2, 3, 2],
  [2, 4, 3],
  [4, 5, 2],
  [5, 6, 1],
  [6, 7, 5],
  [7, 8, 4],
  [7, 9, 1],
  [8, 9, 10],
  [10, 11, 3]
];

describe('dijkstra', function() {

  var graph = new UndirectedGraph();

  EDGES.forEach(function(edge) {
    graph.mergeEdge(edge[0], edge[1], {weight: edge[2]});
  });

  describe('bidirectional', function() {
    it('should correctly find the shortest path between two nodes.', function() {
      var path = library.bidirectional(graph, 1, 9);

      assert.deepEqual(path, ['1', '8', '7', '9']);

      path = library.bidirectional(graph, 1, 6);

      assert.deepEqual(path, ['1', '2', '4', '5', '6']);

      path = library.bidirectional(graph, 1, 11);

      assert.strictEqual(path, null);
    });
  });

  describe('singleSource', function() {
    it('should correctly find the shortest path between source and all other nodes.', function() {
      var paths = library.singleSource(graph, '1');

      assert.deepEqual(paths, {
        1: ['1'],
        2: ['1', '2'],
        3: ['1', '2', '3'],
        4: ['1', '2', '4'],
        5: ['1', '2', '4', '5'],
        6: ['1', '2', '4', '5', '6'],
        7: ['1', '8', '7'],
        8: ['1', '8'],
        9: ['1', '8', '7', '9']
      });
    });
  });

  describe('brandes', function() {
    it('applying Ulrik Brandes\' method should work properly.', function() {
      var result = library.brandes(graph, '1');

      assert.deepEqual(result, [
        ['1', '2', '8', '3', '4', '5', '7', '6', '9'],
        {
          '1': [],
          '2': ['1'],
          '3': ['2'],
          '4': ['2'],
          '5': ['4'],
          '6': ['5'],
          '7': ['8'],
          '8': ['1'],
          '9': ['7'],
          '10': [],
          '11': []
        },
        {
          '1': 2,
          '2': 2,
          '3': 2,
          '4': 2,
          '5': 2,
          '6': 2,
          '7': 2,
          '8': 2,
          '9': 2,
          '10': 0,
          '11': 0
        }
      ]);
    });
  });
});
