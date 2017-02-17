/**
 * Graphology Unweighted Shortest Path Unit Tests
 * ===============================================
 */
var assert = require('assert'),
    library = require('../unweighted.js'),
    graphology = require('graphology');

var Graph = graphology.Graph,
    DirectedGraph = graphology.DirectedGraph;

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
      graph.addNodesFrom([1, 2, 3]);

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
});
