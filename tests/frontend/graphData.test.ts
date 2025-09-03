import { GraphData, NodeTypes } from '../../pkg/frontend/src/components/graph/data';
import { NodeStatus } from '../../pkg/frontend/src/components/graph/CustomNodes';
import { K8sResource } from '../../pkg/frontend/src/types';

// Mock logger
jest.mock('../../pkg/frontend/src/logger', () => ({
  logger: {
    log: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock navigate function
const mockNavigate = jest.fn();

describe('GraphData', () => {
  let graphData: GraphData;

  beforeEach(() => {
    graphData = new GraphData();
    jest.clearAllMocks();
    mockNavigate.mockClear();
  });

  describe('addNode', () => {
    const mockResource: K8sResource = {
      kind: 'TestResource',
      apiVersion: 'test.io/v1',
      metadata: {
        name: 'test-resource',
        namespace: 'default',
      },
      status: {
        conditions: [
          {
            type: 'Ready',
            status: 'True',
            lastTransitionTime: '2023-01-01T00:00:00Z',
            reason: 'Available',
          },
        ],
      },
    };

    it('should add a node with correct properties', () => {
      const node = graphData.addNode(NodeTypes.Claim, mockResource, false, mockNavigate);

      expect(node).toBeDefined();
      expect(node.id).toBe('1');
      expect(node.type).toBe(NodeTypes.Claim);
      expect(node.data.label).toBe('test-resource');
      expect(node.data.apiVersion).toBe('test.io/v1');
      expect(node.data.kind).toBe('TestResource');
      expect(node.data.main).toBe(false);
      expect(node.data.status).toBe(NodeStatus.Ok);
      expect(node.position).toEqual({ x: 0, y: 0 });
    });

    it('should add composition name annotation if present', () => {
      const resourceWithAnnotation: K8sResource = {
        ...mockResource,
        metadata: {
          ...mockResource.metadata,
          annotations: {
            'crossplane.io/composition-resource-name': 'test-composition',
          },
        },
      };

      const node = graphData.addNode(NodeTypes.CompositeResource, resourceWithAnnotation, false, mockNavigate);

      expect(node.data.compositionName).toBe('test-composition');
    });

    it('should increment node IDs for multiple nodes', () => {
      const node1 = graphData.addNode(NodeTypes.Claim, mockResource, false, mockNavigate);
      const node2 = graphData.addNode(NodeTypes.ManagedResource, mockResource, false, mockNavigate);

      expect(node1.id).toBe('1');
      expect(node2.id).toBe('2');
      expect(graphData.nodes).toHaveLength(2);
    });

    it('should set onClick to undefined for main nodes', () => {
      const node = graphData.addNode(NodeTypes.Claim, mockResource, true, mockNavigate);

      expect(node.data.onClick).toBeUndefined();
    });

    it('should set onClick function for non-main nodes with valid status', () => {
      const node = graphData.addNode(NodeTypes.Claim, mockResource, false, mockNavigate);

      expect(node.data.onClick).toBeDefined();
      expect(typeof node.data.onClick).toBe('function');
    });
  });

  describe('addEdge', () => {
    it('should add an edge between two nodes', () => {
      const node1 = graphData.addNode(NodeTypes.Claim, {
        kind: 'Resource1',
        apiVersion: 'v1',
        metadata: { name: 'resource1' },
      }, false, mockNavigate);

      const node2 = graphData.addNode(NodeTypes.ManagedResource, {
        kind: 'Resource2',
        apiVersion: 'v1',
        metadata: { name: 'resource2' },
      }, false, mockNavigate);

      graphData.addEdge(node1, node2);

      expect(graphData.edges).toHaveLength(1);
      const edge = graphData.edges[0];
      expect(edge.source).toBe(node1.id);
      expect(edge.target).toBe(node2.id);
      expect(edge.markerStart).toBeDefined();
    });

    it('should style edge based on source node status - NotFound', () => {
      const notFoundResource: K8sResource = {
        kind: 'Resource',
        apiVersion: 'v1',
        metadata: { name: 'not-found' },
        status: {
          conditions: [
            {
              type: 'Found',
              status: 'False',
              lastTransitionTime: '2023-01-01T00:00:00Z',
              reason: 'NotFound',
            },
          ],
        },
      };

      const node1 = graphData.addNode(NodeTypes.Claim, notFoundResource, false, mockNavigate);
      const node2 = graphData.addNode(NodeTypes.ManagedResource, {
        kind: 'Resource2',
        apiVersion: 'v1',
        metadata: { name: 'resource2' },
      }, false, mockNavigate);

      graphData.addEdge(node1, node2);

      const edge = graphData.edges[0];
      expect(edge.style).toEqual({ stroke: 'maroon' });
      expect(edge.markerStart?.color).toBe('maroon');
    });

    it('should style edge based on source node status - NotReady', () => {
      const notReadyResource: K8sResource = {
        kind: 'Resource',
        apiVersion: 'v1',
        metadata: { name: 'not-ready' },
        status: {
          conditions: [
            {
              type: 'Ready',
              status: 'False',
              lastTransitionTime: '2023-01-01T00:00:00Z',
              reason: 'NotReady',
            },
          ],
        },
      };

      const node1 = graphData.addNode(NodeTypes.Claim, notReadyResource, false, mockNavigate);
      const node2 = graphData.addNode(NodeTypes.ManagedResource, {
        kind: 'Resource2',
        apiVersion: 'v1',
        metadata: { name: 'resource2' },
      }, false, mockNavigate);

      graphData.addEdge(node1, node2);

      const edge = graphData.edges[0];
      expect(edge.style).toEqual({ stroke: 'red' });
      expect(edge.markerStart?.color).toBe('red');
    });

    it('should style edge based on source node status - NotSynced', () => {
      const notSyncedResource: K8sResource = {
        kind: 'Resource',
        apiVersion: 'v1',
        metadata: { name: 'not-synced' },
        status: {
          conditions: [
            {
              type: 'Synced',
              status: 'False',
              lastTransitionTime: '2023-01-01T00:00:00Z',
              reason: 'NotSynced',
            },
          ],
        },
      };

      const node1 = graphData.addNode(NodeTypes.Claim, notSyncedResource, false, mockNavigate);
      const node2 = graphData.addNode(NodeTypes.ManagedResource, {
        kind: 'Resource2',
        apiVersion: 'v1',
        metadata: { name: 'resource2' },
      }, false, mockNavigate);

      graphData.addEdge(node1, node2);

      const edge = graphData.edges[0];
      expect(edge.style).toEqual({ stroke: 'orange' });
      expect(edge.markerStart?.color).toBe('orange');
    });
  });

  describe('getStatus', () => {
    it('should return NotFound when resource is null', () => {
      const [status, message] = graphData['getStatus'](null as any);
      expect(status).toBe(NodeStatus.NotFound);
      expect(message).toBe('Not Specified');
    });

    it('should return Ok status when all conditions are True', () => {
      const healthyResource: K8sResource = {
        kind: 'Resource',
        apiVersion: 'v1',
        metadata: { name: 'healthy' },
        status: {
          conditions: [
            {
              type: 'Ready',
              status: 'True',
              lastTransitionTime: '2023-01-01T00:00:00Z',
              reason: 'Available',
            },
            {
              type: 'Synced',
              status: 'True',
              lastTransitionTime: '2023-01-01T00:00:00Z',
              reason: 'ReconcileSuccess',
            },
          ],
        },
      };

      const [status, message] = graphData['getStatus'](healthyResource);
      expect(status).toBe(NodeStatus.Ok);
      expect(message).toBe('');
    });

    it('should prioritize Found condition over others', () => {
      const resourceWithMultipleIssues: K8sResource = {
        kind: 'Resource',
        apiVersion: 'v1',
        metadata: { name: 'multiple-issues' },
        status: {
          conditions: [
            {
              type: 'Ready',
              status: 'False',
              lastTransitionTime: '2023-01-01T00:00:00Z',
              reason: 'NotReady',
            },
            {
              type: 'Found',
              status: 'False',
              lastTransitionTime: '2023-01-01T00:00:00Z',
              reason: 'NotFound',
            },
          ],
        },
      };

      const [status, message] = graphData['getStatus'](resourceWithMultipleIssues);
      expect(status).toBe(NodeStatus.NotFound);
      expect(message).toBe('NotFound');
    });
  });

  describe('genOnClick', () => {
    const mockResource: K8sResource = {
      kind: 'TestResource',
      apiVersion: 'test.io/v1',
      metadata: {
        name: 'test-resource',
        namespace: 'default',
      },
    };

    it('should return NOOP for main nodes', () => {
      const onClick = graphData['genOnClick'](NodeTypes.Claim, mockResource, true, mockNavigate);
      
      // Call the onClick function
      onClick();
      
      // Navigate should not be called for main nodes
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should return NOOP for NotFound resources', () => {
      const notFoundResource: K8sResource = {
        ...mockResource,
        status: {
          conditions: [
            {
              type: 'Found',
              status: 'False',
              lastTransitionTime: '2023-01-01T00:00:00Z',
              reason: 'NotFound',
            },
          ],
        },
      };

      const onClick = graphData['genOnClick'](NodeTypes.Claim, notFoundResource, false, mockNavigate);
      
      onClick();
      
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should generate correct URL for Claim', () => {
      const onClick = graphData['genOnClick'](NodeTypes.Claim, mockResource, false, mockNavigate);
      
      onClick();
      
      expect(mockNavigate).toHaveBeenCalledWith('/claims/test.io/v1/TestResource/default/test-resource');
    });

    it('should generate correct URL for Composition', () => {
      const onClick = graphData['genOnClick'](NodeTypes.Composition, mockResource, false, mockNavigate);
      
      onClick();
      
      expect(mockNavigate).toHaveBeenCalledWith('/compositions/test-resource');
    });

    it('should generate correct URL for CompositeResource', () => {
      const onClick = graphData['genOnClick'](NodeTypes.CompositeResource, mockResource, false, mockNavigate);
      
      onClick();
      
      expect(mockNavigate).toHaveBeenCalledWith('/composite/test.io/v1/TestResource/test-resource');
    });

    it('should generate correct URL for ManagedResource', () => {
      const onClick = graphData['genOnClick'](NodeTypes.ManagedResource, mockResource, false, mockNavigate);
      
      onClick();
      
      expect(mockNavigate).toHaveBeenCalledWith('/managed/test.io/v1/TestResource/test-resource');
    });

    it('should return NOOP for unhandled node types', () => {
      const onClick = graphData['genOnClick']('unknown' as NodeTypes, mockResource, false, mockNavigate);
      
      onClick();
      
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('integration tests', () => {
    it('should build a complete graph with nodes and edges', () => {
      const claim: K8sResource = {
        kind: 'Database',
        apiVersion: 'example.com/v1',
        metadata: { name: 'my-db', namespace: 'default' },
      };

      const composite: K8sResource = {
        kind: 'XDatabase',
        apiVersion: 'example.com/v1',
        metadata: { name: 'my-db-composite' },
      };

      const managed: K8sResource = {
        kind: 'RDSInstance',
        apiVersion: 'rds.aws.crossplane.io/v1alpha1',
        metadata: { name: 'my-db-instance' },
      };

      const claimNode = graphData.addNode(NodeTypes.Claim, claim, true, mockNavigate);
      const compositeNode = graphData.addNode(NodeTypes.CompositeResource, composite, false, mockNavigate);
      const managedNode = graphData.addNode(NodeTypes.ManagedResource, managed, false, mockNavigate);

      graphData.addEdge(claimNode, compositeNode);
      graphData.addEdge(compositeNode, managedNode);

      expect(graphData.nodes).toHaveLength(3);
      expect(graphData.edges).toHaveLength(2);
      
      // Verify the graph structure
      expect(graphData.edges[0].source).toBe(claimNode.id);
      expect(graphData.edges[0].target).toBe(compositeNode.id);
      expect(graphData.edges[1].source).toBe(compositeNode.id);
      expect(graphData.edges[1].target).toBe(managedNode.id);
    });

    it('should handle empty resource status gracefully', () => {
      const resourceWithoutStatus: K8sResource = {
        kind: 'Resource',
        apiVersion: 'v1',
        metadata: { name: 'no-status' },
      };

      const node = graphData.addNode(NodeTypes.Claim, resourceWithoutStatus, false, mockNavigate);

      expect(node.data.status).toBe(NodeStatus.Ok);
      expect(node.data.statusMsg).toBe('');
    });
  });
});
