import * as THREE from 'three';
import { GLBModel } from '../assets/game-models/GLBModel';
import { BulletSystem } from '../systems/BulletSystem';
import { SmokeSystem } from '../systems/SmokeSystem';
import { ExplosionSystem } from '../systems/ExplosionSystem';

export class Player {
    private model: GLBModel;
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
    private flashColor: number = 0xffffff;
    private playerNum: number;
    private smokeTimer: number = 0;
    private smokeInterval: number = 0.1; // Spawn smoke every 0.1 seconds
    private isOutsideBoundary: boolean = false;
    private boundaryFlashStartTime: number = 0;
    private boundaryFlashInterval: number = 50; // Flash every 25ms for rapid pulsing
    private explosionSystem: ExplosionSystem | null = null;
    private onDeathCallback: (() => void) | null = null;
    private config: { color: THREE.ColorRepresentation, isCPU: boolean };

    constructor(model: GLBModel, playerNum: number, config: { color: THREE.ColorRepresentation, isCPU: boolean }) {
        this.config = config;
        this.model = model;
        this.model.getGroup().rotation.y = -Math.PI / 2;
        this.model.getGroup().scale.set(1, 1, 1);
        this.model.setColor(config.color);
        this.group = new THREE.Group();
        this.group.add(this.model.getGroup());
        this.initialPosition = new THREE.Vector3(0, 0, 0);
        this.playerNum = playerNum;
    }

    public setBulletSystem(bulletSystem: BulletSystem): void {
        this.bulletSystem = bulletSystem;
    }

    public setSmokeSystem(smokeSystem: SmokeSystem): void {
        this.smokeSystem = smokeSystem;
    }

    public setExplosionSystem(explosionSystem: ExplosionSystem): void {
        this.explosionSystem = explosionSystem;
    }

    public update(deltaTime: number): void {
        if (this.isGameOver) return;
        this.model.update();

        // Move forward in the direction the plane is facing
        const forward = new THREE.Vector3(1, 0, 0);
        forward.applyQuaternion(this.group.quaternion);
        this.group.position.add(forward.multiplyScalar(this.moveSpeed * deltaTime));

        // Handle boundary flash effect
        if (this.isOutsideBoundary) {
            const currentTime = Date.now();
            if (!this.boundaryFlashStartTime) {
                this.boundaryFlashStartTime = currentTime;
            }
            
            // Rapid pulsing flash every 25ms
            const elapsed = currentTime - this.boundaryFlashStartTime;
            const flashState = Math.floor(elapsed / this.boundaryFlashInterval) % 2;
            
            this.model.setColor(flashState === 0 ? this.flashColor : this.config.color);
            
            // Force material update
            this.model.getGroup().traverse((child: THREE.Object3D) => {
                if (child instanceof THREE.Mesh) {
                    const material = child.material as THREE.MeshPhongMaterial;
                    if (material) {
                        material.needsUpdate = true;
                    }
                }
            });
        } else {
            // Only handle damage flash if not outside boundary
            if (this.isFlashing) {
                const currentTime = Date.now();
                const elapsed = currentTime - this.flashStartTime;
                
                if (elapsed >= this.flashDuration) {
                    this.isFlashing = false;
                    this.model.setColor(this.config.color);
                } else {
                    // Alternate between flash color and original color
                    const isWhite = Math.floor(elapsed / 50) % 2 === 0;
                    this.model.setColor(isWhite ? this.flashColor : this.config.color);
                }
            } else {
                // Reset color when returning to boundary
                this.model.setColor(this.config.color);
                this.boundaryFlashStartTime = 0;
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
            // Spawn death explosion
            this.explosionSystem?.spawnDeathExplosion(this.getPosition());
            // Call death callback
            this.onDeathCallback?.();
        }
    }

    public reset(): void {
        this.energy = 3;
        this.isGameOver = false;
        this.isFlashing = false;
        this.model.setColor(this.config.color);
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

    public setOutsideBoundary(outside: boolean): void {
        this.isOutsideBoundary = outside;
        if (!outside) {
            this.model.setColor(this.config.color);
            this.boundaryFlashStartTime = 0;
        }
    }

    public setOnDeathCallback(callback: () => void): void {
        this.onDeathCallback = callback;
    }

    public getModel(): GLBModel {
        return this.model;
    }
} 