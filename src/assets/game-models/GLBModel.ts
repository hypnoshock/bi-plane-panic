import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export class GLBModel {
    private group: THREE.Group;
    private materials: THREE.Material[] = [];

    constructor(url: string, color: THREE.ColorRepresentation) {
        this.group = new THREE.Group();
        this.loadModel(url, color);
    }

    private async loadModel(url: string, color: THREE.ColorRepresentation): Promise<void> {
        const loader = new GLTFLoader();
        try {
            const gltf = await loader.loadAsync(url);
            const model = gltf.scene;
            
            // Apply color to all materials
            model.traverse((child: THREE.Object3D) => {
                if (child instanceof THREE.Mesh) {
                    const material = child.material as THREE.MeshPhongMaterial;
                    if (material) {
                        material.color.setHex(color as number);
                        this.materials.push(material);
                    }
                }
            });

            this.group.add(model);
        } catch (error) {
            console.error('Error loading GLB model:', error);
            // Fallback to a basic plane model if loading fails
            const geometry = new THREE.BoxGeometry(1, 0.1, 0.5);
            const material = new THREE.MeshPhongMaterial({ color });
            const mesh = new THREE.Mesh(geometry, material);
            this.group.add(mesh);
            this.materials.push(material);
        }
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
            if ('color' in material && material.color instanceof THREE.Color) {
                material.color.setHex(color);
            }
        });
    }

    public getColor(): number {
        return this.materials[0] instanceof THREE.MeshPhongMaterial 
            ? this.materials[0].color.getHex() 
            : 0xffffff;
    }
} 