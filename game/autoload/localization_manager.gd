extends Node
## Loc — yerelleştirme: tr ana dil, en/es altyazı altyapısı.
## CSV: localization/tr.csv, en.csv, es.csv  (anahtar,metin)

var dil: String = "tr"
var _tablolar: Dictionary = {}  # dil -> {anahtar: metin}

func _ready() -> void:
	for d in ["tr", "en", "es"]:
		_tablolar[d] = _csv_yukle("res://localization/%s.csv" % d)

func _csv_yukle(yol: String) -> Dictionary:
	var t: Dictionary = {}
	if not FileAccess.file_exists(yol):
		return t
	var f := FileAccess.open(yol, FileAccess.READ)
	while not f.eof_reached():
		var satir := f.get_csv_line()
		if satir.size() >= 2 and not satir[0].is_empty() and not satir[0].begins_with("#"):
			t[satir[0]] = satir[1]
	f.close()
	return t

func dil_ata(yeni: String) -> void:
	if yeni in _tablolar:
		dil = yeni

func m(anahtar: String) -> String:
	## Metin getir: aktif dil → tr → anahtarın kendisi.
	var t: Dictionary = _tablolar.get(dil, {})
	if anahtar in t:
		return t[anahtar]
	var tr_t: Dictionary = _tablolar.get("tr", {})
	return tr_t.get(anahtar, anahtar)
