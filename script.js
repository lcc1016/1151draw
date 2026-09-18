// 請替換成你的 Google Apps Script 部署網址
const API_URL = "https://script.google.com/macros/s/AKfycbx8EWYzXJpbwCWp7ZmLo7KQE4xFJUZK0wqS0mGIBa4JQSn0rD9l2G0dwrWirpQ_TfnP/exec"; 

let rawData = {};          // 儲存後端傳回的完整 JSON 資料
let currentStudents = [];  // 當前班級/性別篩選條件下的學生清單
let classDrawnMap = {};    // 改用物件紀錄「各班級」已抽中的座號：{ "908": ["1", "3"], "708": ["2"] }
let availableStudents = [];// 剩餘可抽學生清單
let isDrawing = false;

document.addEventListener("DOMContentLoaded", () => {
    fetchAllData();
});

// 1. 一次性抓取所有班級與學生資料
async function fetchAllData() {
    const select = document.getElementById("classSelect");
    select.innerHTML = '<option value="">載入中...</option>';

    try {
        const res = await fetch(API_URL);
        rawData = await res.json();
        
        select.innerHTML = "";
        const classes = Object.keys(rawData);

        if (classes.length > 0) {
            classes.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c;
                opt.textContent = c + " 班";
                select.appendChild(opt);
            });
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

    // 若該班級尚未建立抽驗紀錄，初始化空陣列
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

    // 依座號排序
    currentStudents.sort((a, b) => Number(a.seat) - Number(b.seat));

    // 嚴格比對：只排除「當前班級」已抽過的座號
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

// 切換條件（班級/性別）時清空抽籤展示區並重新計算獨立人數
function resetDisplay() {
    document.getElementById("studentsContainer").innerHTML = "";
    loadStudentsData();
}

// 3. 開始抽籤動畫
// 3. 開始抽籤動畫（已加入剩餘人數不足時自動彈性調整邏輯）
function startDraw() {
    if (isDrawing || availableStudents.length === 0) return;

    const countSelectVal = parseInt(document.getElementById("countSelect").value);
    
    // 強制比對：若設定人數大於剩餘人數，自動以剩餘人數為主
    const drawCount = Math.min(countSelectVal, availableStudents.length);

    if (drawCount <= 0) return;

    isDrawing = true;
    document.getElementById("drawBtn").disabled = true;
    const container = document.getElementById("studentsContainer");
    container.innerHTML = "";

    // 依據「實際可抽出人數 (drawCount)」動態建立對應數量的卡片
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

    // 動態跑號動畫
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
// 4. 決定最終中籤者並寫入該班級專屬的紀錄
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

        // 將中籤者加入「該班級獨立」的已抽紀錄
        classDrawnMap[className].push(String(student.seat));
    });

    isDrawing = false;
    loadStudentsData();
}

// 5. 單獨重置當前班級的抽籤輪次
function manualResetDrawn() {
    const className = document.getElementById("classSelect").value;
    if (!className) return;

    if (confirm(`確定要重置 ${className} 班的抽籤輪次嗎？`)) {
        classDrawnMap[className] = []; // 只清空該班級的已抽紀錄
        document.getElementById("studentsContainer").innerHTML = "";
        loadStudentsData();
    }
}