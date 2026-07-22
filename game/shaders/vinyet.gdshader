shader_type canvas_item;
// Kenar karartma (vinyet) — atmosfer derinliği
uniform float guc : hint_range(0.0, 1.0) = 0.55;
uniform float ic : hint_range(0.0, 1.0) = 0.35;
uniform float dis : hint_range(0.0, 1.5) = 0.85;
void fragment() {
	vec2 uv = UV - 0.5;
	float d = length(uv * vec2(1.15, 1.0));
	float v = smoothstep(dis, ic, d);
	COLOR = vec4(0.0, 0.0, 0.02, (1.0 - v) * guc);
}
