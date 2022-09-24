import TWEEN from '@tweenjs/tween.js';

const leftPupil = document.getElementById('pupil-left');
const rightPupil = document.getElementById('pupil-right');

const min = { x: 37, y: 41 };
const max = { x: 178, y: 182 };

let position = {...min};

const newTarget = () => {
    const newX = min.x + Math.random() * (max.x - min.x);
    const newY = min.y + Math.random() * (max.y - min.y);
    return { x: newX, y: newY };
};

const render = (time) => {
    requestAnimationFrame(render);
    TWEEN.update(time);
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
        .onComplete(lookAtRandom)
        .start();
};

lookAtRandom();
requestAnimationFrame(render);