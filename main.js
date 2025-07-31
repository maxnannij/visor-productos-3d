// Importaciones (con TransformControls)
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

// --- VARIABLES GLOBALES ---
let currentModel;
let allProducts = [];
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
orbitControls.enableDamping = true;

// --- INICIALIZACIÓN DE INTERACCIÓN ---
raycaster = new THREE.Raycaster();
mouse = new THREE.Vector2();

transformControls = new TransformControls(camera, renderer.domElement);
transformControls.addEventListener('dragging-changed', (event) => {
    orbitControls.enabled = !event.value;
});
scene.add(transformControls);


// --- GESTOR DE CARGA Y CARGADOR ---
// DIAGNÓSTICO: Modificamos el LoadingManager para que sea más explícito
const loadingManager = new THREE.LoadingManager(
    // onLoad: Se llama cuando todas las cargas pendientes han terminado.
    () => {
        console.log("LoadingManager: ¡Carga completada! Ocultando overlay.");
        loadingOverlay.style.display = 'none';
    },
    // onProgress: Se llama con cada item cargado.
    (url, itemsLoaded, itemsTotal) => {
        console.log(`LoadingManager: Cargando archivo: ${url} (${itemsLoaded}/${itemsTotal})`);
    },
    // onError: Se llama si un loader falla.
    (url) => {
        console.error(`LoadingManager: Error cargando el archivo ${url}. Ocultando overlay.`);
        loadingOverlay.style.display = 'none';
    }
);
const gltfLoader = new GLTFLoader(loadingManager); // El loader ahora usa nuestro manager detallado

// --- FUNCIONES DE LA APLICACIÓN ---
function loadModel(fileName) {
    // La pantalla de carga ya la maneja el LoadingManager, así que no la mostramos aquí.
    if (currentModel) scene.remove(currentModel);
    if (transformControls.object) transformControls.detach();
    movableObjects = [];
    
    gltfLoader.load(`models/${fileName}`, (gltf) => {
        currentModel = gltf.scene;
        const box = new THREE.Box3().setFromObject(currentModel);
        const center = box.getCenter(new THREE.Vector3());
        currentModel.position.sub(center);
        scene.add(currentModel);

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

    if (intersects.length === 0 || (selectedObject && intersects[0].object === selectedObject)) {
        if (selectedObject) {
            selectedObject.material = originalMaterials.get(selectedObject);
            originalMaterials.delete(selectedObject);
        }
        transformControls.detach();
        selectedObject = null;
        return;
    }

    if (selectedObject) {
        selectedObject.material = originalMaterials.get(selectedObject);
        originalMaterials.delete(selectedObject);
    }
    
    selectedObject = intersects[0].object;
    
    originalMaterials.set(selectedObject, selectedObject.material);
    selectedObject.material = highlightMaterial;
    
    transformControls.attach(selectedObject);
    const move = selectedObject.userData.moveAxis || "";
    const rotate = selectedObject.userData.rotateAxis || "";
    transformControls.showX = move.includes("x") || rotate.includes("x");
    transformControls.showY = move.includes("y") || rotate.includes("y");
    transformControls.showZ = move.includes("z") || rotate.includes("z");
    transformControls.setMode(rotate ? "rotate" : "translate");
}

function highlightActiveProduct(fileName) {
    Array.from(productSelect.options).forEach(option => option.classList.remove('active-product'));
    const activeOption = productSelect.querySelector(`option[value="${fileName}"]`);
    if (activeOption) activeOption.classList.add('active-product');
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
searchBox.addEventListener('input', (e) => { const searchTerm = e.target.value.toLowerCase(); const filteredProducts = allProducts.filter(product => product.name.toLowerCase().includes(searchTerm)); populateProductSelect(filteredProducts); highlightActiveProduct(productSelect.value); });
productSelect.addEventListener('change', (e) => { const selectedFile = e.target.value; loadModel(selectedFile); highlightActiveProduct(selectedFile); });
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('click', onClick);

// --- BUCLE DE ANIMACIÓN ---
function animate() {
    requestAnimationFrame(animate);
    orbitControls.update();
    renderer.render(scene, camera);
}

// --- FUNCIÓN PRINCIPAL ASÍNCRONA ---
async function main() {
    console.log("DIAGNÓSTICO: Iniciando main()...");
    try {
        const response = await fetch('models.json');
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        allProducts = await response.json();
        console.log("DIAGNÓSTICO: models.json cargado con éxito. Productos:", allProducts.length);
        populateProductSelect(allProducts);

        if (allProducts.length > 0) {
            console.log("DIAGNÓSTICO: Hay productos en la lista. Cargando el primero.");
            const firstProductFile = allProducts[0].file;
            productSelect.value = firstProductFile;
            loadModel(firstProductFile);
            highlightActiveProduct(firstProductFile);
        } else {
            // DIAGNÓSTICO: Si no hay productos, no hay nada que cargar.
            // El LoadingManager no se activará, así que debemos ocultar la pantalla de carga manualmente.
            console.warn("DIAGNÓSTICO: No hay productos en models.json. Ocultando overlay manualmente.");
            loadingOverlay.style.display = 'none';
        }
    } catch (error) {
        console.error("DIAGNÓSTICO: Error fatal en la función main:", error);
        // DIAGNÓSTICO: Si hay un error al leer el JSON, también debemos ocultar el overlay.
        loadingOverlay.style.display = 'none';
    }
}

// --- RESIZE Y INICIO ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

main();
animate();
