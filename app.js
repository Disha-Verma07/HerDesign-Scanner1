// --- 1. Basic Setup (Scene, Camera, Renderer) ---
let mannequin; // will store the model for texture editing

const scene = new THREE.Scene();
// Set a neutral background color to display while the HDRI loads
scene.background = new THREE.Color(0xffffff); 

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
// Use antialias for smoother edges
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
// Add the WebGL renderer canvas to the HTML document body
document.body.appendChild(renderer.domElement);

// Set camera starting position (adjust this if the model is too big/small)
camera.position.set(0, 1.5, 3);

// --- 2. Lighting and Environment Map Setup (High Quality) ---

// Path to a free, public-domain HDRI texture for realistic lighting/reflections
const HDR_PATH = 'https://threejs.org/examples/textures/equirectangular/venice_sunset_1k.hdr'; 

// PMREMGenerator helps process the HDRI for better quality lighting
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

new THREE.RGBELoader()
    .setPath('') // Using a full URL, so path is empty
    .load(HDR_PATH, function (texture) {
        
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;

        // Apply the environment map for both lighting and background
        scene.environment = envMap;
        scene.background = new THREE.Color(0xffffff); 

        // After the environment is loaded, we can load the model
        loadMannequinModel(scene);
        
        texture.dispose();
        pmremGenerator.dispose();
    });
    
// --- 3. Interactive Camera Controls ---
const controls = new THREE.OrbitControls(camera, renderer.domElement);
// Center the camera rotation on a point likely at the base/center of the mannequin
controls.target.set(0, 1, 0); 
controls.update();

// --- 4. Model Loading Function ---

function loadMannequinModel(scene) {
    const loader = new THREE.GLTFLoader();

    // The file name here must exactly match your model file
    loader.load(
        'mannequin.glb', 
        
        // Success Callback: Model has loaded
        function (gltf) {
            mannequin = gltf.scene;
scene.add(mannequin);
console.log('Mannequin loaded successfully!');

            
            // OPTIONAL: If your model is too small or large, adjust the scale here
            // gltf.scene.scale.set(10, 10, 10); 
        },
        
        // Progress Callback: Called while assets are loading
        function (xhr) {
            // Calculate and log the loading percentage
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        
        // Error Callback: Called if loading fails
        function (error) {
            console.error('An error occurred while loading the model:', error);
        }
    );
}

// --- 5. Animation Loop (The heart of the 3D scene) ---
function animate() {
    // Request the next frame from the browser, creating a loop
    requestAnimationFrame(animate);

    // Update controls (allows rotation, zoom, etc.)
    controls.update(); 
    
    // Render the scene from the camera's perspective
    renderer.render(scene, camera);
}

// Start the animation loop
animate();

// --- 6. Handle Window Resizing ---
// This ensures the 3D view adjusts correctly when the browser window size changes
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    // --- 7. Fabric Upload to Apply Texture ---
const fileInput = document.getElementById("fabricUpload");

fileInput.addEventListener("change", function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    const texture = new THREE.TextureLoader().load(url);
    texture.flipY = false; // IMPORTANT for GLTF

    if (!mannequin) {
        console.error("Mannequin not loaded yet!");
        return;
    }

    mannequin.traverse((child) => {
        if (child.isMesh) {
            child.material.map = texture;
            child.material.needsUpdate = true;
        }
    });

    console.log("✅ Fabric texture applied!");
});

});