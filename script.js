// 請替換成你的 Google Apps Script 部署網址
const API_URL = "https://script.google.com/macros/s/AKfycbx8EWYzXJpbwCWp7ZmLo7KQE4xFJUZK0wqS0mGIBa4JQSn0rD9l2G0dwrWirpQ_TfnP/exec"; 

const STORAGE_KEY = "CLASS_DRAWN_STATUS_V1"; // 本地暫存金鑰

let rawData = {};          // 儲存後端傳回的完整 JSON 資料
let currentStudents = [];  // 當前班級/性別篩選條件下的學生清單
let classDrawnMap = loadLocalDrawnMap(); // 開啟時先從暫存讀取已抽紀錄
let availableStudents = [];// 剩餘可抽學生清單
let isDrawing = false;

document.addEventListener("DOMContentLoaded", () => {
    fetchAllData();
});

// 讀取本地暫存資料
function loadLocalDrawnMap() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch (e) {
        console.error("無法讀取 LocalStorage 暫存", e);
        return {};
    }
}

// 儲存本地暫存資料
function saveLocalDrawnMap() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(classDrawnMap));
    } catch (e) {
        console.error("無法寫入 LocalStorage 暫存", e);
    }
}

// 1. 一次性抓取所有班級與學生資料
async function fetchAllData() {
    const select = document.getElementById("classSelect");
    
    // 如果已有選項（重新載入時），不重複清空
    if (!select.value) {
        select.innerHTML = '<option value="">載入中...</option>';
    }

    try {
        const res = await fetch(API_URL);
        rawData = await res.json();
        
        const currentSelected = select.value;
        select.innerHTML = "";
        const classes = Object.keys(rawData);

        if (classes.length > 0) {
            classes.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c;
                opt.textContent = c + " 班";
                select.appendChild(opt);
            });

            // 保持原本選取的班級
            if (currentSelected && classes.includes(currentSelected)) {
                select.value = currentSelected;
            }

            loadStudentsData();
        } else {
            select.innerHTML = '<option value="">無班級資料</option>';
        }
    } catch (err) {
        alert("資料載入失敗，請確認 API 網址是否正確！");
        console.error(err);
    }
}

// 2. 根據選取的班級與性別，整理出學生名單與獨立記錄
function loadStudentsData() {
    const className = document.getElementById("classSelect").value;
    const gender = document.getElementById("genderSelect").value;
    
    if (!className || !rawData[className]) return;

    if (!classDrawnMap[className]) {
        classDrawnMap[className] = [];
    }

    const classObj = rawData[className];
    currentStudents = [];

    Object.keys(classObj).forEach(seat => {
        const student = classObj[seat];
        if (gender === "ALL" || student.gender === gender) {
            currentStudents.push({
                seat: String(seat),
                name: student.name,
                gender: student.gender,
                photo: student.photo,
                className: className
            });
        }
    });

    currentStudents.sort((a, b) => Number(a.seat) - Number(b.seat));

    const currentClassDrawn = classDrawnMap[className];
    availableStudents = currentStudents.filter(s => !currentClassDrawn.includes(String(s.seat)));

    const statusInfo = document.getElementById("statusInfo");
    statusInfo.innerText = `剩餘可抽：${availableStudents.length} 人`;

    if (availableStudents.length > 0) {
        document.getElementById("drawBtn").disabled = false;
    } else {
        document.getElementById("drawBtn").disabled = true;
        statusInfo.innerText += " (本輪已抽完，請點選重置輪次)";
    }
}

function resetDisplay() {
    document.getElementById("studentsContainer").innerHTML = "";
    loadStudentsData();
}

// 3. 開始抽籤動畫
function startDraw() {
    if (isDrawing || availableStudents.length === 0) return;

    const countSelectVal = parseInt(document.getElementById("countSelect").value);
    const drawCount = Math.min(countSelectVal, availableStudents.length);

    if (drawCount <= 0) return;

    isDrawing = true;
    document.getElementById("drawBtn").disabled = true;
    const container = document.getElementById("studentsContainer");
    container.innerHTML = "";

    const cardElements = [];
    for (let i = 0; i < drawCount; i++) {
        const card = document.createElement("div");
        card.className = "student-card animation-rolling";
        card.innerHTML = `
            <div class="photo-box"><img src="" style="display:none;" /></div>
            <div class="info-box">
                <span class="seat">--</span>
                <span class="name">抽籤中...</span>
            </div>
        `;
        container.appendChild(card);
        cardElements.push(card);
    }

    let counter = 0;
    const interval = setInterval(() => {
        cardElements.forEach(card => {
            const randomStudent = availableStudents[Math.floor(Math.random() * availableStudents.length)];
            card.querySelector(".seat").innerText = randomStudent.seat + " 號";
            card.querySelector(".name").innerText = randomStudent.name;
        });

        counter++;
        if (counter > 20) {
            clearInterval(interval);
            finalizeDraw(drawCount, cardElements);
        }
    }, 100);
}

// 4. 決定最終中籤者並寫入紀錄（寫入記憶體 + 寫入暫存）
function finalizeDraw(drawCount, cardElements) {
    const className = document.getElementById("classSelect").value;
    const shuffled = [...availableStudents].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, drawCount);

    selected.forEach((student, idx) => {
        const card = cardElements[idx];
        card.classList.remove("animation-rolling");
        card.classList.add("winner");

        const img = card.querySelector("img");
        if (student.photo) {
            img.src = student.photo;
            img.style.display = "block";
        }
        card.querySelector(".seat").innerText = student.seat + " 號";
        card.querySelector(".name").innerText = student.name;

        classDrawnMap[className].push(String(student.seat));
    });

    // 儲存到瀏覽器硬碟暫存
    saveLocalDrawnMap();

    isDrawing = false;
    loadStudentsData();
}

// 5. 重置輪次（同步清除暫存）
function manualResetDrawn() {
    const className = document.getElementById("classSelect").value;
    if (!className) return;

    if (confirm(`確定要重置 ${className} 班的抽籤輪次嗎？`)) {
        classDrawnMap[className] = [];
        saveLocalDrawnMap(); // 更新暫存
        document.getElementById("studentsContainer").innerHTML = "";
        loadStudentsData();
    }
}