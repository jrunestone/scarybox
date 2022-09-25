import TWEEN from '@tweenjs/tween.js';

const DEVICE_WIDTH = 1016;
const DEVICE_HEIGHT = 455;
const DEBUG = window.location.search.indexOf('debug=1') !== -1;

const video = document.getElementById('video');
const canvas = document.getElementById('facecanvas');
let fmesh = null;
let facepred = null;
let ctx = null;

const leftPupil = document.getElementById('pupil-left');
const rightPupil = document.getElementById('pupil-right');

const min = { x: 37, y: 41 };
const max = { x: 178, y: 182 };

let position = {...min};

// Face Mesh Demo by Andy Kong
// Base Javascript for setting up a camera-streaming HTML webpage.

const setupCamera = async () => {
    // Find the <video> element in the webpage, 
    // then use the mediaDevices API to request a camera from the user
    const stream = await navigator.mediaDevices.getUserMedia({
        'audio': false,
        'video': {
            facingMode: 'user',
            width: { ideal: DEVICE_WIDTH },
            height: { ideal: DEVICE_HEIGHT },
        },
    });
    // Assign our camera to the HTML's video element
    video.srcObject = stream;

    return new Promise((resolve) => {
        video.onloadedmetadata = () => {
            resolve(video);
        };
    });
};

const newTarget = () => {
    const newX = min.x + Math.random() * (max.x - min.x);
    const newY = min.y + Math.random() * (max.y - min.y);
    return { x: newX, y: newY };
};

const render = async (time) => {
    facepred = await fmesh.estimateFaces(video);

    if (DEBUG) {
        ctx.drawImage(video, 0, 0);

        if (facepred && facepred.length) {
            drawFace(facepred[0]);
        }
    }

    requestAnimationFrame(render);
    TWEEN.update(time);
};

const drawFace = (face) => {
    const bb = face.boundingBox;

    ctx.fillStyle = 'cyan';
    ctx.strokeStyle = 'cyan';
    
    face.scaledMesh.forEach(pt => {
        ctx.beginPath();
        ctx.ellipse(pt[0], pt[1], 3, 3, 0, 0, 2*Math.PI)
        ctx.fill();
    });

    ctx.beginPath();
    ctx.rect(bb.topLeft[0], bb.topLeft[1], bb.bottomRight[0] - bb.topLeft[0], bb.bottomRight[1] - bb.topLeft[1]);
    ctx.stroke();

    ctx.font = '16px serif';
    const cx = bb.topLeft[0] + ((bb.bottomRight[0] - bb.topLeft[0]) / 2);
    const cy = bb.topLeft[1] + ((bb.bottomRight[1] - bb.topLeft[1]) / 2);
    ctx.fillText(`${cx}, ${cy}`, 10, 20);
};

const lookAt = () => {
    return facepred && facepred.length ? lookAtFace : lookAtRandom;
};

const lookAtRandom = () => {
    new TWEEN.Tween(position)
        .to(newTarget(), 500 + Math.random() * 2000)
        .delay(Math.random() * 1000)
        .easing(TWEEN.Easing.Sinusoidal.InOut)
        .onUpdate(() => {
            leftPupil.style.transform = `translate(${position.x}px, ${position.y}px)`;
            rightPupil.style.transform = `translate(${position.x}px, ${position.y}px)`;
        })
        .onComplete(lookAt())
        .start();
};

const lookAtFace = () => {
    if (!facepred || !facepred.length) {
        lookAt()();
        return;
    }

    const bb = facepred[0].boundingBox;
    const cx = bb.topLeft[0] + ((bb.bottomRight[0] - bb.topLeft[0]) / 2);
    const cy = bb.topLeft[1] + ((bb.bottomRight[1] - bb.topLeft[1]) / 2);

    // screen = 1016,455
    // min, max = 37,41 - 178,182
    // cx, cy = 508, 227
    // x = 37 + 508/1016 * (178-37) = 107

    const faceTarget = {
        x: min.x + (1.0 - cx / DEVICE_WIDTH) * (max.x - min.x),
        y: min.y + cy / DEVICE_HEIGHT * (max.y - min.y)
    };

    new TWEEN.Tween(position)
        .to(faceTarget, 100 + Math.random() * 300)
        // .easing(TWEEN.Easing.Sinusoidal.InOut)
        .onUpdate(() => {
            leftPupil.style.transform = `translate(${position.x}px, ${position.y}px)`;
            rightPupil.style.transform = `translate(${position.x}px, ${position.y}px)`;
        })
        .onComplete(lookAt())
        .start();
};

(async () => {
    await setupCamera();
    video.play();

    if (DEBUG) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx = canvas.getContext('2d');
        canvas.style.display = 'block';
    }

    fmesh = await facemesh.load({ detectionConfidence: 0.9, maxFaces: 1 });

    lookAtRandom();
    requestAnimationFrame(render);
})();