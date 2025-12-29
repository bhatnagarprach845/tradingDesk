import React from 'react'
export default function ResultTable({rows, columns}){
    return (
        <table border="1" cellPadding="6" style={{borderCollapse:'collapse'}}>
            <thead>
                <tr>{columns.map(c=> <th key={c}>{c}</th>)}</tr>
            </thead>
            <tbody>
                {rows.map((r, idx)=> (
                    <tr key={idx}>
                    {columns.map(c=> <td key={c}>{String(r[c] ?? '')}</td>)}
                    </tr>
                ))}
            </tbody>
        </table>
    )
}
