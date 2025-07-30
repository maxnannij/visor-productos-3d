// Importaciones (sin cambios)
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- VARIABLES GLOBALES Y CONSTANTES ---
let currentModel;
let allProducts = [];

// --- ELEMENTOS DEL DOM ---
const canvas = document.querySelector('#c');
const loadingOverlay = document.getElementById('loading-overlay');
const searchBox = document.getElementById('search-box');
const productSelect = document.getElementById('product-select');
const bgColorPicker = document.getElementById('bg-color-picker');

// --- INICIALIZACIÓN DE THREE.JS ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(bgColorPicker.value); 
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 6);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// --- CONFIGURACIÓN DE LUCES FIJAS ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Luz de relleno suave
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2); // Luz principal para contraste
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);

// --- GESTOR DE CARGA Y CARGADOR (sin cambios) ---
const loadingManager = new THREE.LoadingManager(() => { loadingOverlay.style.display = 'none'; });
const gltfLoader = new GLTFLoader(loadingManager);

// --- FUNCIONES DE LA APLICACIÓN (sin cambios) ---
function loadModel(fileName) {
    loadingOverlay.style.display = 'flex';
    if (currentModel) scene.remove(currentModel);
    
    gltfLoader.load(`models/${fileName}`, (gltf) => {
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

function highlightActiveProduct(fileName) {
    Array.from(productSelect.options).forEach(option => {
        option.classList.remove('active-product');
    });
    const activeOption = productSelect.querySelector(`option[value="${fileName}"]`);
    if (activeOption) {
        activeOption.classList.add('active-product');
    }
}

function populateProductSelect(products) {
    const currentSelectedValue = productSelect.value;
    productSelect.innerHTML = '';
    products.forEach(product => {
        const option = document.createElement('option');
        option.value = product.file;
        option.textContent = product.name;
        productSelect.appendChild(option);
    });
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
    highlightActiveProduct(productSelect.value);
});

productSelect.addEventListener('change', (e) => {
    const selectedFile = e.target.value;
    loadModel(selectedFile);
    highlightActiveProduct(selectedFile);
});

bgColorPicker.addEventListener('input', (e) => {
    scene.background.set(e.target.value);
});

// --- BUCLE DE ANIMACIÓN (sin cambios) ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// --- FUNCIÓN PRINCIPAL ASÍNCRONA (sin cambios) ---
async function main() {
    try {
        const response = await fetch('models.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allProducts = await response.json();
        populateProductSelect(allProducts);
        if (allProducts.length > 0) {
            const firstProductFile = allProducts[0].file;
            productSelect.value = firstProductFile;
            loadModel(firstProductFile);
            highlightActiveProduct(firstProductFile);
        } else {
            console.warn("No hay productos para cargar.");
            loadingOverlay.style.display = 'none';
        }
    } catch (error) {
        console.error("No se pudo cargar o procesar el archivo models.json:", error);
        loadingOverlay.style.display = 'none';
    }
}

// --- RESIZE Y INICIO (sin cambios) ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

main();
animate();
