import TWEEN from '@tweenjs/tween.js';

const DEVICE_WIDTH = 1016;
const DEVICE_HEIGHT = 455;
const DEBUG = window.location.search.indexOf('debug=1') !== -1;
let FACE = true;
let FULLSCREEN = false;

const video = document.getElementById('video');
const canvas = document.getElementById('facecanvas');

let facepred = null;
let dbgCtx = null;
let canv = document.createElement('canvas');
canv.width = DEVICE_WIDTH;
canv.height = DEVICE_HEIGHT;
let ctx = canv.getContext('2d');

const leftPupil = document.getElementById('pupil-left');
const rightPupil = document.getElementById('pupil-right');
const upperLids = document.getElementsByClassName('lid-upper');
const lowerLids = document.getElementsByClassName('lid-lower');

const min = { x: 37, y: 41 };
const max = { x: 178, y: 182 };

let position = {...min};

document.getElementById('eye-right').onclick = () => { FACE = !FACE; }
document.getElementById('eye-left').onclick = () => { FULLSCREEN = !FULLSCREEN; FULLSCREEN ? document.documentElement.webkitRequestFullscreen() : document.webkitExitFullscreen(); }

const worker = new Worker(new URL('./worker.js', import.meta.url), { type: 'module' });

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
    ctx.drawImage(video, 0, 0);

    if (FACE) {
        worker.postMessage(ctx.getImageData(0, 0, DEVICE_WIDTH, DEVICE_HEIGHT));
    }

    if (DEBUG) {
        dbgCtx.drawImage(video, 0, 0);

        if (facepred && facepred.length) {
            drawFace(facepred[0]);
        }
    }

    TWEEN.update(time);
    requestAnimationFrame(render);
};

const drawFace = (face) => {
    const bb = face.boundingBox;

    dbgCtx.fillStyle = 'cyan';
    dbgCtx.strokeStyle = 'cyan';
    
    face.scaledMesh.forEach(pt => {
        dbgCtx.beginPath();
        dbgCtx.ellipse(pt[0], pt[1], 3, 3, 0, 0, 2*Math.PI)
        dbgCtx.fill();
    });

    dbgCtx.beginPath();
    dbgCtx.rect(bb.topLeft[0], bb.topLeft[1], bb.bottomRight[0] - bb.topLeft[0], bb.bottomRight[1] - bb.topLeft[1]);
    dbgCtx.stroke();

    dbgCtx.font = '16px serif';
    const cx = bb.topLeft[0] + ((bb.bottomRight[0] - bb.topLeft[0]) / 2);
    const cy = bb.topLeft[1] + ((bb.bottomRight[1] - bb.topLeft[1]) / 2);
    dbgCtx.fillText(`${cx}, ${cy}`, 10, 20);
};

const lookAt = () => {
    return FACE && facepred && facepred.length ? lookAtFace : lookAtRandom;
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

const blink = () => {
    let lidPos = { x: 0, y: 0 };
    const lidTarget = { x: 0, y: 170 };

    new TWEEN.Tween(lidPos)
        .to(lidTarget, 400)
        .easing(TWEEN.Easing.Exponential.In)
        .onUpdate(() => {
            for (const lid of upperLids) {
                lid.style.transform = `translate(0px, ${lidPos.y}px)`
            }
            
            for (const lid of lowerLids) {
                lid.style.transform = `translate(0px, ${-lidPos.y}px)`
            }
        })
        .repeat(1)
        .yoyo(true)
        .onComplete(() => { setTimeout(blink, 1000 + Math.random() * 7000); })
        .start();
};

(async () => {
    await setupCamera();

    video.play();

    if (DEBUG) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        dbgCtx = canvas.getContext('2d');
        canvas.style.display = 'block';
    }

    lookAtRandom();
    blink();
    
    requestAnimationFrame(render);
})();

worker.onmessage = data => {
    facepred = data.data;
};