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
            init();
            observer.disconnect();
        }
    });

    observer.observe(document.body, {
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
    });
});

function init() {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    document.getElementById('ar-container').appendChild(renderer.domElement);

    document.body.appendChild(ARButton.createButton(renderer, {
        requiredFeatures: ['hit-test']
    }));

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();

    // Bright Hemisphere Light
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 3);
    hemiLight.position.set(0, 1, 0);
    scene.add(hemiLight);

    // Reticle for surface placement
    const geometry = new THREE.RingGeometry(0.07, 0.09, 32).rotateX(-Math.PI / 2);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    reticle = new THREE.Mesh(geometry, material);
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add(reticle);

    const loader = new GLTFLoader();

    let hitTestSource = null;
    let localSpace = null;

    renderer.xr.addEventListener('sessionstart', async () => {
        const session = renderer.xr.getSession();
        const viewerRefSpace = await session.requestReferenceSpace('viewer');
        hitTestSource = await session.requestHitTestSource({ space: viewerRefSpace });
        localSpace = await session.requestReferenceSpace('local');
    });

    // Handle model placement
    controller = renderer.xr.getController(0);
    controller.addEventListener('select', () => {
        if (reticle.visible && !dogModel) {
            loader.load('Assets/Pomodog_dog1.glb', (gltf) => {
                dogModel = gltf.scene;
                dogModel.scale.set(0.2, 0.2, 0.2);
                dogModel.position.setFromMatrixPosition(reticle.matrix);
                scene.add(dogModel);

                // Play animation if available
                if (gltf.animations.length > 0) {
                    mixer = new THREE.AnimationMixer(dogModel);
                    gltf.animations.forEach((clip) => {
                        mixer.clipAction(clip).play();
                    });
                }
            }, undefined, (error) => {
                console.error('Error loading dog model:', error);
            });
        }
    });
    scene.add(controller);

    renderer.setAnimationLoop((timestamp, frame) => {
        if (frame && hitTestSource && localSpace) {
            const hitTestResults = frame.getHitTestResults(hitTestSource);
            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                reticle.visible = true;
                reticle.matrix.fromArray(hit.getPose(localSpace).transform.matrix);
            } else {
                reticle.visible = false;
            }
        }

        const delta = clock.getDelta();
        if (mixer) mixer.update(delta);
        renderer.render(scene, camera);
    });
}
