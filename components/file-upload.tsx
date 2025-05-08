"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, X, FileAudio } from "lucide-react"
import type { UploadedFile } from "@/types"

interface FileUploadProps {
  onFileUploaded: (uploadedFile: UploadedFile) => void
  accept?: string
  label: string
  icon?: React.ReactNode
}

export function FileUpload({ onFileUploaded, accept = "*", label, icon }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      processFile(droppedFile)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      processFile(selectedFile)
    }
  }

  const processFile = (file: File) => {
    setFile(file)

    // Создаем URL для файла
    const fileUrl = URL.createObjectURL(file)

    // Передаем информацию о файле родительскому компоненту
    onFileUploaded({
      file,
      url: fileUrl,
    })
  }

  const clearFile = () => {
    if (file) {
      URL.revokeObjectURL(URL.createObjectURL(file))
    }
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Card
      className={`p-4 border-2 border-dashed ${
        isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20"
      } transition-colors`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center gap-2 text-center">
        {file ? (
          <div className="w-full">
            <div className="flex items-center justify-between p-2 bg-muted rounded-md">
              <div className="flex items-center gap-2 truncate">
                {icon || <FileAudio className="h-5 w-5 text-primary" />}
                <span className="text-sm font-medium truncate">{file.name}</span>
                <span className="text-xs text-muted-foreground">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
              </div>
              <Button variant="ghost" size="icon" onClick={clearFile} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-4 rounded-full bg-muted">{icon || <Upload className="h-6 w-6 text-primary" />}</div>
            <div>
              <p className="font-medium">{label}</p>
              <p className="text-sm text-muted-foreground">Перетащите файл сюда или нажмите для выбора</p>
            </div>
            <Label
              htmlFor="file-upload"
              className="cursor-pointer bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
            >
              Выбрать файл
            </Label>
          </>
        )}
        <Input
          id="file-upload"
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          ref={fileInputRef}
        />
      </div>
    </Card>
  )
}
