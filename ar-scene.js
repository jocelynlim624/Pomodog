import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

let camera, scene, renderer;
let reticle, controller;
let dogModel = null;
let mixer = null;
const clock = new THREE.Clock();

window.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver(() => {
        const arPage = document.getElementById('ar-study');
        if (arPage.classList.contains('active')) {
            initARScene();
            observer.disconnect();
        }
    });

    observer.observe(document.body, {
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
    });
});

function initARScene() {
    const container = document.getElementById('ar-container');

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.xr.enabled = true;
    container.appendChild(renderer.domElement);

    // Hide ARButton UI (we already control the flow)
    const arButton = ARButton.createButton(renderer, { requiredFeatures: ['hit-test'] });
    arButton.style.display = 'none';
    document.body.appendChild(arButton);

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 3);
    hemiLight.position.set(0, 1, 0);
    scene.add(hemiLight);

    const ringGeo = new THREE.RingGeometry(0.07, 0.09, 32).rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    reticle = new THREE.Mesh(ringGeo, ringMat);
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    const loader = new GLTFLoader();
    let hitTestSource = null;
    let localSpace = null;

    renderer.xr.addEventListener('sessionstart', async () => {
        const session = renderer.xr.getSession();
        const viewerSpace = await session.requestReferenceSpace('viewer');
        hitTestSource = await session.requestHitTestSource({ space: viewerSpace });
        localSpace = await session.requestReferenceSpace('local');
    });

    controller = renderer.xr.getController(0);
    controller.addEventListener('select', () => {
        if (dogModel) return;

        loader.load('Assets/Pomodog_dog1.glb', (gltf) => {
            dogModel = gltf.scene;
            dogModel.scale.set(0.2, 0.2, 0.2);

            if (reticle.visible) {
                dogModel.position.setFromMatrixPosition(reticle.matrix);
            } else {
                const dir = new THREE.Vector3(0, 0, -1)
                    .applyMatrix4(camera.matrixWorld)
                    .sub(camera.position)
                    .normalize();
                dogModel.position.copy(camera.position.clone().add(dir.multiplyScalar(1)));
            }

            scene.add(dogModel);

            if (gltf.animations.length > 0) {
                mixer = new THREE.AnimationMixer(dogModel);
                gltf.animations.forEach(clip => mixer.clipAction(clip).play());
            }
        }, undefined, err => console.error('Error loading model:', err));
    });
    scene.add(controller);

    renderer.setAnimationLoop((timestamp, frame) => {
        if (frame && hitTestSource && localSpace) {
            const hits = frame.getHitTestResults(hitTestSource);
            if (hits.length > 0) {
                const hit = hits[0];
                reticle.visible = true;
                reticle.matrix.fromArray(hit.getPose(localSpace).transform.matrix);
            } else {
                reticle.visible = false;
            }
        }

        if (mixer) mixer.update(clock.getDelta());
        renderer.render(scene, camera);
    });
}
