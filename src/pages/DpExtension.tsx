import { useState, useMemo } from 'react'
import { FileSpreadsheet, FileUp, Save, Trash2, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useExcelStore } from '@/store/excelStore'

export default function DpExtension() {
  const {
    filePath,
    headers,
    rows,
    deletedIndices,
    setFilePath,
    setExcelData,
    deleteRow,
    restoreRow,
    reset,
  } = useExcelStore()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const displayedRows = useMemo(() => {
    return rows.map((row, i) => ({
      row,
      index: i,
      deleted: deletedIndices.includes(i),
    }))
  }, [rows, deletedIndices])

  const handleOpenFile = async () => {
    setStatus(null)
    try {
      const result = await window.ipcRenderer.invoke('dialog:openFile')
      if (!result?.filePath) return

      setFilePath(result.filePath)
      setLoading(true)

      const data = await window.ipcRenderer.invoke('excel:read', {
        filePath: result.filePath,
      })

      if (!data.success) {
        setStatus(data.error ?? 'Failed to read file')
        return
      }

      setExcelData(data.headers, data.rows)
      setStatus(`Loaded ${data.rows.length} rows`)
    } catch (err) {
      setStatus(String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleWrite = async () => {
    if (!filePath) return

    const confirmed = await window.ipcRenderer.invoke('dialog:confirm', {
      title: 'Write to Excel',
      message: `Write ${rows.length - deletedIndices.length} rows to the file? Deleted rows will be permanently removed.`,
    })

    if (!confirmed) return

    setSaving(true)
    try {
      const liveRows = rows.filter((_, i) => !deletedIndices.includes(i))
      const result = await window.ipcRenderer.invoke('excel:write', {
        filePath,
        headers,
        rows: liveRows,
      })

      if (!result.success) {
        setStatus(result.error ?? 'Failed to write file')
        return
      }

      setExcelData(headers, liveRows)
      setStatus(`Saved ${liveRows.length} rows to file`)
    } catch (err) {
      setStatus(String(err))
    } finally {
      setSaving(false)
    }
  }

  const handleNewFile = () => {
    reset()
    setStatus(null)
  }

  if (!filePath) {
    return (
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
          <FileSpreadsheet size={24} /> DP Extension
        </h2>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <p className="text-muted-foreground">
              Select an Excel file to import data
            </p>
            <Button onClick={handleOpenFile} disabled={loading}>
              <FileUp className="mr-2" size={16} />
              {loading ? 'Opening...' : 'Open Excel File'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold flex items-center gap-2 mb-6">
        <FileSpreadsheet size={24} /> DP Extension
      </h2>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Excel Data</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground truncate max-w-xs">
                {filePath.split(/[/\\]/).pop()}
              </span>
              <Button variant="outline" size="sm" onClick={handleOpenFile} disabled={loading}>
                <FileUp className="mr-1" size={14} />
                Open
              </Button>
              <Button variant="ghost" size="sm" onClick={handleNewFile}>
                New
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Loading...</p>
          ) : headers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No data</p>
          ) : (
            <>
              <div className="border rounded-md max-h-96 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {headers.map((header) => (
                        <TableHead key={header} className="whitespace-nowrap">
                          {header}
                        </TableHead>
                      ))}
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedRows.map(({ row, index, deleted }) => (
                      <TableRow key={index} className={deleted ? 'opacity-40' : ''}>
                        {headers.map((header) => (
                          <TableCell
                            key={header}
                            className={`whitespace-nowrap ${deleted ? 'line-through' : ''}`}
                          >
                            {row[header]}
                          </TableCell>
                        ))}
                        <TableCell>
                          {deleted ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => restoreRow(index)}
                              title="Restore row"
                            >
                              <RotateCcw size={14} />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteRow(index)}
                              title="Delete row"
                            >
                              <Trash2 size={14} className="text-destructive" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <span className="text-sm text-muted-foreground">
                  {rows.length} rows loaded
                  {deletedIndices.length > 0 &&
                    `, ${deletedIndices.length} marked for deletion`}
                </span>
                <Button onClick={handleWrite} disabled={saving} size="sm">
                  <Save className="mr-1" size={14} />
                  {saving ? 'Saving...' : 'Write to Excel'}
                </Button>
              </div>
            </>
          )}

          {status && (
            <p className="text-sm text-muted-foreground mt-2">{status}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
