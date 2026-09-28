let ctx = null;
let active = false;
let stepIndex = 0;
let nextHitTime = 0.0;
let loopID = null;

let stepMatrix = [, // Kick Row
    [0, 0, 0, 0]  // Hi-Hat Row
];

function initEngine() {
    if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        document.getElementById('master-engine-btn').innerText = "🔊 Online";
        document.getElementById('master-engine-btn').style.background = "#2e7d32";
    }
}

function synthesizeSound(type, timestamp) {
    let oscillator = ctx.createOscillator();
    let dynamicGain = ctx.createGain();
    oscillator.connect(dynamicGain);
    dynamicGain.connect(ctx.destination);

    if (type === 'kick') {
        oscillator.frequency.setValueAtTime(130, timestamp);
        oscillator.frequency.exponentialRampToValueAtTime(0.01, timestamp + 0.12);
        dynamicGain.gain.setValueAtTime(1.0, timestamp);
        dynamicGain.gain.exponentialRampToValueAtTime(0.01, timestamp + 0.14);
        oscillator.start(timestamp);
        oscillator.stop(timestamp + 0.14);
    } else if (type === 'hihat') {
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(8000, timestamp);
        dynamicGain.gain.setValueAtTime(0.3, timestamp);
        dynamicGain.gain.exponentialRampToValueAtTime(0.01, timestamp + 0.05);
        oscillator.start(timestamp);
        oscillator.stop(timestamp + 0.05);
    }
}

function processPlayback() {
    while (nextHitTime < ctx.currentTime + 0.1) {
        if (stepMatrix[0][stepIndex] === 1) synthesizeSound('kick', nextHitTime);
        if (stepMatrix[1][stepIndex] === 1) synthesizeSound('hihat', nextHitTime);

        let currentIdx = stepIndex;
        window.requestAnimationFrame(() => {
            document.querySelectorAll('.node').forEach(n => n.classList.remove('current-hit'));
            document.querySelectorAll(`[data-index="${currentIdx}"]`).forEach(n => n.classList.add('current-hit'));
        });

        let secondsPerBeat = 60.0 / 125;
        nextHitTime += 0.25 * secondsPerBeat;
        stepIndex = (stepIndex + 1) % 4;
    }
    loopID = setTimeout(processPlayback, 25.0);
}

document.getElementById('master-engine-btn').addEventListener('click', initEngine);

document.getElementById('playback-trigger').addEventListener('click', function() {
    initEngine();
    if (!active) {
        active = true;
        this.innerText = "■ Stop";
        this.classList.add('active-play');
        stepIndex = 0;
        nextHitTime = ctx.currentTime + 0.02;
        processPlayback();
    } else {
        active = false;
        this.innerText = "▶ Play";
        this.classList.remove('active-play');
        clearTimeout(loopID);
    }
});

document.querySelectorAll('.track-lane').forEach((lane, trackIdx) => {
    lane.querySelectorAll('.node').forEach((node, nodeIdx) => {
        node.addEventListener('click', () => {
            if (stepMatrix[trackIdx][nodeIdx] === 0) {
                stepMatrix[trackIdx][nodeIdx] = 1;
                node.classList.add('selected');
            } else {
                stepMatrix[trackIdx][nodeIdx] = 0;
                node.classList.remove('selected');
            }
        });
    });
});
