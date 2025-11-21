// declaring variables under
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const countdownDisplay = document.getElementById('countdown-display');
const flashDiv = document.getElementById('flash');
const captureBtn = document.getElementById('captureBtn');
const resetBtn = document.getElementById('resetBtn');
const downloadBtn = document.getElementById('downloadBtn');
const dateFooter = document.getElementById('date-footer');
const frameOverlay = document.getElementById('frame-overlay'); 

let currentStep = 0;
const totalSteps = 3;
const slotIds = ['slot-0', 'slot-1', 'slot-2'];
let capturedImages = []; 

// adding theme selector, default - pink
function toggleTheme(theme) {
    const frameOverlay = document.getElementById('frame-overlay');
    if (theme === 'blue') {
        document.body.classList.add('blue-theme');
        frameOverlay.src = 'bluethimi.png'; 
    } else {
        document.body.classList.remove('blue-theme');
        frameOverlay.src = 'pinkthimi.png';
    }
}

// today's date footer (auto-updating)
function getFormattedDate() {
    const date = new Date();
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', month: 'numeric', day: 'numeric' 
    });
}

const todayDate = getFormattedDate();
if(dateFooter) 
    dateFooter.innerText = todayDate;

// camera footage feed
const constraints = { video: { width: { ideal: 1920 }, height: { ideal: 1080 } } };
navigator.mediaDevices.getUserMedia(constraints).then(stream => {
    video.srcObject = stream;
});

// take photo button
captureBtn.addEventListener('click', async () => {
    captureBtn.disabled = true;
    await runCountdown(3);
    takePhoto(currentStep);
    currentStep++;
    if (currentStep < totalSteps) {
        captureBtn.innerText = `📸 Smile! ${currentStep + 1} / ${totalSteps}`;
        captureBtn.disabled = false;
        updateActiveSlot(currentStep);
    } else {
        captureBtn.style.display = 'none';
        resetBtn.style.display = 'inline-block';
        downloadBtn.style.display = 'inline-block';
        updateActiveSlot(-1); 
    }
});

// reset button
resetBtn.addEventListener('click', () => location.reload());

// download button -> download process
downloadBtn.addEventListener('click', async () => {
    if (capturedImages.length === 0) return;
    
    const printCanvas = document.createElement('canvas');
    const ctx = printCanvas.getContext('2d');
    
    // photo strip base 
    printCanvas.width = 1200;
    printCanvas.height = 3150;

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, printCanvas.width, printCanvas.height);
    
    // photo layer
    const xPos = 100; const width = 1000; const height = 750;     
    const yPositions = [280, 1180, 2080]; 

    for (let i = 0; i < capturedImages.length; i++) {
        if (yPositions[i] !== undefined) {
            await drawImageOnCanvas(ctx, capturedImages[i], xPos, yPositions[i], width, height);
        }
    }

    // outer frame layer
    await new Promise((resolve) => {
        const overlayImg = new Image();
        overlayImg.onload = () => {
            ctx.drawImage(overlayImg, 0, 0, printCanvas.width, printCanvas.height);
            resolve();
        };
        overlayImg.onerror = resolve;
        overlayImg.src = frameOverlay.src; 
    });

    // date footer layer -> need to fix to be smaller
    ctx.font = 'bold 50px Courier New'; 
    ctx.textAlign = 'center';
    if (document.body.classList.contains('blue-theme')) {
        ctx.fillStyle = 'rgb(74, 104, 193)'; 
    } else {
        ctx.fillStyle = 'rgb(193, 74, 104)'; 
    }
    
    ctx.fillText(todayDate, 600, 3080); 
    
    // download path
    const link = document.createElement('a');
    link.download = `chacha-photobooth-${todayDate.replace(/\//g, '-')}.png`;
    link.href = printCanvas.toDataURL('image/png', 1.0);
    link.click();
});

// helper functions under
// formatting photos on canvas base
function drawImageOnCanvas(ctx, url, x, y, w, h) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const ratio = Math.max(w / img.width, h / img.height);
            const centerShift_x = (w - img.width * ratio) / 2;
            const centerShift_y = (h - img.height * ratio) / 2;
            ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
            ctx.drawImage(img, 0, 0, img.width, img.height, x + centerShift_x, y + centerShift_y, img.width * ratio, img.height * ratio);
            ctx.restore(); resolve();
        };
        img.onerror = resolve; img.src = url;
    });
}

// counting down after clicking take photo btn
function runCountdown(seconds) {
    return new Promise(resolve => {
        countdownDisplay.style.display = 'block';
        let counter = seconds;
        countdownDisplay.innerText = counter;
        const interval = setInterval(() => {
            counter--;
            if (counter > 0) countdownDisplay.innerText = counter;
            else { clearInterval(interval); countdownDisplay.style.display = 'none'; resolve(); }
        }, 1000);
    });
}

// take photo helper
function takePhoto(index) {
    flashDiv.classList.add('flash-active');
    setTimeout(() => flashDiv.classList.remove('flash-active'), 200);
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.translate(canvas.width, 0); ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
    capturedImages.push(dataUrl);
    const img = document.createElement('img');
    img.src = dataUrl;
    document.getElementById(slotIds[index]).innerHTML = '';
    document.getElementById(slotIds[index]).appendChild(img);
    updateActiveSlot(index);
}

// active slot helper -> helping users know which frame they're taking photos in
function updateActiveSlot(index) {
    slotIds.forEach(id => document.getElementById(id).classList.remove('active-slot'));
    if (index >= 0 && index < totalSteps) {
        document.getElementById(slotIds[index]).classList.add('active-slot');
    }
}