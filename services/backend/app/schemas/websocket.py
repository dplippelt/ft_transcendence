from pydantic import BaseModel


class WebSocketTicketResponse(BaseModel):
    ticket: str
    expires_in: int
