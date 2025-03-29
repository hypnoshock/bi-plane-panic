import * as THREE from 'three';
import { DebrisParticleModel } from '../assets/game-models/DebrisParticleModel';

export class DebrisParticle {
    private model: DebrisParticleModel;

    constructor(color: number = 0x808080) {
        this.model = new DebrisParticleModel(color);
    }

    public getModel(): DebrisParticleModel {
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