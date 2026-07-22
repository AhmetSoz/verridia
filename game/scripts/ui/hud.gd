extends CanvasLayer
## HUD — Can / Denge / İrade barları (Verridia altın estetiği).
## Kullanım: hud.bagla(oyuncunun CombatStats'ı)

@onready var can_dolgu: ColorRect = $Panel/Can/Dolgu
@onready var denge_dolgu: ColorRect = $Panel/Denge/Dolgu
@onready var irade_dolgu: ColorRect = $Panel/Irade/Dolgu

const BAR_GEN := 180.0
var _stats: CombatStats

func bagla(stats: CombatStats) -> void:
	_stats = stats
	stats.can_degisti.connect(func(y, a): _ayarla(can_dolgu, y, a))
	stats.denge_degisti.connect(func(y, a): _ayarla(denge_dolgu, y, a))
	stats.irade_degisti.connect(func(y, a): _ayarla(irade_dolgu, y, a))
	_ayarla(can_dolgu, stats.can, stats.azami_can)
	_ayarla(denge_dolgu, stats.denge, stats.azami_denge)
	_ayarla(irade_dolgu, stats.irade, stats.azami_irade)

func _ayarla(bar: ColorRect, deger: float, azami: float) -> void:
	var oran: float = clampf(deger / maxf(azami, 1.0), 0.0, 1.0)
	create_tween().tween_property(bar, "size:x", BAR_GEN * oran, 0.15)
