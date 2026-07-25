/**
 * PAOTUNG CUSTOMER PORTAL - Backend API
 * ระบบดึงข้อมูลคิวงานและสถานะการจองรถแห่
 */

function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('PAOTUNG CUSTOMER PORTAL - ระบบตรวจสอบข้อมูลการจองรถแห่')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function searchQueueByPhone(phone) {
  try {
    // 1. ตรวจสอบการเชื่อมต่อกับ Google Sheet
    if (typeof CONFIG === 'undefined' || !CONFIG.SHEET_ID) {
      throw new Error("ยังไม่ได้กำหนดค่า CONFIG.SHEET_ID ในไฟล์สคริปต์");
    }

    var ss = SpreadsheetApp.openById(CONFIG.SHEET_ID.trim());
    if (!ss) throw new Error("ไม่สามารถเปิด Google Sheet ได้");
    
    var sheet = (CONFIG.SHEET_NAME && ss.getSheetByName(CONFIG.SHEET_NAME.trim())) 
                ? ss.getSheetByName(CONFIG.SHEET_NAME.trim()) 
                : ss.getSheets()[0];
    
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return { success: true, count: 0, data: [] };
    }

    // 2. ค้นหา Index ของคอลัมน์ตามชื่อ Header อัตโนมัติ (ป้องกัน Index เคลื่อน)
    var headers = data[0].map(function(h) { return String(h).trim(); });
    
    var colQueueId = getColumnIndex(headers, ["ลำดับคิว", "ลำดับที่", "คิว"], 0);
    var colDate    = getColumnIndex(headers, ["วันที่ แสดง", "วันที่แสดง", "วันที่"], 1);
    var colStart   = getColumnIndex(headers, ["เวลาเริ่มต้น", "เวลาเริ่ม"], 2);
    var colEnd     = getColumnIndex(headers, ["เวลาสิ้นสุด", "เวลาจบ"], 3);
    var colName    = getColumnIndex(headers, ["ชื่อนามสกุล", "ชื่อ-นามสกุล", "ชื่อเจ้าภาพ"], 5);
    var colPhone   = getColumnIndex(headers, ["เบอร์โทร", "เบอร์โทรศัพท์", "เบอร์ติดต่อ"], 6);
    var colLoc     = getColumnIndex(headers, ["สถานที่จัดงาน", "สถานที่"], 7);
    var colPrice   = getColumnIndex(headers, ["ราคาจ้าง", "ยอดรวม"], 8);
    var colDeposit = getColumnIndex(headers, ["ราคามัดจำ", "มัดจำ"], 9);
    var colBalance = getColumnIndex(headers, ["ยอดคงเหลือ", "คงเหลือ"], 10);
    var colMap     = getColumnIndex(headers, ["แผนที่", "Google Map", "Map"], 14);
    
    // 🎯 เจาะจงหาคอลัมน์สถานะการจอง (คอลัมน์ Q)
    var colStatus  = getColumnIndex(headers, ["สถานะการจอง", "สถานะ"], 16);

    var results = [];
    var cleanSearchPhone = String(phone).replace(/\D/g, "").trim();
    var startRow = CONFIG.HEADER_ROW || 1;

    // 3. วนลูปค้นหาข้อมูลที่ตรงกับเบอร์โทรศัพท์ (รองรับหลายเบอร์กั้นด้วย ,)
    for (var i = startRow; i < data.length; i++) {
      var row = data[i];
      var rawPhoneStr = String(row[colPhone] || "").trim();
      
      // 🔥 แยกเบอร์โทรด้วยเครื่องหมาย , และลบตัวอักษรขยะออกให้เหลือเฉพาะตัวเลข
      var phoneList = rawPhoneStr.split(',').map(function(p) {
        return p.replace(/\D/g, "").trim();
      });

      // เช็กว่าเบอร์ที่ผู้ใช้ค้นหา ตรงกับเบอร์ใดเบอร์หนึ่งในรายการหรือไม่
      var isMatch = phoneList.some(function(p) {
        return p !== "" && p === cleanSearchPhone;
      });

      if (isMatch) {
        
        // จัดการฟอร์แมตเวลาแสดง (เช่น 12:00 - 15:00 น.)
        var startTime = formatTime(row[colStart]);
        var endTime   = formatTime(row[colEnd]);
        var timeString = "-";

        if (startTime && endTime) {
          timeString = startTime + " - " + endTime + " น.";
        } else if (startTime) {
          timeString = startTime + " น.";
        }

        // ดึงข้อความสถานะการจอง
        var statusValue = String(row[colStatus] || "").trim();

        results.push({
          queueId: row[colQueueId] || "-",
          eventDate: formatDate(row[colDate]),
          eventTime: timeString,
          customerName: row[colName] || "-",
          phone: rawPhoneStr,                         // แสดงข้อความเบอร์โทรเดิมทั้งหมดจากชีต
          location: row[colLoc] || "-",
          bookingStatus: statusValue,                 // ส่งสถานะที่ดึงได้ไปยัง Frontend
          price: parseNumber(row[colPrice]),
          deposit: parseNumber(row[colDeposit]),
          balance: parseNumber(row[colBalance]),
          map: row[colMap] || ""
        });
      }
    }
    
    return { success: true, count: results.length, data: results };
    
  } catch (error) {
    return { success: false, message: "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์: " + error.toString() };
  }
}

/**
 * ฟังก์ชันช่วยค้นหา Index ของคอลัมน์จากชื่อ Header
 */
function getColumnIndex(headers, possibleNames, defaultIndex) {
  for (var i = 0; i < possibleNames.length; i++) {
    var idx = headers.indexOf(possibleNames[i]);
    if (idx !== -1) return idx;
  }
  return defaultIndex; // หากไม่เจอชื่อหัวข้อ ให้ใช้อินเดกซ์เริ่มต้นที่ระบุไว้
}

/**
 * ฟังก์ชันแปลงตัวเลขและลบคอมม่า/สัญลักษณ์ทางการเงิน
 */
function parseNumber(val) {
  if (val === null || val === undefined || val === "") return 0;
  if (typeof val === 'number') return val;
  var cleaned = String(val).replace(/,/g, "").replace(/[^\d.-]/g, "").trim();
  var num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * ฟังก์ชันแปลงเวลาให้อยู่ในฟอร์แมต HH:mm
 */
function formatTime(timeObj) {
  if (!timeObj) return "";
  if (timeObj instanceof Date) {
    return Utilities.formatDate(timeObj, "Asia/Bangkok", "HH:mm");
  }
  var str = String(timeObj).trim();
  var timeMatch = str.match(/(\d{1,2}:\d{2})/);
  return timeMatch ? timeMatch[1] : str;
}

/**
 * ฟังก์ชันแปลงวันที่เป็น พ.ศ. (dd/MM/yyyy)
 */
function formatDate(dateObj) {
  if (!dateObj) return "-";
  if (dateObj instanceof Date) {
    var day = ("0" + dateObj.getDate()).slice(-2);
    var month = ("0" + (dateObj.getMonth() + 1)).slice(-2);
    var year = dateObj.getFullYear();
    if (year < 2100) year = year + 543;
    return day + "/" + month + "/" + year;
  }
  return String(dateObj);
}
