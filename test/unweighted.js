/**
 * Graphology Unweighted Shortest Path Unit Tests
 * ===============================================
 */
var assert = require('assert'),
    library = require('../unweighted.js'),
    indexLibrary = require('../indexed-brandes.js'),
    graphology = require('graphology');

var Graph = graphology.Graph,
    DirectedGraph = graphology.DirectedGraph,
    UndirectedGraph = graphology.UndirectedGraph;

var EDGES = [
  [1, 2],
  [1, 8],
  [2, 3],
  [2, 4],
  [4, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [7, 9],
  [8, 9],
  [10, 11]
];

describe('unweighted', function() {

  describe('bidirectional', function() {

    it('should throw if given invalid arguments', function() {
      assert.throws(function() {
        library.bidirectional(null);
      }, /graphology/);

      assert.throws(function() {
        library.bidirectional(new Graph(), 'test');
      }, /number/);

      assert.throws(function() {
        library.bidirectional(new Graph(), 'test', 'hello');
      }, /source/);

      assert.throws(function() {
        var graph = new Graph();
        graph.addNode('John');
        library.bidirectional(graph, 'John', 'Stacy');
      }, /target/);
    });

    it('should correctly find the shortest path between two nodes.', function() {
      var graph = new Graph();
      graph.mergeEdge(1, 2);
      graph.mergeEdge(2, 3);
      graph.mergeEdge(3, 4);

      var path = library.bidirectional(graph, 1, 4);

      assert.deepEqual(path, [1, 2, 3, 4]);
    });

    it('should return `null` when no path is found.', function() {
      var graph = new Graph();
      graph.addNode(1);
      graph.addNode(2);
      graph.addNode(3);

      var path = library.bidirectional(graph, 1, 3);

      assert.strictEqual(path, null);
    });

    it('should take directedness into account.', function() {
      var graph = new DirectedGraph();
      graph.mergeEdge(1, 2);
      graph.mergeEdge(2, 3);
      graph.mergeEdge(3, 4);

      var path = library.bidirectional(graph, 1, 4);

      assert.deepEqual(path, [1, 2, 3, 4]);

      path = library.bidirectional(graph, 4, 1);

      assert.strictEqual(path, null);
    });

    it('should handle directed cycles.', function() {
      var graph = new DirectedGraph();

      graph.mergeEdge(0, 1);
      graph.mergeEdge(1, 2);
      graph.mergeEdge(2, 0);

      var path = library.bidirectional(graph, 0, 2)

      assert.deepEqual(path, ['0', '1', '2'])
    });

    it('should handle undirected cycles.', function() {
      var graph = new UndirectedGraph();

      graph.mergeEdge(0, 1);

      var path = library.bidirectional(graph, 0, 1);

      assert.deepEqual(path, ['0', '1']);
    });

    it('Issue #4.1', function() {
      var graph = new UndirectedGraph();

      graph.addNode(0);
      graph.addNode(1);
      graph.addNode(2);
      graph.addNode(3);
      graph.addEdge(0, 1);
      graph.addEdge(0, 2);
      graph.addEdge(1, 2);
      graph.addEdge(2, 3);

      var path = library.bidirectional(graph, 0, 3);

      assert.deepEqual(path, ['0', '2', '3']);
    });

    it('Issue #4.2', function() {
      var graph = new UndirectedGraph();

      graph.addNode(0);
      graph.addNode(1);
      graph.addNode(2);
      graph.addEdge(0, 1);

      var path = library.bidirectional(graph, 2, 0);

      assert.strictEqual(path, null);

      path = library.bidirectional(graph, 0, 2);

      assert.strictEqual(path, null);
    });
  });

  describe('singleSource', function() {
    it('should throw if given invalid arguments', function() {
      assert.throws(function() {
        library.singleSource(null);
      }, /graphology/);

      assert.throws(function() {
        library.singleSource(new Graph());
      }, /number/);

      assert.throws(function() {
        library.singleSource(new Graph(), 'test');
      }, /source/);
    });

    it('should properly return the paths.', function() {
      var graph = new Graph();
      graph.mergeEdge(1, 2);
      graph.mergeEdge(2, 3);
      graph.mergeEdge(3, 4);

      var paths = library.singleSource(graph, 1);

      assert.deepEqual(paths, {
        1: ['1'],
        2: ['1', '2'],
        3: ['1', '2', '3'],
        4: ['1', '2', '3', '4']
      });
    });

    it('should take directedness into account.', function() {
      var graph = new DirectedGraph();
      graph.mergeEdge(1, 2);
      graph.mergeEdge(2, 3);
      graph.mergeEdge(3, 4);

      var paths = library.singleSource(graph, 4);

      assert.deepEqual(paths, {
        4: ['4']
      });

      graph.addEdge(4, 2);

      paths = library.singleSource(graph, 4);

      assert.deepEqual(paths, {
        4: ['4'],
        2: ['4', '2'],
        3: ['4', '2', '3']
      });
    });
  });

  describe('shortestPath', function() {
    it('the polymorphism should work properly.', function() {
      var graph = new Graph();
      graph.mergeEdge(1, 2);
      graph.mergeEdge(2, 3);
      graph.mergeEdge(3, 4);

      var path = library(graph, 2, 4);

      assert.deepEqual(path, ['2', '3', '4']);

      var paths = library(graph, 2);

      assert.deepEqual(paths, {
        2: ['2'],
        3: ['2', '3'],
        4: ['2', '3', '4']
      });
    });
  });

  describe('brandes', function() {
    var graph = new UndirectedGraph();

    EDGES.forEach(function(edge) {
      graph.mergeEdge(edge[0], edge[1]);
    });

    var nodeToIndex = {},
        indexToNode = graph.nodes(),
        i = 0;

    graph.forEachNode(function(node) {
      nodeToIndex[node] = i++;
    });

    var expected = [
      ['1', '2', '8', '3', '4', '7', '9', '5', '6'],
      {
        '1': [],
        '2': ['1'],
        '3': ['2'],
        '4': ['2'],
        '5': ['4'],
        '6': ['7'],
        '7': ['8'],
        '8': ['1'],
        '9': ['8'],
        '10': [],
        '11': []
      },
      {
        '1': 1,
        '2': 1,
        '3': 1,
        '4': 1,
        '5': 1,
        '6': 1,
        '7': 1,
        '8': 1,
        '9': 1,
        '10': 0,
        '11': 0
      }
    ];

    it('applying Ulrik Brandes\' method should work properly.', function() {
      var result = library.brandes(graph, 1);

      assert.deepEqual(result, expected);
    });

    it('the indexed version should also work properly.', function() {
      var indexedBrandes = indexLibrary.createUnweightedIndexedBrandes(graph);

      var result = indexedBrandes(nodeToIndex[1]);

      var S = result[0].toArray().reverse().map(function(index) {
        return indexToNode[index];
      });

      result[0].clear();

      var P = {};

      result[1].forEach(function(s, i) {
        P[indexToNode[i]] = s.map(function(index) {
          return indexToNode[index];
        })
      });

      var sigma = {};

      result[2].forEach(function(s, i) {
        sigma[indexToNode[i]] = s;
      });

      assert.deepEqual(S, expected[0]);
      assert.deepEqual(P, expected[1]);
      assert.deepEqual(sigma, expected[2]);

      assert.doesNotThrow(function() {
        graph.forEachNode(function(node) {
          result = indexedBrandes(node);
          result[0].clear();
        });
      });
    });
  });
});
