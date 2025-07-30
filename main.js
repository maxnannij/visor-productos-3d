// Importaciones (sin cambios)
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// --- VARIABLES GLOBALES ---
let currentModel;
let allProducts = [];

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
renderer.toneMapping = THREE.ReinhardToneMapping;

// --- LUCES FIJAS ---
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
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0, 0.4, 0.85);
const outputPass = new OutputPass();

const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);
composer.addPass(outputPass);

// --- GESTOR DE CARGA Y CARGADOR ---
const loadingManager = new THREE.LoadingManager(() => { loadingOverlay.style.display = 'none'; });
const gltfLoader = new GLTFLoader(loadingManager);

// --- FUNCIÓN DE DIAGNÓSTICO FORENSE ---
function loadModel(fileName) {
    loadingOverlay.style.display = 'flex';
    if (currentModel) scene.remove(currentModel);
    
    gltfLoader.load(`models/${fileName}`, (gltf) => {
        currentModel = gltf.scene;
        // Centrado y escalado del modelo
        const box = new THREE.Box3().setFromObject(currentModel);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 2.5 / maxDim;
        currentModel.position.sub(center);
        currentModel.scale.set(scale, scale, scale);
        scene.add(currentModel);

        console.log(`=============================================`);
        console.log(`INICIANDO ANÁLISIS FORENSE DE: ${fileName}`);
        console.log(`=============================================`);

        currentModel.traverse((child) => {
            if (child.isMesh && child.material) {
                console.log(`-> Encontrada Malla: '${child.name || 'Sin Nombre'}'`);
                
                const materials = Array.isArray(child.material) ? child.material : [child.material];

                materials.forEach((material, index) => {
                    console.log(`  - Material[${index}]: '${material.name || 'Sin Nombre'}'`);
                    
                    if (material.emissive) {
                        console.log(`    - Emissive Color ANTES: (R:${material.emissive.r}, G:${material.emissive.g}, B:${material.emissive.b})`);
                        console.log(`    - Emissive Intensity ANTES: ${material.emissiveIntensity}`);

                        // Forzamos la intensidad a 0 para la prueba
                        material.emissiveIntensity = 0;
                        
                        console.log(`    - Emissive Intensity DESPUÉS: ${material.emissiveIntensity}`);
                    } else {
                        console.log(`    - Este material no tiene propiedades emisivas.`);
                    }
                });
            }
        });
        console.log(`=============================================`);
        console.log(`ANÁLISIS FINALIZADO`);
        console.log(`=============================================`);
    });
}

// --- OTRAS FUNCIONES (sin cambios) ---
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
searchBox.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const filteredProducts = allProducts.filter(product => product.name.toLowerCase().includes(searchTerm));
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

bloomSlider.addEventListener('input', (e) => {
    const strength = parseFloat(e.target.value);
    bloomPass.strength = strength;
});

// --- BUCLE DE ANIMACIÓN ---
function animate() {
    requestAnimationFrame(animate);
    controls.update();
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
            console.warn("No hay productos para cargar.");
            loadingOverlay.style.display = 'none';
        }
    } catch (error) {
        console.error("No se pudo cargar o procesar el archivo models.json:", error);
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
