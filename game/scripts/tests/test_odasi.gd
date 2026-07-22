extends Node2D
## Test odası — dövüş laboratuvarının ilk odası.
## Girişte kontrol noktası kaydeder; HUD'u oyuncuya bağlar.

@onready var oyuncu: PlayerTogan = $Togan
@onready var can_bar: Label = $HUD/Bilgi/Can
@onready var denge_bar: Label = $HUD/Bilgi/Denge
@onready var irade_bar: Label = $HUD/Bilgi/Irade

func _ready() -> void:
	SceneFlow.kontrol_noktasi_kaydet("test_odasi_giris")
	oyuncu.stats.can_degisti.connect(func(y, a): can_bar.text = "CAN  %d / %d" % [y, a])
	oyuncu.stats.denge_degisti.connect(func(y, a): denge_bar.text = "DENGE  %d / %d" % [y, a])
	oyuncu.stats.irade_degisti.connect(func(y, a): irade_bar.text = "İRADE  %d / %d" % [y, a])
	can_bar.text = "CAN  %d / %d" % [oyuncu.stats.can, oyuncu.stats.azami_can]
	denge_bar.text = "DENGE  %d / %d" % [oyuncu.stats.denge, oyuncu.stats.azami_denge]
	irade_bar.text = "İRADE  %d / %d" % [oyuncu.stats.irade, oyuncu.stats.azami_irade]
