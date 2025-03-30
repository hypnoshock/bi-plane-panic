import * as THREE from 'three';

export class BulletModel {
    private mesh: THREE.Mesh;

    constructor() {
        const geometry = new THREE.SphereGeometry(0.05, 16, 16); // radius of 0.05 (diameter 0.1)
        const material = new THREE.MeshPhongMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 1, shininess: 100 });
        this.mesh = new THREE.Mesh(geometry, material);
    }

    public getMesh(): THREE.Mesh {
        return this.mesh;
    }
}