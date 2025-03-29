import * as THREE from 'three';

export class BoundarySphere {
    private group: THREE.Group;
    private sphere: THREE.Mesh;

    constructor() {
        this.group = new THREE.Group();
        
        // Create a custom half sphere geometry
        const radius = 15;
        const segments = 32;
        const rings = 32;
        const geometry = new THREE.BufferGeometry();
        
        // Calculate vertices for half sphere
        const vertices: number[] = [];
        const indices: number[] = [];
        
        // Generate vertices
        for (let ring = 0; ring <= rings; ring++) {
            const phi = (ring / rings) * Math.PI / 2; // Only go up to PI/2 for half sphere
            const sinPhi = Math.sin(phi);
            const cosPhi = Math.cos(phi);
            
            for (let segment = 0; segment <= segments; segment++) {
                const theta = (segment / segments) * Math.PI * 2;
                const sinTheta = Math.sin(theta);
                const cosTheta = Math.cos(theta);
                
                const x = radius * sinPhi * cosTheta;
                const y = radius * sinPhi * sinTheta;
                const z = radius * cosPhi;
                
                vertices.push(x, y, z);
            }
        }
        
        // Generate indices
        for (let ring = 0; ring < rings; ring++) {
            for (let segment = 0; segment < segments; segment++) {
                const a = ring * (segments + 1) + segment;
                const b = a + 1;
                const c = a + (segments + 1);
                const d = c + 1;
                
                indices.push(a, b, c);
                indices.push(b, d, c);
            }
        }
        
        // Set up the geometry
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        
        // Create a wireframe material
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            wireframe: true,
            transparent: true,
            opacity: 0.03
        });
        
        // Create the sphere mesh
        this.sphere = new THREE.Mesh(geometry, material);
        
        // Rotate the sphere to show the concave back
        this.sphere.rotation.x = Math.PI;
        
        // Add the sphere to the group
        this.group.add(this.sphere);
    }

    public getGroup(): THREE.Group {
        return this.group;
    }
} 