// Importamos las librerías necesarias de Three.js
import * as THREE from 'three';
// OrbitControls permite mover la cámara con el ratón
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// GLTFLoader permite cargar modelos en formato glTF/GLB
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// 1. ESCENA (Scene)
// La escena es el contenedor de todos los objetos, luces y cámaras.
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf0f0f0); // Un color de fondo gris claro

// 2. CÁMARA (Camera)
// La cámara define qué parte de la escena es visible.
// PerspectiveCamera(campo de visión, aspect ratio, near, far)
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5; // Alejamos un poco la cámara

// 3. RENDERER (Renderer)
// El renderer "dibuja" la escena en el canvas del HTML.
const canvas = document.querySelector('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// 4. LUCES (Lights)
// Sin luces, no veríamos el modelo.
// Luz ambiental para iluminar todo de forma general
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Luz direccional para crear sombras y brillos (como el sol)
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// 5. CONTROLES DE LA CÁMARA (OrbitControls)
// Permite al usuario girar, hacer zoom y mover la cámara.
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Efecto de "arrastre" suave
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false; // Limita el paneo
controls.minDistance = 2; // Zoom mínimo
controls.maxDistance = 10; // Zoom máximo

// 6. CARGADOR DEL MODELO 3D (GLTFLoader)
const loader = new GLTFLoader();
loader.load(
    'models/producto.glb', // Ruta a tu modelo 3D
    function (gltf) {
        // Esta función se ejecuta cuando el modelo se ha cargado correctamente
        const model = gltf.scene;
        // Opcional: Centrar el modelo y escalarlo si es necesario
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center); // Centra el modelo en el origen
        scene.add(model);
    },
    undefined, // No necesitamos la función de progreso aquí
    function (error) {
        // Esta función se ejecuta si hay un error al cargar
        console.error('Un error ocurrió al cargar el modelo:', error);
    }
);

// 7. FUNCIÓN DE ANIMACIÓN (Animation Loop)
// Este bucle se ejecuta en cada frame y actualiza la escena.
function animate() {
    requestAnimationFrame(animate); // Llama a animate() en el siguiente frame

    controls.update(); // Actualiza los controles de la cámara

    renderer.render(scene, camera); // Renderiza la escena
}

// Iniciar el bucle de animación
animate();

// 8. MANEJO DEL CAMBIO DE TAMAÑO DE LA VENTANA
window.addEventListener('resize', () => {
    // Actualizar el aspect ratio de la cámara
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    // Actualizar el tamaño del renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
});
