console.log("AR Solar System initialized!");

const solarSystem = document.querySelector("#solarSystem");
solarSystem.addEventListener("model-loaded", () => {
    hideLoadingScreen();
    console.log("===== SOLAR SYSTEM MODEL =====");

    solarSystem.object3D.traverse((child) => {
        if (child.isMesh) {
            console.log("Mesh name:", child.name);
        }
    });

    console.log("==============================");
});
solarSystem.addEventListener("model-error", (event) => {

    console.error("Solar System model failed to load:", event);

    showLoadingError(
        "The 3D model could not be loaded. Please reload the page and try again."
    );

});
const infoPanel = document.getElementById('info-panel');
const infoTitle = document.getElementById('info-title');
const infoDesc = document.getElementById('info-desc');
// ============================
// LOADING SCREEN
// ============================
const loadingScreen = document.getElementById("loading-screen");

function hideLoadingScreen() {
    if (loadingScreen) {
        loadingScreen.classList.add("hidden");
    }
}

function showLoadingError(message) {
    if (!loadingScreen) return;

    loadingScreen.innerHTML = `
        <div style="
            text-align: center;
            padding: 20px;
            max-width: 320px;
        ">
            <div style="font-size: 40px; margin-bottom: 15px;">⚠️</div>

            <h3 style="
                margin: 0 0 10px;
                color: #38bdf8;
            ">
                Unable to Load Solar System
            </h3>

            <p style="
                margin: 0;
                color: #cbd5e1;
                font-size: 14px;
                line-height: 1.5;
            ">
                ${message}
            </p>

            <button onclick="location.reload()" style="
                margin-top: 18px;
                padding: 10px 18px;
                border: none;
                border-radius: 20px;
                background: #38bdf8;
                color: #0f172a;
                font-weight: bold;
                cursor: pointer;
            ">
                Reload
            </button>
        </div>
    `;

    loadingScreen.classList.remove("hidden");
}

// Mapped directly to the internal GLTF mesh node names in simple-solar-system.glb
const planetData = {
    sun: { name: "Sun", meshName: "sun", desc: "The yellow dwarf star at the center of our solar system, containing 99.86% of its mass." },
    mercury: { name: "Mercury", meshName: "mercury", desc: "The smallest planet in the solar system and closest to the Sun." },
    venus: { name: "Venus", meshName: "venus", desc: "Second planet from the Sun with a toxic atmosphere making it the hottest planet." },
    earth: { name: "Earth", meshName: "earth", desc: "Third planet from the Sun and the only world known to harbor life." },
    moon: { name: "Moon", meshName: "moon", desc: "Earth's natural satellite, regulating ocean tides and axial rotation." },
    mars: { name: "Mars", meshName: "mars", desc: "The Red Planet, famous for its reddish iron-oxide surface and thin atmosphere." },
    jupiter: { name: "Jupiter", meshName: "jupiter", desc: "Largest planet in our solar system, famous for its Great Red Spot storm." },
    saturn: { name: "Saturn", meshName: "saturn", desc: "Gas giant best known for its bright, massive ring system of ice and dust." },
    uranus: { name: "Uranus", meshName: "uranus", desc: "An ice giant with an extreme axial tilt, rotating nearly sideways." },
    neptune: { name: "Neptune", meshName: "neptune", desc: "The outermost gas giant planet, known for its deep blue color and high winds." },
    pluto: { name: "Pluto", meshName: "pluto", desc: "A dwarf planet located in the distant Kuiper Belt." }
};

let highlightRing = null;

// Function to focus/highlight selected planet
function selectPlanet(key) {
    if (!planetData[key]) return;

    const data = planetData[key];
    showInfo(data.name, data.desc);

    // Find target mesh in GLTF model and attach highlight indicator
    if (solarSystem && solarSystem.object3D) {
        solarSystem.object3D.traverse((child) => {
            if (child.isMesh && child.name.toLowerCase().includes(data.meshName)) {
                highlightMesh(child);
            }
        });
    }
}

// Visual Indicator: Adds a glowing selection ring around the target mesh
function highlightMesh(targetMesh) {
    if (highlightRing) {
        if (highlightRing.parent) highlightRing.parent.remove(highlightRing);
    }

    // 1. Thicker geometry: inner radius 1.2 -> outer radius 2.2
    const geometry = new THREE.RingGeometry(1.2, 2.2, 32);

    // 2. Bright glowing material (Emissive material ignores scene shadows)
    const material = new THREE.MeshBasicMaterial({ 
        color: 0x00ffff,         // Bright Cyan/Neon Blue
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
    });

    highlightRing = new THREE.Mesh(geometry, material);

    // Attach indicator directly to the mesh
    targetMesh.add(highlightRing);

    // 3. Lay flat and lift slightly to prevent visual clipping with the planet sphere
    highlightRing.rotation.x = Math.PI / 2; 
    highlightRing.position.y = 0.05;
}

function showInfo(title, description) {
    if (infoPanel && infoTitle && infoDesc) {
        infoTitle.innerText = title;
        infoDesc.innerText = description;
        infoPanel.style.display = 'block';
    }
}

function hideInfo() {
    if (infoPanel) {
        infoPanel.style.display = 'none';
    }
    if (highlightRing && highlightRing.parent) {
        highlightRing.parent.remove(highlightRing);
    }
}

// A-Frame Mesh Raycaster Handler
AFRAME.registerComponent('planet-selector', {
    init: function () {
        this.el.addEventListener('model-loaded', () => {
            const obj = this.el.getObject3D('mesh');
            if (!obj) return;

            obj.traverse((node) => {
                if (node.isMesh) {
                    node.el = this.el;
                }
            });
            this.el.classList.add('collidable');
        });

        this.el.addEventListener('click', (evt) => {
            if (evt.detail.intersection) {
                const clickedMesh = evt.detail.intersection.object;
                const meshName = clickedMesh.name.toLowerCase();

                // Match mesh name with planet keys
                for (let key in planetData) {
                    if (meshName.includes(planetData[key].meshName)) {
                        selectPlanet(key);
                        break;
                    }
                }
            }
        });
    }
});

// ============================
// DRAG ROTATION LOGIC
// ============================
let isMouseDown = false;
let previousX = 0;
let previousY = 0;

const startDrag = (x, y, target) => {
    if (target.tagName === "BUTTON" || target.closest("#info-panel") || target.closest("#planet-bar")) return;
    isMouseDown = true;
    previousX = x;
    previousY = y;
};

const moveDrag = (x, y) => {
    if (!isMouseDown || !solarSystem.object3D) return;

    const deltaX = x - previousX;
    const deltaY = y - previousY;

    solarSystem.object3D.rotation.y += deltaX * 0.008;
    solarSystem.object3D.rotation.x += deltaY * 0.008;

    previousX = x;
    previousY = y;
};

window.addEventListener("mousedown", (e) => startDrag(e.clientX, e.clientY, e.target));
window.addEventListener("mousemove", (e) => moveDrag(e.clientX, e.clientY));
window.addEventListener("mouseup", () => { isMouseDown = false; });

window.addEventListener("touchstart", (e) => {
    if (e.touches.length === 1) startDrag(e.touches[0].clientX, e.touches[0].clientY, e.target);
});
window.addEventListener("touchmove", (e) => {
    if (e.touches.length === 1) moveDrag(e.touches[0].clientX, e.touches[0].clientY);
});
window.addEventListener("touchend", () => { isMouseDown = false; });

// ============================
// ZOOM CONTROLS
// ============================
let currentScale = 0.07;
const zoomIn = document.querySelector("#zoomIn");
const zoomOut = document.querySelector("#zoomOut");

zoomIn.addEventListener("click", (e) => {
    e.stopPropagation();
    currentScale = Math.min(0.2, currentScale + 0.015);
    if (solarSystem) solarSystem.object3D.scale.set(currentScale, currentScale, currentScale);
});

zoomOut.addEventListener("click", (e) => {
    e.stopPropagation();
    currentScale = Math.max(0.01, currentScale - 0.015);
    if (solarSystem) solarSystem.object3D.scale.set(currentScale, currentScale, currentScale);
});

// ============================
// PLANET ANIMATION
// ============================

let animationEnabled = true;

function animatePlanets() {

    if (!animationEnabled || !solarSystem || !solarSystem.object3D) {
        requestAnimationFrame(animatePlanets);
        return;
    }

    solarSystem.object3D.traverse((child) => {

        if (!child.isMesh) return;

        const name = child.name.toLowerCase();

        // Slow rotation for planets
        if (
            name.includes("sun") ||
            name.includes("mercury") ||
            name.includes("venus") ||
            name.includes("earth") ||
            name.includes("mars") ||
            name.includes("jupiter") ||
            name.includes("saturn") ||
            name.includes("uranus") ||
            name.includes("neptune") ||
            name.includes("pluto")
        ) {
            child.rotation.y += 0.001;
        }
    });

    requestAnimationFrame(animatePlanets);
}

animatePlanets();

// ============================
// ANIMATION CONTROL
// ============================

const animationButton = document.querySelector("#animation-btn");

if (animationButton) {

    animationButton.addEventListener("click", (e) => {

        e.stopPropagation();

        animationEnabled = !animationEnabled;

        if (animationEnabled) {
            animationButton.innerText = "⏸ Animation";
        } else {
            animationButton.innerText = "▶ Animation";
        }

    });

}

// ============================
// CAMERA ERROR HANDLING
// ============================

window.addEventListener("error", (event) => {

    const message = event.message || "";

    if (
        message.toLowerCase().includes("camera") ||
        message.toLowerCase().includes("webcam") ||
        message.toLowerCase().includes("media")
    ) {
        console.error("Camera error:", message);

        showLoadingError(
            "Camera access is unavailable. Please allow camera permission and reload the page."
        );
    }
});
window.addEventListener("unhandledrejection", (event) => {

    const reason = String(event.reason || "").toLowerCase();

    if (
        reason.includes("camera") ||
        reason.includes("webcam") ||
        reason.includes("mediadevices")
    ) {
        console.error("Camera permission error:", event.reason);

        showLoadingError(
            "Camera access is unavailable. Please allow camera permission and reload the page."
        );
    }
});