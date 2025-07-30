// Importaciones (sin cambios)
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- VARIABLES GLOBALES Y CONSTANTES ---
let currentModel;
let allProducts = []; // Almacenará la lista completa de productos
const modelActions = { moveUp: false, moveDown: false, rotateLeft: false, rotateRight: false };
const moveSpeed = 0.5, rotationSpeed = 1.0;
const clock = new THREE.Clock();

// --- VALORES INICIALES DE LUZ ---
const initialLightIntensity = {
    ambient: 0.8,
    directional: 1.0
};

// --- ELEMENTOS DEL DOM ---
const canvas = document.querySelector('#c');
const loadingOverlay = document.getElementById('loading-overlay');
const searchBox = document.getElementById('search-box');
const productSelect = document.getElementById('product-select');
const btnMoveUp = document.getElementById('move-up'), btnMoveDown = document.getElementById('move-down');
const btnRotateLeft = document.getElementById('rotate-left'), btnRotateRight = document.getElementById('rotate-right');
const lightSlider = document.getElementById('light-slider');

// --- INICIALIZACIÓN DE THREE.JS ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 6);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

const ambientLight = new THREE.AmbientLight(0xffffff, initialLightIntensity.ambient);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, initialLightIntensity.directional);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);

// --- GESTOR DE CARGA Y CARGADOR (sin cambios) ---
const loadingManager = new THREE.LoadingManager(() => { loadingOverlay.style.display = 'none'; });
const gltfLoader = new GLTFLoader(loadingManager);

// --- FUNCIONES DE LA APLICACIÓN ---

function loadModel(fileName) {
    loadingOverlay.style.display = 'flex';
    if (currentModel) scene.remove(currentModel);
    
    gltfLoader.load(`models/${fileName}`, (gltf) => {
        currentModel = gltf.scene;
        // ... (código de centrado y escalado sin cambios) ...
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

/**
 * Llena el menú desplegable <select> con una lista de productos.
 * @param {Array} products - El array de productos a mostrar.
 */
function populateProductSelect(products) {
    productSelect.innerHTML = ''; // Limpiar opciones anteriores
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.file;
        option.textContent = product.name;
        productSelect.appendChild(option);
    });
}

// --- CONFIGURACIÓN DE EVENT LISTENERS ---

// Buscador
searchBox.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm)
    );
    populateProductSelect(filteredProducts);
});

// Selector de producto
productSelect.addEventListener('change', (e) => {
    loadModel(e.target.value);
});

// Slider de luz global
lightSlider.addEventListener('input', (e) => {
    const multiplier = parseFloat(e.target.value);
    ambientLight.intensity = initialLightIntensity.ambient * multiplier;
    directionalLight.intensity = initialLightIntensity.directional * multiplier;
});

// Controles de transformación (código sin cambios)
const setupButtonEvents = (button, action) => {
    button.addEventListener('mousedown', () => { modelActions[action] = true; });
    button.addEventListener('mouseup', () => { modelActions[action] = false; });
    button.addEventListener('mouseleave', () => { modelActions[action] = false; });
    button.addEventListener('touchstart', (e) => { e.preventDefault(); modelActions[action] = true; });
    button.addEventListener('touchend', () => { modelActions[action] = false; });
};
setupButtonEvents(btnMoveUp, 'moveUp');
setupButtonEvents(btnMoveDown, 'moveDown');
setupButtonEvents(btnRotateLeft, 'rotateLeft');
setupButtonEvents(btnRotateRight, 'rotateRight');

// --- BUCLE DE ANIMACIÓN (actualizado para usar deltaTime) ---
function animate() {
    requestAnimationFrame(animate);
    const deltaTime = clock.getDelta();
    if (currentModel) {
        if (modelActions.moveUp) currentModel.position.y += moveSpeed * deltaTime;
        if (modelActions.moveDown) currentModel.position.y -= moveSpeed * deltaTime;
        if (modelActions.rotateLeft) currentModel.rotation.y += rotationSpeed * deltaTime;
        if (modelActions.rotateRight) currentModel.rotation.y -= rotationSpeed * deltaTime;
    }
    controls.update();
    renderer.render(scene, camera);
}

// --- FUNCIÓN PRINCIPAL ASÍNCRONA ---
async function main() {
    try {
        const response = await fetch('models.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allProducts = await response.json(); // Guardamos en la variable global

        populateProductSelect(allProducts); // Llenamos el select con todos los productos

        if (allProducts.length > 0) {
            loadModel(allProducts[0].file);
        } else {
            console.warn("No hay productos para cargar.");
            loadingOverlay.style.display = 'none';
        }
    } catch (error) {
        console.error("No se pudo cargar o procesar el archivo models.json:", error);
        loadingOverlay.style.display = 'none';
    }
}

// --- RESIZE Y INICIO ---
window.addEventListener('resize', () => { /* ... código sin cambios ... */
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

main();
animate();
