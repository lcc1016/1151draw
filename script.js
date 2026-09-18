const GAS_API_URL = "https://script.google.com/macros/s/AKfycbx8EWYzXJpbwCWp7ZmLo7KQE4xFJUZK0wqS0mGIBa4JQSn0rD9l2G0dwrWirpQ_TfnP/exec";[cite: 1]
const defaultAvatar = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='%2395a5a6'><path d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/></svg>";[cite: 1]

// 🎵 MP3 抽籤音效 Base64 字串
const BINGO_SOUND_URL = "data:audio/mpeg;base64,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`";[cite: 1]

let students = [];
let drawnSeats = [];

window.onload = function() {
    loadClasses();
};

function loadClasses() {
    const classSelect = document.getElementById("classSelect");
    classSelect.innerHTML = '<option value="">載入中...</option>';

    fetch(`${GAS_API_URL}?action=getClasses`)
        .then(res => res.json())
        .then(data => {
            classSelect.innerHTML = '';
            if (data.status === "success" && data.classes.length > 0) {
                data.classes.forEach(c => {
                    let opt = document.createElement("option");
                    opt.value = c;
                    opt.textContent = c;
                    classSelect.appendChild(opt);
                });
                resetDisplay();
            } else {
                classSelect.innerHTML = '<option value="">無班級資料</option>';
            }
        })
        .catch(err => {
            console.error("載入班級失敗", err);
            classSelect.innerHTML = '<option value="">載入失敗</option>';
        });
}

function resetDisplay() {
    const className = document.getElementById("classSelect").value;
    const gender = document.getElementById("genderSelect").value;
    const count = parseInt(document.getElementById("countSelect").value);
    const container = document.getElementById("studentsContainer");
    const drawBtn = document.getElementById("drawBtn");
    const statusInfo = document.getElementById("statusInfo");

    if (!className) return;

    drawBtn.disabled = true;
    statusInfo.textContent = "資料讀取中...";

    container.innerHTML = "";
    for (let i = 0; i < count; i++) {
        container.innerHTML += createStudentCardHtml("?", "❓", defaultAvatar);
    }

    fetch(`${GAS_API_URL}?action=getStudents&class=${encodeURIComponent(className)}&gender=${encodeURIComponent(gender)}`)
        .then(res => res.json())
        .then(data => {
            if (data.status === "success") {
                students = data.students;
                drawnSeats = data.drawnSeats || [];
                updateStatusInfo();
            }
        })
        .catch(err => {
            console.error(err);
            statusInfo.textContent = "讀取資料失敗";
        });
}

function updateStatusInfo() {
    const drawBtn = document.getElementById("drawBtn");
    const statusInfo = document.getElementById("statusInfo");
    
    const availableStudents = students.filter(s => !drawnSeats.includes(s.seat));
    statusInfo.textContent = `剩餘可抽：${availableStudents.length} / ${students.length} 人`;

    if (availableStudents.length === 0) {
        drawBtn.disabled = true;
        if (students.length > 0) {
            statusInfo.textContent += " (全班已抽完，請點選重置輪次)";
        }
    } else {
        drawBtn.disabled = false;
    }
}

function createStudentCardHtml(seat, name, photoUrl) {
    const imgSrc = (photoUrl && photoUrl.trim() !== "") ? photoUrl : defaultAvatar;
    return `
        <div class="student-card">
            <div class="seat-number">${seat === '?' ? '?' : seat + ' 號'}</div>
            <div class="avatar-container">
                <img src="${imgSrc}" onerror="this.src='${defaultAvatar}'">
            </div>
            <div class="student-name">${name}</div>
        </div>
    `;
}

function playBingoSound() {
    try {
        const audio = new Audio(BINGO_SOUND_URL);
        audio.play().catch(e => console.log("音效播放被瀏覽器阻擋:", e));
    } catch(e) {
        console.error("音效錯誤", e);
    }
}

function startDraw() {
    const drawBtn = document.getElementById("drawBtn");
    const count = parseInt(document.getElementById("countSelect").value);
    const availableStudents = students.filter(s => !drawnSeats.includes(s.seat));

    if (availableStudents.length === 0) return;

    drawBtn.disabled = true;

    const actualCount = Math.min(count, availableStudents.length);
    let tempAvailable = [...availableStudents];
    let selectedStudents = [];

    for (let i = 0; i < actualCount; i++) {
        const randomIndex = Math.floor(Math.random() * tempAvailable.length);
        selectedStudents.push(tempAvailable[randomIndex]);
        tempAvailable.splice(randomIndex, 1);
    }

    let counter = 0;
    const maxCycles = 20; 
    const interval = setInterval(() => {
        counter++;
        let randomDisplay = [];
        for (let i = 0; i < actualCount; i++) {
            const randIdx = Math.floor(Math.random() * students.length);
            randomDisplay.push(students[randIdx]);
        }
        
        renderCards(randomDisplay);

        if (counter >= maxCycles) {
            clearInterval(interval);
            renderCards(selectedStudents);
            playBingoSound();

            const newDrawnSeats = selectedStudents.map(s => s.seat);
            drawnSeats.push(...newDrawnSeats);

            saveDrawnState(selectedStudents[0].className, newDrawnSeats);
            updateStatusInfo();
        }
    }, 80);
}

function renderCards(studentList) {
    const container = document.getElementById("studentsContainer");
    container.innerHTML = "";
    studentList.forEach(s => {
        container.innerHTML += createStudentCardHtml(s.seat, s.name, s.photo);
    });
}

function saveDrawnState(className, newlyDrawnSeats) {
    fetch(GAS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-request" },
        body: JSON.stringify({
            action: "markDrawn",
            className: className,
            seats: newlyDrawnSeats
        })
    }).catch(err => console.error("紀錄抽籤狀態失敗:", err));
}

function manualResetDrawn() {
    const className = document.getElementById("classSelect").value;
    if (!className) return;

    if (confirm(`確定要重置【${className}】的抽籤輪次嗎？（重置後該班所有人皆可重新被抽中）`)) {
        fetch(GAS_API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-request" },
            body: JSON.stringify({
                action: "resetDrawn",
                className: className
            })
        })
        .then(res => res.json())
        .then(data => {
            if (data.status === "success") {
                alert("已成功重置輪次！");
                resetDisplay();
            }
        })
        .catch(err => alert("重置失敗，請稍後再試"));
    }
}