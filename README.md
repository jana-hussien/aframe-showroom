# VR Showroom (Work in Progress)

This project is a showroom built with [A-Frame](https://aframe.io/), supporting both desktop and immersive WebXR experiences. Models and their placement are managed dynamically via a `config.json` file.

## Features
- **Movement controls** Swap between teleportation mode (only available in VR mode: hold down the trigger and aim), and movement controls (WASD for desktop, joysticks for VR).
- **Model Loading**: All showcase models are loaded and placed based on `config.json`.

## Project Structure

- `index.html` — Main A-Frame scene and UI.
- `main.js` — Handles model loading and movement logic.
- `config.json` — List of models to load, with position, scale, and other properties.
- `assets/models/` — 3D model files and textures.
- `components/` — Custom A-Frame components (movement, shadow, etc). (need to add credit for shadow component, not mine)
- `style.css` — Custom styles for loading and UI.

## Adding/Editing Models

1. Add model files (GLTF/GLB) to `assets/models/`.
2. Edit `config.json` to add a new entry:
   ```json
   {
     "id": "model1",
     "path": "assets/models/shoe1/scene.gltf",
     "position": "-2 1 0",
     "height": 0.2,
     "animationType": "hoverAndRotate"
   }
   ```
3. The scene will automatically load and place the model on next reload.

## Running

There is no need to run locally, as it is hosted on Github Pages. on a VR headset, visit the website in the browser and enter VR mode. When finished, it will be turned into a PWA which is installable on VR to remove the long waiting time for assets to load.

## Credits
- Built with [A-Frame](https://aframe.io/)
- Models: See individual licenses in `assets/models/`


