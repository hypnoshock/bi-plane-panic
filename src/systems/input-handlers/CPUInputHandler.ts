import { Player } from '../../game-objects/Player';
import * as THREE from 'three';

export class CPUInputHandler {
    private eventHandler: ((event: string, isPress: boolean) => void) | null = null;
    private controlledPlayer: Player | null = null;
    private otherPlayers: Player[] = [];
    private debugMode: boolean = false;
    private lastShootTime: number = 0;
    private shootCooldown: number = 0.25; // Minimum time between shots in seconds
    private decisionUpdateInterval: number = 0.2; // Increased from 0.1 to 0.2 for slower reactions
    private lastDecisionTime: number = 0;
    private currentTarget: Player | null = null;
    private lastTargetPosition: THREE.Vector3 | null = null;
    private targetPredictionError: number = 0.3; // Random error in radians (about 17 degrees)
    private reactionDelay: number = 0.15; // Seconds of delay before reacting to changes

    constructor() {}

    public setEventHandler(handler: (event: string, isPress: boolean) => void): void {
        this.eventHandler = handler;
    }

    public setControlledPlayer(player: Player): void {
        this.controlledPlayer = player;
        if (this.debugMode) {
            console.log('Initial player rotation:', player.getGroup().rotation.z);
        }
    }

    public setOtherPlayers(players: Player[]): void {
        this.otherPlayers = players;
    }

    private isBeingShotAt(): boolean {
        if (!this.controlledPlayer) return false;
        
        const controlledPosition = this.controlledPlayer.getGroup().position;
        const controlledRotation = this.controlledPlayer.getGroup().rotation;
        
        // Check if any player is shooting at us
        for (const player of this.otherPlayers) {
            if (player.isDead()) continue;
            const playerPosition = player.getGroup().position;
            const playerRotation = player.getGroup().rotation;
            
            // Calculate vector from player to us
            const vectorToUs = new THREE.Vector3(
                controlledPosition.x - playerPosition.x,
                controlledPosition.y - playerPosition.y,
                0
            ).normalize();
            
            // Calculate player's forward vector
            const playerForward = new THREE.Vector3(
                Math.cos(playerRotation.z),
                Math.sin(playerRotation.z),
                0
            );
            
            // Calculate angle between player's forward vector and vector to us
            const angleToUs = Math.acos(vectorToUs.dot(playerForward));
            
            // If angle is small enough, player is shooting at us
            if (angleToUs < 0.3) { // About 17 degrees
                return true;
            }
        }
        
        return false;
    }

    private performEvasiveManeuver(): void {
        if (!this.eventHandler) return;
        
        // Randomly choose between different evasive maneuvers
        const maneuver = Math.random();
        
        if (maneuver < 0.5) {
            // Roll left and move up
            this.eventHandler('left', true);
            this.eventHandler('right', false);
            this.eventHandler('up', true);
            this.eventHandler('down', false);
        } else {
            // Roll right and move down
            this.eventHandler('right', true);
            this.eventHandler('left', false);
            this.eventHandler('down', true);
            this.eventHandler('up', false);
        }
    }

    private predictTargetPosition(targetPosition: THREE.Vector3): THREE.Vector3 {
        if (!this.lastTargetPosition) {
            this.lastTargetPosition = targetPosition.clone();
            return targetPosition;
        }

        // Calculate target's velocity
        const velocity = new THREE.Vector3().subVectors(targetPosition, this.lastTargetPosition);
        
        // Add some random error to the prediction
        const predictionError = (Math.random() - 0.5) * this.targetPredictionError;
        
        // Predict future position with error
        const predictedPosition = targetPosition.clone().add(velocity.multiplyScalar(this.reactionDelay));
        predictedPosition.x += Math.cos(predictionError) * 2;
        predictedPosition.y += Math.sin(predictionError) * 2;
        
        this.lastTargetPosition = targetPosition.clone();
        return predictedPosition;
    }

    public update(deltaTime: number): void {
        if (!this.controlledPlayer || !this.eventHandler) return;

        const currentTime = Date.now() / 1000; // Convert to seconds
        
        // Only update decisions every decisionUpdateInterval seconds
        if (currentTime - this.lastDecisionTime < this.decisionUpdateInterval) {
            return;
        }
        this.lastDecisionTime = currentTime;

        const controlledPosition = this.controlledPlayer.getGroup().position;
        const controlledRotation = this.controlledPlayer.getGroup().rotation;

        // Find closest player
        let closestPlayer: Player | null = null;
        let minDistance = Infinity;

        for (const player of this.otherPlayers) {
            if (player.isDead()) continue;
            const distance = controlledPosition.distanceTo(player.getGroup().position);
            if (distance < minDistance) {
                minDistance = distance;
                closestPlayer = player;
            }
        }

        // Update current target
        this.currentTarget = closestPlayer;

        if (closestPlayer) {
            const targetPosition = closestPlayer.getGroup().position;
            const predictedPosition = this.predictTargetPosition(targetPosition);
            
            // Calculate vector to predicted target position
            const vectorToTarget = new THREE.Vector3(
                predictedPosition.x - controlledPosition.x,
                predictedPosition.y - controlledPosition.y,
                0
            ).normalize();
            
            // Calculate angle to target with some random error
            const baseAngle = Math.atan2(
                vectorToTarget.y,
                vectorToTarget.x
            );
            const angleError = (Math.random() - 0.5) * this.targetPredictionError;
            const angleToTarget = baseAngle + angleError;
            
            // Calculate angle difference
            let angleDiff = angleToTarget - controlledRotation.z;
            
            // Normalize angle difference to [-PI, PI]
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

            if (this.debugMode) {
                console.log('Current rotation:', controlledRotation.z);
                console.log('Angle to target:', angleToTarget);
                console.log('Angle diff:', angleDiff);
                console.log('Distance:', minDistance);
                console.log('---');
            }

            // Check if we're being shot at
            if (this.isBeingShotAt()) {
                this.performEvasiveManeuver();
                return; // Skip normal behavior while evading
            }

            // Normal chase behavior with slower turning
            // Turn towards target with a larger threshold
            if (Math.abs(angleDiff) > 0.2) { // Increased from 0.1 to 0.2 for less precise turning
                // Always turn in the direction that requires the least rotation
                if (angleDiff > 0) {
                    this.eventHandler('left', true);
                    this.eventHandler('right', false);
                } else {
                    this.eventHandler('right', true);
                    this.eventHandler('left', false);
                }
            } else {
                this.eventHandler('right', false);
                this.eventHandler('left', false);
            }

            // Move towards target with some randomness
            if (minDistance > 3) {
                // Randomly decide whether to move or not
                if (Math.random() > 0.1) { // 90% chance to move
                    this.eventHandler('up', true);
                    this.eventHandler('down', false);
                } else {
                    this.eventHandler('up', false);
                    this.eventHandler('down', false);
                }
            } else {
                this.eventHandler('up', false);
                this.eventHandler('down', false);
            }

            // Shooting logic with less accuracy
            if (Math.abs(angleDiff) < 0.3 && minDistance < 8) { // Increased angle threshold from 0.2 to 0.3
                if (currentTime - this.lastShootTime >= this.shootCooldown) {
                    // Random chance to miss
                    if (Math.random() > 0.2) { // 80% chance to shoot
                        this.eventHandler('button1', true);
                        this.lastShootTime = currentTime;
                    } else {
                        this.eventHandler('button1', false);
                    }
                }
            } else {
                this.eventHandler('button1', false);
            }
        } else {
            // No target, stop all movement
            this.eventHandler('up', false);
            this.eventHandler('down', false);
            this.eventHandler('left', false);
            this.eventHandler('right', false);
            this.eventHandler('button1', false);
            this.lastTargetPosition = null;
        }
    }
} 