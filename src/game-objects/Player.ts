import * as THREE from 'three';
import { PlaneModel } from '../assets/game-models/PlaneModel';
import { BulletSystem } from '../systems/BulletSystem';
import { SmokeSystem } from '../systems/SmokeSystem';

export class Player {
    private model: PlaneModel;
    private group: THREE.Group;
    private moveSpeed: number = 5; // Units per second
    private rotationSpeed: number = 3; // Radians per second
    private bulletSystem: BulletSystem | null = null;
    private smokeSystem: SmokeSystem | null = null;
    private lastSpacePress: number = 0;
    private fireRate: number = 0.25; // Minimum time between shots in seconds
    private initialPosition: THREE.Vector3;
    private energy: number = 3;
    private isGameOver: boolean = false;
    private isFlashing: boolean = false;
    private flashStartTime: number = 0;
    private flashDuration: number = 200; // Duration in milliseconds
    private originalColor: number = 0x4169e1;
    private flashColor: number = 0xffffff;
    private playerNum: number;
    private smokeTimer: number = 0;
    private smokeInterval: number = 0.1; // Spawn smoke every 0.1 seconds

    constructor(model: PlaneModel, playerNum: number) {
        this.model = model;
        this.group = new THREE.Group();
        this.group.add(this.model.getGroup());
        this.initialPosition = new THREE.Vector3(0, 0, 0);
        this.originalColor = this.model.getColor();
        this.playerNum = playerNum;
    }

    public setBulletSystem(bulletSystem: BulletSystem): void {
        this.bulletSystem = bulletSystem;
    }

    public setSmokeSystem(smokeSystem: SmokeSystem): void {
        this.smokeSystem = smokeSystem;
    }

    public update(deltaTime: number): void {
        if (this.isGameOver) return;
        this.model.update();

        // Move forward in the direction the plane is facing
        const forward = new THREE.Vector3(1, 0, 0);
        forward.applyQuaternion(this.group.quaternion);
        this.group.position.add(forward.multiplyScalar(this.moveSpeed * deltaTime));

        // Handle flash effect
        if (this.isFlashing) {
            const currentTime = Date.now();
            const elapsed = currentTime - this.flashStartTime;
            
            if (elapsed >= this.flashDuration) {
                this.isFlashing = false;
                this.model.setColor(this.originalColor);
            } else {
                // Alternate between flash color and original color
                const isWhite = Math.floor(elapsed / 50) % 2 === 0;
                this.model.setColor(isWhite ? this.flashColor : this.originalColor);
            }
        }

        // Handle smoke effect when energy is low
        if (this.energy === 1 && this.smokeSystem) {
            this.smokeTimer += deltaTime;
            if (this.smokeTimer >= this.smokeInterval) {
                this.smokeTimer = 0;
                // Spawn smoke slightly behind the player
                const smokePosition = this.group.position.clone().sub(forward.multiplyScalar(1.5));
                this.smokeSystem.spawnSmoke(smokePosition, 0x808080);
            }
        }
    }

    public getGroup(): THREE.Group {
        return this.group;
    }

    public getPosition(): THREE.Vector3 {
        return this.group.position;
    }

    public resetPosition(): void {
        this.group.position.copy(this.initialPosition);
        this.group.rotation.set(0, 0, 0);
    }

    public moveUp(deltaTime: number): void {
        // Up/down movement removed as per new requirements
    }

    public moveDown(deltaTime: number): void {
        // Up/down movement removed as per new requirements
    }

    public moveLeft(deltaTime: number): void {
        this.group.rotation.z += this.rotationSpeed * deltaTime;
    }

    public moveRight(deltaTime: number): void {
        this.group.rotation.z -= this.rotationSpeed * deltaTime;
    }

    public shoot(deltaTime: number): void {
        if (!this.bulletSystem || this.isDead()) return;
        
        const currentTime = Date.now();
        if (currentTime - this.lastSpacePress >= this.fireRate * 1000) {
            const playerPosition = this.group.position;
            // Get the forward direction of the plane
            const forward = new THREE.Vector3(1, 0, 0);
            forward.applyQuaternion(this.group.quaternion);
            
            // Spawn bullet in front of the ship
            const bulletPosition = new THREE.Vector3(
                playerPosition.x + forward.x * 1.5,
                playerPosition.y + forward.y * 1.5,
                playerPosition.z + forward.z * 1.5
            );
            
            // Shoot in the direction the plane is facing
            this.bulletSystem.spawnBullet(bulletPosition, forward, this.playerNum);
            this.lastSpacePress = currentTime;
        }
    }

    public getEnergy(): number {
        return this.energy;
    }

    public isDead(): boolean {
        return this.energy <= 0;
    }

    public takeDamage(): void {
        this.energy--;
        this.isFlashing = true;
        this.flashStartTime = Date.now();
        
        if (this.energy <= 0) {
            this.isGameOver = true;
            this.hideShip();
        }
    }

    public reset(): void {
        this.energy = 3;
        this.isGameOver = false;
        this.isFlashing = false;
        this.model.setColor(this.originalColor);
        this.resetPosition();
    }

    public setGameOver(): void {
        this.isGameOver = true;
        this.hideShip();
    }

    private hideShip(): void {
        this.group.visible = false;
    }

    public getPlayerNum(): number {
        return this.playerNum;
    }
} 