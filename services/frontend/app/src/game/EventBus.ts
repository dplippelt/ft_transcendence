import { Events } from "phaser";

// Used to emit events between components, HTML and Phaser scenes
export const EventBus = new Events.EventEmitter();

// Emits the event as soon as the listener is ready. If it doesn't exist yet
// it waits one frame and tries again.
// This is to account for race conditions where we cannot predict whether the
// React component will mount first or the phaser class that subscribes to the event
// is constructed first.
export function emitWhenReady( event: string, ...args: unknown[] ) {
  if (EventBus.listenerCount(event) > 0) {
    EventBus.emit(event, ...args);
  } else {
    requestAnimationFrame(() => emitWhenReady(event, ...args));
  }
}
