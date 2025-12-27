interface QueuedPlayer {
  id: string;
  ws: any;
  timestamp: number;
}

export class RoomQueue {
  private queue: QueuedPlayer[] = [];

  enqueue(player: QueuedPlayer) {
    this.queue.push(player);
  }

  dequeue(): QueuedPlayer | undefined {
    return this.queue.shift();
  }

  remove(playerId: string) {
    this.queue = this.queue.filter(p => p.id !== playerId);
  }

  size(): number {
    return this.queue.length;
  }

  clear() {
    this.queue = [];
  }
}
