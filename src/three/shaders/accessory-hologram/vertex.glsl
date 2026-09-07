#include ../includes/avatar-progress/vertex.glsl;

varying vec3 vNormal;
varying vec3 vWorldPos;

void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);

    vWorldPos = worldPosition.xyz;
    vNormal = normalize(normalMatrix * normal);
    vModelProgress = getModelProgress(position);

    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
