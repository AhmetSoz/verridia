extends Node2D
## Test odası — dövüş laboratuvarının ilk odası.
## Girişte kontrol noktası kaydeder; stilize HUD'u oyuncuya bağlar.

@onready var oyuncu: PlayerTogan = $Togan
@onready var hud = $HUD

func _ready() -> void:
	SceneFlow.kontrol_noktasi_kaydet("test_odasi_giris")
	hud.bagla(oyuncu.stats)
