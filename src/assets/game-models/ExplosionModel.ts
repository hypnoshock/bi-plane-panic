import * as THREE from 'three';

export class ExplosionModel {
    private fireGeometry: THREE.SphereGeometry;
    private fireMaterial: THREE.MeshBasicMaterial;
    private fireMesh: THREE.Mesh;
    private whiteGeometry: THREE.SphereGeometry;
    private whiteMaterial: THREE.MeshBasicMaterial;
    private whiteMesh: THREE.Mesh;
    private group: THREE.Group;
    private fireMaxScale: number = 3.0;
    private fireDuration: number = 1.5;
    private currentTime: number = 0;
    private whiteSphereDuration: number = 0.25;

    constructor() {
        this.fireGeometry = new THREE.SphereGeometry(0.5, 32, 32);
        this.fireMaterial = new THREE.MeshBasicMaterial({
            color: 0xff6600,
            transparent: true,
            opacity: 1
        });
        this.fireMesh = new THREE.Mesh(this.fireGeometry, this.fireMaterial);
        this.fireMesh.renderOrder = 0; // Lower render order for the fire mesh
        
        // Create white sphere
        this.whiteGeometry = new THREE.SphereGeometry(0.2, 32, 32);
        this.whiteMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1.0,
            depthTest: false,    // Ignore depth testing
            depthWrite: false 
        });
        this.whiteMesh = new THREE.Mesh(this.whiteGeometry, this.whiteMaterial);
        this.whiteMesh.renderOrder = 1; // Higher render order for the white mesh
        
        this.group = new THREE.Group();
        this.group.add(this.fireMesh);
        this.group.add(this.whiteMesh);
    }

    public getGroup(): THREE.Group {
        return this.group;
    }

    public update(deltaTime: number): boolean {
        this.currentTime += deltaTime;
        const explosionProgress = this.currentTime / this.fireDuration;

        if (explosionProgress >= 1) {
            return false; // Explosion is done
        }

        // Scale up and fade out with a more dramatic curve
        const scale = 1 + (this.fireMaxScale - 1) * (1 - Math.pow(1 - explosionProgress, 2));
        this.fireMesh.scale.set(scale, scale, scale);
        this.fireMaterial.opacity = 1 - Math.pow(explosionProgress, 2);

        // Handle white sphere visibility
        const whiteProgress = this.currentTime / this.whiteSphereDuration;
        if (this.currentTime <= this.whiteSphereDuration) {
            this.whiteMesh.visible = true;
            this.whiteMaterial.opacity = 1 - whiteProgress;
        } else {
            this.whiteMesh.visible = false;
        }

        return true;
    }

    public setPosition(x: number, y: number, z: number): void {
        this.group.position.set(x, y, z);
    }
} 