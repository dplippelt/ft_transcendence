from pathlib import Path
from urllib.parse import urlparse


AVATAR_DIR = Path("uploads/avatars")
AVATAR_URL_PREFIX = "/uploads/avatars/"


def delete_local_avatar(avatar_url: str | None) -> None:
    if avatar_url is None:
        return

    path = urlparse(avatar_url).path

    if not path.startswith(AVATAR_URL_PREFIX):
        # External avatar, e.g. Google.
        return

    filename = Path(path).name
    avatar_path = AVATAR_DIR / filename

    avatar_path.unlink(missing_ok=True)
