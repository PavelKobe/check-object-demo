/**
 * exportExcel.js — export checks list to Excel
 */
import * as XLSX from 'xlsx';

export function exportChecksToExcel(checks) {
    if (!checks || checks.length === 0) return;

    const rows = checks.map((c, i) => {
        const p = c.payload || {};
        const totalStaff = p.b2_total_staff ?? null;
        const absent = p.b2_absent_posts ?? null;
        const factPosts =
            typeof totalStaff === 'number' && typeof absent === 'number' ? totalStaff - absent : '—';

        return {
            '#': checks.length - i,
            'Дата / Время': c.timestamp,
            Магазин: c.store_name,
            'По штату': totalStaff ?? '—',
            'По факту': factPosts,
            Балл: `${c.total_score}%`,
            Категория: c.grade,
        };
    });

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Проверки');

    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `checks-${date}.xlsx`);
}
