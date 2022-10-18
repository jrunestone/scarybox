importScripts("https://cdn.jsdelivr.net/npm/@tensorflow/tfjs", "https://cdn.jsdelivr.net/npm/@tensorflow-models/facemesh");
tf.setBackend('webgl');

let fmesh = null;
let video = null;

facemesh.load({ detectionConfidence: 0.9, maxFaces: 1 }).then(r => { fmesh = r; });

onmessage = e => {
    video = e.data;
};

work = async _ => {
    if (video && fmesh) {
        var faces = await fmesh.estimateFaces(video);
        postMessage(faces);
    }

    requestAnimationFrame(work);
}

work();