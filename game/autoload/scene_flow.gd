extends Node
## SceneFlow — sahne geçişleri + kontrol noktası akışı.
## "POV geçiş sinematiği → merkez → aksiyon → boss → sonuç" zincirini yönetir.

signal gecis_basladi(hedef: String)
signal gecis_bitti(hedef: String)

var _son_kontrol_noktasi: String = ""
var _son_kontrol_sahnesi: String = ""

func sahneye_git(yol: String) -> void:
	gecis_basladi.emit(yol)
	## İleride: karartma animasyonu buraya bağlanacak.
	get_tree().change_scene_to_file.call_deferred(yol)
	await get_tree().process_frame
	gecis_bitti.emit(yol)

func kontrol_noktasi_kaydet(nokta_id: String) -> void:
	_son_kontrol_noktasi = nokta_id
	_son_kontrol_sahnesi = get_tree().current_scene.scene_file_path
	## Otomatik kayıt: aktif yuva 1 varsayılan (menü bağlanınca seçilen yuva kullanılacak)
	SaveManager.kaydet(1, nokta_id)

func son_kontrol_noktasina_don() -> void:
	## Ölüm: son kontrol noktasına dön; büyük ara sahne tekrar oynatılmaz.
	if _son_kontrol_sahnesi.is_empty():
		get_tree().reload_current_scene()
		return
	sahneye_git(_son_kontrol_sahnesi)

func son_kontrol_noktasi() -> String:
	return _son_kontrol_noktasi
