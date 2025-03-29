import * as THREE from 'three';

export class BoundarySphere {
    private group: THREE.Group;
    private sphere: THREE.Mesh;

    constructor() {
        this.group = new THREE.Group();
        
        // Create a sphere geometry with radius 15 (diameter 30)
        const geometry = new THREE.SphereGeometry(15, 32, 32);
        
        // Create a wireframe material
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            transparent: true,
            opacity: 0.03 // Changed from 0.5 to 0.3 for more transparency
        });
        
        // Create the sphere mesh
        this.sphere = new THREE.Mesh(geometry, material);
        
        // Add the sphere to the group
        this.group.add(this.sphere);
    }

    public getGroup(): THREE.Group {
        return this.group;
    }
} 