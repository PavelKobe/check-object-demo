/**
 * printCheck.js — печатная форма чек-листа.
 * Открывает окно печати — в Chrome/Edge (Windows 10) выберите «Сохранить как PDF».
 * Кириллица отображается корректно.
 */
import {
    BLOCK1_ITEMS,
    BLOCK3_ITEMS,
    BLOCK4_ITEMS,
    BLOCK5_ITEMS,
    BLOCK7_ITEMS,
    BLOCK8_ITEMS,
} from '../components/checklistData';

const BLOCK_DEFS = [
    { num: 1, title: 'Общие критерии безопасности', items: BLOCK1_ITEMS },
    { num: 3, title: 'КПП (входные группы)', items: BLOCK3_ITEMS },
    { num: 4, title: 'Кассы', items: BLOCK4_ITEMS },
    { num: 5, title: 'Инкасса', items: BLOCK5_ITEMS },
    { num: 7, title: 'ЧОП — Внешний вид', items: BLOCK7_ITEMS },
    { num: 8, title: 'Мониторка', items: BLOCK8_ITEMS },
];

function esc(s) {
    if (s == null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function blockRows(p, items) {
    return items
        .map(
            (item) =>
                `<tr><td>${p[item.key] ? '✓' : '☐'}</td><td>${esc(item.label)}</td><td>${item.weight}%</td></tr>`
        )
        .join('');
}

export function printCheckToPdf(check) {
    if (!check) return;

    const p = check.payload || {};
    const d = check.details || {};
    const totalStaff = p.b2_total_staff ?? '—';
    const absentPosts = p.b2_absent_posts ?? '—';
    const factPosts =
        typeof totalStaff === 'number' && typeof absentPosts === 'number'
            ? totalStaff - absentPosts
            : '—';

    const block2Html = `
    <div class="block">
      <div class="block-title">Блок 2: % присутствия сотрудников ЧОП (балл: ${d.block_2 != null ? d.block_2 + '%' : '—'})</div>
      <table class="block-table"><tbody>
        <tr><td>По штату</td><td>${esc(totalStaff)}</td><td></td></tr>
        <tr><td>Отсутствует постов</td><td>${esc(absentPosts)}</td><td></td></tr>
        <tr><td>По факту</td><td>${esc(factPosts)}</td><td></td></tr>
      </tbody></table>
    </div>`;

    const block6Html = `
    <div class="block">
      <div class="block-title">Блок 6: Двери (СКУД) (балл: ${d.block_6 != null ? d.block_6 + '%' : '—'})</div>
      <table class="block-table"><tbody>
        <tr><td>Закрыто дверей</td><td>${esc(p.b6_closed_doors)} из ${esc(p.b6_total_doors)}</td><td></td></tr>
      </tbody></table>
    </div>`;

    function makeBlock(b) {
        const score = d[`block_${b.num}`] != null ? d[`block_${b.num}`] + '%' : '—';
        return `
    <div class="block">
      <div class="block-title">Блок ${b.num}: ${b.title} (балл: ${score})</div>
      <table class="block-table"><thead><tr><th>Статус</th><th>Пункт</th><th>Вес</th></tr></thead>
      <tbody>${blockRows(p, b.items)}</tbody></table>
    </div>`;
    }

    const blocksHtml = [
        makeBlock(BLOCK_DEFS[0]),
        block2Html,
        makeBlock(BLOCK_DEFS[1]),
        makeBlock(BLOCK_DEFS[2]),
        makeBlock(BLOCK_DEFS[3]),
        block6Html,
        makeBlock(BLOCK_DEFS[4]),
        makeBlock(BLOCK_DEFS[5]),
    ].join('');

    const fullHtml = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Чек-лист: ${esc(check.store_name)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.4; color: #333; margin: 16px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #6366f1; padding-bottom: 12px; }
    .header h1 { margin: 0; font-size: 18pt; }
    .header .meta { font-size: 10pt; color: #666; }
    .header .badge { font-weight: bold; font-size: 12pt; padding: 4px 12px; border-radius: 6px; background: #6366f1; color: white; }
    .block { margin-bottom: 16px; break-inside: avoid; }
    .block-title { font-weight: bold; font-size: 10pt; margin-bottom: 6px; color: #6366f1; }
    .block-table { width: 100%; border-collapse: collapse; font-size: 9pt; }
    .block-table th, .block-table td { border: 1px solid #ccc; padding: 4px 8px; text-align: left; }
    .block-table th { background: #6366f1; color: white; }
    .block-table td:first-child { width: 40px; text-align: center; }
    .block-table td:last-child { width: 50px; text-align: right; }
    @media print { body { margin: 12px; } .block { break-inside: avoid; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Чек-лист: ${esc(check.store_name)}</h1>
      <div class="meta">Дата: ${esc(check.timestamp)}</div>
    </div>
    <div class="badge">${esc(check.total_score)}% — ${esc(check.grade)}</div>
  </div>
  ${blocksHtml}
</body>
</html>`;

    const win = window.open('', '_blank');
    win.document.write(fullHtml);
    win.document.close();
    win.focus();
    win.onafterprint = () => win.close();
    setTimeout(() => win.print(), 300);
}
