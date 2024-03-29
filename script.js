import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Reflector } from "three/addons/objects/Reflector.js";

//console.log(Refractor)

const scene = new THREE.Scene();

/**
 * Shaders
 */

// Vertex Shader
const vertexShader = `
uniform mat4 textureMatrix;
		varying vec4 vUv;

		#include <common>
		#include <logdepthbuf_pars_vertex>

		void main() {

			vUv = textureMatrix * vec4( position, 1.0 );

			gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

			#include <logdepthbuf_vertex>

		}
`;

// Fragment Shader
const fragmentShader = `
  

   uniform vec3 color;
   uniform sampler2D tDiffuse;
   varying vec4 vUv;
   uniform sampler2D tDudv;
   uniform float time;
   uniform float waveStrength;
   uniform float waveSpeed;

   #include <logdepthbuf_pars_fragment>

   void main() {

       #include <logdepthbuf_fragment>

       float waveStrength = 0.09;
       float waveSpeed = 0.02;
  
        vec2 distortedUv = texture2D( tDudv, vec2( vUv.x + time * waveSpeed, vUv.y ) ).rg * waveStrength;
        distortedUv = vUv.xy + vec2( distortedUv.x, distortedUv.y + time * waveSpeed );
        vec2 distortion = ( texture2D( tDudv, distortedUv ).rg * 2.0 - 1.0 ) * waveStrength;
  
        // new uv coords
  
        vec4 uv = vec4( vUv );
        uv.xy += distortion;

       vec4 base = texture2DProj( tDiffuse, uv );
       gl_FragColor = vec4( mix( base.rgb, color, 0.9 ), 1.0 );

       #include <tonemapping_fragment>
       #include <colorspace_fragment>

   }
`;

// Vertex Shader
const vertexShaderGrad = `
void main() {
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;
// Fragment Shader
const fragmentShaderGrad = `
uniform vec2 u_resolution;
void main() {
  vec2 uv = gl_FragCoord.xy / vec2(${window.innerWidth}, ${window.innerHeight});
  vec3 col = 0.42 + 1.19 * cos(uv.y + vec3(0.584, 0.3524, 0.232));
  gl_FragColor = vec4(col, 1.0);
}

`;

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

controls.update();

/* Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.9);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.far = -15;
directionalLight.shadow.camera.left = -7;
directionalLight.shadow.camera.top = -70;
directionalLight.shadow.camera.right = 7;
directionalLight.shadow.camera.bottom = -7;
directionalLight.position.set(15, -50, 5);
scene.add(directionalLight);

const pointLight = new THREE.PointLight(0xffffff, 0.5);
pointLight.position.x = 2;
pointLight.position.y = 3;
pointLight.position.z = 4;
scene.add(pointLight);

/**
 * Sky for reflection
 */

const planeGeometrySky = new THREE.PlaneGeometry(800, 800);
const planeMaterialSky = new THREE.ShaderMaterial({
  vertexShader: vertexShaderGrad,
  fragmentShader: fragmentShaderGrad,
});
const planeSky = new THREE.Mesh(planeGeometrySky, planeMaterialSky);

//planeSky.rotation.x = -Math.PI * 0.5;
planeSky.rotation.y = 0;
planeSky.position.set(0, 0, -230);
scene.add(planeSky);

const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
//scene.add(cube);

const objGeometry = new THREE.BoxGeometry(1, 1, 1);
const objMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff });
const objForCollision = new THREE.Mesh(objGeometry, objMaterial);
//scene.add(objForCollision);
objForCollision.scale.x = 0.5;
objForCollision.position.x = -3;

var cubes = [];

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

function makeRandomObjects(numCubes) {
  for (var i = 0; i < numCubes; i++) {
    var newObject = objForCollision.clone();

    newObject.position.x = getRandomArbitrary(-15, 15);
    newObject.position.y = 0; // Keeping the Y position constant for all cubes
    newObject.position.z = getRandomArbitrary(-5, 2); // Keeping the Z position constant for all cubes

    newObject.scale.set(0.65, 0.65, 0.65); // Keeping the scale the same for all cubes
    newObject.rotation.set(0, 0, 1); // Keeping the rotation the same for all cubes

    cubes.push(newObject);

    scene.add(newObject);
  }
}

makeRandomObjects(5); // This will create 10 random cubes
console.log(cubes);

const mirrorShader = Reflector.ReflectorShader;
mirrorShader.vertexShader = vertexShader;
mirrorShader.fragmentShader = fragmentShader;

const dudvMap = new THREE.TextureLoader().load(
  "src/waterdudv.jpg",
  function () {
    animate();
  }
);

mirrorShader.uniforms.tDudv = { value: dudvMap };
mirrorShader.uniforms.time = { value: 0 };

console.log(mirrorShader.uniforms.tDudv.value);
console.log(mirrorShader.uniforms.time.value);

dudvMap.wrapS = dudvMap.wrapT = THREE.RepeatWrapping;

let groundMirror, mirrorOptions;

const planeGeometry2 = new THREE.PlaneGeometry(2500, 2500);
mirrorOptions = {
  shader: mirrorShader,
  clipBias: 0.003,
  textureWidth: window.innerWidth,
  textureHeight: window.innerHeight,
  color: 0x0a5c89,
  //textureWidth: window.innerWidth * window.devicePixelRatio,
  //textureHeight: window.innerHeight * window.devicePixelRatio,
};

groundMirror = new Reflector(planeGeometry2, mirrorOptions);
groundMirror.position.y = -2;
groundMirror.rotation.x = -Math.PI * 0.5;
scene.add(groundMirror);

//plane
const planeGeometry = new THREE.PlaneGeometry(100, 10, 5, 5);
const planeMaterial = new THREE.MeshBasicMaterial({ color: 0x440055 });
const planeFloor = new THREE.Mesh(planeGeometry, planeMaterial);
planeFloor.rotation.x = 5;
planeFloor.position.y = -1;
//scene.add(planeFloor);
camera.position.z = 8;

//cube movement borders
const maxBoundary = window.innerWidth / (window.innerHeight * 0.5);
const minBoundary = -maxBoundary;

// LOADER
// Instantiate a loader
const loader = new GLTFLoader();

// Optional: Provide a DRACOLoader instance to decode compressed mesh data
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath("/draco/");

loader.setDRACOLoader(dracoLoader);

let ship;

// Load a glTF resource
loader.load(
  // resource URL
  "models/ship.gltf",
  // called when the resource is loaded
  function (gltf) {
    ship = gltf.scene;
    scene.add(ship);
    console.log(ship.size);
    ship.position.set(0, -2, 0);
    ship.scale.set(0.6, 0.6, 0.6);
    ship.rotation.x = 0.1;

    gltf.animations; // Array<THREE.AnimationClip>
    gltf.scene; // THREE.Group
    gltf.scenes; // Array<THREE.Group>
    gltf.cameras; // Array<THREE.Camera>
    gltf.asset; // Object

    //changePosition();
  },
  // called while loading is progressing
  function (xhr) {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  },
  // called when loading has errors
  function (error) {
    console.log("An error happened", error);
  }
);

//ship.position.y = 0;

function animate() {
  requestAnimationFrame(animate);
  // camera.position.z += -0.008;
  //cube.position.z += -0.008;

  //   cube.rotation.x += 0.01;
  //   cube.rotation.y += 0.01;
  mirrorShader.uniforms.time.value += 0.503;
  groundMirror.material.uniforms.time.value += 0.0503;

  // Update cube positions
  for (var i = 0; i < cubes.length; i++) {
    // Move the cube towards the camera along the Z-axis
    cubes[i].position.z += 0.01;
    cubes[i].position.y = -2;

    // Optional: Reset cube position after it passes a certain point
    if (cubes[i].position.z > 5) {
      cubes[i].position.z = -20;
      cubes[i].position.x = getRandomArbitrary(-20, 20); // Optionally randomize the x position again
    }
  }

  renderer.render(scene, camera);
}

export function cubeMoveRight() {
  if (ship.position.x < maxBoundary) {
    ship.position.x += 0.18;
  }
}

export function cubeMoveLeft() {
  if (ship.position.x > minBoundary) {
    ship.position.x -= 0.18;
  }
}

animate();
