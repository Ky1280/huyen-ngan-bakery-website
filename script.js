/* ===== PRELOADER ===== */
window.addEventListener('load', () => {
    const loader = document.getElementById('loader');
    if (loader) {
        setTimeout(() => {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, 600);
        }, 1500);
    }
});

/* ===== NAVBAR SCROLL ===== */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    if (navbar) {
        navbar.classList.toggle('scrolled', window.scrollY > 80);
    }
});

/* ===== HERO SLIDESHOW ===== */
const slides = document.querySelectorAll('.hero-slide');
let currentSlideIndex = 0;

function nextSlide() {
    if (slides.length > 0) {
        slides[currentSlideIndex].classList.remove('active');
        currentSlideIndex = (currentSlideIndex + 1) % slides.length;
        slides[currentSlideIndex].classList.add('active');
    }
}
if (slides.length > 0) setInterval(nextSlide, 5000);

/* ===== SCROLL REVEAL ===== */
const revealElements = document.querySelectorAll('.reveal');
const revealOnScroll = () => {
    revealElements.forEach(el => {
        const elementTop = el.getBoundingClientRect().top;
        if (elementTop < window.innerHeight - 100) {
            el.classList.add('active');
        }
    });
};
window.addEventListener('scroll', revealOnScroll);
revealOnScroll();

/* ===== MENU FILTERING ===== */
const tabBtns = document.querySelectorAll('.tab-btn');
const menuCards = document.querySelectorAll('.menu-card');

tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.dataset.filter;
        menuCards.forEach(card => {
            if (filter === 'all' || card.dataset.category === filter) {
                card.style.display = 'block';
                setTimeout(() => { card.style.opacity = '1'; card.style.transform = 'translateY(0)'; }, 50);
            } else {
                card.style.display = 'none';
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
            }
        });
    });
});

/* ============================================================ */
/* ===== HYBRID CHATBOT — HUYEN NGAN BAKERY                ==== */
/* ===== Mode 1: Rule-based 5-Branch (Quick Menu)          ==== */
/* ===== Mode 2: Gemini AI Free-chat                       ==== */
/* ============================================================ */

const chatFab = document.getElementById('chatFab');
const chatWindow = document.getElementById('chatWindow');
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');
const quickRepliesEl = document.getElementById('quickReplies');

let chatOpen = false;
let chatHistory = [];
let aiConversation = [];

// ============================================================
// SYSTEM CONFIG
// ============================================================
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw0aaaLaeE8uNjI-QsaJtekJIVakrQWYoT4BVz-jnPCxOFGvErKZGh4Y1VoVd9poFYDMA/exec';
const AI_CHAT_SESSION_ID = 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

// ===== GEMINI AI CONFIG =====
const GEMINI_API_KEY = 'AIzaSyChILvywGFvfx9zFf1SFelEbPoXF1Gbjdc';
const GEMINI_MODEL = 'gemini-2.0-flash';
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

const AI_SYSTEM_PROMPT = `Ban la tro ly AI cua Huyen Ngan Bakery — tiem banh uy tin tu nam 1992.

THONG TIN TIEM BANH:
- Triet ly: "Khach hang la an nhan"
- San pham: Banh kem sinh nhat (be trai/gai, nguoi lon), banh mi dinh duong, banh trung thu, cookies, do uong
- Gia banh kem tu 350.000d, banh mi tu 25.000d, cookies tu 120.000d

HE THONG 5 CUA HANG:
- CS1: 17-19 Dinh Cong Trang, P. Ba Dinh, TP. Thanh Hoa — DT: 0237 3752 666
- CS2: Vincom Shophouse PG3-17, Le Hoan, TP. Thanh Hoa — DT: 0237 3279 666
- CS3: 62 Quang Trung, TK6, TX. Nghi Son — DT: 0237 3579 666
- CS4: 236 Ngo Quyen, P. Trung Son, TP. Sam Son — DT: 0237 3818 666
- CS5: 279 Le Lai, P. Dong Son, TP. Thanh Hoa — DT: 0835 172 279
- Hotline tong: 0917 551 111
- Zalo: zalo.me/0917551111

GIONG DIEU:
- Xung "em", goi khach "Anh/Chi" hoac "An nhan"
- Than thien, nhiet tinh, chuyen nghiep
- Tra loi ngan gon (toi da 3-4 cau), de hieu
- Luon goi y khach de lai SDT hoac nhan Zalo de duoc tu van chi tiet

QUY TAC DAC BIET VE TRICH XUAT DU LIEU:
Trong qua trinh tro chuyen, neu ban phat hien nguoi dung cung cap Ten, So dien thoai hoac Email, ban HAY VUA tra loi ho binh thuong, VUA chen them mot doan ma JSON vao cuoi cung cua cau tra loi theo dung dinh dang sau:
||LEAD_DATA: {"name": "...", "phone": "...", "email": "..."}||
Neu thong tin nao chua co, hay de null.
TUYET DOI KHONG giai thich hay de cap den doan ma nay cho nguoi dung.`;

// ============================================================
// STATE MANAGEMENT
// ============================================================
let chatState = {
    branch: null,
    step: 0,
    data: {},
    isHandedOver: false,
    mode: 'menu'
};

// ============================================================
// 5-BRANCH CONVERSATION CONFIG
// ============================================================
const branches = {
    birthday: {
        name: 'Dat banh sinh nhat',
        questions: [
            { text: "Da, Anh/Chi can banh cho dip gi a?", options: ['Sinh nhat be', 'Sinh nhat nguoi lon', 'Ky niem', 'Khai truong', 'Khac'], field: 'occasion' },
            { text: "Ngay va gio Anh/Chi can lay banh / nhan banh la khi nao a?", field: 'dateTime' },
            { text: "Anh/Chi muon lay tai cua hang hay can giao tan noi a?", options: ['Lay tai cua hang', 'Giao tan noi'], field: 'deliveryMethod' },
            { 
                text: (state) => state.data.deliveryMethod === 'Lay tai cua hang' ? "Anh/Chi muon nhan banh o co so nao a?" : "Anh/Chi cho em xin dia chi nhan banh a.",
                options: (state) => state.data.deliveryMethod === 'Lay tai cua hang' ? [
                    'CS1: 17-19 Dinh Cong Trang (TP. Thanh Hoa)', 
                    'CS2: Vincom Shophouse PG3-17 (Le Hoan)', 
                    'CS3: 62 Quang Trung (Nghi Son)', 
                    'CS4: 236 Ngo Quyen (Sam Son)', 
                    'CS5: 279 Le Lai (Dong Son)'
                ] : null,
                field: 'location'
            },
            { text: "Da, cho em xin Ten va So dien thoai cua Anh/Chi de ben em tien lien he a.", field: 'customerInfo' },
            { text: "Mau banh Anh/Chi chon la mau nao a? (Neu da gui anh thi nhan 'Theo mau gui').", field: 'hasSample' },
            { 
                text: "Anh/Chi muon dat banh kich thuoc (size) bao nhieu a?", 
                options: ['Size 16 (4-6 nguoi)', 'Size 18 (6-8 nguoi)', 'Size 20 (8-10 nguoi)', 'Kich thuoc khac'],
                field: 'cakeSize' 
            },
            { text: "Banh bong lan ben trong Anh/Chi chon vi nao a?", options: ['Vi truyen thong', 'Vi Socola', 'Vi Matcha', 'Vi Chanh leo'], field: 'cakeFlavor' },
            { text: "Anh/Chi muon tone mau / phong cach nhu the nao a?", options: ['Sang trong', 'De thuong', 'Don gian', 'Theo mau rieng'], field: 'style' },
            { text: "Noi dung ghi len banh la gi a? (Vi du: Chuc mung sinh nhat...)", field: 'cakeContent' },
            { text: "Gia thanh / Ngan sach Anh/Chi du kien cho mau nay khoang bao nhieu a?", field: 'budget' },
            { 
                text: "Anh/Chi muon thanh toan khi nhan (COD) hay chuyen khoan qua QR truoc a?", 
                options: ['Thanh toan khi nhan (COD)', 'Chuyen khoan QR truoc'], 
                field: 'paymentMethod' 
            },
            { text: "Anh/Chi co luu y gi them cho tho lam banh khong a?", field: 'note' }
        ]
    },
    instock: {
        name: 'Hoi banh co san',
        questions: [
            { text: "Anh/Chi can banh dung ngay hom nay dung khong a?", options: ['Dung ngay bay gio', 'Dung toi nay'], field: 'time' },
            { text: "Anh/Chi muon banh sinh nhat, banh lanh hay banh mi an vat a?", options: ['Banh sinh nhat', 'Banh lanh', 'Banh an vat'], field: 'type' },
            { text: "Anh/Chi se ghe co so nao de lay banh a?", options: [
                'CS1: 17-19 Dinh Cong Trang (TP. Thanh Hoa)', 
                'CS2: Vincom Shophouse PG3-17 (Le Hoan)', 
                'CS3: 62 Quang Trung (Nghi Son)', 
                'CS4: 236 Ngo Quyen (Sam Son)', 
                'CS5: 279 Le Lai (Dong Son)'
            ], field: 'location' },
            { text: "Da cho em xin so dien thoai, em bao nhan vien tai quay kiem tra va goi lai bao mau san cho Anh/Chi ngay a!", field: 'phone' }
        ]
    },
    bread: {
        name: 'Banh ran / Banh mi',
        questions: [
            { text: "Anh/Chi muon dat banh mi dinh duong hay banh ran an vat a?", options: ['Banh mi cac loai', 'Banh ran / Banh quy'], field: 'type' },
            { text: "So luong Anh/Chi can lay la bao nhieu a?", field: 'quantity' },
            { text: "Anh/Chi ghe lay hay ben em ship tan noi a?", options: ['Tu ghe lay', 'Can ship tan noi'], field: 'delivery' },
            { text: "Da, cho em xin So dien thoai cua minh nhe!", field: 'phone' }
        ]
    },
    address: {
        name: 'Dia chi / Giao hang',
        questions: [
            { text: "Da, Anh/Chi muon tim dia chi co so o khu vuc nao a?", options: ['TP Thanh Hoa', 'Nghi Son', 'Sam Son', 'Ha Noi'], field: 'area' },
            { text: "Anh/Chi cho em xin thong tin khu vuc can ship de em bao phi ship chinh xac nhe.", field: 'shipInfo' },
            { text: "Vui long de lai SDT, nhan vien van chuyen se goi tu van lich ship cho ban a.", field: 'phone' }
        ]
    },
    complaint: {
        name: 'Khieu nai / Phan hoi',
        questions: [
            { text: "Da em thay mat Huyen Ngan Bakery xin loi vi Anh/Chi dang co trai nghiem chua hai long a. Anh/Chi vui long cho em xin lai So dien thoai dat hang de em xu ly ngay a.", field: 'phone' },
            { text: "Anh/Chi hay mo ta chi tiet van de gap phai de em bao cap quan ly giai quyet gap cho minh nhe a.", field: 'issue' }
        ]
    }
};

// ============================================================
// CHATBOT UI FUNCTIONS
// ============================================================
function toggleChat() {
    chatOpen = !chatOpen;
    chatWindow.style.display = chatOpen ? 'flex' : 'none';
    if (chatOpen && chatMessages.children.length === 0) {
        initChat();
    }
}

function initChat() {
    addBotMessage("Huyen Ngan Bakery kinh chao An nhan! 🎂");
    setTimeout(() => {
        addBotMessage("Anh/Chi chon muc ben duoi de dat hang nhanh, hoac <strong>nhan tin tu do</strong> de duoc AI tu van ngay a!");
        showMainMenu();
    }, 600);
}

function addBotMessage(text) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble bot';
    bubble.innerHTML = text;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    chatHistory.push({ role: 'AI', content: text.replace(/<[^>]*>?/gm, '') });
}

function addUserMessage(text) {
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble user';
    bubble.textContent = text;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    chatHistory.push({ role: 'Khach', content: text });
}

function addTypingIndicator() {
    const typing = document.createElement('div');
    typing.className = 'chat-bubble bot typing-indicator';
    typing.id = 'typingBubble';
    typing.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span>';
    chatMessages.appendChild(typing);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function removeTypingIndicator() {
    const typing = document.getElementById('typingBubble');
    if (typing) typing.remove();
}

function showQuickReplies(options) {
    quickRepliesEl.innerHTML = '';
    if (!options || options.length === 0) return;
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'quick-reply-btn';
        btn.textContent = (typeof opt === 'string') ? opt : opt.text;
        btn.onclick = () => {
            const val = (typeof opt === 'string') ? opt : opt.value;
            const label = (typeof opt === 'string') ? opt : opt.text;
            addUserMessage(label);
            processInput(val);
        };
        quickRepliesEl.appendChild(btn);
    });
}

function showMainMenu() {
    chatState = { branch: null, step: 0, data: {}, isHandedOver: false, mode: 'menu' };
    showQuickReplies([
        { text: '🎂 Dat banh sinh nhat', value: 'birthday' },
        { text: '🍰 Hoi banh co san', value: 'instock' },
        { text: '🥖 Banh ran / Banh mi', value: 'bread' },
        { text: '📍 Dia chi / Giao hang', value: 'address' },
        { text: '⚠️ Khieu nai / Phan hoi', value: 'complaint' },
        { text: '🤖 Chat voi AI tu van', value: 'ai_mode' },
        { text: '👤 Gap nhan vien', value: 'human' },
        { text: '🔵 Chat qua Zalo', value: 'zalo' }
    ]);
}

// ============================================================
// INPUT PROCESSING
// ============================================================
function processInput(input) {
    if (input === 'human') {
        addBotMessage("Da, nhan vien tu van dang bat dau ket noi voi Anh/Chi. Vui long doi trong giay lat a! ❤️<br><br>Hoac Anh/Chi nhan Zalo: <a href='https://zalo.me/0917551111' target='_blank' style='color:#0068ff;font-weight:bold'>0917 551 111</a> de duoc ho tro nhanh nhat.");
        chatState.isHandedOver = true;
        quickRepliesEl.innerHTML = '';
        return;
    }
    if (input === 'zalo') {
        window.open('https://zalo.me/0917551111', '_blank');
        addBotMessage("Em da mo Zalo cua Huyen Ngan Bakery cho Anh/Chi roi a!");
        return;
    }
    if (input === 'ai_mode') {
        chatState.mode = 'ai';
        chatState.branch = null;
        quickRepliesEl.innerHTML = '';
        addBotMessage("🤖 Che do AI da bat! Anh/Chi cu hoi bat ky dieu gi ve banh, gia, giao hang, khuyen mai... Em se tu van ngay a!<br><br><em style='font-size:0.8rem;opacity:0.7'>Nhan \"menu\" de quay lai danh muc nhanh.</em>");
        return;
    }
    if (chatState.mode === 'ai') {
        if (input.toLowerCase() === 'menu' || input.toLowerCase() === 'quay lai') {
            addBotMessage("Da, em chuyen ve menu chinh cho Anh/Chi nhe!");
            showMainMenu();
            return;
        }
        callGeminiAI(input);
        return;
    }
    if (!chatState.branch) {
        if (branches[input]) {
            chatState.branch = input;
            chatState.mode = 'branch';
            chatState.step = 0;
            askQuestion();
        } else {
            chatState.mode = 'ai';
            callGeminiAI(input);
        }
        return;
    }
    const branch = branches[chatState.branch];
    const currentQ = branch.questions[chatState.step];
    chatState.data[currentQ.field] = input;
    chatState.step++;
    if (chatState.step < branch.questions.length) {
        askQuestion();
    } else {
        finishBranch();
    }
}

function askQuestion() {
    const branch = branches[chatState.branch];
    const q = branch.questions[chatState.step];
    const text = (typeof q.text === 'function') ? q.text(chatState) : q.text;
    const opts = (typeof q.options === 'function') ? q.options(chatState) : q.options;
    setTimeout(() => {
        addBotMessage(text);
        if (opts) { showQuickReplies(opts); } else { quickRepliesEl.innerHTML = ''; }
    }, 400);
}

// ============================================================
// GEMINI AI
// ============================================================
async function callGeminiAI(userMessage) {
    if (!GEMINI_API_KEY || GEMINI_API_KEY.includes('DAN_API_KEY')) {
        addBotMessage("⚠️ Chuc nang AI chua duoc kich hoat. Anh/Chi vui long chon tu menu ben duoi hoac nhan Zalo <a href='https://zalo.me/0917551111' target='_blank' style='color:#0068ff;font-weight:bold'>0917 551 111</a> de duoc tu van truc tiep a!");
        showMainMenu();
        return;
    }
    addTypingIndicator();
    quickRepliesEl.innerHTML = '';
    aiConversation.push({ role: 'user', parts: [{ text: userMessage }] });
    try {
        const response = await fetch(GEMINI_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: { parts: [{ text: AI_SYSTEM_PROMPT }] },
                contents: aiConversation,
                generationConfig: { temperature: 0.7, maxOutputTokens: 500, topP: 0.9 }
            })
        });
        const result = await response.json();
        removeTypingIndicator();
        if (result.candidates && result.candidates[0]?.content?.parts[0]?.text) {
            let aiText = result.candidates[0].content.parts[0].text;
            aiConversation.push({ role: 'model', parts: [{ text: aiText }] });
            aiText = processLeadDataTag(aiText);
            addBotMessage(aiText);
            showQuickReplies([{ text: '📋 Quay lai Menu', value: 'menu_return' }]);
        } else {
            addBotMessage("Da em xin loi, em chua hieu ro a. Anh/Chi vui long nhan lai hoac goi Hotline <strong>0917 551 111</strong> de duoc ho tro ngay a!");
        }
    } catch (error) {
        removeTypingIndicator();
        console.error("Loi goi Gemini AI:", error);
        addBotMessage("Da duong truyen dang chap chon a. Anh/Chi thu lai sau giay lat hoac nhan Zalo <a href='https://zalo.me/0917551111' target='_blank' style='color:#0068ff;font-weight:bold'>0917 551 111</a> a!");
    }
}

// ============================================================
// LEAD DATA EXTRACTION
// ============================================================
function processLeadDataTag(aiResponse) {
    const dataPattern = /\|\|LEAD_DATA:\s*(\{.*?\})\s*\|\|/;
    if (aiResponse.includes("||LEAD_DATA:")) {
        const match = aiResponse.match(dataPattern);
        if (match && match[1]) {
            try {
                const leadData = JSON.parse(match[1]);
                console.log("AI phat hien thong tin khach:", leadData);
                if (leadData.name || leadData.phone || leadData.email) {
                    syncLeadToGoogleSheets({ name: leadData.name || '', phone: leadData.phone || '', email: leadData.email || '' });
                }
            } catch (error) { console.error("Loi parse Lead Data:", error); }
        }
        aiResponse = aiResponse.replace(dataPattern, "").trim();
    }
    return aiResponse;
}

// ============================================================
// GOOGLE SHEETS SYNC
// ============================================================
async function syncLeadToGoogleSheets(leadData) {
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes('DAN_URL')) { return; }
    const historyText = chatHistory.map(m => `${m.role}: ${m.content}`).join('\n\n');
    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST', mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...leadData, sessionId: AI_CHAT_SESSION_ID, chatHistory: historyText, timestamp: new Date().toLocaleString('vi-VN'), source: window.location.href })
        });
        console.log("Da dong bo du lieu thanh cong!");
    } catch (err) { console.error("Loi gui du lieu:", err); }
}

// ============================================================
// FINISH BRANCH — Order Summary + Sheet Sync
// ============================================================
function finishBranch() {
    const data = chatState.data;
    const branchName = branches[chatState.branch].name;
    let leadInfo = { 
        name: data.customerInfo || data.phone || 'An nhan', 
        phone: data.phone || (data.customerInfo ? (data.customerInfo.match(/\d{4,}/g) || []).join('') : ''), 
        email: `Loai: ${branchName} | Chi tiet: ${JSON.stringify(data)}`
    };
    syncLeadToGoogleSheets(leadInfo);

    let rows = '';
    rows += `<p><strong>Dich vu:</strong> ${branchName}</p>`;
    if (data.occasion) rows += `<p><strong>Dip:</strong> ${data.occasion}</p>`;
    if (data.dateTime) rows += `<p><strong>Thoi gian:</strong> ${data.dateTime}</p>`;
    if (data.deliveryMethod) rows += `<p><strong>Hinh thuc:</strong> ${data.deliveryMethod}</p>`;
    if (data.location) rows += `<p><strong>Dia diem:</strong> ${data.location}</p>`;
    if (data.customerInfo) rows += `<p><strong>Lien he:</strong> ${data.customerInfo}</p>`;
    if (data.phone) rows += `<p><strong>SDT:</strong> ${data.phone}</p>`;
    if (data.hasSample) rows += `<p><strong>Mau banh:</strong> ${data.hasSample}</p>`;
    if (data.cakeSize) rows += `<p><strong>Size:</strong> ${data.cakeSize}</p>`;
    if (data.cakeFlavor) rows += `<p><strong>Vi banh:</strong> ${data.cakeFlavor}</p>`;
    if (data.style) rows += `<p><strong>Phong cach:</strong> ${data.style}</p>`;
    if (data.cakeContent) rows += `<p><strong>Ghi len banh:</strong> ${data.cakeContent}</p>`;
    if (data.budget) rows += `<p><strong>Ngan sach:</strong> ${data.budget}</p>`;
    if (data.paymentMethod) rows += `<p><strong>Thanh toan:</strong> ${data.paymentMethod}</p>`;
    if (data.note) rows += `<p><strong>Luu y:</strong> ${data.note}</p>`;
    if (data.type) rows += `<p><strong>Loai:</strong> ${data.type}</p>`;
    if (data.quantity) rows += `<p><strong>So luong:</strong> ${data.quantity}</p>`;
    if (data.delivery) rows += `<p><strong>Giao hang:</strong> ${data.delivery}</p>`;
    if (data.area) rows += `<p><strong>Khu vuc:</strong> ${data.area}</p>`;
    if (data.shipInfo) rows += `<p><strong>Thong tin ship:</strong> ${data.shipInfo}</p>`;
    if (data.issue) rows += `<p><strong>Van de:</strong> ${data.issue}</p>`;

    let footerMsg = chatState.branch === 'complaint' 
        ? 'Cap quan ly se goi lai cho Anh/Chi ngay lap tuc de giai quyet a! Thanh that xin loi An nhan.'
        : 'Nhan vien se goi lai tu van don hang cho minh ngay bay gio. Cam on An nhan! ❤️';
    let icon = chatState.branch === 'complaint' ? '⚠️' : '🎂';
    let title = chatState.branch === 'complaint' ? 'GHI NHAN PHAN HOI' : 'XAC NHAN DON HANG';

    let summaryHTML = `<div class="order-bill"><div class="bill-header">${icon} ${title}</div><div class="bill-content">${rows}</div><div class="bill-footer">${footerMsg}</div></div>`;
    addBotMessage(summaryHTML);
    setTimeout(showMainMenu, 5000);
}

// ============================================================
// SEND MESSAGE
// ============================================================
function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    addUserMessage(text);
    chatInput.value = '';
    if (text === 'menu_return') { showMainMenu(); return; }
    processInput(text);
}

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

// ============================================================
// CONTACT FORM — Google Sheets Sync
// ============================================================
document.getElementById('bakeryContact')?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        const target = e.target;
        if (target.tagName === 'TEXTAREA') return;
        e.preventDefault();
        const form = e.target.closest('form');
        const fields = Array.from(form.querySelectorAll('input, select, textarea'));
        const currentIndex = fields.indexOf(target);
        if (currentIndex < fields.length - 1) { fields[currentIndex + 1].focus(); }
        else { form.requestSubmit(); }
    }
});

document.getElementById('bakeryContact')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const btn = form.querySelector('button');
    const originalText = btn.textContent;
    const inputs = form.querySelectorAll('input, select, textarea');
    const formData = { name: inputs[0]?.value || '', phone: inputs[1]?.value || '', email: `Quan tam: ${inputs[2]?.value || ''} | Loi nhan: ${inputs[3]?.value || ''}`, type: 'form' };
    btn.disabled = true;
    btn.textContent = "Dang gui... ⏳";
    await syncLeadToGoogleSheets(formData);
    btn.textContent = "✅ Da gui thanh cong!";
    btn.style.background = '#27ae60';
    setTimeout(() => {
        alert("Cam on An nhan! Huyen Ngan da nhan duoc yeu cau va se lien he som nhat a. 🎂");
        btn.disabled = false;
        btn.textContent = originalText;
        btn.style.background = '';
        form.reset();
    }, 1000);
});

// ============================================================
// QUICK VIEW
// ============================================================
function openQuickView(type) {
    if (!chatOpen) toggleChat();
    processInput(type);
}
