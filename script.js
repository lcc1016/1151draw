// 請替換成你的 Google Apps Script 部署網址
const API_URL = "https://script.google.com/macros/s/AKfycbx8EWYzXJpbwCWp7ZmLo7KQE4xFJUZK0wqS0mGIBa4JQSn0rD9l2G0dwrWirpQ_TfnP/exec"; 

let rawData = {};          // 儲存後端傳回的完整 JSON 資料
let currentStudents = [];  // 當前篩選條件下的學生清單
let drawnSeats = [];      // 已抽中座號紀錄
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
        const classes = Object.keys(rawData); // 取得所有班級 (例如 ["708"])

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

// 2. 根據選取的班級與性別，整理出學生名單
function loadStudentsData() {
    const className = document.getElementById("classSelect").value;
    const gender = document.getElementById("genderSelect").value;
    
    if (!className || !rawData[className]) return;

    // 將物件 {"1": {name...}, "2": {name...}} 轉成陣列格式
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

    // 篩選未抽過的學生
    availableStudents = currentStudents.filter(s => !drawnSeats.includes(String(s.seat)));

    const statusInfo = document.getElementById("statusInfo");
    statusInfo.innerText = `剩餘可抽：${availableStudents.length} 人`;

    if (availableStudents.length > 0) {
        document.getElementById("drawBtn").disabled = false;
    } else {
        document.getElementById("drawBtn").disabled = true;
        statusInfo.innerText += " (本輪已抽完，請點選重置輪次)";
    }
}

// 切換條件時重新整理畫面
function resetDisplay() {
    document.getElementById("studentsContainer").innerHTML = "";
    loadStudentsData();
}

// 3. 開始抽籤動畫
function startDraw() {
    if (isDrawing || availableStudents.length === 0) return;

    const count = parseInt(document.getElementById("countSelect").value);
    const drawCount = Math.min(count, availableStudents.length);
    
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

// 4. 決定最終中籤者並渲染結果
function finalizeDraw(drawCount, cardElements) {
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

        // 將中籤者加入已抽名單中
        drawnSeats.push(String(student.seat));
    });

    isDrawing = false;
    loadStudentsData();
}

// 5. 重置該班級的抽籤輪次
function manualResetDrawn() {
    const className = document.getElementById("classSelect").value;
    if (!className) return;

    if (confirm(`確定要重置 ${className} 班的抽籤輪次嗎？`)) {
        drawnSeats = [];
        document.getElementById("studentsContainer").innerHTML = "";
        loadStudentsData();
    }
}