import math
from collections import deque

from app.game.dungeon.map_builder import Map
from app.game.math_utils.bounding_box import BoundingBox
from app.game.math_utils.random_util import Weight, random_point, weighted_random
from app.game.math_utils.vector2 import Vector2

from .dungeon_models import Room, RoomType, Tile, TileNode, TileNodeType
from .room_graph import RoomNode


class RoomSetup:
    def apply(self, map: Map):
        entrance = self.__pick_entrance(map)
        _ = self.__pick_exit(entrance, map)
        self.__setup_remaining_rooms(map)

    def __is_in_front_of_door(self, tile: Vector2, room: Room) -> bool:
        for door in room.doors:
            if (door.position.x == tile.x and abs(tile.y - door.position.y) < 2) or (
                door.position.y == tile.y and abs(tile.x - door.position.x) < 2
            ):
                return True
        return False

    def __pick_random_room_tile(self, room: Room) -> Vector2:
        inner_aabb: BoundingBox = room.aabb.clone().shrink()
        has_free_tile: bool = max(0, inner_aabb.area() - len(room.doors)) > 0

        tile = random_point(inner_aabb.min, inner_aabb.max)
        while self.__is_in_front_of_door(tile, room) and has_free_tile:
            tile = random_point(inner_aabb.min, inner_aabb.max)
        return tile

    def __calculate_entrance_weights(
        self, candidates: list[RoomNode], max_size: float, max_door_count: int
    ) -> list[Weight]:
        SIZE_WEIGHT: float = 0.3
        DOOR_WEIGHT: float = 0.7

        for node in candidates:
            node.score = SIZE_WEIGHT * (
                1.0 - node.room.aabb.area() / max_size
            ) + DOOR_WEIGHT * (1.0 - len(node.room.doors) / max_door_count)

        return [
            Weight(indexx=i, weight=candidates[i].score) for i in range(len(candidates))
        ]

    def __insert_tile_node(self, map: list[list[str]], tile_node: TileNode) -> None:
        x, y = tile_node.position.unpack()
        match tile_node.type:
            case TileNodeType.ENTER_POINT:
                map[y][x] = Tile.ENTER
            case TileNodeType.EXIT_POINT:
                map[y][x] = Tile.EXIT
            case TileNodeType.SPAWN_POINT:
                map[y][x] = Tile.SPAWN
            case _:
                pass

    def __pick_entrance(self, map: Map) -> RoomNode:
        max_door_count: int = 1
        max_size: int = 1
        candidates: list[RoomNode] = []

        for node in map.room_graph.graph:
            max_door_count = max(max_door_count, len(node.room.doors))
            max_size = max(max_size, node.room.aabb.area())
            candidates.append(node)

        weights = self.__calculate_entrance_weights(
            candidates, max_size, max_door_count
        )
        entrance_node = candidates[weighted_random(weights).indexx]
        entrance_node.room.type = RoomType.ENTRANCE
        entrance_node.room.tile_node = TileNode(
            position=self.__pick_random_room_tile(entrance_node.room),
            type=TileNodeType.ENTER_POINT,
        )

        self.__insert_tile_node(map.map, entrance_node.room.tile_node)
        return entrance_node

    def __calculate_exit_weights(
        self, candidates: list[RoomNode], max_depth: float, max_size: float
    ) -> list[Weight]:
        DEPTH_WEIGHT: float = 0.8
        SIZE_WEIGHT: float = 0.2

        for node in candidates:
            node.score = DEPTH_WEIGHT * math.sqrt(
                node.score / max_depth
            ) + SIZE_WEIGHT * (1.0 - node.room.aabb.area() / max_size)

        return [
            Weight(indexx=i, weight=candidates[i].score) for i in range(len(candidates))
        ]

    def __pick_exit(self, entrance: RoomNode, map: Map) -> RoomNode:
        map.room_graph.reset_nodes()
        entrance.visited = True

        max_depth: float = 1
        max_size: float = 1
        candidates: list[RoomNode] = []

        queue: deque[RoomNode] = deque([entrance,])
        while queue:
            current_node: RoomNode = queue.popleft()
            neighbors = map.room_graph.get(current_node)
            for neighbor in neighbors:
                if neighbor.visited:
                    continue

                neighbor.visited = True
                neighbor.score = current_node.score + 1
                if len(map.room_graph.get(neighbor)) > 1:
                    queue.append(neighbor)
                    continue

                max_depth = max(max_depth, neighbor.score)
                max_size = max(max_size, neighbor.room.aabb.area())
                candidates.append(neighbor)

        weights: list[Weight] = self.__calculate_exit_weights(
            candidates, max_depth, max_size
        )
        exit_node = candidates[weighted_random(weights).indexx]
        exit_node.room.type = RoomType.EXIT
        exit_node.room.tile_node = TileNode(
            position=self.__pick_random_room_tile(exit_node.room),
            type=TileNodeType.EXIT_POINT,
        )

        self.__insert_tile_node(map.map, exit_node.room.tile_node)
        return exit_node

    def __setup_remaining_rooms(self, map: Map) -> None:
        for node in map.room_graph.graph:
            room: Room = node.room
            if room.type is not RoomType.NONE:
                continue

            room.type = RoomType.STANDARD
            room.tile_node = TileNode(
                position=self.__pick_random_room_tile(room),
                type=TileNodeType.SPAWN_POINT,
            )
            self.__insert_tile_node(map.map, room.tile_node)
