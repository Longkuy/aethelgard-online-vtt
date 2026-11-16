# Aethelgard Online VTT (Roll20-Style)

เว็บเล่น D&D ออนไลน์แบบ Real-time สำหรับแคมเปญ **Aethelgard** (อ้างอิงข้อมูลจาก `DND LONGKUNG`)

## ฟีเจอร์หลัก
- **Real-time Multiplayer Rooms (Socket.IO):** สร้างห้องด้วยรหัสห้อง (เช่น `AETHEL`) หรือส่งลิงก์ `?room=AETHEL` ให้เพื่อนเข้าห้องเดียวกัน
- **Roll20-Style Battlemap:** ซูม/ย่อแผนที่, ปรับความชัดตาราง (16×9), ย้ายหมากตัวละครแบบ Real-time, และปุ่ม **Ping** ชี้ตำแหน่งบนแผนที่ให้ทุกคนเห็น
- **Easy-to-Understand Skill Hotbar:** แถบสกิลด้านล่างสำหรับแต่ละตัวละคร แสดงไอคอน, ค่าพลังงาน (Mana / Aura / Faith), เป้าหมาย, สูตรเต๋า (`d20+5`, `2d8+3`), และกดใช้สกิลได้ในคลิกเดียวพร้อมการ์ดผลลัพธ์ในแชท
- **Character Creator (9 เผ่า / 16 อาชีพ):** สร้างตัวละครจากโลก Aethelgard พร้อมสกิลประจำเผ่าและประจำอาชีพ
- **DM & Scene Tools:** สลับฉาก Session 1 (Act 1–3 + World Map), เสกมอนสเตอร์, ส่งบทบรรยาย, และคุมลำดับเทิร์น (Turn Tracker)

## วิธีรันในเครื่อง
```bash
npm run install:all
npm run build
npm start
```
เปิดเบราว์เซอร์ที่ `http://localhost:3001`

## วิธี Deploy ออนไลน์ให้เพื่อนเข้าเล่นจากที่บ้าน
เนื่องจากโปรเจกต์ใช้ **Socket.IO (WebSocket)** แนะนำให้ Deploy บนแพลตฟอร์มที่รองรับ Node.js Server เช่น **Render**, **Railway**, หรือ **Fly.io**:
- **Build Command:** `npm run install:all && npm run build`
- **Start Command:** `npm start`
- **Port:** `3001` (หรือใช้ `process.env.PORT` อัตโนมัติ)
