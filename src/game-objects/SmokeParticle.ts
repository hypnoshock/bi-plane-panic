import * as THREE from 'three';
import { SmokeParticleModel } from '../assets/game-models/SmokeParticleModel';

export class SmokeParticle {
    private model: SmokeParticleModel;

    constructor(color: number = 0x808080) {
        this.model = new SmokeParticleModel(color);
    }

    public getModel(): SmokeParticleModel {
        return this.model;
    }

    public getMesh(): THREE.Mesh {
        return this.model.getMesh();
    }

    public setInitialPosition(position: THREE.Vector3, velocity: THREE.Vector3): void {
        this.model.setInitialPosition(position, velocity);
    }

    public update(deltaTime: number): boolean {
        return this.model.update(deltaTime);
    }
} 