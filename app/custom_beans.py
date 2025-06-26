from pydantic import BaseModel

class LeaderboardItem(BaseModel):
    user_id: int
    value: float

class Leaderboards(BaseModel):
    distance: list[LeaderboardItem]
    elevation: list[LeaderboardItem]
    max_speed: list[LeaderboardItem]
    elev_high: list[LeaderboardItem]

class TeamStatsResponse(BaseModel):
    total_distance_km: float
    total_elevation_m: float
    leaderboards: Leaderboards