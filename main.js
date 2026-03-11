async function fetchLatestLogs() {
    try {
        const response = await fetch('logs.json');
        const logs = await response.json();

        // --- 1. スキル集計 ---
        const skillCounts = {
            "Pwn": 0, "Rev": 0, "Web": 0, "Crypto": 0, "Forensics": 0, "OSINT": 0, "Hardware": 0,"Misc": 0
        };

        const writeups = logs.filter(log => log.tag === "Writeup");
        const totalWriteups = writeups.length;

                writeups.forEach(log => {
            const cat = log.category || "";
            if (cat.includes("Pwn")) skillCounts["Pwn"]++;
            else if (cat.includes("Rev")) skillCounts["Rev"]++;
            else if (cat.includes("Web")) skillCounts["Web"]++;
            else if (cat.includes("Crypto")) skillCounts["Crypto"]++;
            else if (cat.includes("Forensics")) skillCounts["Forensics"]++;
            else if (cat.includes("OSINT")) skillCounts["OSINT"]++;
            else if (cat.includes("Hardware")) skillCounts["Hardware"]++; // ここ
            else skillCounts["Misc"]++;
        });


        const skillInventory = document.getElementById('skill-inventory');
        if (skillInventory) {
            skillInventory.innerHTML = Object.keys(skillCounts).map(genre => {
                const count = skillCounts[genre];
                const percentage = totalWriteups > 0 ? (count / totalWriteups) * 100 : 0;
                const barLength = totalWriteups > 0 ? Math.round((count / totalWriteups) * 10) : 0;
                
                const hashes = "#".repeat(barLength);
                const dashes = "-".repeat(10 - barLength);
                
                const colors = { 
                    "Pwn": "var(--tag-pwn)", "Rev": "var(--tag-writeup)", 
                    "Web": "var(--tag-web)", "Crypto": "var(--cyan)", 
                    "Forensics": "#ff9e64",
                    "OSINT": "var(--tag-news)", "Misc": "var(--comment)","Hardware": "#e67e22" 
                };
                const color = colors[genre] || "var(--text-color)";

                return `
                    <div class="skill-item">
                        <span class="skill-label">${genre}</span>
                        <span class="skill-bar">[<span style="color: ${color};">${hashes}</span>${dashes}] ${Math.round(percentage)}%</span>
                    </div>
                `;
            }).join('');
        }
        
        // --- 2. Activity Log (最新3件) ---
        const logResponse = document.getElementById('log-response');
        const latestLogs = logs.slice(0, 3);
        let logHtml = '';

        latestLogs.forEach(log => {
            const tagClass = `tag-${log.tag.toLowerCase()}`;
            const hasLink = log.link && log.link.trim() !== "";
            
            let actionButton = "";
            if (log.tag.toLowerCase() === "writeup" && hasLink) {
                actionButton = `<a href="${log.link}" target="_blank" style="color: var(--accent-color); font-size: 0.8em; margin-left: 10px; font-weight: bold;">[ READ_WRITEUP ] ↗</a>`;
            }

            logHtml += `
                <span style="color: var(--comment);">[${log.date.split(' ')[0]}]</span> 
                <span class="tag ${tagClass}">${log.tag}</span> 
                <span style="color: var(--text-color);">${log.title}</span> 
                ${actionButton}<br>
            `;
        });

        logHtml += `
            <div style="margin-top: 15px;">
                <a href="logs.html" style="color: var(--cyan); font-weight: bold;">
                    >> [ VIEW_FULL_LOG_FILE ]
                </a>
            </div>
        `;
        logResponse.innerHTML = logHtml;

        // --- 3. Achievements ---
        const achievementBody = document.getElementById('achievement-table-body');
        const results = logs.filter(log => log.tag === "Result");
        
        achievementBody.innerHTML = results.map(res => `
            <tr>
                <td>${res.date.split(' ')[0]}</td>
                <td>${res.title}</td>
                <td style="color:var(--tag-writeup)">${res.details ? res.details.replace('# ', '') : '-'}</td>
            </tr>
        `).join('');

    } catch (e) {
        console.error("JSON load error:", e);
    }
}

// ターミナルのタイピング演出
function typeWriter(element, text, speed, callback) {
    let i = 0;
    element.innerHTML = '';
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        } else if (callback) {
            callback();
        }
    }
    type();
}

// セクション切り替えロジック
function showSection(sectionId, isInitial = false) {
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick')?.includes(`'${sectionId}'`)) {
            item.classList.add('active');
        }
    });

    document.querySelectorAll('.section').forEach(s => {
        s.classList.remove('active');
        s.style.display = "none";
    });
    
    const bottomPrompt = document.getElementById('bottom-prompt');
    if (bottomPrompt) {
        bottomPrompt.style.display = "none";
        bottomPrompt.style.opacity = "0";
    }

    let target = document.getElementById(sectionId);
    let commandToType = "";

    if (target) {
        const commandElem = target.querySelector('.command');
        commandToType = commandElem.innerText.trim();
    } else {
        target = document.getElementById('error-section');
        commandToType = sectionId;
        document.getElementById('error-command').innerText = '';
    }

    target.style.display = "block";
    target.classList.add('active');

    const promptInner = target.querySelector('.prompt');
    const commandElem = target.querySelector('.command');
    const responseElem = target.querySelector('.response');

    promptInner.style.opacity = '0';
    commandElem.innerText = '';
    responseElem.style.display = 'none';
    responseElem.style.opacity = '0';

    setTimeout(() => {
        promptInner.style.transition = "opacity 0.2s ease";
        promptInner.style.opacity = "1";

        setTimeout(() => {
            typeWriter(commandElem, commandToType, 50, () => {
                responseElem.style.display = 'block';
                setTimeout(() => {
                    responseElem.style.opacity = "1";
                    setTimeout(() => {
                        if (bottomPrompt) {
                            bottomPrompt.style.display = "flex";
                            setTimeout(() => {
                                bottomPrompt.style.transition = "opacity 0.3s ease";
                                bottomPrompt.style.opacity = "1";
                            }, 10);
                        }
                    }, 300);
                }, 10);
            });
        }, 300);
    }, 100);

    document.getElementById('terminal-screen').scrollTop = 0;
}

// 時刻更新
function updateTime() {
    const now = new Date();
    const options = { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
    const formatter = new Intl.DateTimeFormat('ja-JP', options);
    const parts = formatter.formatToParts(now);
    const timeStr = `JST: ${parts[0].value}-${parts[2].value}-${parts[4].value} ${parts[6].value}:${parts[8].value}:${parts[10].value}`;
    document.getElementById('jst-time').innerText = timeStr;
}

// 初期化
window.onload = () => {
    updateTime();
    setInterval(updateTime, 1000);
    fetchLatestLogs(); 
    showSection('whoami', true);
};

// コマンド入力
const hiddenInput = document.getElementById('hidden-input');
const inputDisplay = document.getElementById('input-display');
document.addEventListener('click', () => hiddenInput.focus());
hiddenInput.addEventListener('input', (e) => inputDisplay.innerText = e.target.value);
hiddenInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const cmd = hiddenInput.value.trim();
        if (cmd !== "") {
            hiddenInput.value = "";
            inputDisplay.innerText = "";
            const targetId = getSectionIdByCommand(cmd);
            showSection(targetId || cmd);
        }
    }
});

function getSectionIdByCommand(cmd) {
    const mapping = { 
        'whoami': 'whoami', 
        'ls': 'achievements', 
        'ls -l': 'achievements', 
        'tail': 'timeline', 
        'activity.log': 'timeline', 
        'contact': 'contact', 
        './contact.sh': 'contact' 
    };
    return mapping[cmd.toLowerCase()];
}
