# TriMet Art Ride

Upload the contents of this folder to your repository root. `index.html` must be directly at the root, alongside `assets/`, `css/`, and `js/`.

Publish the repository root with GitHub Pages. No npm install, build command, CDN or API key is required. All dependencies and artwork are included, and paths are relative for repository subpaths.

## Controls
- W / Up: accelerate. A / Left and D / Right: steer.
- S / Down: brake, then reverse. Space: handbrake.
- C: cycle five exterior cameras. R: reset to the nearest road position.
- Escape: return to the wrap garage. Start Driving starts a fresh procedural route.
- Touch: hold the direction, brake and GO buttons; use the camera button to change views.

Hard launches briefly lift the front. Fast turns and hard acceleration while turning reduce grip; countersteer or ease off to recover. Leaving the road slows the bus. Going far off-road resets it to the road.

Portals cycle through all seven artist wraps. Their colors indicate the incoming line; crossing produces radiating rings. The nine-wrap garage also includes TriMet and Neutral. Roads and neighborhoods are fictional and procedural.

To preview locally, serve this folder over HTTP (for example `python -m http.server 8000`) and open http://localhost:8000. Opening index.html directly with file:// does not support module/model loading reliably.

## Contents
- index.html: entry point
- css/style.css: interface styles
- js/app.js: viewer, materials and wrap selection
- js/drive.js: input, cameras, animation and portals
- js/physics.js: arcade vehicle motion
- js/route.js: procedural roads and scenery
- js/vendor/: bundled Three.js modules
- assets/: bus GLB, wraps, perforated film masks and branding

## Verification
Automated checks covered actual GLB pivot discovery, wheel/reverse animation, launch/landing, sideways drift, all five cameras, all seven portal transitions, route seams and bounded scene size over 10 km, reset, and relative file paths. Live browser/GPU and touch-device verification was unavailable in the authoring session.
