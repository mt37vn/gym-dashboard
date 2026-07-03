import { useState, useRef, type DragEvent } from 'react'

interface Props {
  onFile: (text: string) => void
}

export default function FileUpload({ onFile }: Props) {
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onFile(reader.result)
      }
    }
    reader.readAsText(file)
  }

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const onDragOver = (e: DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }

  const onDragLeave = () => setDragging(false)

  return (
    <div
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
        dragging
          ? 'border-accent bg-accent/5'
          : 'border-border hover:border-accent/50 hover:bg-bg-card'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
      {fileName ? (
        <div>
          <div className="text-accent font-display text-lg mb-1">{fileName}</div>
          <p className="text-text-muted text-sm">Drop a new file or click to replace</p>
        </div>
      ) : (
        <div>
          <svg
            className="w-8 h-8 mx-auto mb-3 text-text-muted"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <p className="text-text-primary font-medium mb-1">
            Drop your StrengthLog CSV here
          </p>
          <p className="text-text-muted text-sm">or click to browse</p>
        </div>
      )}
    </div>
  )
}
