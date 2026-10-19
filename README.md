# TriMet Art Ride v0.29

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

## v0.25 — touchdown-driven suspension
The wheelie descends to explicit front-wheel contact before transferring impact into the complete sprung assembly. The normal launch produces about 7 cm of compression, 3.7 cm of rebound, then a smaller settling bounce. Compression remains bounded by the 75 mm clearance envelope. Wheel pitch stays at zero after touchdown; bounce strength scales with downward impact speed.

Tests cover no pre-contact bounce, one landing per launch, grounded wheel pitch after contact, rebound order/amplitude, settling, impact strength limits, and consistent behavior at 60/120/240 Hz. Existing assembly, driving, reward, portal and packaging checks retained. Lighting, garage UI and driving balance unchanged. Live visual/browser verification remains outstanding.

## v0.26 — mobile controls, full viewport and transitions
Front landing bounce now pitches the complete sprung assembly around the rear axle instead of translating the whole body vertically. Rear axle and wheels remain planted after touchdown. Bus-stop kneeling remains a separate body-height adjustment.

The canvas fills the available viewport; UI sits above it. Camera distance fits the bus through a full garage rotation in portrait and landscape. Garage arrows preload and queue a directional slide; portal changes use a 1.05-second soft front-to-back artwork wipe, including perforated window film. Glass and body remain solid.

Mobile: game controls suppress text selection, tap highlight and long-press menus. Tap Tilt steering to opt in, hold the phone comfortably for calibration, and use GO/Brake normally. Calibrate resets neutral. Orientation changes recalibrate; unavailable or denied motion access retains touch-arrow steering. Some embedded browsers may not expose motion sensors; use the hosted HTTPS page in your phone browser. Esc clears canvas focus on return to the garage.

Validation: front/rear pivot displacement, permission/denial/calibration logic, portrait/landscape steering mapping, framing math, shader injection and film-mask uniforms, and existing driving/landing/portal/reward tests passed. Actual phone sensor behavior, GPU shader rendering and visual carousel timing require a live device/browser check, unavailable during authoring. Approved lighting and driving physics balance retained.

## v0.27 — preload and mobile layout
Compact top-aligned mobile garage and driving information, with touch controls along the bottom. Floating arrow glyphs. Simultaneous carousel movement with a small gap; current and neighboring wraps are loaded and GPU textures initialized before arrows enable. Upcoming portal artwork is prefetched. Stop signs use a raster export of the original rosette; posts end beneath the panels.

Automated preload/cache and carousel checks pass. Live browser/GPU and physical mobile verification remain unavailable.

## v0.28 — off-screen carousel and artist links
Carousel travel now clears the entire camera frustum before entry and after exit, including portrait and ultrawide screens. Both buses still move together and adjacent assets remain preloaded. Removed the outgoing opacity fade and blanket transparency on preview materials; opaque interiors retain depth-tested opaque rendering while glass and film retain their own materials.

Instagram links beside the artist credit: Mike Bennett @mikebennettart, Saleam @saleam108, Bleached by Josh @bleachedbyjosh. Links open a new tab and are hidden for fleet wraps.

Verified off-screen bounds at six aspect ratios and four orientations, material render flags, links, preload behavior, suspension, driving and asset paths. Live GPU/browser and physical mobile visual verification remain outstanding.

## v0.29 — Off the Rails café pit stops
Three portal crossings count as the first loop and unlock cafés. The first café is scheduled beyond the visible route; subsequent locations are spaced randomly 500–800 m apart. Look for the OFF THE RAILS distance cue, pull into the bay, and stop for one second to begin recharging. Energy refills at 20% per second. Existing boost strips consume 25%; ordinary driving remains available at zero energy. New drives begin at 100%.

The supplied café GLB is preloaded with embedded textures and clear reflective glass. It retains its metre scale and uses the current environment/lighting. The roadside bay has a straight approach, reserved scenery space, and a simple bus-footprint collision check around the café and its overhangs. Cached café geometry is reused without reloading or disposing it as old road sections are removed.

Automated checks cover actual café geometry, embedded images, three-crossing unlock, repeated placements, random spacing, straight approaches, bay/collider alignment, recharge interruptions and limits, cache-safe removal, existing driving, carousel bounds and package paths. Live GPU/browser and physical mobile checks remain outstanding.
