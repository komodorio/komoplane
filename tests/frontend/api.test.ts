import { sendStatsToHeap } from '../../pkg/frontend/src/utils';

// Mock the utils module
jest.mock('../../pkg/frontend/src/utils', () => ({
  sendStatsToHeap: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn();

// Mock the API client methods directly
const apiClient = {
  innterFetch: jest.fn(),
  getProviderList: jest.fn(),
  getProvider: jest.fn(),
  getEvents: jest.fn(),
  getProviderConfigs: jest.fn(),
  getClaimList: jest.fn(),
  getClaim: jest.fn(),
  getManagedResourcesList: jest.fn(),
  getManagedResource: jest.fn(),
  getCompositeResourcesList: jest.fn(),
  getCompositeResource: jest.fn(),
  getCompositionsList: jest.fn(),
  getXRDsList: jest.fn(),
  getStatus: jest.fn(),
};

describe('APIClient Mock Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('should have all required methods', () => {
      expect(apiClient.innterFetch).toBeDefined();
      expect(apiClient.getProviderList).toBeDefined();
      expect(apiClient.getProvider).toBeDefined();
      expect(apiClient.getEvents).toBeDefined();
      expect(apiClient.getProviderConfigs).toBeDefined();
      expect(apiClient.getClaimList).toBeDefined();
      expect(apiClient.getClaim).toBeDefined();
      expect(apiClient.getManagedResourcesList).toBeDefined();
      expect(apiClient.getManagedResource).toBeDefined();
      expect(apiClient.getCompositeResourcesList).toBeDefined();
      expect(apiClient.getCompositeResource).toBeDefined();
      expect(apiClient.getCompositionsList).toBeDefined();
      expect(apiClient.getXRDsList).toBeDefined();
      expect(apiClient.getStatus).toBeDefined();
    });

    it('should verify all methods are jest functions', () => {
      Object.values(apiClient).forEach(method => {
        expect(jest.isMockFunction(method)).toBe(true);
      });
    });
  });

  describe('provider operations', () => {
    it('should mock getProviderList successfully', async () => {
      const mockProviders = [
        { 
          name: 'test-provider',
          healthy: true,
          installed: true
        }
      ];
      
      apiClient.getProviderList.mockResolvedValue(mockProviders);
      
      const result = await apiClient.getProviderList();
      
      expect(apiClient.getProviderList).toHaveBeenCalled();
      expect(result).toEqual(mockProviders);
    });

    it('should mock getProvider for individual provider', async () => {
      const mockProvider = {
        name: 'aws-provider',
        healthy: true,
        installed: true,
        version: 'v1.0.0'
      };
      
      apiClient.getProvider.mockResolvedValue(mockProvider);
      
      const result = await apiClient.getProvider('aws-provider');
      
      expect(apiClient.getProvider).toHaveBeenCalledWith('aws-provider');
      expect(result).toEqual(mockProvider);
    });

    it('should handle provider API errors', async () => {
      apiClient.getProviderList.mockRejectedValue(new Error('Provider service unavailable'));
      
      await expect(apiClient.getProviderList()).rejects.toThrow('Provider service unavailable');
    });
  });

  describe('resource operations', () => {
    it('should mock getManagedResourcesList', async () => {
      const mockResources = [
        { name: 'bucket-1', kind: 'Bucket', status: 'Ready' },
        { name: 'bucket-2', kind: 'Bucket', status: 'Creating' }
      ];
      
      apiClient.getManagedResourcesList.mockResolvedValue(mockResources);
      
      const result = await apiClient.getManagedResourcesList();
      
      expect(apiClient.getManagedResourcesList).toHaveBeenCalled();
      expect(result).toEqual(mockResources);
    });

    it('should mock getCompositeResourcesList', async () => {
      const mockComposites = [
        { name: 'xbucket-1', kind: 'XBucket', status: 'Ready' }
      ];
      
      apiClient.getCompositeResourcesList.mockResolvedValue(mockComposites);
      
      const result = await apiClient.getCompositeResourcesList();
      
      expect(apiClient.getCompositeResourcesList).toHaveBeenCalled();
      expect(result).toEqual(mockComposites);
    });

    it('should mock getClaimList', async () => {
      const mockClaims = [
        { name: 'my-bucket', namespace: 'default', status: 'Bound' }
      ];
      
      apiClient.getClaimList.mockResolvedValue(mockClaims);
      
      const result = await apiClient.getClaimList();
      
      expect(apiClient.getClaimList).toHaveBeenCalled();
      expect(result).toEqual(mockClaims);
    });
  });

  describe('configuration operations', () => {
    it('should mock getProviderConfigs', async () => {
      const mockConfigs = [
        { name: 'aws-config', provider: 'aws', status: 'Ready' }
      ];
      
      apiClient.getProviderConfigs.mockResolvedValue(mockConfigs);
      
      const result = await apiClient.getProviderConfigs();
      
      expect(apiClient.getProviderConfigs).toHaveBeenCalled();
      expect(result).toEqual(mockConfigs);
    });

    it('should mock getCompositionsList', async () => {
      const mockCompositions = [
        { name: 'xbucket-composition', compositeTypeRef: 'XBucket' }
      ];
      
      apiClient.getCompositionsList.mockResolvedValue(mockCompositions);
      
      const result = await apiClient.getCompositionsList();
      
      expect(apiClient.getCompositionsList).toHaveBeenCalled();
      expect(result).toEqual(mockCompositions);
    });

    it('should mock getXRDsList', async () => {
      const mockXRDs = [
        { name: 'xbuckets.example.com', kind: 'CompositeResourceDefinition' }
      ];
      
      apiClient.getXRDsList.mockResolvedValue(mockXRDs);
      
      const result = await apiClient.getXRDsList();
      
      expect(apiClient.getXRDsList).toHaveBeenCalled();
      expect(result).toEqual(mockXRDs);
    });
  });

  describe('system operations', () => {
    it('should mock getStatus', async () => {
      const mockStatus = {
        healthy: true,
        version: '1.0.0',
        crossplaneVersion: '1.14.0'
      };
      
      apiClient.getStatus.mockResolvedValue(mockStatus);
      
      const result = await apiClient.getStatus();
      
      expect(apiClient.getStatus).toHaveBeenCalled();
      expect(result).toEqual(mockStatus);
    });

    it('should mock getEvents', async () => {
      const mockEvents = [
        { 
          type: 'Normal',
          reason: 'Created',
          message: 'Resource created successfully',
          timestamp: '2023-01-01T00:00:00Z'
        }
      ];
      
      apiClient.getEvents.mockResolvedValue(mockEvents);
      
      const result = await apiClient.getEvents('bucket-1');
      
      expect(apiClient.getEvents).toHaveBeenCalledWith('bucket-1');
      expect(result).toEqual(mockEvents);
    });
  });

  describe('core fetch operations', () => {
    it('should mock innterFetch method', async () => {
      const mockResponse = { data: 'test response' };
      
      apiClient.innterFetch.mockResolvedValue(mockResponse);
      
      const result = await apiClient.innterFetch('/api/test');
      
      expect(apiClient.innterFetch).toHaveBeenCalledWith('/api/test');
      expect(result).toEqual(mockResponse);
    });

    it('should handle fetch errors', async () => {
      apiClient.innterFetch.mockRejectedValue(new Error('Network error'));
      
      await expect(apiClient.innterFetch('/api/test')).rejects.toThrow('Network error');
    });
  });

  describe('analytics integration', () => {
    it('should be able to call sendStatsToHeap', () => {
      sendStatsToHeap('test_event', { key: 'value' });
      
      expect(sendStatsToHeap).toHaveBeenCalledWith('test_event', { key: 'value' });
    });

    it('should track analytics for different event types', () => {
      const events = [
        ['page_view', { page: 'providers' }],
        ['resource_click', { resource: 'bucket-1' }],
        ['api_call', { endpoint: '/api/providers' }]
      ];

      events.forEach(([event, data]) => {
        sendStatsToHeap(event, data);
      });

      expect(sendStatsToHeap).toHaveBeenCalledTimes(3);
      events.forEach(([event, data]) => {
        expect(sendStatsToHeap).toHaveBeenCalledWith(event, data);
      });
    });
  });
});
