extends Node
## SaveManager — üç kampanya yuvası, JSON tabanlı.

const YUVA_SAYISI := 3
const SURUM := "0.1.0"

signal kaydedildi(yuva: int)
signal yuklendi(yuva: int)

func _yol(yuva: int) -> String:
	return "user://kayit_%d.json" % yuva

func kaydet(yuva: int, kontrol_noktasi: String = "") -> bool:
	if yuva < 1 or yuva > YUVA_SAYISI:
		return false
	var veri := GameState.durum_sozlugu()
	veri["kontrol_noktasi"] = kontrol_noktasi
	veri["surum"] = SURUM
	veri["tarih"] = Time.get_datetime_string_from_system()
	var f := FileAccess.open(_yol(yuva), FileAccess.WRITE)
	if f == null:
		push_error("Kayıt yazılamadı: yuva %d" % yuva)
		return false
	f.store_string(JSON.stringify(veri, "\t"))
	f.close()
	kaydedildi.emit(yuva)
	return true

func yukle(yuva: int) -> bool:
	if not yuva_var(yuva):
		return false
	var f := FileAccess.open(_yol(yuva), FileAccess.READ)
	var sonuc = JSON.parse_string(f.get_as_text())
	f.close()
	if typeof(sonuc) != TYPE_DICTIONARY:
		push_error("Kayıt bozuk: yuva %d" % yuva)
		return false
	GameState.durumdan_yukle(sonuc)
	yuklendi.emit(yuva)
	return true

func yuva_var(yuva: int) -> bool:
	return FileAccess.file_exists(_yol(yuva))

func yuva_ozeti(yuva: int) -> Dictionary:
	## Menüde göstermek için hafif özet (tam yükleme yapmadan).
	if not yuva_var(yuva):
		return {}
	var f := FileAccess.open(_yol(yuva), FileAccess.READ)
	var sonuc = JSON.parse_string(f.get_as_text())
	f.close()
	if typeof(sonuc) != TYPE_DICTIONARY:
		return {}
	return {
		"kisim": sonuc.get("kisim", 1),
		"fasil": sonuc.get("fasil", 1),
		"aktif_pov": sonuc.get("aktif_pov", "togan"),
		"oyun_suresi_sn": sonuc.get("oyun_suresi_sn", 0.0),
		"tarih": sonuc.get("tarih", ""),
	}

func sil(yuva: int) -> void:
	if yuva_var(yuva):
		DirAccess.remove_absolute(ProjectSettings.globalize_path(_yol(yuva)))
