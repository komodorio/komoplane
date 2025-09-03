import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Error Handling in main.tsx', () => {
  let originalAddEventListener: typeof window.addEventListener;
  let mockAddEventListener: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Store the original addEventListener
    originalAddEventListener = window.addEventListener;
    
    // Create a mock
    mockAddEventListener = vi.fn();
    window.addEventListener = mockAddEventListener;
    
    // Clear any previous event listeners
    mockAddEventListener.mockClear();
  });

  afterEach(() => {
    // Restore the original addEventListener
    window.addEventListener = originalAddEventListener;
  });

  it('should register an unhandledrejection event listener', async () => {
    // Import main.tsx to trigger the event listener registration
    await import('../main');

    // Verify that addEventListener was called with 'unhandledrejection'
    expect(mockAddEventListener).toHaveBeenCalledWith(
      'unhandledrejection',
      expect.any(Function)
    );
  });

  it('should suppress browser extension errors', async () => {
    await import('../main');

    // Get the event handler that was registered
    const calls = mockAddEventListener.mock.calls;
    const unhandledRejectionCall = calls.find(call => call[0] === 'unhandledrejection');
    expect(unhandledRejectionCall).toBeTruthy();

    const eventHandler = unhandledRejectionCall![1] as (event: PromiseRejectionEvent) => void;

    // Test message channel closed error
    const messageChannelEvent = {
      reason: {
        message: 'A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received'
      },
      preventDefault: vi.fn()
    } as unknown as PromiseRejectionEvent;

    eventHandler(messageChannelEvent);
    expect(messageChannelEvent.preventDefault).toHaveBeenCalled();

    // Test listener error
    const listenerEvent = {
      reason: {
        message: 'listener indicated an asynchronous response'
      },
      preventDefault: vi.fn()
    } as unknown as PromiseRejectionEvent;

    eventHandler(listenerEvent);
    expect(listenerEvent.preventDefault).toHaveBeenCalled();
  });

  it('should not suppress non-extension errors', async () => {
    await import('../main');

    const calls = mockAddEventListener.mock.calls;
    const unhandledRejectionCall = calls.find(call => call[0] === 'unhandledrejection');
    const eventHandler = unhandledRejectionCall![1] as (event: PromiseRejectionEvent) => void;

    // Test regular error (should not be suppressed)
    const regularEvent = {
      reason: {
        message: 'Some regular error'
      },
      preventDefault: vi.fn()
    } as unknown as PromiseRejectionEvent;

    eventHandler(regularEvent);
    expect(regularEvent.preventDefault).not.toHaveBeenCalled();
  });

  it('should handle events with undefined reason gracefully', async () => {
    await import('../main');

    const calls = mockAddEventListener.mock.calls;
    const unhandledRejectionCall = calls.find(call => call[0] === 'unhandledrejection');
    const eventHandler = unhandledRejectionCall![1] as (event: PromiseRejectionEvent) => void;

    // Test event with undefined reason
    const undefinedReasonEvent = {
      reason: undefined,
      preventDefault: vi.fn()
    } as unknown as PromiseRejectionEvent;

    expect(() => eventHandler(undefinedReasonEvent)).not.toThrow();
    expect(undefinedReasonEvent.preventDefault).not.toHaveBeenCalled();
  });

  it('should handle events with null reason gracefully', async () => {
    await import('../main');

    const calls = mockAddEventListener.mock.calls;
    const unhandledRejectionCall = calls.find(call => call[0] === 'unhandledrejection');
    const eventHandler = unhandledRejectionCall![1] as (event: PromiseRejectionEvent) => void;

    // Test event with null reason
    const nullReasonEvent = {
      reason: null,
      preventDefault: vi.fn()
    } as unknown as PromiseRejectionEvent;

    expect(() => eventHandler(nullReasonEvent)).not.toThrow();
    expect(nullReasonEvent.preventDefault).not.toHaveBeenCalled();
  });
});
