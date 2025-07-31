// Importaciones (con TransformControls y Post-procesamiento)
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// --- VARIABLES GLOBALES ---
let currentModel;
let allProducts = [];
let raycaster, mouse, transformControls, orbitControls, composer;
let movableObjects = [];
let selectedObject = null;
const highlightMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, wireframe: true, transparent: true, opacity: 0.7 });
let originalMaterials = new Map();

// --- ELEMENTOS DEL DOM ---
const canvas = document.querySelector('#c');
const loadingOverlay = document.getElementById('loading-overlay');
const searchBox = document.getElementById('search-box');
const productSelect = document.getElementById('product-select');
const bgColorPicker = document.getElementById('bg-color-picker');
const bloomSlider = document.getElementById('bloom-slider');

// --- INICIALIZACIÓN DE THREE.JS ---
const scene = new THREE.Scene();
scene.background = new THREE.Color("#545454"); 
const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.5, 6);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping; // Mejor tone mapping para bloom

const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;

// --- INICIALIZACIÓN DE POST-PROCESAMIENTO ---
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0, 0.4, 0.85);
const outputPass = new OutputPass();
composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);
composer.addPass(outputPass);

// --- INICIALIZACIÓN DE INTERACCIÓN ---
raycaster = new THREE.Raycaster();
mouse = new THREE.Vector2();

transformControls = new TransformControls(camera, renderer.domElement);
transformControls.addEventListener('dragging-changed', (event) => {
    orbitControls.enabled = !event.value;
});
scene.add(transformControls);


// --- GESTOR DE CARGA ---
const loadingManager = new THREE.LoadingManager(() => {
    loadingOverlay.style.display = 'none';
});
const gltfLoader = new GLTFLoader(loadingManager);

// --- FUNCIONES DE LA APLICACIÓN ---
function loadModel(fileName) {
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
                movableObjects.push(child);
            }
        });
    });
}

function onPointerMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
}

function onClick(event) {
    // Evita que el raycaster se dispare si se hace clic en un control de la UI
    if (event.target.closest('.panel, #floating-controls')) return;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(movableObjects, false);

    if (intersects.length > 0) {
        const newSelectedObject = intersects[0].object;
        if (selectedObject !== newSelectedObject) {
             if (selectedObject) {
                selectedObject.material = originalMaterials.get(selectedObject);
                originalMaterials.delete(selectedObject);
            }
            selectedObject = newSelectedObject;
            originalMaterials.set(selectedObject, selectedObject.material);
            selectedObject.material = highlightMaterial;
            transformControls.attach(selectedObject);
        }
    } else {
        if (selectedObject) {
            selectedObject.material = originalMaterials.get(selectedObject);
            originalMaterials.delete(selectedObject);
        }
        transformControls.detach();
        selectedObject = null;
    }
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
bgColorPicker.addEventListener('input', (e) => { scene.background.set(e.target.value); });
bloomSlider.addEventListener('input', (e) => { bloomPass.strength = parseFloat(e.target.value); });
window.addEventListener('pointermove', onPointerMove, false);
window.addEventListener('click', onClick, false);

// --- BUCLE DE ANIMACIÓN ---
function animate() {
    requestAnimationFrame(animate);
    orbitControls.update();
    // Ahora renderizamos con el composer para aplicar los efectos
    composer.render();
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
            productSelect.value = firstProductFile;
            loadModel(firstProductFile);
            highlightActiveProduct(firstProductFile);
        } else {
            loadingOverlay.style.display = 'none';
        }
    } catch (error) {
        console.error("Error en la función main:", error);
        loadingOverlay.style.display = 'none';
    }
}

// --- RESIZE Y INICIO ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

main();
animate();
