'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import type { BenefitTable, TableColumn, TableRow } from '@/lib/content/types';

interface TableEditorProps {
  table: BenefitTable;
  onChange: (table: BenefitTable) => void;
  onRemove: () => void;
}

export function TableEditor({ table, onChange, onRemove }: TableEditorProps) {
  const updateField = (field: keyof BenefitTable, value: any) => {
    onChange({ ...table, [field]: value });
  };

  const updateCell = (rowIdx: number, colIdx: number, value: string) => {
    const rows = [...table.rows];
    const cells = [...rows[rowIdx].cells];
    cells[colIdx] = value;
    rows[rowIdx] = { ...rows[rowIdx], cells };
    updateField('rows', rows);
  };

  const updateRowLabel = (rowIdx: number, label: string) => {
    const rows = [...table.rows];
    rows[rowIdx] = { ...rows[rowIdx], label };
    updateField('rows', rows);
  };

  const updateColumnLabel = (colIdx: number, label: string) => {
    const cols = [...table.columns];
    cols[colIdx] = { ...cols[colIdx], label };
    updateField('columns', cols);
  };

  const updateColumnSubLabel = (colIdx: number, subLabel: string) => {
    const cols = [...table.columns];
    cols[colIdx] = { ...cols[colIdx], subLabel: subLabel || undefined };
    updateField('columns', cols);
  };

  const addRow = () => {
    const newRow: TableRow = {
      _key: `row-${Date.now()}`,
      label: '',
      cells: table.columns.map(() => ''),
    };
    updateField('rows', [...table.rows, newRow]);
  };

  const removeRow = (rowIdx: number) => {
    updateField('rows', table.rows.filter((_, i) => i !== rowIdx));
  };

  const addColumn = () => {
    const newCol: TableColumn = {
      _key: `col-${Date.now()}`,
      key: `col_${Date.now()}`,
      label: 'New Column',
    };
    const cols = [...table.columns, newCol];
    const rows = table.rows.map((row) => ({
      ...row,
      cells: [...row.cells, ''],
    }));
    onChange({ ...table, columns: cols, rows });
  };

  const removeColumn = (colIdx: number) => {
    const cols = table.columns.filter((_, i) => i !== colIdx);
    const rows = table.rows.map((row) => ({
      ...row,
      cells: row.cells.filter((_, i) => i !== colIdx),
    }));
    onChange({ ...table, columns: cols, rows });
  };

  return (
    <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50/50">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Input
            value={table.tableTitle || ''}
            onChange={(e) => updateField('tableTitle', e.target.value)}
            placeholder="Table title"
            className="font-semibold text-sm"
          />
          <Input
            value={table.tableDescription || ''}
            onChange={(e) => updateField('tableDescription', e.target.value)}
            placeholder="Table description (optional)"
            className="text-xs"
          />
        </div>
        <Button variant="ghost" size="sm" onClick={onRemove} className="ml-2 text-red-500 hover:text-red-700">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {table.templateId && (
        <div className="text-xs text-slate-400">Template: {table.templateId}</div>
      )}

      {/* Table Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr>
              <th className="p-1 text-left text-slate-500 font-medium w-40 min-w-[140px]">
                Row Label
              </th>
              {table.columns.map((col, ci) => (
                <th key={col._key} className="p-1 min-w-[120px]">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1">
                      <Input
                        value={col.label}
                        onChange={(e) => updateColumnLabel(ci, e.target.value)}
                        className="h-7 text-xs font-semibold"
                      />
                      {table.columns.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeColumn(ci)} className="h-7 w-7 p-0 text-red-400">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                    <Input
                      value={col.subLabel || ''}
                      onChange={(e) => updateColumnSubLabel(ci, e.target.value)}
                      placeholder="Sub-label"
                      className="h-6 text-[10px] text-slate-400"
                    />
                  </div>
                </th>
              ))}
              <th className="p-1 w-8">
                <Button variant="ghost" size="sm" onClick={addColumn} className="h-7 w-7 p-0 text-blue-500" title="Add column">
                  <Plus className="h-3 w-3" />
                </Button>
              </th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, ri) => (
              <tr key={row._key} className={row.isSection ? 'bg-slate-200' : ri % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="p-1">
                  <Input
                    value={row.label}
                    onChange={(e) => updateRowLabel(ri, e.target.value)}
                    className={`h-7 text-xs ${row.isSection ? 'font-bold' : ''}`}
                  />
                </td>
                {table.columns.map((_, ci) => (
                  <td key={ci} className="p-1">
                    {row.isSection ? (
                      <span className="text-xs text-slate-500 px-2">—</span>
                    ) : (
                      <Input
                        value={row.cells[ci] ?? ''}
                        onChange={(e) => updateCell(ri, ci, e.target.value)}
                        className="h-7 text-xs"
                      />
                    )}
                  </td>
                ))}
                <td className="p-1">
                  <Button variant="ghost" size="sm" onClick={() => removeRow(ri)} className="h-7 w-7 p-0 text-red-400">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Button variant="outline" size="sm" onClick={addRow} className="text-xs">
        <Plus className="h-3 w-3 mr-1" /> Add Row
      </Button>
    </div>
  );
}

interface ChapterTablesEditorProps {
  tables: BenefitTable[];
  onChange: (tables: BenefitTable[]) => void;
}

export function ChapterTablesEditor({ tables, onChange }: ChapterTablesEditorProps) {
  const updateTable = (idx: number, table: BenefitTable) => {
    const updated = [...tables];
    updated[idx] = table;
    onChange(updated);
  };

  const removeTable = (idx: number) => {
    onChange(tables.filter((_, i) => i !== idx));
  };

  const addTable = () => {
    const newTable: BenefitTable = {
      _key: `tbl-${Date.now()}`,
      tableTitle: 'New Table',
      columns: [
        { _key: 'col-0', key: 'col_0', label: 'Column 1' },
      ],
      rows: [
        { _key: 'row-0', label: 'Row 1', cells: [''] },
      ],
    };
    onChange([...tables, newTable]);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">
          Tables ({tables.length})
        </label>
        <Button variant="outline" size="sm" onClick={addTable} className="text-xs">
          <Plus className="h-3 w-3 mr-1" /> Add Table
        </Button>
      </div>
      {tables.map((table, idx) => (
        <TableEditor
          key={table._key}
          table={table}
          onChange={(t) => updateTable(idx, t)}
          onRemove={() => removeTable(idx)}
        />
      ))}
    </div>
  );
}
