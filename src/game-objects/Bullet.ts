import * as THREE from 'three';
import { BulletModel } from '../assets/game-models/BulletModel';

export class Bullet {
    private model: BulletModel;
    private group: THREE.Group;
    private speed: number = 10; // Units per second
    private direction: THREE.Vector3;
    private playerNum: number;

    constructor(bullet: BulletModel, direction: THREE.Vector3, playerNum: number) {
        this.model = bullet;
        this.direction = direction.normalize();
        this.playerNum = playerNum;
        this.group = new THREE.Group();
        this.group.add(this.model.getMesh());
    }

    public update(deltaTime: number): void {
        // Move the bullet in the specified direction
        this.group.position.add(this.direction.clone().multiplyScalar(this.speed * deltaTime));
    }

    public getGroup(): THREE.Group {
        return this.group;
    }

    public setPosition(x: number, y: number, z: number): void {
        this.group.position.set(x, y, z);
    }

    public getPlayerNum(): number {
        return this.playerNum;
    }
} 