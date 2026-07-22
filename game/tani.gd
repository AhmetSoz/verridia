extends SceneTree
func _init():
	var oyuncu = load("res://scenes/characters/togan.tscn").instantiate()
	var dusman = load("res://scenes/enemies/dummy.tscn").instantiate()
	var kok = Node2D.new(); get_root().add_child(kok)
	kok.add_child(oyuncu); kok.add_child(dusman)
	oyuncu.global_position = Vector2(100, 100)
	dusman.global_position = Vector2(118, 100)
	await physics_frame; await physics_frame
	oyuncu.hitbox.position.x = 18
	oyuncu.hitbox.ac()
	await physics_frame; await physics_frame; await physics_frame
	var hb = oyuncu.hitbox; var hu = dusman.hurtbox
	print("HITBOX: layer=%d mask=%d monitoring=%s monitorable=%s gpos=%s" % [hb.collision_layer, hb.collision_mask, hb.monitoring, hb.monitorable, hb.global_position])
	print("HURTBOX: layer=%d mask=%d monitoring=%s monitorable=%s gpos=%s" % [hu.collision_layer, hu.collision_mask, hu.monitoring, hu.monitorable, hu.global_position])
	print("hitbox.overlapping_areas=", hb.get_overlapping_areas())
	print("hurtbox.overlapping_areas=", hu.get_overlapping_areas())
	quit()
