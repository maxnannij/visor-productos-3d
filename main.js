// Importaciones (sin cambios)
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- VARIABLES GLOBALES Y ELEMENTOS DEL DOM (sin cambios) ---
let currentModel;
const canvas = document.querySelector('#c');
const loadingOverlay = document.getElementById('loading-overlay');
const productListDiv = document.getElementById('product-list');

// --- INICIALIZACIÓN DE THREE.JS (escena, cámara, luces, etc. - sin cambios) ---
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 6);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);

// --- GESTOR DE CARGA (sin cambios) ---
const loadingManager = new THREE.LoadingManager(() => {
    loadingOverlay.style.display = 'none';
});
const gltfLoader = new GLTFLoader(loadingManager);

// --- FUNCIÓN DE CARGA DE MODELO (sin cambios) ---
function loadModel(fileName) {
    loadingOverlay.style.display = 'flex';
    if (currentModel) {
        scene.remove(currentModel);
    }
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

// --- NUEVA FUNCIÓN PRINCIPAL ASÍNCRONA ---
async function main() {
    try {
        // 1. Cargar la lista de productos desde el archivo JSON
        const response = await fetch('models.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const products = await response.json();

        // 2. Crear los botones dinámicamente
        products.forEach(product => {
            const button = document.createElement('button');
            button.innerText = product.name;
            button.addEventListener('click', () => {
                loadModel(product.file);
            });
            productListDiv.appendChild(button);
        });

        // 3. Cargar el primer producto de la lista
        if (products.length > 0) {
            loadModel(products[0].file);
        } else {
            console.warn("No hay productos en models.json para cargar.");
            loadingOverlay.style.display = 'none';
        }

    } catch (error) {
        console.error("No se pudo cargar o procesar el archivo models.json:", error);
        loadingOverlay.style.display = 'none';
    }
}

// --- BUCLE DE ANIMACIÓN Y RESIZE (sin cambios) ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// --- INICIAR LA APLICACIÓN ---
main();
