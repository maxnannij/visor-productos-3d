// Importaciones (ya no necesitamos TransformControls)
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// (Las importaciones de post-procesamiento pueden quedarse si sigues usando bloom)

// --- VARIABLES GLOBALES ---
let currentModel;
let allProducts = [];
let orbitControls;
// NUEVO: Variables para la animación
let mixer;
let animationAction;

// --- ELEMENTOS DEL DOM ---
const canvas = document.querySelector('#c');
const loadingOverlay = document.getElementById('loading-overlay');
const searchBox = document.getElementById('search-box');
const productSelect = document.getElementById('product-select');
const animationControls = document.getElementById('animation-controls');
const animationSlider = document.getElementById('animation-slider');

// --- INICIALIZACIÓN DE THREE.JS (sin cambios) ---
const scene = new THREE.Scene();
// ... (toda la inicialización de escena, cámara, renderer, luces, etc. es la misma)
scene.background = new THREE.Color("#545454"); 
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 6);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);
orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;

// --- GESTOR DE CARGA ---
const loadingManager = new THREE.LoadingManager(() => { loadingOverlay.style.display = 'none'; });
const gltfLoader = new GLTFLoader(loadingManager);

// --- FUNCIONES DE LA APLICACIÓN ---
function loadModel(fileName) {
    if (currentModel) scene.remove(currentModel);
    // Resetea el mezclador de animación
    mixer = null;
    animationAction = null;
    animationControls.style.display = 'none'; // Oculta los controles
    
    gltfLoader.load(`models/${fileName}`, (gltf) => {
        currentModel = gltf.scene;
        // ... (código de centrado y escalado)
        scene.add(currentModel);

        // LÓGICA DE ANIMACIÓN
        if (gltf.animations && gltf.animations.length) {
            console.log("¡Animación encontrada en el modelo!");
            // 1. Crear el mezclador
            mixer = new THREE.AnimationMixer(currentModel);
            // 2. Obtener la primera acción de animación
            animationAction = mixer.clipAction(gltf.animations[0]);
            // 3. Ponerla en pausa y activarla para que podamos controlarla
            animationAction.paused = true;
            animationAction.play();
            // 4. Mostrar los controles de animación
            animationControls.style.display = 'block';
            animationSlider.value = 0; // Resetea el slider
        } else {
            console.log("Este modelo no tiene animaciones.");
        }
    });
}

// ... (highlightActiveProduct y populateProductSelect sin cambios)

// --- CONFIGURACIÓN DE EVENT LISTENERS ---
// ... (Listeners de búsqueda y selección sin cambios)

// NUEVO: Listener para el slider de animación
animationSlider.addEventListener('input', (e) => {
    if (animationAction) {
        const duration = animationAction.getClip().duration;
        const newTime = parseFloat(e.target.value) * duration;
        
        // Sincroniza la animación con la posición del slider
        animationAction.time = newTime;
        
        // Actualiza el mezclador para que el cambio se refleje en el modelo
        if (mixer) {
            mixer.update(0);
        }
    }
});

// --- BUCLE DE ANIMACIÓN ---
// El bucle ahora es mucho más simple
function animate() {
    requestAnimationFrame(animate);
    orbitControls.update();
    renderer.render(scene, camera);
}

// ... (Función main y listener de resize sin cambios)
// ...

main();
animate();
