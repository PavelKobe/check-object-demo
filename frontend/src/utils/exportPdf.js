/**
 * exportPdf.js — export single check to PDF
 */
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import {
    BLOCK1_ITEMS,
    BLOCK3_ITEMS,
    BLOCK4_ITEMS,
    BLOCK5_ITEMS,
    BLOCK7_ITEMS,
    BLOCK8_ITEMS,
} from '../components/checklistData';

const BLOCK_DEFS = [
    { num: 1, title: 'Общие критерии безопасности', weight: 15, items: BLOCK1_ITEMS },
    { num: 3, title: 'КПП (входные группы)', weight: 15, items: BLOCK3_ITEMS },
    { num: 4, title: 'Кассы', weight: 10, items: BLOCK4_ITEMS },
    { num: 5, title: 'Инкасса', weight: 10, items: BLOCK5_ITEMS },
    { num: 7, title: 'ЧОП — Внешний вид', weight: 15, items: BLOCK7_ITEMS },
    { num: 8, title: 'Мониторка', weight: 15, items: BLOCK8_ITEMS },
];

function addBlockTable(doc, tableOpts, head, body, columnStyles) {
    doc.autoTable({
        ...tableOpts,
        head: [head],
        body,
        theme: 'grid',
        ...(columnStyles && { columnStyles }),
    });
    tableOpts.startY = doc.lastAutoTable.finalY + 6;
}

export function exportCheckToPdf(check) {
    if (!check) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const p = check.payload || {};
    const d = check.details || {};
    let y = 15;

    // Header
    doc.setFontSize(16);
    doc.text(`Чек-лист: ${check.store_name}`, 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.text(`Дата: ${check.timestamp}`, 14, y);
    doc.text(`${check.total_score}% — ${check.grade}`, doc.internal.pageSize.getWidth() - 14, y, { align: 'right' });
    y += 12;

    const tableOpts = {
        startY: y,
        headStyles: { fillColor: [99, 102, 241] },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 8 },
        columnStyles: { 0: { cellWidth: 12 }, 1: { cellWidth: 'auto' }, 2: { cellWidth: 18 } },
    };

    // Block 1
    const b1Score = d.block_1 !== undefined ? `${d.block_1}%` : '—';
    const b1Body = BLOCK_DEFS[0].items.map((item) => [p[item.key] ? '✅' : '☐', item.label, String(item.weight)]);
    addBlockTable(doc, tableOpts, `Блок 1: Общие критерии безопасности (балл: ${b1Score})`, b1Body);

    // Block 2 — numeric
    const totalStaff = p.b2_total_staff ?? '—';
    const absentPosts = p.b2_absent_posts ?? '—';
    const factPosts =
        typeof totalStaff === 'number' && typeof absentPosts === 'number'
            ? totalStaff - absentPosts
            : '—';
    const b2Score = d.block_2 !== undefined ? `${d.block_2}%` : '—';
    addBlockTable(
        doc,
        tableOpts,
        `Блок 2: % присутствия сотрудников ЧОП (балл: ${b2Score})`,
        [
            ['По штату', String(totalStaff), ''],
            ['Отсутствует постов', String(absentPosts), ''],
            ['По факту', String(factPosts), ''],
        ],
        { 0: { cellWidth: 50 }, 1: { cellWidth: 30 }, 2: { cellWidth: 'auto' } }
    );

    // Block 3
    const b3Score = d.block_3 !== undefined ? `${d.block_3}%` : '—';
    const b3Body = BLOCK_DEFS[1].items.map((item) => [p[item.key] ? '✅' : '☐', item.label, String(item.weight)]);
    addBlockTable(doc, tableOpts, `Блок 3: КПП (входные группы) (балл: ${b3Score})`, b3Body);

    // Block 4
    const b4Score = d.block_4 !== undefined ? `${d.block_4}%` : '—';
    const b4Body = BLOCK_DEFS[2].items.map((item) => [p[item.key] ? '✅' : '☐', item.label, String(item.weight)]);
    addBlockTable(doc, tableOpts, `Блок 4: Кассы (балл: ${b4Score})`, b4Body);

    // Block 5
    const b5Score = d.block_5 !== undefined ? `${d.block_5}%` : '—';
    const b5Body = BLOCK_DEFS[3].items.map((item) => [p[item.key] ? '✅' : '☐', item.label, String(item.weight)]);
    addBlockTable(doc, tableOpts, `Блок 5: Инкасса (балл: ${b5Score})`, b5Body);

    // Block 6 — doors
    const b6Score = d.block_6 !== undefined ? `${d.block_6}%` : '—';
    addBlockTable(
        doc,
        tableOpts,
        `Блок 6: Двери (СКУД) (балл: ${b6Score})`,
        [['Закрыто дверей', `${p.b6_closed_doors ?? '—'} из ${p.b6_total_doors ?? '—'}`, '']]
    );

    // Block 7
    const b7Score = d.block_7 !== undefined ? `${d.block_7}%` : '—';
    const b7Body = BLOCK_DEFS[4].items.map((item) => [p[item.key] ? '✅' : '☐', item.label, String(item.weight)]);
    addBlockTable(doc, tableOpts, `Блок 7: ЧОП — Внешний вид (балл: ${b7Score})`, b7Body);

    // Block 8
    const b8Score = d.block_8 !== undefined ? `${d.block_8}%` : '—';
    const b8Body = BLOCK_DEFS[5].items.map((item) => [p[item.key] ? '✅' : '☐', item.label, String(item.weight)]);
    addBlockTable(doc, tableOpts, `Блок 8: Мониторка (балл: ${b8Score})`, b8Body);

    const safeName = (check.store_name || 'check').replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    const safeDate = (check.timestamp || '').replace(/[/:]/g, '-').slice(0, 16);
    doc.save(`check-${safeName}-${safeDate}.pdf`);
}
