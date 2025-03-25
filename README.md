# Game Template

This project serves as a template for creating 2D or 3D games using TypeScript and Three.js. It provides a basic structure and essential features to help you get started quickly.

## Features

- **Menu System**: A simple menu with options to start the game and toggle fullscreen.
- **Input Handling**: Supports keyboard, touch controls, and gamepad input.
- **Audio System**: Includes background music and sound effects for bullets and explosions.
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
   npm start
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

## Customization

To create a new game using this template:

1. **Create a New GameState**: Add a new class in the `game-states/` directory for your game logic.
2. **Modify the Menu**: Update the `MenuState` to include options relevant to your game.
3. **Add Game Objects**: Create new models and objects in the `game-models/` and `game-objects/` directories.
4. **Implement Game Logic**: Use the existing input and audio systems to implement your game mechanics.

## License

This project is licensed under the MIT License. Feel free to use and modify it for your own projects.

## Acknowledgments

- [Three.js](https://threejs.org/) - The 3D library used for rendering.
- [TypeScript](https://www.typescriptlang.org/) - The programming language used for development. 