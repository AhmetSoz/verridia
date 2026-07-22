extends Node2D
## Kartal-Yurdu — Birinci Kitap açılışı (Bölüm 1, TOGAN).
## Şafak öncesi bozkır talim alanı. Tek Göz gökte, Kızıl Sürü ufukta.

@onready var oyuncu: PlayerTogan = $Togan
@onready var hud = $HUD

func _ready() -> void:
	SceneFlow.kontrol_noktasi_kaydet("kartal_yurdu_giris")
	hud.bagla(oyuncu.stats)
