import * as THREE from 'three';

export class Bullet {
    private mesh: THREE.Mesh;

    constructor() {
        const geometry = new THREE.SphereGeometry(0.05, 16, 16); // radius of 0.05 (diameter 0.1)
        const material = new THREE.MeshPhongMaterial({ color: 0xffffff });
        this.mesh = new THREE.Mesh(geometry, material);
    }

    public getMesh(): THREE.Mesh {
        return this.mesh;
    }
} 