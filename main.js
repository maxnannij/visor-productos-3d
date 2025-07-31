// Importaciones (NUEVA: TransformControls)
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

// --- VARIABLES GLOBALES ---
let currentModel;
let allProducts = [];
// NUEVO: Variables para la interacción
let raycaster, mouse, transformControls;
let movableObjects = [];
let selectedObject = null;
const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true });
let originalMaterials = new Map();

// --- ELEMENTOS DEL DOM ---
const canvas = document.querySelector('#c');
const loadingOverlay = document.getElementById('loading-overlay');
const searchBox = document.getElementById('search-box');
const productSelect = document.getElementById('product-select');

// --- INICIALIZACIÓN DE THREE.JS ---
const scene = new THREE.Scene();
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

const orbitControls = new OrbitControls(camera, renderer.domElement);

// --- INICIALIZACIÓN DE INTERACCIÓN ---
raycaster = new THREE.Raycaster();
mouse = new THREE.Vector2();

transformControls = new TransformControls(camera, renderer.domElement);
transformControls.addEventListener('dragging-changed', (event) => {
    orbitControls.enabled = !event.value; // Deshabilita la cámara al mover un objeto
});
scene.add(transformControls);


// --- GESTOR DE CARGA Y CARGADOR ---
const loadingManager = new THREE.LoadingManager(() => { loadingOverlay.style.display = 'none'; });
const gltfLoader = new GLTFLoader(loadingManager);

// --- FUNCIONES DE LA APLICACIÓN ---
function loadModel(fileName) {
    loadingOverlay.style.display = 'flex';
    if (currentModel) scene.remove(currentModel);
    if (transformControls.object) transformControls.detach();
    movableObjects = []; // Limpia la lista de objetos móviles
    
    gltfLoader.load(`models/${fileName}`, (gltf) => {
        currentModel = gltf.scene;
        const box = new THREE.Box3().setFromObject(currentModel);
        const center = box.getCenter(new THREE.Vector3());
        currentModel.position.sub(center);
        scene.add(currentModel);

        // LÓGICA DINÁMICA: Busca objetos con metadatos
        currentModel.traverse((child) => {
            if (child.isMesh && child.userData.isMovable) {
                console.log(`Parte móvil encontrada: ${child.name}`);
                movableObjects.push(child);
            }
        });
    });
}

function onPointerMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
}

function onClick() {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(movableObjects, true);

    // Deseleccionar si se hace clic en el fondo o en el mismo objeto
    if (intersects.length === 0 || (selectedObject && intersects[0].object === selectedObject)) {
        if (selectedObject) {
            // Restaurar material original
            selectedObject.material = originalMaterials.get(selectedObject);
            originalMaterials.delete(selectedObject);
        }
        transformControls.detach();
        selectedObject = null;
        return;
    }

    // Seleccionar un nuevo objeto
    if (selectedObject) { // Deseleccionar el anterior primero
        selectedObject.material = originalMaterials.get(selectedObject);
        originalMaterials.delete(selectedObject);
    }
    
    selectedObject = intersects[0].object;
    
    // Guardar material original y aplicar resaltado
    originalMaterials.set(selectedObject, selectedObject.material);
    selectedObject.material = highlightMaterial;
    
    // Adjuntar gizmo y configurar sus modos según los metadatos
    transformControls.attach(selectedObject);
    const move = selectedObject.userData.moveAxis || "";
    const rotate = selectedObject.userData.rotateAxis || "";
    transformControls.showX = move.includes("x") || rotate.includes("x");
    transformControls.showY = move.includes("y") || rotate.includes("y");
    transformControls.showZ = move.includes("z") || rotate.includes("z");
    transformControls.setMode(rotate ? "rotate" : "translate");
}

// ... (highlightActiveProduct y populateProductSelect sin cambios)
function highlightActiveProduct(fileName) { /* ... */ }
function populateProductSelect(products) { /* ... */ }

// --- CONFIGURACIÓN DE EVENT LISTENERS ---
// ... (Listeners de búsqueda y selección de producto sin cambios)
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('click', onClick);

// --- BUCLE DE ANIMACIÓN, MAIN, Y RESIZE ---
function animate() { requestAnimationFrame(animate); orbitControls.update(); renderer.render(scene, camera); }
async function main() { /* ... */ }
window.addEventListener('resize', () => { /* ... */ });
main(); animate();
