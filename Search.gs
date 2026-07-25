/**
 * ฟังก์ชันหลักในการค้นหาคิวงานจากเบอร์โทรศัพท์ (บังคับตรงกันเป๊ะ 10 หลัก)
 */
function searchQueueByPhone(searchPhone) {
  try {
    const cleanSearchPhone = normalizePhone_(searchPhone);

    // 🛑 ดักจับฝั่ง Server: ถ้าเบอร์ไม่ครบ 10 หลัก ตีกลับทันที
    if (!cleanSearchPhone || cleanSearchPhone.length !== 10) {
      return {
        success: false,
        message: "กรุณากรอกเบอร์โทรศัพท์ให้ครบ 10 หลัก"
      };
    }

    const ss = SpreadsheetApp.openById(CONFIG.SHEET_ID);
    const sheet = ss.getSheetByName(CONFIG.SHEET_NAME) || ss.getSheets()[0];
    const data = sheet.getDataRange().getValues();

    if (data.length <= CONFIG.HEADER_ROW) {
      return { success: true, count: 0, data: [] };
    }

    const headers = data[CONFIG.HEADER_ROW - 1];
    
    // หา Index ของแต่ละคอลัมน์จาก Config
    const queueIdx     = headers.indexOf(COLUMN.QUEUE_ID);
    const dateIdx      = headers.indexOf(COLUMN.EVENT_DATE);
    const startTimeIdx = headers.indexOf(COLUMN.START_TIME);
    const endTimeIdx   = headers.indexOf(COLUMN.END_TIME);
    const phoneIdx     = headers.indexOf(COLUMN.PHONE);
    const locationIdx  = headers.indexOf(COLUMN.LOCATION);
    const priceIdx     = headers.indexOf(COLUMN.PRICE);
    const depositIdx   = headers.indexOf(COLUMN.DEPOSIT);
    const balanceIdx   = headers.indexOf(COLUMN.BALANCE);
    const mapIdx       = headers.indexOf(COLUMN.MAP);

    const results = [];

    for (let i = CONFIG.HEADER_ROW; i < data.length; i++) {
      const row = data[i];
      const rawPhone = phoneIdx !== -1 ? row[phoneIdx] : '';
      const rowPhone = normalizePhone_(rawPhone);

      // 🛑 เปลี่ยนจาก .includes() เป็น === เพื่อบังคับให้เบอร์ตรงกันเป๊ะทั้ง 10 หลัก
      if (rowPhone && rowPhone === cleanSearchPhone) {
        let priceVal   = priceIdx !== -1 ? Number(row[priceIdx]) || 0 : 0;
        let depositVal = depositIdx !== -1 ? Number(row[depositIdx]) || 0 : 0;
        let balanceVal = balanceIdx !== -1 ? Number(row[balanceIdx]) || 0 : (priceVal - depositVal);

        let timeStr = "-";
        if (startTimeIdx !== -1 && row[startTimeIdx]) {
          const start = formatTime_(row[startTimeIdx]);
          const end   = endTimeIdx !== -1 && row[endTimeIdx] ? formatTime_(row[endTimeIdx]) : "";
          timeStr     = end ? `${start} - ${end}` : start;
        }

        results.push({
          queueId:   queueIdx !== -1 ? row[queueIdx] : i,
          eventDate: dateIdx !== -1 ? formatThaiDate_(row[dateIdx]) : "-",
          eventTime: timeStr,
          location:  locationIdx !== -1 ? row[locationIdx] : "-",
          phone:     rawPhone,
          price:     priceVal,
          deposit:   depositVal,
          balance:   balanceVal,
          map:       mapIdx !== -1 ? row[mapIdx] : ""
        });
      }
    }

    return {
      success: true,
      count: results.length,
      data: results
    };

  } catch (error) {
    return {
      success: false,
      message: error.toString()
    };
  }
}

function testSearch() {
  const result = searchQueueByPhone("0933015202"); // เบอร์ที่มีอยู่ในชีต
  Logger.log(JSON.stringify(result, null, 2));
}

