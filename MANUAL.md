# คู่มือการติดตั้งและใช้งานระบบเกม Tic-Tac-Toe (Siam-XO)

โปรเจกต์นี้เป็น Web Application เกม OX (Tic-Tac-Toe) ที่พัฒนาด้วย **React (Vite) + Material UI** สำหรับส่วนหน้าบ้าน (Frontend) และ **FastAPI (Python) + SQLite** สำหรับส่วนหลังบ้าน (Backend) โดยมีระบบล็อกอินผ่าน **GitHub OAuth** และระบบเก็บคะแนนแบบเรียลไทม์

---

## 📋 ความต้องการของระบบ (Prerequisites)

1.  **Node.js** (เวอร์ชัน 18 หรือสูงกว่า) - [ดาวน์โหลด](https://nodejs.org/)
2.  **Python** (เวอร์ชัน 3.10 หรือสูงกว่า) - [ดาวน์โหลด](https://www.python.org/)
3.  **Git** - [ดาวน์โหลด](https://git-scm.com/)
4.  **บัญชี GitHub** (สำหรับสร้าง OAuth App)

---

## ⚙️ การตั้งค่าและติดตั้ง (Installation & Setup)

### ส่วนที่ 1: การตั้งค่า Backend

1.  **เปิด Terminal** และเข้าไปที่โฟลเดอร์ `backend`:
    ```bash
    cd backend
    ```

2.  **สร้าง Virtual Environment** (แนะนำเพื่อให้จัดการ dependencies ได้ง่าย):
    *   **Windows:**
        ```powershell
        python -m venv venv
        venv\Scripts\activate
        ```
    *   **macOS / Linux:**
        ```bash
        python3 -m venv venv
        source venv/bin/activate
        ```

3.  **ติดตั้ง Library ที่จำเป็น:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **ตั้งค่า OAuth 2.0 กับ GitHub:**
    *   ไปที่ [GitHub Developer Settings](https://github.com/settings/developers)
    *   เลือกเมนู **OAuth Apps** > กดปุ่ม **New OAuth App**
    *   กรอกข้อมูลดังนี้:
        *   **Application name:** `Tic-Tac-Toe App` (หรือชื่อที่ต้องการ)
        *   **Homepage URL:** `http://localhost:5173`
        *   **Authorization callback URL:** `http://localhost:8000/auth/callback/github`
    *   กด **Register application**
    *   คุณจะได้รับ **Client ID** และต้องกดปุ่ม **Generate a new client secret** เพื่อรับ **Client Secret**

5.  **สร้างไฟล์ตั้งค่า Environment:**
    *   สร้างไฟล์ชื่อ `.env` ในโฟลเดอร์ `backend`
    *   คัดลอกเนื้อหาด้านล่างไปใส่ และแทนที่ `YOUR_CLIENT_ID` และ `YOUR_CLIENT_SECRET` ด้วยค่าที่ได้จาก GitHub:

    ```env
    SECRET_KEY=supersecretkey_change_this_to_something_random
    GITHUB_CLIENT_ID=YOUR_GITHUB_CLIENT_ID
    GITHUB_CLIENT_SECRET=YOUR_GITHUB_CLIENT_SECRET
    ```

6.  **เริ่มรัน Backend Server:**
    ```bash
    uvicorn main:app --reload
    ```
    *   Server จะทำงานที่ `http://localhost:8000`
    *   หน้าจอ Terminal จะต้องเปิดค้างไว้ระหว่างใช้งาน

---

### ส่วนที่ 2: การตั้งค่า Frontend

1.  **เปิด Terminal ใหม่** (อย่าปิดอันเดิม) และเข้าไปที่โฟลเดอร์ `frontend`:
    ```bash
    cd frontend
    ```

2.  **ติดตั้ง Node Modules:**
    ```bash
    npm install
    ```

3.  **เริ่มรัน Frontend Server:**
    ```bash
    npm run dev
    ```
    *   Server จะทำงานที่ `http://localhost:5173`

---

## 🎮 คู่มือการใช้งาน (User Guide)

### 1. การเข้าสู่ระบบ
1.  เปิดเว็บเบราว์เซอร์ไปที่ `http://localhost:5173`
2.  คุณจะพบหน้าจอต้อนรับ ให้กดปุ่ม **"LOGIN WITH GITHUB"**
3.  ระบบจะพาไปที่หน้าล็อกอินของ GitHub เพื่อขออนุญาตเข้าถึงข้อมูลพื้นฐาน (ชื่อผู้ใช้)
4.  เมื่ออนุญาตสำเร็จ ระบบจะพากลับมาที่หน้าเกมพร้อมแสดงชื่อของคุณ

### 2. กติกาการเล่น
*   **เริ่มเกม:** คุณจะได้เล่นเป็น **X** และเริ่มก่อนเสมอ (หรือสลับกันตามตรรกะเกม)
*   **เป้าหมาย:** เรียงเครื่องหมายของคุณให้ครบ 3 ตัวในแนวตั้ง แนวนอน หรือแนวทแยง เพื่อชนะ
*   **บอท:** หลังจากคุณเดิน ระบบบอท (O) จะเดินตอบโต้ทันที

### 3. ระบบคะแนน (Scoring System)
*   🟢 **ชนะ (Win):** ได้รับ **+1 คะแนน**
*   🔴 **แพ้ (Lose):** เสีย **-1 คะแนน**
*   ⚪ **เสมอ (Draw):** คะแนนไม่เปลี่ยนแปลง
*   🔥 **โบนัส (Streak):** หากชนะติดกันครบ **3 ครั้ง** จะได้รับคะแนนพิเศษเพิ่มอีก **+1 คะแนน** (รวมเป็นได้ 2 คะแนนในตานั้น)

### 4. ตารางอันดับ (Leaderboard)
*   ตารางด้านล่างเกมจะแสดงรายชื่อผู้เล่น เรียงตามคะแนนจากมากไปน้อย
*   ข้อมูลในตารางจะ **อัปเดตอัตโนมัติ** ทันทีเมื่อเกมจบลงในแต่ละตา

---

## ❓ การแก้ปัญหาเบื้องต้น (Troubleshooting)

**Q: กด Login แล้วขึ้น 404 หรือไม่ไปหน้าถัดไป**
*   **A:** ตรวจสอบไฟล์ `backend/.env` ว่าใส่ Client ID/Secret ถูกต้องหรือไม่ และ Restart Backend Server ใหม่

**Q: คะแนนไม่อัปเดต**
*   **A:** ลอง Refresh หน้าเว็บ 1 ครั้ง หากยังไม่หายให้ตรวจสอบว่า Backend Terminal มี Error อะไรขึ้นหรือไม่

**Q: ติดตั้ง `pip install` ไม่ผ่าน**
*   **A:** ตรวจสอบเวอร์ชัน Python ว่าเป็น 3.10 ขึ้นไป และลองรัน Command Prompt (cmd) หรือ PowerShell ในฐานะ Administrator

---

Developed by: **Sarawut.o & GitHub Copilot** 🤝
