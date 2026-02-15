import React from 'react';

interface Column {
  header: string;
  accessor: string;
  align?: 'left' | 'right' | 'center';
  className?: string;
  format?: (value: any) => string;
}

interface ReportTableProps {
  columns: Column[];
  data: any[];
  className?: string;
}

export function ReportTable({ columns, data, className = '' }: ReportTableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="min-w-full border-collapse border-2 border-gray-600" style={{ fontSize: '9px' }}>
        <thead className="bg-gray-700">
          <tr>
            {columns.map((column, index) => (
              <th
                key={index}
                className={`px-1 py-1 text-${column.align || 'left'} font-bold text-white border border-gray-600 whitespace-nowrap`}
                style={{ fontSize: '9px' }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-100'}>
              {columns.map((column, colIndex) => {
                const value = row[column.accessor];
                const formattedValue = column.format ? column.format(value) : value;

                return (
                  <td
                    key={colIndex}
                    className={`px-1 py-0.5 text-${column.align || 'left'} border border-gray-400 text-gray-900 ${column.className || ''} whitespace-nowrap`}
                    style={{ fontSize: '9px' }}
                  >
                    {formattedValue}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
