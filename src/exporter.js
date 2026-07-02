// ── Helpers ───────────────────────────────────────────────────────────────────

function sanitizeHTML(str) {
  if (str == null) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function localeFor(language) {
  const map = { en: 'en-US', he: 'he-IL', es: 'es-ES', fr: 'fr-FR', pt: 'pt-BR', ar: 'ar-SA' };
  return map[language] || 'en-US';
}

function formatDate(date) {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${d}.${m}.${date.getFullYear()}`;
}

// Bidirectional ID match — handles the new short-hash data-id from WhatsApp Web
// and the older full false_PHONE@c.us_HASH serialized key.
function idsMatch(a, b) {
  if (!a || !b) return false;
  return a === b || a.includes(b) || b.includes(a);
}

function extractContactName(voteData, contact) {
  const sender = voteData.__x_sender;
  const phone  = String(sender.user);
  const senderSources = ['pushname', 'verifiedName', 'formattedName', 'displayName', 'name', 'shortName', 'notifyName'];
  for (const src of senderSources) {
    const v = sender[src];
    if (v && typeof v === 'string' && v.trim() && v !== phone) return v.trim();
  }
  if (contact) {
    const contactSources = ['__x_name', '__x_pushname', '__x_verifiedName', '__x_formattedName', '__x_displayName'];
    for (const src of contactSources) {
      const v = contact[src];
      if (v && typeof v === 'string' && v.trim() && v !== String(contact.__x_id?.user)) return v.trim();
    }
  }
  return 'Unknown';
}

function processTimestamp(voteData, pollData) {
  let ts = voteData.__x_timestamp || voteData.__x_t || pollData?.__x_t || 0;
  if (ts > 0 && ts < 946684800000) ts *= 1000;
  const d = new Date(ts);
  return {
    timestamp: ts,
    validDate: (isNaN(d.getTime()) || d.getFullYear() <= 1971) ? new Date() : d,
  };
}

// ── Translations ──────────────────────────────────────────────────────────────

let _translations = {};
let _translationsLoaded = false;

async function loadTranslations() {
  if (_translationsLoaded) return;
  await new Promise(resolve => {
    const s = document.createElement('script');
    s.src = extURL('translations.js');
    s.onload = () => {
      if (window.translations) { _translations = window.translations; _translationsLoaded = true; }
      resolve();
    };
    s.onerror = () => resolve();
    document.head.appendChild(s);
  });
}

function getTranslation(key, language) {
  if (_translationsLoaded && _translations[language]?.[key]) {
    return _translations[language][key];
  }
  const fallback = {
    en: { pollName: 'Poll Name', pollCreatedDate: 'Poll created date', pollCreatedTime: 'Poll created time', total: 'Total', name: 'Name', phone: 'Phone', responseDate: 'Response Date', responseTime: 'Response Time' },
    he: { pollName: 'שם הסקר', pollCreatedDate: 'תאריך יצירת הסקר', pollCreatedTime: 'שעת יצירת הסקר', total: 'סה"כ', name: 'שם', phone: 'טלפון', responseDate: 'תאריך תגובה', responseTime: 'שעת תגובה' },
    es: { pollName: 'Nombre de la encuesta', pollCreatedDate: 'Fecha de creación', pollCreatedTime: 'Hora de creación', total: 'Total', name: 'Nombre', phone: 'Teléfono', responseDate: 'Fecha de respuesta', responseTime: 'Hora de respuesta' },
    fr: { pollName: 'Nom du sondage', pollCreatedDate: 'Date de création', pollCreatedTime: 'Heure de création', total: 'Total', name: 'Nom', phone: 'Téléphone', responseDate: 'Date de réponse', responseTime: 'Heure de réponse' },
    pt: { pollName: 'Nome da enquete', pollCreatedDate: 'Data de criação', pollCreatedTime: 'Hora de criação', total: 'Total', name: 'Nome', phone: 'Telefone', responseDate: 'Data da resposta', responseTime: 'Hora da resposta' },
    ar: { pollName: 'اسم الاستطلاع', pollCreatedDate: 'تاريخ الإنشاء', pollCreatedTime: 'وقت الإنشاء', total: 'المجموع', name: 'الاسم', phone: 'الهاتف', responseDate: 'تاريخ الإجابة', responseTime: 'وقت الإجابة' },
  };
  return (fallback[language] || fallback.en)[key] || key;
}

// ── XLSX availability check ───────────────────────────────────────────────────

function isXLSXAvailable() {
  try {
    if (!window.XLSX?.utils?.book_new || !window.XLSX.write) return false;
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, window.XLSX.utils.aoa_to_sheet([['Test']]), 'S');
    const out = window.XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return out && out.byteLength > 50;
  } catch { return false; }
}

// ── Export: CSV ───────────────────────────────────────────────────────────────

function exportToCSV(pollOptions, voteAccumulator, voteRows, pollName, pollCreationDate, language) {
  const t      = key => getTranslation(key, language);
  const locale = localeFor(language);

  const createdDate = formatDate(pollCreationDate);
  const createdTime = pollCreationDate.toLocaleTimeString(locale);

  let csv = `"${t('pollName')}","${t('pollCreatedDate')}","${t('pollCreatedTime')}"\r\n`;
  csv += `"${(pollName || 'Poll').replace(/"/g, '""')}","${createdDate}","${createdTime}"\r\n`;
  csv += `\r\n\r\n`;
  csv += `"${t('total')}","","","",${pollOptions.map((_, i) => voteAccumulator[i] || 0).join(',')}\r\n`;
  csv += `"${t('name')}","${t('phone')}","${t('responseDate')}","${t('responseTime')}",${pollOptions.map(o => `"${o.replace(/"/g, '""')}"`).join(',')}\r\n`;
  csv += `"","","","",${pollOptions.map(() => '""').join(',')}\r\n`;

  voteRows.forEach(row => {
    let phone = row.phone || '';
    if (phone.startsWith("'")) phone = phone.slice(1);
    if (phone.includes('@')) phone = phone.split('@')[0];

    const date = row.rawDate ? row.rawDate.toLocaleDateString(locale) : row.date;
    const time = row.rawDate ? row.rawDate.toLocaleTimeString(locale) : row.time;

    csv += `"${row.name.replace(/"/g, '""')}","="${phone}"","${date}","${time}",`;
    csv += pollOptions.map((_, i) => row.votes && row.votes.includes(i) ? 'X' : '').join(',');
    csv += '\r\n';
  });

  const filename = `${(pollName || 'Poll').replace(/[\\/:*?"<>|]/g, '_')}_${Date.now()}.csv`;
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
  triggerDownload(blob, filename);

  window.postMessage({ source: 'WAVoteExporter', exportComplete: true, success: true, method: 'csv', filename }, '*');
}

// ── Export: HTML-Excel ────────────────────────────────────────────────────────

function exportToExcelViaHTML(pollOptions, voteAccumulator, voteRows, pollName, pollCreationDate, language) {
  try {
    const t      = key => getTranslation(key, language);
    const locale = localeFor(language);
    const rtl    = ['he', 'ar'].includes(language);
    const dir    = rtl ? 'rtl' : 'ltr';
    const align  = rtl ? 'right' : 'left';

    const createdDate = formatDate(pollCreationDate);
    const createdTime = pollCreationDate.toLocaleTimeString(locale);

    const colCount = 4 + pollOptions.length;
    const lastCol  = String.fromCharCode(65 + colCount - 1);
    const tableRows = voteRows.length + 1;

    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:x="urn:schemas-microsoft-com:office:excel"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<!--[if gte mso 9]><xml>
  <x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
    <x:Name>Poll Votes</x:Name>
    <x:WorksheetOptions>${rtl ? '<x:DisplayRightToLeft/>' : ''}</x:WorksheetOptions>
  </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook>
</xml><![endif]-->
<style>
  table { border-collapse:collapse; width:100%; direction:${dir}; }
  th,td { border:1px solid #ddd; padding:8px; text-align:${align}; }
  .header-row { font-weight:bold; font-size:14pt; background:#F5F5F5; }
  .header-row td { border-bottom:2px solid #aaa; }
  .total-row { font-weight:bold; background:#E6E6FA; }
  .total-row td { border-top:2px solid #aaa; border-bottom:2px solid #aaa; }
  .col-headers { font-weight:bold; background:#F2F2F2; }
  .col-headers th { border:1px solid #666; text-align:center; }
  .filter-row td { background:#E8E8E8; font-style:italic; text-align:center; height:25px; }
  .vote-cell { text-align:center; }
  .even-row { background:#F8F8FF; }
</style>
</head>
<body>
<table>
  <tr class="header-row">
    <td>${t('pollName')}</td><td>${t('pollCreatedDate')}</td><td>${t('pollCreatedTime')}</td>
  </tr>
  <tr><td>${sanitizeHTML(pollName || 'Poll')}</td><td>${sanitizeHTML(createdDate)}</td><td>${sanitizeHTML(createdTime)}</td></tr>
  <tr><td colspan="5">&nbsp;</td></tr>
  <tr><td colspan="5">&nbsp;</td></tr>
  <tr class="total-row">
    <td>${t('total')}</td><td></td><td></td><td></td>
    ${pollOptions.map((_, i) => `<td>${voteAccumulator[i] || 0}</td>`).join('')}
  </tr>
  <tr class="col-headers">
    <th>${t('name')}</th><th>${t('phone')}</th><th>${t('responseDate')}</th><th>${t('responseTime')}</th>
    ${pollOptions.map(o => `<th>${sanitizeHTML(o)}</th>`).join('')}
  </tr>
  <tr class="filter-row">${Array(colCount).fill('<td></td>').join('')}</tr>`;

    voteRows.forEach((row, i) => {
      let phone = row.phone || '';
      if (phone.startsWith("'")) phone = phone.slice(1);
      if (phone.includes('@')) phone = phone.split('@')[0];
      const date = row.date || (row.rawDate ? row.rawDate.toLocaleDateString(locale) : '');
      const time = row.time || (row.rawDate ? row.rawDate.toLocaleTimeString(locale) : '');

      html += `<tr class="${i % 2 === 0 ? 'even-row' : ''}">
    <td>${sanitizeHTML(row.name)}</td>
    <td style="mso-number-format:'\\@';">${sanitizeHTML(phone)}</td>
    <td>${sanitizeHTML(date)}</td><td>${sanitizeHTML(time)}</td>
    ${pollOptions.map((_, j) => `<td class="vote-cell">${row.votes && row.votes.includes(j) ? '<b>X</b>' : ''}</td>`).join('')}
  </tr>`;
    });

    html += `</table>
<!--[if gte mso 9]><xml>
  <x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
    <x:Name>Poll Votes</x:Name>
    <x:WorksheetOptions>${rtl ? '<x:DisplayRightToLeft/>' : ''}
      <x:Print><x:ValidPrinterInfo/></x:Print>
    </x:WorksheetOptions>
    <x:AutoFilter x:Range="A6:${lastCol}${6 + tableRows}" xmlns="urn:schemas-microsoft-com:office:excel"/>
  </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook>
</xml><![endif]-->
</body></html>`;

    const filename = `${(pollName || 'Poll').replace(/[\\/:*?"<>|]/g, '_')}_${Date.now()}.xls`;
    triggerDownload(new Blob([html], { type: 'application/vnd.ms-excel' }), filename);
    window.postMessage({ source: 'WAVoteExporter', exportComplete: true, success: true, method: 'html-excel', filename }, '*');
    return true;
  } catch (err) {
    console.error('HTML-Excel export failed:', err);
    exportToCSV(pollOptions, voteAccumulator, voteRows, pollName, pollCreationDate, language);
    return false;
  }
}

// ── Export: native XLSX ───────────────────────────────────────────────────────

function exportToNativeXLSX(pollOptions, voteAccumulator, voteRows, pollName, pollCreationDate, language) {
  try {
    const t      = key => getTranslation(key, language);
    const locale = localeFor(language);
    const rtl    = ['he', 'ar'].includes(language);

    const wb = window.XLSX.utils.book_new();
    if (!wb.Workbook) wb.Workbook = {};
    wb.Workbook.WBProps = { ...(wb.Workbook.WBProps || {}), codeName: 'ThisWorkbook' };
    if (rtl) { wb.Workbook.Views = [{ RTL: true }]; }

    const createdDate = formatDate(pollCreationDate);
    const createdTime = pollCreationDate.toLocaleTimeString(locale);

    const dataHeaders = [t('name'), t('phone'), t('responseDate'), t('responseTime'), ...pollOptions];
    const totalRow    = [t('total'), '', '', '', ...pollOptions.map((_, i) => voteAccumulator[i] || 0)];

    const ws_data = [
      [t('pollName'), t('pollCreatedDate'), t('pollCreatedTime')],
      [pollName || 'Poll', createdDate, createdTime],
      [],
      [],
      totalRow,
      dataHeaders,
      Array(dataHeaders.length).fill(''),
      ...voteRows.map(row => {
        let phone = row.phone || '';
        if (phone.startsWith("'")) phone = phone.slice(1);
        if (phone.includes('@')) phone = phone.split('@')[0];
        return [
          row.name,
          { v: phone, t: 's', z: '@' },
          { v: row.rawDate, t: 'd', z: window.XLSX.SSF.get_table()[14] },
          { v: row.rawDate, t: 'd', z: window.XLSX.SSF.get_table()[20] },
          ...pollOptions.map((_, i) => row.votes && row.votes.includes(i) ? 'X' : ''),
        ];
      }),
    ];

    const ws = window.XLSX.utils.aoa_to_sheet(ws_data);

    if (rtl) {
      ws['!sheetPr'] = { rightToLeft: true };
      ws['!sheetView'] = { rightToLeft: true };
    }

    ws['!cols'] = [{ wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, ...pollOptions.map(() => ({ wch: 15 }))];

    const lastCol = window.XLSX.utils.encode_col(dataHeaders.length - 1);
    ws['!autofilter'] = { ref: `A6:${lastCol}${voteRows.length + 7}` };

    if (window.XLSX.utils.encode_cell) {
      const hAlign = rtl ? 'right' : 'left';
      const styles = {
        title:   { font: { bold: true, sz: 14 }, fill: { fgColor: { rgb: 'EEEEEE' } }, alignment: { horizontal: hAlign } },
        colHead: { font: { bold: true, sz: 13 }, fill: { fgColor: { rgb: 'F2F2F2' } }, alignment: { horizontal: 'center' }, border: { top: { style: 'medium' }, bottom: { style: 'medium' }, left: { style: 'thin' }, right: { style: 'thin' } } },
        total:   { font: { bold: true, sz: 12 }, fill: { fgColor: { rgb: 'E6E6FA' } }, alignment: { horizontal: hAlign } },
        even:    { fill: { fgColor: { rgb: 'F8F8FF' } }, alignment: { horizontal: hAlign } },
        odd:     { alignment: { horizontal: hAlign } },
      };

      for (let c = 0; c < 3; c++) {
        const ref = window.XLSX.utils.encode_cell({ r: 0, c });
        if (ws[ref]) ws[ref].s = styles.title;
      }
      for (let c = 0; c < dataHeaders.length; c++) {
        const ref = window.XLSX.utils.encode_cell({ r: 5, c });
        if (ws[ref]) ws[ref].s = styles.colHead;
      }
      for (let c = 0; c < totalRow.length; c++) {
        const ref = window.XLSX.utils.encode_cell({ r: 4, c });
        if (ws[ref]) ws[ref].s = styles.total;
      }
      for (let r = 7; r < voteRows.length + 7; r++) {
        const rowStyle = r % 2 === 0 ? styles.even : styles.odd;
        for (let c = 0; c < dataHeaders.length; c++) {
          const ref = window.XLSX.utils.encode_cell({ r, c });
          if (!ws[ref]) continue;
          ws[ref].s = { ...rowStyle };
          if (c >= 4 && ws[ref].v === 'X') ws[ref].s.font = { bold: true };
        }
      }
    }

    window.XLSX.utils.book_append_sheet(wb, ws, 'Votes');

    const filename = `${(pollName || 'Poll').replace(/[\\/:*?"<>|]/g, '_')}_${Date.now()}.xlsx`;
    const wbout = window.XLSX.write(wb, { bookType: 'xlsx', bookSST: true, type: 'array', cellStyles: true, compression: true });

    if (!wbout || wbout.byteLength < 100) throw new Error('Invalid XLSX output');

    triggerDownload(
      new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      filename
    );
    window.postMessage({ source: 'WAVoteExporter', exportComplete: true, success: true, method: 'xlsx', filename }, '*');
    return true;
  } catch (err) {
    console.error('XLSX export failed, falling back to HTML-Excel:', err.message);
    return exportToExcelViaHTML(pollOptions, voteAccumulator, voteRows, pollName, pollCreationDate, language);
  }
}

// ── Download trigger ──────────────────────────────────────────────────────────

function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a   = document.createElement('a');
  a.href    = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  setTimeout(() => {
    a.click();
    setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 1000);
  }, 100);
}

// ── Main export handler ───────────────────────────────────────────────────────

window.addEventListener('message', async (e) => {
  if (e.data?.source !== 'WAVoteExporter' || !e.data.export) return;

  try {
    const preferredFormat = e.data.preferredFormat || 'auto';
    const language        = e.data.language || 'en';

    await loadTranslations();

    if (!window.Store) {
      return sendError('WhatsApp API not available');
    }
    if (!Store.PollVote?.getModelsArray) {
      return sendError('Poll functionality not available');
    }
    if (!Store.Msg?.getModelsArray) {
      return sendError('Message functionality not available');
    }

    // ── Find matching votes ─────────────────────────────────────────────────

    let votes = [];
    try {
      votes = Store.PollVote.getModelsArray().filter(x => {
        try { return idsMatch(e.data.export, x?.__x_parentMsgKey?._serialized); } catch { return false; }
      });
    } catch (err) { console.error('[PollExporter] Error getting votes:', err); }

    // ── Find matching poll message ──────────────────────────────────────────

    let poll = null;
    try {
      const pollMessages = Store.Msg.getModelsArray().filter(m => m?.type === 'poll_creation');
      poll = pollMessages.find(m => {
        try { return idsMatch(e.data.export, m?.__x_id?.id) || idsMatch(e.data.export, m?.__x_id?._serialized); }
        catch { return false; }
      });
    } catch (err) { console.error('[PollExporter] Error getting poll:', err); }

    if (!votes.length || !poll) return sendError('Poll data not found');
    if (!Array.isArray(poll.__x_pollOptions)) return sendError('Poll options not found');

    // ── Poll metadata ───────────────────────────────────────────────────────

    const pollOptions = poll.__x_pollOptions.map(x => x.name);
    let pollName = poll.__x_pollName || poll.__x_name || poll.__x_body || 'Poll';

    const pollCreationDate = new Date(poll.__x_t * 1000);

    const voteAccumulator = {};
    votes.forEach(x => {
      (x.__x_selectedOptionLocalIds || []).forEach(y => {
        if (y != null) voteAccumulator[y] = (voteAccumulator[y] || 0) + 1;
      });
    });

    // ── Poll creator name ───────────────────────────────────────────────────

    let pollCreator = null, pollCreatorName = null, pollCreatorPushname = null;
    try {
      if (poll.__x_sender) {
        pollCreator = poll.__x_sender;
        pollCreatorPushname = pollCreator.pushname || null;
        if (Store.Contact?.getModelsArray) {
          const cc = Store.Contact.getModelsArray().find(c =>
            c?.__x_id && String(c.__x_id.user) === String(pollCreator.user)
          );
          if (cc?.__x_name && cc.__x_name !== String(cc.__x_id.user)) {
            pollCreatorName = cc.__x_name;
          }
        }
      }
    } catch {}

    // ── Build vote rows ─────────────────────────────────────────────────────

    let contacts = [];
    try {
      if (Store.Contact?.getModelsArray) contacts = Store.Contact.getModelsArray();
    } catch {}

    const voteRows = votes.map(v => {
      if (!v?.__x_sender?.user || !Array.isArray(v.__x_selectedOptionLocalIds)) return null;

      const userPhone = String(v.__x_sender.user);
      const contact   = contacts.find(c => c?.__x_id && String(c.__x_id.user) === userPhone) || null;

      let name = extractContactName(v, contact);
      if (pollCreator && userPhone === String(pollCreator.user)) {
        name = pollCreatorName || pollCreatorPushname || name;
      }

      const ts = processTimestamp(v, poll);

      return {
        name,
        phone: formatPhone(userPhone),
        date:  formatDate(ts.validDate),
        time:  ts.validDate.toLocaleTimeString(localeFor(language)),
        rawDate:   ts.validDate,
        timestamp: ts.timestamp,
        votes: v.__x_selectedOptionLocalIds,
      };
    }).filter(Boolean);

    voteRows.sort((a, b) => {
      const d = (a.timestamp || 0) - (b.timestamp || 0);
      return d !== 0 ? d : (a.name || '').localeCompare(b.name || '');
    });

    // ── Dispatch export ─────────────────────────────────────────────────────

    const xlsxReady = isXLSXAvailable();

    if (preferredFormat === 'csv') {
      exportToCSV(pollOptions, voteAccumulator, voteRows, pollName, pollCreationDate, language);
    } else if (preferredFormat === 'xlsx') {
      xlsxReady
        ? exportToNativeXLSX(pollOptions, voteAccumulator, voteRows, pollName, pollCreationDate, language)
        : exportToExcelViaHTML(pollOptions, voteAccumulator, voteRows, pollName, pollCreationDate, language);
    } else if (preferredFormat === 'html-excel') {
      exportToExcelViaHTML(pollOptions, voteAccumulator, voteRows, pollName, pollCreationDate, language);
    } else {
      xlsxReady
        ? exportToNativeXLSX(pollOptions, voteAccumulator, voteRows, pollName, pollCreationDate, language)
        : exportToExcelViaHTML(pollOptions, voteAccumulator, voteRows, pollName, pollCreationDate, language);
    }
  } catch (err) {
    console.error('[PollExporter] Export error:', err);
    sendError(err.message || 'Unknown error');
  }

  function sendError(msg) {
    window.postMessage({ source: 'WAVoteExporter', exportComplete: true, success: false, error: msg }, '*');
  }
});
