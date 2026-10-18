# TriMet Art Ride v0.24

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

## Lighting and arcade additions (v0.22)
Softer lighting, automatic garage rotation (drag or select a view to pause; Auto rotate resumes), a spring rebound on wheelie landing, working headlights and braking lamps. Roof markers remain steady.

Bus stops: pass for 5 tickets, or pull into the blue bay and remain stopped for just over one second for 25 tickets and a kneeling animation. Each stop rewards once. Accelerate to raise the bus again. White strips on the road trigger a short boost with streaks and a camera effect. Road colors blend over 60 metres around each portal. Duplicate section-boundary objects and intersecting sculpture layers were removed.

Automated checks also cover lamp states, ticket payout guards, kneeling/recovery, boost activation, landing compression/rebound, showcase rotation and gradient continuity. Visual browser verification remains unavailable.

## v0.23 — balanced driving
Boost acceleration reduced from 17 to a peak of 8 m/s²; duration reduced from 2.3 to 1.4 seconds, with smooth entry/exit. Braking overrides boost thrust. Steering becomes gentler with speed, normal lateral grip is stronger, and drift is reserved for aggressive high-speed turns or the handbrake. Countersteering restores grip faster. Wheelies, landing bounce, lights, stops, tickets and portals are retained.

Release ZIP filenames include their version. Keep prior ZIPs for rollback; extract only the desired release into the repository root.

Lighting adjustment: lower exposure and key light, neutral key color, reduced wrap reflections/clearcoat and broader highlights. Ambient fill retained to protect shadow detail; original artwork textures and clear reflective glass retained. Yellow source texture visually inspected; live rendered appearance still requires browser review.

## v0.24 — garage and complete body motion
Garage uses side arrows and a left-hand artwork title/count/start control, with a large artist name centered under the bus. Fleet options hide the artist credit. Initial load randomly selects one of the eight non-neutral wraps; Neutral remains selectable with the arrows.

All non-wheel attachments now share one sprung assembly for landing bounce and bus-stop kneeling. Four wheel branches remain separate. Actual exported hierarchy verification confirms 167 non-wheel nodes move together and 30 wheel nodes remain fixed during vertical suspension motion. Stops carry the original TriMet rosette.

Approved v0.23 lighting and driving balance retained. Root-level index.html and all dependencies included. Live browser layout and visual motion verification remains outstanding.
