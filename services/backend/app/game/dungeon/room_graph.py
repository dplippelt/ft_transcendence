from .dungeon_models import Room


class RoomNode:
    def __init__(self, room: Room):
        self.room: Room = room
        self.visited: bool = False
        self.score: float = -1


class RoomGraph:
    def __init__(self):
        self.graph: dict[RoomNode, set[RoomNode]] = {}
        self.__id_to_node: dict[int, RoomNode] = {}

    def get_room_node(self, room: Room) -> RoomNode:
        return self.__id_to_node[room.id]

    def get(self, room_node: RoomNode) -> set[RoomNode]:
        return self.graph[room_node]

    def add_connection(self, room_a: Room, room_b: Room):
        room_a_node = self.__id_to_node.setdefault(room_a.id, RoomNode(room_a))
        room_b_node = self.__id_to_node.setdefault(room_b.id, RoomNode(room_b))

        self.graph.setdefault(room_a_node, set()).add(room_b_node)
        self.graph.setdefault(room_b_node, set()).add(room_a_node)

    def reset_nodes(self):
        for node in self.graph:
            node.visited = False
            node.score = -1

    def clear(self):
        self.graph.clear()
        self.__id_to_node.clear()
