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
 * แปลงวันที่ไทย (รองรับทั้ง Date Object, พ.ศ., ค.ศ., DD/MM/YYYY และ YYYY-MM-DD)
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

  return Utilities.formatDate(d, "Asia/Bangkok", "dd/MM/yyyy");
}

/**
 * แปลงเวลา (HH:mm)
 */
function formatTime_(value) {
  if (!value) return "";

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
