
import {Object3D} from "three";
import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";

export let bunnyModel: Object3D;


const bunnyGLTF = 'static/models/bunny_plushie/scene.gltf';
const gltfLoader = new GLTFLoader();

export const objectsInit = async () => {
    bunnyModel = (await gltfLoader.loadAsync(bunnyGLTF)).scene;
}