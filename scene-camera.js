import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { Raycaster, Vector2, Vector3, Plane } from 'three';


let scene, camera, renderer, controls;
let dogModel = null;
let mixer = null;
const clock = new THREE.Clock();
const container = document.getElementById('model-overlay');

const raycaster = new Raycaster();
const tapPosition = new Vector2();
const ground = new Plane(new Vector3(0, 1, 0), 0); // horizontal ground plane at y=0

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

    const light = new THREE.HemisphereLight(0xffffff, 0x44444, 5);
    scene.add(light);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enablePan = false;
    controls.enableZoom = true; // ✅ Enable zoom
    controls.minDistance = 1;
    controls.maxDistance = 10;

    controls.target.set(0, 1, 0);
    controls.update();

    const loader = new GLTFLoader();
    const characterIndex = parseInt(localStorage.getItem('selectedCharacter'));
    console.log('Raw character index from storage:', localStorage.getItem('selectedCharacter'));
    console.log('Parsed character index:', characterIndex);
    
    // Ensure we have a valid index (0, 1, or 2)
    const validIndex = characterIndex >= 0 && characterIndex <= 2 ? characterIndex : 0;
    let modelNumber;
    if (validIndex === 0) {
        modelNumber = 1;  // Character 1 shows model 3
    } else if (validIndex === 1) {
        modelNumber = 2;  // Character 2 shows model 2 (unchanged)
    } else {
        modelNumber = 3;  // Character 3 shows model 1
    }
    const modelFile = `Assets/Pomodog_dog${modelNumber}.glb`;
    
    console.log('Loading model file:', modelFile);
    
    loader.load(
        modelFile,
        (gltf) => {
            console.log('Successfully loaded model:', modelFile);
            dogModel = gltf.scene;
            dogModel.scale.set(1.5, 1.5, 1.5);
            dogModel.position.set(-0.2, 1, 0.5);
            scene.add(dogModel);

            // Play animation
            mixer = new THREE.AnimationMixer(dogModel);
            gltf.animations.forEach((clip) => {
                const action = mixer.clipAction(clip);
                action.play();
            });
        },
        undefined,
        (error) => {
            console.error('Error loading model:', error);
        }
    );

    renderer.domElement.addEventListener('click', onTap);

    function onTap(event) {
        if (!dogModel) return;

        const rect = renderer.domElement.getBoundingClientRect();
        tapPosition.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        tapPosition.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(tapPosition, camera);
        const intersectPoint = new Vector3();
        raycaster.ray.intersectPlane(ground, intersectPoint);

        dogModel.position.copy(intersectPoint);
    }

    animate();
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();

    if (mixer) mixer.update(delta);

    controls.update();
    renderer.render(scene, camera);
}
