import {
    ACESFilmicToneMapping,
    WebGLRenderer,
    Scene, PerspectiveCamera, PlaneGeometry, TextureLoader,
    Vector3, MirroredRepeatWrapping, HemisphereLight, PMREMGenerator,
    MathUtils,
    ShaderMaterial,
    Mesh,


    AxesHelper,


} from 'three';
import { Water } from './objects/water'
import { Sky } from "three/examples/jsm/objects/Sky"

const scene = new Scene();
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);

let renderer: WebGLRenderer;

const sceneConfiguration = {
    objectMoving: false,
    speed: 0.0,
    cameraMovingToStartPosition: false,
    cameraStartAnimationPlaying: false,
    ready: false,
}

// Stores the current position of the camera, while the opening camera animation is playing
let cameraAngleStartAnimation = 0.00;

const destructionBits = new Array<Mesh>();

function createWater() {
    const waterGeometry = new PlaneGeometry(10000, 10000);

    return new Water(
        waterGeometry,
        {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new TextureLoader().load('./static/normals/waternormals.jpeg', function (texture) {
                texture.wrapS = texture.wrapT = MirroredRepeatWrapping;
            }),
            sunDirection: new Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f,
            distortionScale: 3.7,
            fog: scene.fog !== undefined
        }
    );
}

const water = createWater()


function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()

    if (renderer) {
        renderer.setSize(window.innerWidth, window.innerHeight)
    }

    updateWaterMaterial()
}

function setupSky(sky: Sky, sun: Vector3) {
    // Set up variables to control the look of the sky
    const skyUniforms = sky.material.uniforms;
    skyUniforms['turbidity'].value = 10;
    skyUniforms['rayleigh'].value = 2;
    skyUniforms['mieCoefficient'].value = 0.005;
    skyUniforms['mieDirectionalG'].value = 0.8;

    const parameters = {
        elevation: 3,
        azimuth: 115
    };

    const pmremGenerator = new PMREMGenerator(renderer);

    const phi = MathUtils.degToRad(90 - parameters.elevation);
    const theta = MathUtils.degToRad(parameters.azimuth);

    sun.setFromSphericalCoords(1, phi, theta);

    sky.material.uniforms['sunPosition'].value.copy(sun);

    scene.environment = pmremGenerator.fromScene(sky as any).texture;
}

function setupWater(water: Water, sun: Vector3) {
    (water.material as ShaderMaterial).uniforms['speed'].value = 0.0;
    (water.material as ShaderMaterial).uniforms['sunDirection'].value.copy(sun).normalize();

}

function init() {
    renderer = new WebGLRenderer();
    renderer.toneMapping = ACESFilmicToneMapping;
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio);

    document.body.appendChild(renderer.domElement)


    const sun = new Vector3();
    const light = new HemisphereLight(0xffffff, 0x444444, 1.0);
    light.position.set(0, 1, 0);
    scene.add(light);

    // Water
    water.rotation.x = -Math.PI / 2;
    water.rotation.z = 0;

    scene.add(water);

    // Create the skybox
    const sky = new Sky();
    sky.scale.setScalar(10000);
    scene.add(sky);


    setupSky(sky, sun)
    setupWater(water, sun)


    sceneConfiguration.ready = true;

    camera.position.set(0, 10, 30);


    scene.add(new AxesHelper(20));
}

const animate = () => {
    requestAnimationFrame(animate)

    if (sceneConfiguration.ready) {
        // if (!sceneConfiguration.cameraStartAnimationPlaying) {
        //     camera.position.x = 20 * Math.cos(cameraAngleStartAnimation);
        //     camera.position.z = 20 * Math.sin(cameraAngleStartAnimation);
        //     camera.position.y = 30;
        //     // camera.position.y += 40;
        //     // camera.lookAt(rocketModel.position);
        //     cameraAngleStartAnimation += 0.005;
        // }


        destructionBits.forEach(mesh => {
            if (mesh.userData.clock && mesh.userData.mixer) {
                // debugger;
                mesh.userData.mixer.update(mesh.userData.clock.getDelta());
            }
        });

        camera.userData?.mixer?.update(camera.userData?.clock?.getDelta());
    }

    updateWaterMaterial();
    renderer.render(scene, camera);
}

function updateWaterMaterial() {
    (water.material as ShaderMaterial).uniforms['time'].value += 1 / 60.0;
    if (sceneConfiguration.objectMoving) {
        (water.material as ShaderMaterial).uniforms['speed'].value += sceneConfiguration.speed / 50;
    }
}


window.addEventListener('resize', onWindowResize, false);
init()
animate();
