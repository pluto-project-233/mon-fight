// EventQueue - FIFO queue for WebSocket events
// Ensures events are processed one at a time, in order

class EventQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
    this.processor = null; // Function to process each event
    this.onIdle = null; // Callback when queue becomes idle
  }

  // Set the event processor function
  setProcessor(processorFn) {
    this.processor = processorFn;
  }

  // Set callback for when queue becomes idle
  setOnIdle(callback) {
    this.onIdle = callback;
  }

  // Add event to queue
  push(event) {
    console.log('[EventQueue] Enqueue:', event.type);
    this.queue.push(event);
    this.processNext();
  }

  // Process next event if not already processing
  async processNext() {
    if (this.isProcessing || this.queue.length === 0 || !this.processor) {
      return;
    }

    this.isProcessing = true;
    const event = this.queue.shift();
    
    console.log('[EventQueue] Processing:', event.type);
    
    try {
      await this.processor(event);
    } catch (error) {
      console.error('[EventQueue] Error processing event:', error);
    }
    
    this.isProcessing = false;
    
    // Check if more events to process
    if (this.queue.length > 0) {
      this.processNext();
    } else {
      // Queue is now idle, trigger callback
      if (this.onIdle) {
        this.onIdle();
      }
    }
  }

  // Check if queue is empty and not processing
  isIdle() {
    return !this.isProcessing && this.queue.length === 0;
  }

  // Clear all pending events (use carefully)
  clear() {
    this.queue = [];
  }

  // Get queue length
  get length() {
    return this.queue.length;
  }
}

window.EventQueue = EventQueue;
