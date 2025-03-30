import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

export class GLBModel {
    private group: THREE.Group;
    private materials: THREE.Material[] = [];
    public modelLoader: Promise<void>;

    constructor(url: string) {
        this.group = new THREE.Group();
        this.modelLoader = this.loadModel(url);
    }

    private async loadModel(url: string): Promise<void> {
        const loader = new GLTFLoader();
        try {
            const gltf = await loader.loadAsync(url);
            const model = gltf.scene;
            
            // Apply color to all materials
            model.traverse((child: THREE.Object3D) => {
                if (child instanceof THREE.Mesh) {
                    // Create a new shinier material
                    const newMaterial = new THREE.MeshPhongMaterial({
                        color: child.material instanceof THREE.MeshPhongMaterial ? child.material.color : 0xffffff,
                        shininess: 200,
                        specular: new THREE.Color(0xffffff),
                        emissive: new THREE.Color(0x000000),
                        emissiveIntensity: 0
                    });
                    
                    // Replace the old material with our new one
                    child.material = newMaterial;
                    this.materials.push(newMaterial);
                }
            });

            this.group.add(model);
        } catch (error) {
            console.error('Error loading GLB model:', error);
            // Fallback to a basic plane model if loading fails
            const geometry = new THREE.BoxGeometry(1, 0.1, 0.5);
            const material = new THREE.MeshPhongMaterial();
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

    public async setColor(color: THREE.ColorRepresentation): Promise<void> {
        if (this.modelLoader) {
            await this.modelLoader;
        }
        this.materials.forEach(material => {
            if ('color' in material && material.color instanceof THREE.Color) {
                material.color.set(color);
                material.needsUpdate = true;

            }
        });
    }

    public getColor(): number {
        return this.materials[0] instanceof THREE.MeshPhongMaterial 
            ? this.materials[0].color.getHex() 
            : 0xffffff;
    }
} 