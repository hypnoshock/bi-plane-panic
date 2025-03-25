import * as THREE from 'three';

export class SmokeParticleModel {
    private mesh: THREE.Mesh;
    private material: THREE.MeshBasicMaterial;
    private maxScale: number = 1.0;
    private duration: number = 2.0;
    private currentTime: number = 0;
    private initialPosition: THREE.Vector3 = new THREE.Vector3();
    private velocity: THREE.Vector3 = new THREE.Vector3();
    private color: number;

    constructor(color: number = 0x808080) {
        const geometry = new THREE.SphereGeometry(0.1, 16, 16);
        this.material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8
        });
        this.mesh = new THREE.Mesh(geometry, this.material);
        this.color = color;
    }

    public getMesh(): THREE.Mesh {
        return this.mesh;
    }

    public setInitialPosition(position: THREE.Vector3, velocity: THREE.Vector3): void {
        this.initialPosition = position.clone();
        this.velocity = velocity.clone();
        this.mesh.position.copy(position);
    }

    public update(deltaTime: number): boolean {
        this.currentTime += deltaTime;
        const progress = this.currentTime / this.duration;

        if (progress >= 1) {
            return false; // Particle is done
        }

        // Update position based on velocity
        this.mesh.position.add(this.velocity.clone().multiplyScalar(deltaTime));

        // Scale up and fade out
        const scale = 1 + (this.maxScale - 1) * (1 - Math.pow(1 - progress, 2));
        this.mesh.scale.set(scale, scale, scale);
        this.material.opacity = 0.8 * (1 - Math.pow(progress, 2));

        return true;
    }
} 