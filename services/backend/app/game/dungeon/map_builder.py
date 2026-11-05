from collections import deque
from collections.abc import Iterable
from itertools import islice

from app.game.dungeon.dungeon_models import Direction, Door, DungeonConfig, Room, Tile
from app.game.dungeon.room_graph import RoomGraph
from app.game.math_utils.bounding_box import Bound2D
from app.game.math_utils.random_util import randomf, shuffle
from app.game.math_utils.vector2 import Vector2


class Map:
    def __init__(self, map: list[list[str]], width: int, height: int, rooms: list[Room], doors: list[Door], graph: RoomGraph):
        self.map: list[list[str]] = map
        self.width: int = width
        self.height: int = height
        self.rooms: list[Room] = rooms
        self.doors: list[Door] = doors
        self.room_graph: RoomGraph = graph

    def __str__(self):
        return "\n".join(["".join(row) for row in self.map])


class MapBuilder:
    def __generate_rooms(self, config: DungeonConfig) -> list[Room]:
        room_count = randomf(config.room_count.min, config.room_count.max + 1)
        rooms: list[Room] = []
        for i in range(room_count):
            rooms.append(Room.create_room(i, config.room_width, config.room_height))

        return rooms

    def __random_door_count(self, remaing_room_count: int, door_count: Bound2D) -> int:
        return min(remaing_room_count, randomf(door_count.min, door_count.max + 1))

    def __put_room_at(
        self,
        unplaced: Room,
        placed: Room,
        direction: Direction,
        all_placed_rooms: Iterable[Room],
    ) -> bool:
        placed_size = placed.aabb.size
        unplaced_size = unplaced.aabb.size
        offset = Vector2()

        match direction:
            case Direction.TOP:
                offset.y = -unplaced_size.y
                offset.x = randomf(-unplaced_size.x + 3, placed_size.x - 2)
            case Direction.RIGHT:
                offset.x = placed_size.x
                offset.y = randomf(-unplaced_size.y + 3, placed_size.y - 2)
            case Direction.DOWN:
                offset.y = placed_size.y
                offset.x = randomf(-unplaced_size.x + 3, placed_size.x - 2)
            case Direction.LEFT:
                offset.x = -unplaced_size.x
                offset.y = randomf(-unplaced_size.y + 3, placed_size.y - 2)
            case _:
                raise ValueError(
                    f"Invalid direction value {direction} for room placement"
                )

        _ = unplaced.aabb.place(Vector2.addition(placed.aabb.min, offset))
        assert not unplaced.aabb.is_overlap(placed.aabb), (
            "initial placement is already overlapping"
        )

        no_overlap = (
            not unplaced.aabb.is_overlap(room.aabb) for room in all_placed_rooms
        )

        return all(no_overlap)

    def __add_door_way(
        self, doors: list[Door], room_a: Room, room_b: Room, direction: Direction
    ) -> None:
        if not room_a.has_open_space() or not room_b.has_open_space():
            return

        top_left: Vector2 = Vector2.max(room_a.aabb.min, room_b.aabb.min)
        bottom_right: Vector2 = Vector2.min(room_a.aabb.max, room_b.aabb.max)
        position_a: Vector2
        position_b: Vector2

        match direction:
            case Direction.TOP:
                x = randomf(top_left.x + 1, bottom_right.x - 1)
                position_a = Vector2(x, room_a.aabb.min.y)
                position_b = Vector2(x, room_b.aabb.max.y - 1)
            case Direction.RIGHT:
                y = randomf(top_left.y + 1, bottom_right.y - 1)
                position_a = Vector2(room_a.aabb.max.x - 1, y)
                position_b = Vector2(room_b.aabb.min.x, y)
            case Direction.DOWN:
                x = randomf(top_left.x + 1, bottom_right.x - 1)
                position_a = Vector2(x, room_a.aabb.max.y - 1)
                position_b = Vector2(x, room_b.aabb.min.y)
            case Direction.LEFT:
                y = randomf(top_left.y + 1, bottom_right.y - 1)
                position_a = Vector2(room_a.aabb.min.x, y)
                position_b = Vector2(room_b.aabb.max.x - 1, y)
            case _:
                raise ValueError(
                    f"Invalid direction value {direction} for door placement"
                )

        door_a = Door(position=position_a, direction=direction)
        door_b = Door(position=position_b, direction=direction)
        room_a.doors.append(door_a)
        room_b.doors.append(door_b)
        doors.append(door_a)
        doors.append(door_b)

    def __calculate_map_bounds(self, rooms: list[Room]) -> tuple[Vector2, Vector2]:
        min: Vector2 = Vector2(999999, 999999)
        max: Vector2 = Vector2(-999999, -999999)

        for room in rooms:
            min = Vector2.min(room.aabb.min, min)
            max = Vector2.max(room.aabb.max, max)

        return min, max.sub(min)

    def __normalize_to_origin(
        self, map_origin: Vector2, rooms: list[Room], doors: list[Door]
    ):
        offset: Vector2 = map_origin.clone().flip()
        for room in rooms:
            _ = room.aabb.move(offset)

        for door in doors:
            _ = door.position.add(offset)

    def __create_map(
        self, width: int, height: int, rooms: list[Room], placed_doors: list[Door]
    ) -> list[list[str]]:
        map: list[list[str]] = [[Tile.NONE] * width for _ in range(height)]

        for room in rooms:
            for y in range(room.aabb.min.y, room.aabb.max.y):
                for x in range(room.aabb.min.x, room.aabb.max.x):
                    is_vertical = x == room.aabb.min.x or x == room.aabb.max.x - 1
                    is_horizontal = y == room.aabb.min.y or y == room.aabb.max.y - 1
                    if is_vertical and is_horizontal:
                        map[y][x] = Tile.CORNER
                    elif is_vertical or is_horizontal:
                        map[y][x] = Tile.WALL
                    else:
                        map[y][x] = Tile.OPEN

        for door in placed_doors:
            x, y = door.position.unpack()
            map[y][x] = Tile.DOOR

        return map

    def __create_room_layout(
        self, config: DungeonConfig
    ) -> tuple[list[Room], list[Door], RoomGraph]:
        rooms: list[Room] = self.__generate_rooms(config)
        queued_rooms: deque[Room] = deque(maxlen=len(rooms))
        doors: list[Door] = []
        directions: list[Direction] = [
            Direction.TOP,
            Direction.RIGHT,
            Direction.DOWN,
            Direction.LEFT,
        ]
        graph: RoomGraph = RoomGraph()

        room_idx = 1
        queued_rooms.append(rooms[0])
        while queued_rooms and room_idx < len(rooms):
            placed_room = queued_rooms.popleft()
            door_count = self.__random_door_count(len(rooms) - room_idx, config.door_count)

            shuffle(directions)
            for i in range(len(directions)):
                if door_count == 0:
                    break
                direction = directions[i % len(directions)]
                if self.__put_room_at(
                    rooms[room_idx], placed_room, direction, islice(rooms, room_idx)
                ):
                    graph.add_connection(placed_room, rooms[room_idx])
                    self.__add_door_way(doors, placed_room, rooms[room_idx], direction)
                    queued_rooms.append(rooms[room_idx])
                    door_count -= 1
                    room_idx += 1

        return rooms, doors, graph

    def create(self, config: DungeonConfig) -> Map:
        rooms, doors, graph = self.__create_room_layout(config)
        min, size = self.__calculate_map_bounds(rooms)
        self.__normalize_to_origin(min, rooms, doors)
        map = self.__create_map(size.x, size.y, rooms, doors)

        return Map(map=map, width=size.x, height=size.y, rooms=rooms, doors=doors, graph=graph)
