// Importaciones (con nuevas adiciones para post-procesamiento)
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// --- VARIABLES GLOBALES Y CONSTANTES (sin cambios) ---
let currentModel;
let allProducts = [];

// --- ELEMENTOS DEL DOM (sin cambios) ---
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
renderer.toneMapping = THREE.ReinhardToneMapping; // Un Tone Mapping que funciona bien con Bloom

// --- LUCES FIJAS (sin cambios) ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 1, 0);


// --- POST-PROCESAMIENTO (BLOOM) ---
const renderScene = new RenderPass(scene, camera);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
// Parámetros de UnrealBloomPass:
// 1. resolution: El tamaño del render.
// 2. strength: La intensidad del brillo. (ej: 1.5)
// 3. radius: El radio de dispersión del brillo. (ej: 0.4)
// 4. threshold: El umbral de brillo. Solo los píxeles más brillantes que este valor generarán bloom. (ej: 0.85)

const outputPass = new OutputPass(); // Corrige la salida de color después de los efectos.

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);
composer.addPass(outputPass);


// --- GESTOR DE CARGA Y CARGADOR (sin cambios) ---
const loadingManager = new THREE.LoadingManager(() => { loadingOverlay.style.display = 'none'; });
const gltfLoader = new GLTFLoader(loadingManager);

// --- CÓMO HACER QUE UN OBJETO BRILLE (EJEMPLO) ---
// Para que el bloom funcione, un material debe tener un color "emisivo"
// con una intensidad superior al `threshold` del bloomPass.
// Vamos a añadir un cubo de ejemplo para demostrarlo.
const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
const glowingMaterial = new THREE.MeshStandardMaterial({
    emissive: 0xffffee, // El color de la luz que emite
    emissiveIntensity: 2, // La intensidad. ¡Este valor debe superar el threshold!
    color: 0x000000 // El color base puede ser oscuro
});
const glowingCube = new THREE.Mesh(geometry, glowingMaterial);
glowingCube.position.set(2, 1, 0); // Lo ponemos a un lado para verlo
scene.add(glowingCube);


// --- FUNCIONES DE LA APLICACIÓN (con una modificación en loadModel) ---
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

        // **IMPORTANTE**: Itera sobre tu modelo para activar la emisión si es necesario
        // Por ejemplo, si tienes un material llamado "Luz_Pantalla" en tu modelo:
        currentModel.traverse((child) => {
            if (child.isMesh && child.material.name === 'Luz_Pantalla') {
                child.material.emissive = new THREE.Color(0x00ffff); // Cian
                child.material.emissiveIntensity = 5;
            }
        });
    });
}
// ... (resto de funciones sin cambios: highlightActiveProduct, populateProductSelect) ...
function highlightActiveProduct(fileName) { Array.from(productSelect.options).forEach(option => { option.classList.remove('active-product'); }); const activeOption = productSelect.querySelector(`option[value="${fileName}"]`); if (activeOption) { activeOption.classList.add('active-product'); } }
function populateProductSelect(products) { const currentSelectedValue = productSelect.value; productSelect.innerHTML = ''; products.forEach(product => { const option = document.createElement('option'); option.value = product.file; option.textContent = product.name; productSelect.appendChild(option); }); if (productSelect.querySelector(`option[value="${currentSelectedValue}"]`)) { productSelect.value = currentSelectedValue; } }

// --- EVENT LISTENERS (sin cambios) ---
searchBox.addEventListener('input', (e) => { const searchTerm = e.target.value.toLowerCase(); const filteredProducts = allProducts.filter(product => product.name.toLowerCase().includes(searchTerm)); populateProductSelect(filteredProducts); highlightActiveProduct(productSelect.value); });
productSelect.addEventListener('change', (e) => { const selectedFile = e.target.value; loadModel(selectedFile); highlightActiveProduct(selectedFile); });
bgColorPicker.addEventListener('input', (e) => { scene.background.set(e.target.value); });

// --- BUCLE DE ANIMACIÓN (MODIFICADO) ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();

    // En lugar de renderer.render, usamos el composer
    composer.render();
}

// --- FUNCIÓN PRINCIPAL ASÍNCRONA (sin cambios) ---
async function main() { /* ... código sin cambios ... */ try { const response = await fetch('models.json'); if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`); allProducts = await response.json(); populateProductSelect(allProducts); if (allProducts.length > 0) { const firstProductFile = allProducts[0].file; productSelect.value = firstProductFile; loadModel(firstProductFile); highlightActiveProduct(firstProductFile); } else { console.warn("No hay productos para cargar."); loadingOverlay.style.display = 'none'; } } catch (error) { console.error("No se pudo cargar o procesar el archivo models.json:", error); loadingOverlay.style.display = 'none'; } }

// --- RESIZE (MODIFICADO) Y INICIO ---
window.addEventListener('resize', () => {
    // Actualizar cámara
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Actualizar renderer Y composer
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

main();
animate();
