import Graph, {NodeKey} from 'graphology-types';

type ShortestPath = Array<NodeKey>;
type ShortestPathMapping = {[key: string]: ShortestPath};

type BrandesResult = [
  Array<NodeKey>,
  {[key: string]: Array<NodeKey>},
  {[key: string]: number}
];

interface IUnweightedShortestPath {
  (graph: Graph, source: NodeKey): ShortestPathMapping;
  (graph: Graph, source: NodeKey, target: NodeKey): ShortestPath | null;

  bidirectional(graph: Graph, source: NodeKey, target: NodeKey): ShortestPath | null;
  singleSource(graph: Graph, source: NodeKey): ShortestPathMapping;
  brandes(graph: Graph, source: NodeKey): BrandesResult;
}

declare const shortestPath: IUnweightedShortestPath;

export default shortestPath;
