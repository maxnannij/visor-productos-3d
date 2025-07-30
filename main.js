// Importaciones (sin cambios)
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- VARIABLES GLOBALES ---
let currentModel;
const modelActions = {
    moveUp: false,
    moveDown: false,
    rotateLeft: false,
    rotateRight: false
};
const moveSpeed = 0.5; // Unidades por segundo
const rotationSpeed = 1.0; // Radianes por segundo
const clock = new THREE.Clock();

// --- ELEMENTOS DEL DOM ---
const canvas = document.querySelector('#c');
const loadingOverlay = document.getElementById('loading-overlay');
const productListDiv = document.getElementById('product-list');
const btnMoveUp = document.getElementById('move-up');
const btnMoveDown = document.getElementById('move-down');
const btnRotateLeft = document.getElementById('rotate-left');
const btnRotateRight = document.getElementById('rotate-right');
const lightSlider = document.getElementById('light-slider');

// --- INICIALIZACIÓN DE THREE.JS ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 6);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// La luz ambiental la creamos aquí para poder acceder a ella globalmente
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);

// --- GESTOR DE CARGA Y CARGADOR (sin cambios) ---
const loadingManager = new THREE.LoadingManager(() => { loadingOverlay.style.display = 'none'; });
const gltfLoader = new GLTFLoader(loadingManager);

// --- FUNCIÓN PARA CARGAR MODELOS (sin cambios) ---
function loadModel(fileName) {
    loadingOverlay.style.display = 'flex';
    if (currentModel) scene.remove(currentModel);
    
    const modelPath = `models/${fileName}`;
    gltfLoader.load(modelPath, (gltf) => {
        currentModel = gltf.scene;
        const box = new THREE.Box3().setFromObject(currentModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.5 / maxDim;
        currentModel.position.sub(center);
        currentModel.scale.set(scale, scale, scale);
        scene.add(currentModel);
    });
}

// --- CONFIGURACIÓN DE LOS EVENT LISTENERS DE LA UI ---
// Usamos mousedown y mouseup para permitir mantener presionado el botón
const setupButtonEvents = (button, action) => {
    button.addEventListener('mousedown', () => { modelActions[action] = true; });
    button.addEventListener('mouseup', () => { modelActions[action] = false; });
    button.addEventListener('mouseleave', () => { modelActions[action] = false; }); // Detener si el ratón se sale
    // Soporte para pantallas táctiles
    button.addEventListener('touchstart', (e) => { e.preventDefault(); modelActions[action] = true; });
    button.addEventListener('touchend', () => { modelActions[action] = false; });
};

setupButtonEvents(btnMoveUp, 'moveUp');
setupButtonEvents(btnMoveDown, 'moveDown');
setupButtonEvents(btnRotateLeft, 'rotateLeft');
setupButtonEvents(btnRotateRight, 'rotateRight');

// Event listener para el slider de la luz
lightSlider.addEventListener('input', (event) => {
    ambientLight.intensity = parseFloat(event.target.value);
});


// --- BUCLE DE ANIMACIÓN (ACTUALIZADO) ---
function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta(); // Tiempo transcurrido desde el último frame

    // Actualizar la posición/rotación del modelo si una acción está activa
    if (currentModel) {
        if (modelActions.moveUp) currentModel.position.y += moveSpeed * deltaTime;
        if (modelActions.moveDown) currentModel.position.y -= moveSpeed * deltaTime;
        if (modelActions.rotateLeft) currentModel.rotation.y += rotationSpeed * deltaTime;
        if (modelActions.rotateRight) currentModel.rotation.y -= rotationSpeed * deltaTime;
    }

    controls.update();
    renderer.render(scene, camera);
}


// --- FUNCIÓN PRINCIPAL ASÍNCRONA (sin cambios) ---
async function main() {
    try {
        const response = await fetch('models.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const products = await response.json();

        products.forEach(product => {
            const button = document.createElement('button');
            button.innerText = product.name;
            button.addEventListener('click', () => loadModel(product.file));
            productListDiv.appendChild(button);
        });

        if (products.length > 0) {
            loadModel(products[0].file);
        } else {
            console.warn("No hay productos para cargar.");
            loadingOverlay.style.display = 'none';
        }
    } catch (error) {
        console.error("No se pudo cargar o procesar el archivo models.json:", error);
        loadingOverlay.style.display = 'none';
    }
}

// --- RESIZE (sin cambios) Y INICIO ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

main();
animate(); // ¡Importante mover la llamada a animate() fuera de main() para que se inicie siempre!
