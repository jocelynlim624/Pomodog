import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let scene, camera, renderer, controls;
let dogModel = null;
const container = document.getElementById('model-overlay');

initCameraFeed();
initScene();

function initCameraFeed() {
    const video = document.getElementById('camera-feed');

    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        .then((stream) => {
            video.srcObject = stream;
        })
        .catch((err) => {
            console.error('Camera access denied:', err);
        });
}

function initScene() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 100);
    camera.position.set(0, 1.5, 3);

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const light = new THREE.HemisphereLight(0xffffff, 0x444444);
    scene.add(light);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.target.set(0, 1, 0);
    controls.update();

    const loader = new GLTFLoader();
    const characterIndex = parseInt(localStorage.getItem('selectedCharacter')) || 0;
    const modelFile = `Assets/Pomodog_dog${characterIndex + 1}.glb`;

    loader.load(modelFile, (gltf) => {
        dogModel = gltf.scene;
        dogModel.scale.set(1.5, 1.5, 1.5);
        dogModel.position.set(0, 0, 0);
        scene.add(dogModel);
    });

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
