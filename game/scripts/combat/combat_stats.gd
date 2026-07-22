class_name CombatStats
extends Node
## Can / Denge / İrade — plan §7'deki üç gösterge.
## Denge: savunma ve ağır darbelerde azalır; kırılınca sendeleme.
## İrade: parry ve riskli oyunla dolar; özel yeteneklerde harcanır.

signal can_degisti(yeni: float, azami: float)
signal denge_degisti(yeni: float, azami: float)
signal irade_degisti(yeni: float, azami: float)
signal denge_kirildi
signal oldu

@export var azami_can: float = 100.0
@export var azami_denge: float = 60.0
@export var azami_irade: float = 100.0
@export var denge_yenilenme_hizi: float = 12.0   # sn başına (savaş dışı/bekleme)
@export var denge_yenilenme_gecikme: float = 1.2 # son darbeden sonra bekleme

var can: float
var denge: float
var irade: float = 0.0
var _denge_gecikme_sayaci: float = 0.0

func _ready() -> void:
	can = azami_can
	denge = azami_denge

func _physics_process(delta: float) -> void:
	if denge < azami_denge:
		if _denge_gecikme_sayaci > 0.0:
			_denge_gecikme_sayaci -= delta
		else:
			denge = minf(azami_denge, denge + denge_yenilenme_hizi * delta)
			denge_degisti.emit(denge, azami_denge)

func hasar_al(miktar: float) -> void:
	can = maxf(0.0, can - miktar)
	can_degisti.emit(can, azami_can)
	if can <= 0.0:
		oldu.emit()

func iyiles(miktar: float) -> void:
	can = minf(azami_can, can + miktar)
	can_degisti.emit(can, azami_can)

func denge_hasari(miktar: float) -> void:
	denge = maxf(0.0, denge - miktar)
	_denge_gecikme_sayaci = denge_yenilenme_gecikme
	denge_degisti.emit(denge, azami_denge)
	if denge <= 0.0:
		denge = azami_denge * 0.5  # kırılma sonrası yarımdan toparlar
		denge_kirildi.emit()

func irade_kazan(miktar: float) -> void:
	irade = minf(azami_irade, irade + miktar)
	irade_degisti.emit(irade, azami_irade)

func irade_harca(miktar: float) -> bool:
	if irade < miktar:
		return false
	irade -= miktar
	irade_degisti.emit(irade, azami_irade)
	return true
