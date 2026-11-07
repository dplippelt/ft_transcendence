from app.game.dungeon.dungeon_models import DungeonConfig
from app.game.dungeon.map_builder import Map, MapBuilder
from app.game.dungeon.room_setup import RoomSetup


class Dungeon:
    def __init__(self):
        self.map: Map | None = None
        self.map_builder: MapBuilder = MapBuilder()
        self.room_setup: RoomSetup = RoomSetup()

    def generate(self, config: DungeonConfig):
        self.map = self.map_builder.create(config)
        self.room_setup.apply(self.map)
