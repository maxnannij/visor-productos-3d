// Importaciones
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

// --- ENVOLVEMOS TODO EN UN LISTENER 'DOMContentLoaded' ---
window.addEventListener('DOMContentLoaded', () => {

    // --- VARIABLES GLOBALES ---
    let currentModel;
    let allProducts = [];
    let orbitControls, composer;
    let mixer;
    let animationAction;
    const clock = new THREE.Clock();

    // --- ELEMENTOS DEL DOM (AHORA SE BUSCAN CUANDO EL DOM ESTÁ LISTO) ---
    const canvas = document.querySelector('#c');
    const loadingOverlay = document.getElementById('loading-overlay');
    const searchBox = document.getElementById('search-box');
    const productSelect = document.getElementById('product-select');
    const animationControls = document.getElementById('animation-controls');
    const animationSlider = document.getElementById('animation-slider');

    // --- INICIALIZACIÓN DE THREE.JS ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#545454"); 
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.5, 6);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;

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
    // composer.addPass(bloomPass); // Descomenta para activar el bloom
    composer.addPass(outputPass);

    // --- GESTOR DE CARGA ---
    const loadingManager = new THREE.LoadingManager(() => {
        loadingOverlay.style.display = 'none';
    });
    const gltfLoader = new GLTFLoader(loadingManager);

    // --- FUNCIONES DE LA APLICACIÓN ---
    function loadModel(fileName) {
        if (currentModel) scene.remove(currentModel);
        mixer = null;
        animationAction = null;
        animationControls.style.display = 'none';
        
        gltfLoader.load(`models/${fileName}`, (gltf) => {
            currentModel = gltf.scene;
            const box = new THREE.Box3().setFromObject(currentModel);
            const center = box.getCenter(new THREE.Vector3());
            currentModel.position.sub(center);
            scene.add(currentModel);

            if (gltf.animations && gltf.animations.length) {
                mixer = new THREE.AnimationMixer(currentModel);
                animationAction = mixer.clipAction(gltf.animations[0]);
                animationAction.play();
                mixer.update(0); 
                animationControls.style.display = 'block';
                animationSlider.value = 0;
            }
        });
    }

    function highlightActiveProduct(fileName) {
        Array.from(productSelect.options).forEach(option => option.classList.remove('active-product'));
        const activeOption = document.querySelector(`#product-select option[value="${fileName}"]`);
        if (activeOption) activeOption.classList.add('active-product');
    }

    function populateProductSelect(products) {
        productSelect.innerHTML = '';
        products.forEach(product => {
            const option = document.createElement('option');
            option.value = product.file;
            option.textContent = product.name;
            productSelect.appendChild(option);
        });
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

    animationSlider.addEventListener('input', (e) => {
        if (animationAction) {
            const duration = animationAction.getClip().duration;
            const newTime = parseFloat(e.target.value) * duration;
            animationAction.time = newTime;
            // Forzamos una actualización inmediata del mixer para que el scrubbing sea responsivo
            if (mixer) {
                mixer.update(0);
            }
        }
    });

    // --- BUCLE DE ANIMACIÓN ---
    function animate() {
        requestAnimationFrame(animate);
        // El delta no es necesario si no hay reproducción automática
        // const delta = clock.getDelta(); 

        orbitControls.update();
        
        // El mixer ya no necesita actualizarse aquí si solo lo controlamos con el slider
        // if (mixer) {
        //     mixer.update(delta);
        // }
        
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

    // --- RESIZE ---
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        composer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });

    // --- INICIO ---
    main();
    animate();

}); // <-- FIN DEL LISTENER 'DOMContentLoaded'
