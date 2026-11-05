import { Room } from "./DungeonModels";

export class RoomNode {
  room: Room;
  visited: boolean;
  score: number;

  constructor(room: Room) {
    this.room = room;
    this.visited = false;
    this.score = -1;
  }
}

export class RoomGraph {
  private idToNode: Map<number, RoomNode>;
  graph: Map<RoomNode, Set<RoomNode>>;

  constructor() {
    this.idToNode = new Map<number, RoomNode>();
    this.graph = new Map<RoomNode, Set<RoomNode>>;
  }

  getRoomNode(room: Room): RoomNode {
    return this.idToNode.get(room.id);
  }

  get(roomNode: RoomNode): Set<RoomNode> {
    return this.graph.get(roomNode);
  }

  addConnection(roomA: Room, roomB: Room): void {
    let roomNodeA = this.idToNode.get(roomA.id);
    if (roomNodeA === undefined) {
      roomNodeA = new RoomNode(roomA);
      this.idToNode.set(roomA.id, roomNodeA);
    }

    let roomNodeB: RoomNode = this.idToNode.get(roomB.id);
    if (roomNodeB === undefined) {
      roomNodeB = new RoomNode(roomB);
      this.idToNode.set(roomB.id, roomNodeB);
    }

    const roomNodeASet = this.graph.get(roomNodeA);
    if (roomNodeASet === undefined) {
      this.graph.set(roomNodeA, new Set<RoomNode>().add(roomNodeB))
    } else {
      roomNodeASet.add(roomNodeB);
    }

    const roomNodeBSet = this.graph.get(roomNodeB);
    if (roomNodeBSet === undefined) {
      this.graph.set(roomNodeB, new Set<RoomNode>().add(roomNodeA))
    } else {
      roomNodeBSet.add(roomNodeA);
    }
  }

  resetNodes(): void {
    for (const node of this.graph.keys()) {
      node.visited = false;
      node.score = -1;
    }
  }

  clear(): void {
    this.graph.clear();
    this.idToNode.clear();
  }
}
