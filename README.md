# Bi-plane Panic

Using Cursor to expirment with vibe coding, a small dog fight plane game.

## Features

- **Menu System**: A simple menu with options to start the game and toggle fullscreen.
- **Input Handling**: Supports keyboard, touch controls, and gamepad input.
- **Audio System**: Includes sound effects for bullets and explosions and a tone generator and drum machine which the music system uses
- **Music System**: Loads in music files which are in JSON format
- **Game States**: Easily switch between different game states (e.g., menu, play).
- **Mobile Support**: Detects mobile devices and adjusts controls accordingly.
- **Basic Gameplay**: A red cube that can be controlled using the input handlers.

## Getting Started

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/yourusername/game-template.git
   cd game-template
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Run the Development Server**:
   ```bash
   npm dev
   ```

4. **Open in Browser**:
   Navigate to `http://localhost:3000` in your web browser.

## Project Structure

- `src/`: Contains the source code for the game.
  - `game-states/`: Contains the game state classes (e.g., `MenuState`, `PlayState`).
  - `system/`: Contains utility classes (e.g., `AudioSystem`, `KeyboardHandler`).
  - `game-models/`: Contains models for game objects (e.g., `Bullet`, `Spaceship`).
  - `game-objects/`: Contains classes for game objects (e.g., `Player`, `Enemy`).
- `index.html`: The main HTML file that loads the game.
- `style.css`: The CSS file for styling the game.

## License

This project is licensed under the MIT License. Feel free to use and modify it for your own projects.

## Acknowledgments

- [Three.js](https://threejs.org/) - The 3D library used for rendering.
- [TypeScript](https://www.typescriptlang.org/) - The programming language used for development. 