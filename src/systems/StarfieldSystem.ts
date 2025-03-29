import * as THREE from 'three';

export class StarfieldSystem {
    private particles: THREE.Points;
    private particleCount: number = 1000;
    private boundaryRadius: number;
    private particlePositions: Float32Array;
    private particleVelocities: Float32Array;

    constructor(scene: THREE.Scene, boundaryRadius: number) {
        this.boundaryRadius = boundaryRadius;
        
        // Create particle geometry
        const geometry = new THREE.BufferGeometry();
        this.particlePositions = new Float32Array(this.particleCount * 3);
        this.particleVelocities = new Float32Array(this.particleCount * 3);
        
        // Initialize particles
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            
            // Random position outside the boundary sphere
            const angle = Math.random() * Math.PI * 2;
            const distance = this.boundaryRadius + Math.random() * 10; // 10 units beyond boundary
            this.particlePositions[i3] = Math.cos(angle) * distance;
            this.particlePositions[i3 + 1] = Math.sin(angle) * distance;
            this.particlePositions[i3 + 2] = 0;
            
            // Random velocity
            const speed = 0.1 + Math.random() * 0.2;
            this.particleVelocities[i3] = -Math.cos(angle) * speed;
            this.particleVelocities[i3 + 1] = -Math.sin(angle) * speed;
            this.particleVelocities[i3 + 2] = 0;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(this.particlePositions, 3));
        
        // Create particle material
        const material = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 0.1,
            transparent: true,
            opacity: 0.8
        });
        
        // Create points object
        this.particles = new THREE.Points(geometry, material);
        scene.add(this.particles);
    }

    public update(deltaTime: number): void {
        const positions = this.particles.geometry.attributes.position.array as Float32Array;
        
        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            
            // Update position
            positions[i3] += this.particleVelocities[i3] * deltaTime;
            positions[i3 + 1] += this.particleVelocities[i3 + 1] * deltaTime;
            
            // Check if particle needs to be reset
            const distance = Math.sqrt(
                positions[i3] * positions[i3] + 
                positions[i3 + 1] * positions[i3 + 1]
            );
            
            if (distance < this.boundaryRadius) {
                // Reset particle to outside boundary
                const angle = Math.random() * Math.PI * 2;
                const newDistance = this.boundaryRadius + Math.random() * 10;
                positions[i3] = Math.cos(angle) * newDistance;
                positions[i3 + 1] = Math.sin(angle) * newDistance;
                
                // Update velocity
                const speed = 2 + Math.random() * 4;
                this.particleVelocities[i3] = -Math.cos(angle) * speed;
                this.particleVelocities[i3 + 1] = -Math.sin(angle) * speed;
            }
        }
        
        this.particles.geometry.attributes.position.needsUpdate = true;
    }

    public cleanup(): void {
        if (this.particles) {
            this.particles.geometry.dispose();
            this.particles.material.dispose();
        }
    }
} 