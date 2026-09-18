// 請替換成你部署後的 GAS Web App 網址
const API_URL = "https://script.google.com/macros/s/AKfycbx8EWYzXJpbwCWp7ZmLo7KQE4xFJUZK0wqS0mGIBa4JQSn0rD9l2G0dwrWirpQ_TfnP/exec"; 

let currentStudents = [];
let drawnSeats = [];
let availableStudents = [];
let isDrawing = false;

// 頁面載入完成後初始化班級選單
document.addEventListener("DOMContentLoaded", () => {
    fetchClasses();
});

// 1. 載入班級選單
async function fetchClasses() {
    try {
        const res = await fetch(`${API_URL}?action=getClasses`);
        const data = await res.json();
        
        const select = document.getElementById("classSelect");
        select.innerHTML = "";

        if (data.status === "success" && data.classes.length > 0) {
            data.classes.forEach(c => {
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
        alert("載入班級失敗，請確認 API 網址或網路狀況");
        console.error(err);
    }
}

// 2. 載入學生資料與已抽歷史
async function loadStudentsData() {
    const className = document.getElementById("classSelect").value;
    const gender = document.getElementById("genderSelect").value;
    
    if (!className) return;

    document.getElementById("drawBtn").disabled = true;
    document.getElementById("statusInfo").innerText = "讀取資料中...";

    try {
        const res = await fetch(`${API_URL}?action=getStudents&class=${encodeURIComponent(className)}&gender=${gender}`);
        const data = await res.json();

        if (data.status === "success") {
            currentStudents = data.students;
            drawnSeats = data.drawnSeats.map(String);

            // 過濾出尚未抽中的學生
            availableStudents = currentStudents.filter(s => !drawnSeats.includes(String(s.seat)));

            document.getElementById("statusInfo").innerText = `剩餘可抽：${availableStudents.length} 人`;
            
            if (availableStudents.length > 0) {
                document.getElementById("drawBtn").disabled = false;
            } else {
                document.getElementById("statusInfo").innerText += " (本輪已抽完，請點選重置輪次)";
            }
        }
    } catch (err) {
        console.error("載入學生失敗", err);
    }
}

// 下拉選單切換時清空畫面並重載
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

    // 建立卡片 placeholder
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

    // 隨機動態跑號動畫
    let counter = 0;
    const interval = setInterval(() => {
        cardElements.forEach(card => {
            const randomStudent = availableStudents[Math.floor(Math.random() * availableStudents.length)];
            card.querySelector(".seat").innerText = randomStudent.seat + "號";
            card.querySelector(".name").innerText = randomStudent.name;
        });

        counter++;
        if (counter > 20) { // 跑號約 2 秒
            clearInterval(interval);
            finalizeDraw(drawCount, cardElements);
        }
    }, 100);
}

// 4. 決定最終結果並傳回後端儲存
async function finalizeDraw(drawCount, cardElements) {
    // 洗牌抽取的學生
    const shuffled = [...availableStudents].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, drawCount);
    const selectedSeats = selected.map(s => String(s.seat));

    // 渲染最終卡片資料
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
    });

    const className = document.getElementById("classSelect").value;

    // 將抽中名單寫回 Google Apps Script
    try {
        await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
                action: "markDrawn",
                className: className,
                seats: selectedSeats
            })
        });
    } catch (err) {
        console.error("儲存抽籤結果失敗", err);
    }

    isDrawing = false;
    loadStudentsData(); // 更新剩餘人數
}

// 5. 重置該班級的抽籤輪次
async function manualResetDrawn() {
    const className = document.getElementById("classSelect").value;
    if (!className) return;

    if (confirm(`確定要重置 ${className} 班的抽籤輪次嗎？`)) {
        document.getElementById("statusInfo").innerText = "重置中...";
        try {
            await fetch(API_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify({
                    action: "resetDrawn",
                    className: className
                })
            });
            document.getElementById("studentsContainer").innerHTML = "";
            loadStudentsData();
        } catch (err) {
            alert("重置失敗");
        }
    }
}