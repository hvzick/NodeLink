// utils/EventBus.ts

// A very simple event emitter class to allow different parts of the app
// to communicate without direct dependencies.
class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  /**
   * Subscribe to an event.
   * @param event The name of the event to listen for.
   * @param listener The callback function to execute when the event is emitted.
   */
  on(event: string, listener: Function) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
  }

  /**
   * Unsubscribe from an event.
   * @param event The name of the event.
   * @param listener The callback function to remove.
   */
  off(event: string, listener: Function) {
    if (!this.events[event]) return;

    this.events[event] = this.events[event].filter(l => l !== listener);
  }

  /**
   * Emit an event, calling all subscribed listeners.
   * @param event The name of the event to emit.
   * @param payload The data to pass to the listeners.
   */
  emit(event: string, payload: any) {
    if (!this.events[event]) return;

    this.events[event].forEach(listener => listener(payload));
  }
}

// --- MODIFICATION ---
// Changed from 'export default' to a named export 'export const'.
// This is a more explicit and robust way to export the singleton instance.
export const EventBus = new EventEmitter();
