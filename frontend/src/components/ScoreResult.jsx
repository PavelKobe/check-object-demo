/**
 * ScoreResult.jsx
 */
export default function ScoreResult({ result }) {
    if (!result) return null;

    const gradeColors = {
        'отлично': '#22c55e',
        'хорошо': '#3b82f6',
        'удовлетворительно': '#f59e0b',
        'неудовлетворительно': '#ef4444',
    };

    const blockNames = [
        'Общие критерии безопасности',
        '% присутствия сотрудников ЧОП',
        'КПП (входные группы)',
        'Кассы',
        'Инкасса',
        'Двери (СКУД)',
        'ЧОП — внешний вид',
        'Мониторка',
    ];

    const color = gradeColors[result.grade] || '#94a3b8';

    return (
        <div className="score-result">
            <div className="score-main" style={{ borderColor: color }}>
                <div className="score-percent" style={{ color }}>{result.total_score}%</div>
                <div className="score-grade" style={{ background: color }}>{result.grade}</div>
                <div className="score-store">🏪 {result.store_name}</div>
            </div>
            <div className="score-blocks">
                <h3>Разбивка по блокам</h3>
                {Object.entries(result.details).map(([key, val], i) => {
                    const pct = Number(val);
                    return (
                        <div key={key} className="block-row">
                            <span className="block-label">{i + 1}. {blockNames[i]}</span>
                            <div className="block-bar-wrap">
                                <div
                                    className="block-bar"
                                    style={{
                                        width: `${pct}%`,
                                        background: pct >= 76 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444',
                                    }}
                                />
                            </div>
                            <span className="block-pct">{pct.toFixed(1)}%</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
