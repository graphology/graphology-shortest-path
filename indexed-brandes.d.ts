import Graph from 'graphology-types';
import FixedStack from 'mnemonist/fixed-stack';

type IndexedBrandesResult = [
  FixedStack<number>,
  Array<Array<number>>,
  Uint32Array
];

type IndexedBrandesFunction = (sourceIndex: number) => IndexedBrandesResult;

export function createUnweightedIndexedBrandes(graph: Graph): IndexedBrandesFunction;
