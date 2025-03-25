import * as THREE from 'three';

export class PlaneModel {
    private group: THREE.Group;
    private materials: THREE.MeshPhongMaterial[] = [];

    constructor(color: THREE.ColorRepresentation) {
        this.group = new THREE.Group();

        // Create ship body (cylinder)
        const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 32);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color });
        this.materials.push(bodyMaterial);
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.rotation.x = Math.PI / 2; // Lay the cylinder on its side
        this.group.add(body);

        // Create nose cone
        const noseGeometry = new THREE.ConeGeometry(0.2, 0.5, 32);
        const noseMaterial = new THREE.MeshPhongMaterial({ color });
        this.materials.push(noseMaterial);
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.position.z = 0.75; // Position at the front of the body
        nose.rotation.x = Math.PI / 2; // Lay the cone on its side

        this.group.add(nose);

        // Create wings
        const wingGeometry = new THREE.BoxGeometry(2, 0.1, 0.5);
        const wingMaterial = new THREE.MeshPhongMaterial({ color });
        this.materials.push(wingMaterial);
        const wing = new THREE.Mesh(wingGeometry, wingMaterial);
        wing.position.y = 0.5; // Position above the body
        this.group.add(wing);

        this.group.rotation.y = Math.PI / 2;
    }

    public update(): void {
        // Get the current Z rotation from the parent group
        const parentZRotation = this.group.parent?.rotation.z || 0;
        
        // Make X rotation proportional to Z rotation
        // When Z is PI (180 degrees), X should be PI (180 degrees)
        this.group.rotation.x = parentZRotation;
        
        // Keep the gentle rocking motion
        this.group.rotation.z = Math.sin(Date.now() * 0.001) * 0.05;
    }

    public getGroup(): THREE.Group {
        return this.group;
    }

    public setColor(color: number): void {
        this.materials.forEach(material => {
            material.color.setHex(color);
        });
    }

    public getColor(): number {
        return this.materials[0].color.getHex();
    }
} 