// Importamos las librerías necesarias de Three.js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// --- CONFIGURACIÓN DE PRODUCTOS ---
const products = [
    {
        name: '301176',
        path: 'models/301176.glb'
    },
    {
        name: '301169',
        path: 'models/301169.glb'
    },
    // Añade más productos aquí
];

// --- VARIABLES GLOBALES ---
let currentModel;

// --- ELEMENTOS DEL DOM ---
const canvas = document.querySelector('#c');
const loadingOverlay = document.getElementById('loading-overlay');
const productListDiv = document.getElementById('product-list');

// 1. ESCENA
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0);

// 2. CÁMARA
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 6);

// 3. RENDERER
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Mejor rendimiento en pantallas de alta densidad

// 4. LUCES
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// 5. CONTROLES
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0); // Apunta la cámara un poco más arriba

// --- GESTOR DE CARGA (LOADING MANAGER) ---
// El LoadingManager es clave para saber cuándo empieza y termina la carga.
const loadingManager = new THREE.LoadingManager(
    // Se llama cuando la carga se completa
    () => {
        loadingOverlay.style.display = 'none';
    },
    // Se llama durante el progreso de carga (opcional)
    (itemUrl, itemsLoaded, itemsTotal) => {
        const progressPercent = Math.round((itemsLoaded / itemsTotal) * 100);
        console.log(`Cargando: ${progressPercent}%`);
    },
    // Se llama si hay un error
    () => {
        console.error('Hubo un error al cargar el modelo.');
        loadingOverlay.style.display = 'none'; // Ocultar también en caso de error
    }
);

// 6. CARGADOR DEL MODELO 3D
const gltfLoader = new GLTFLoader(loadingManager); // Usamos el gestor de carga

// --- FUNCIÓN PARA CARGAR MODELOS ---
function loadModel(url) {
    // Muestra el indicador de carga
    loadingOverlay.style.display = 'flex';

    // Si ya hay un modelo en la escena, lo eliminamos
    if (currentModel) {
        scene.remove(currentModel);
    }

    gltfLoader.load(url, (gltf) => {
        currentModel = gltf.scene;

        // Centrar y escalar el modelo (opcional pero recomendado)
        const box = new THREE.Box3().setFromObject(currentModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.5 / maxDim; // Escala para que el modelo tenga un tamaño razonable
        
        currentModel.position.sub(center);
        currentModel.scale.set(scale, scale, scale);

        scene.add(currentModel);
    });
}

// --- CREACIÓN DINÁMICA DE BOTONES ---
products.forEach(product => {
    const button = document.createElement('button');
    button.innerText = product.name;
    button.addEventListener('click', () => {
        loadModel(product.path);
    });
    productListDiv.appendChild(button);
});

// --- BUCLE DE ANIMACIÓN ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

// --- MANEJO DE REDIMENSIÓN DE VENTANA ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

// --- CARGA INICIAL DEL PRIMER PRODUCTO ---
if (products.length > 0) {
    loadModel(products[0].path);
}
