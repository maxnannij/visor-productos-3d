// Importaciones (sin cambios)
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- VARIABLES GLOBALES Y CONSTANTES ---
let currentModel;
let allProducts = [];
const clock = new THREE.Clock();

const initialLightIntensity = { ambient: 0.8, directional: 1.0 };

// --- ELEMENTOS DEL DOM ---
const canvas = document.querySelector('#c');
const loadingOverlay = document.getElementById('loading-overlay');
const searchBox = document.getElementById('search-box');
const productSelect = document.getElementById('product-select');
const lightSlider = document.getElementById('light-slider');
const bgColorPicker = document.getElementById('bg-color-picker'); // Nuevo

// --- INICIALIZACIÓN DE THREE.JS ---
const scene = new THREE.Scene();
// El color de fondo ahora se establecerá desde el picker
scene.background = new THREE.Color(bgColorPicker.value); 
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 6);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true }); // No necesita alpha:true
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
 * Resalta la opción actualmente seleccionada en el <select>.
 * @param {string} fileName - El nombre del archivo del producto activo.
 */
function highlightActiveProduct(fileName) {
    // Primero, quitamos la clase 'active-product' de todas las opciones
    Array.from(productSelect.options).forEach(option => {
        option.classList.remove('active-product');
    });
    // Luego, la añadimos solo a la opción correspondiente
    const activeOption = productSelect.querySelector(`option[value="${fileName}"]`);
    if (activeOption) {
        activeOption.classList.add('active-product');
    }
}

function populateProductSelect(products) {
    const currentSelectedValue = productSelect.value;
    productSelect.innerHTML = ''; // Limpiar opciones anteriores
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.file;
        option.textContent = product.name;
        productSelect.appendChild(option);
    });
    // Volver a seleccionar el producto que estaba activo si todavía existe en la lista
    if (productSelect.querySelector(`option[value="${currentSelectedValue}"]`)) {
        productSelect.value = currentSelectedValue;
    }
}

// --- CONFIGURACIÓN DE EVENT LISTENERS ---

searchBox.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredProducts = allProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm)
    );
    populateProductSelect(filteredProducts);
    highlightActiveProduct(productSelect.value); // Re-aplicar el resaltado
});

productSelect.addEventListener('change', (e) => {
    const selectedFile = e.target.value;
    loadModel(selectedFile);
    highlightActiveProduct(selectedFile);
});

lightSlider.addEventListener('input', (e) => {
    const multiplier = parseFloat(e.target.value);
    ambientLight.intensity = initialLightIntensity.ambient * multiplier;
    directionalLight.intensity = initialLightIntensity.directional * multiplier;
});

bgColorPicker.addEventListener('input', (e) => {
    scene.background.set(e.target.value);
});


// --- BUCLE DE ANIMACIÓN ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// --- FUNCIÓN PRINCIPAL ASÍNCRONA ---
async function main() {
    try {
        const response = await fetch('models.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allProducts = await response.json();

        populateProductSelect(allProducts);

        if (allProducts.length > 0) {
            const firstProductFile = allProducts[0].file;
            productSelect.value = firstProductFile; // Asegurar que el select refleje la carga inicial
            loadModel(firstProductFile);
            highlightActiveProduct(firstProductFile); // Resaltar el primer producto
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
