/**
 * ==========================================
 * Helper Functions & Formatting
 * PAOTUNG Customer Portal API
 * ==========================================
 */

/**
 * ตัดช่องว่าง ขีด และแปลงรหัสประเทศให้เหลือเฉพาะเบอร์โทรศัพท์
 */
function normalizePhone_(phone) {
  if (!phone) return "";
  let cleaned = String(phone).replace(/\D/g, "");
  if (cleaned.startsWith("66")) {
    cleaned = "0" + cleaned.slice(2);
  }
  return cleaned;
}

/**
 * แปลงวันที่เป็น พ.ศ. ไทย (dd/MM/yyyy)
 */
function formatThaiDate_(value) {
  if (!value) return "";

  let d;
  if (value instanceof Date) {
    d = value;
  } else {
    let dateStr = String(value).trim();
    let parts = dateStr.split(/[\/\-\.]/);
    
    if (parts.length === 3) {
      let p0 = parseInt(parts[0], 10);
      let p1 = parseInt(parts[1], 10);
      let p2 = parseInt(parts[2], 10);

      let day, month, year;

      if (parts[0].length === 4) {
        year = p0;
        month = p1 - 1;
        day = p2;
      } else {
        day = p0;
        month = p1 - 1;
        year = p2;
      }

      if (year > 2400) year -= 543;
      d = new Date(year, month, day);
    } else {
      d = new Date(value);
    }
  }

  if (isNaN(d.getTime())) return String(value);

  // ✅ แปลงเป็น พ.ศ. ไทย (+543)
  let day = ("0" + d.getDate()).slice(-2);
  let month = ("0" + (d.getMonth() + 1)).slice(-2);
  let thaiYear = d.getFullYear() < 2400 ? d.getFullYear() + 543 : d.getFullYear();

  return `${day}/${month}/${thaiYear}`;
}

/**
 * แปลงเวลา (HH:mm)
 */
function formatTime_(value) {
  if (!value) return "";

  // ✅ รองรับกรณี Google Sheets ส่ง Date ปี 1899 มา
  if (value instanceof Date) {
    return Utilities.formatDate(value, "Asia/Bangkok", "HH:mm");
  }

  let timeStr = String(value).trim();
  let match = timeStr.match(/(\d{1,2}:\d{2})/);
  if (match) {
    let parts = match[1].split(':');
    let hh = parts[0].padStart(2, '0');
    let mm = parts[1];
    return `${hh}:${mm}`;
  }

  return timeStr;
}

/**
 * ✅ เพิ่มใหม่: แปลงค่าเงิน/ตัวเลข ป้องกันอาการขึ้น NaN
 */
function parseNumber_(val) {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === 'number') return val;
  
  // ลบเครื่องหมายลูกน้ำ (,), ฿ และตัวอักษรอื่นๆ ออก ให้เหลือเฉพาะตัวเลข
  let cleaned = String(val).replace(/,/g, "").replace(/[^\d.-]/g, "").trim();
  let num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}
