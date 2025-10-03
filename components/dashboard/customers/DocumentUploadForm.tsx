"use client"
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, CheckCircle, AlertTriangle, X, Loader2 } from 'lucide-react'
import api from '@/lib/axios'
import toast from 'react-hot-toast'

interface DocumentUpload {
  id: string
  documentType: string
  documentNumber: string
  documentUrl: string
  originalName: string
  fileSize: number
  mimeType: string
  status: string
  uploadedAt: string
  verifiedAt?: string
  verifiedBy?: string
  rejectionReason?: string
}

interface DocumentUploadFormProps {
  uploadedDocuments: DocumentUpload[]
  onDocumentsChange: (documents: DocumentUpload[]) => void
}

export const DocumentUploadForm: React.FC<DocumentUploadFormProps> = ({
  uploadedDocuments,
  onDocumentsChange
}) => {
  const [uploading, setUploading] = useState<string | null>(null)

  // Use backend enum values
  const documentTypes = [
    { id: 'NATIONAL_ID', name: 'National ID', required: true },
    { id: 'PASSPORT', name: 'Passport', required: false },
    { id: 'DRIVING_LICENSE', name: 'Driving License', required: false },
    { id: 'UTILITY_BILL', name: 'Utility Bill', required: true },
    { id: 'BANK_STATEMENT', name: 'Bank Statement', required: true }
  ]

  const handleFileUpload = async (documentType: string, file: File) => {
    setUploading(documentType)
    
    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf']
      if (!allowedTypes.includes(file.type)) {
        toast.error('Invalid file type. Please upload PDF, JPG, or PNG files only.')
        return
      }

      // Validate file size (2MB limit)
      const maxSize = 2 * 1024 * 1024 // 2MB
      if (file.size > maxSize) {
        toast.error('File size too large. Please upload files smaller than 2MB.')
        return
      }

      // Create FormData for upload
      const formData = new FormData()
      formData.append('file', file)
      formData.append('documentType', documentType)

      console.log('Uploading document:', { documentType, fileName: file.name })

      // Upload to backend
      const response = await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      console.log('Upload response:', response.data)

      // Check if upload was successful (backend returns message and document)
      if (response.data.message && response.data.document) {
        const uploadedDoc = response.data.document
        
        console.log('Uploaded document data:', uploadedDoc)
        
        // Create document object with backend response
        const newDocument: DocumentUpload = {
          id: uploadedDoc.id,
          documentType: uploadedDoc.documentType,
          documentNumber: uploadedDoc.documentNumber || '',
          documentUrl: uploadedDoc.documentUrl,
          originalName: uploadedDoc.originalName,
          fileSize: uploadedDoc.fileSize,
          mimeType: uploadedDoc.mimeType,
          status: uploadedDoc.status,
          uploadedAt: uploadedDoc.uploadedAt
        }

        console.log('New document object:', newDocument)
        console.log('Current uploaded documents:', uploadedDocuments)

        // Remove any existing document of the same type
        const filteredDocs = uploadedDocuments.filter(doc => doc.documentType !== documentType)
        
        console.log('Filtered documents:', filteredDocs)
        
        // Add the new document
        const updatedDocuments = [...filteredDocs, newDocument]
        console.log('Updated documents:', updatedDocuments)
        
        onDocumentsChange(updatedDocuments)
        
        toast.success(`${documentTypes.find(dt => dt.id === documentType)?.name} uploaded successfully!`)
      } else {
        console.error('Upload failed:', response.data)
        toast.error(response.data.message || 'Upload failed')
      }
    } catch (error: any) {
      console.error('Upload error:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Upload failed'
      toast.error(errorMessage)
    } finally {
      setUploading(null)
    }
  }

  const removeDocument = (documentId: string) => {
    console.log('Removing document:', documentId)
    const updatedDocs = uploadedDocuments.filter(doc => doc.id !== documentId)
    console.log('Documents after removal:', updatedDocs)
    onDocumentsChange(updatedDocs)
    toast.success('Document removed')
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Rejected</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800"><FileText className="h-3 w-3 mr-1" />Pending</Badge>
      default:
        return <Badge variant="outline">Uploaded</Badge>
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Debug: Log current state
  console.log('DocumentUploadForm - uploadedDocuments:', uploadedDocuments)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Document Upload
        </CardTitle>
        <CardDescription>
          Upload required business documents for verification. Files will be uploaded immediately to the backend.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {documentTypes.map((docType) => {
            const existingDoc = uploadedDocuments.find(doc => doc.documentType === docType.id)
            const isUploading = uploading === docType.id
            
            return (
              <div key={docType.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    {docType.name}
                    {docType.required && <span className="text-red-500 ml-1">*</span>}
                  </Label>
                  {existingDoc && getStatusBadge(existingDoc.status)}
                </div>
                
                {existingDoc ? (
                  <div className="border rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{existingDoc.originalName}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(existingDoc.fileSize)}</p>
                        {existingDoc.rejectionReason && (
                          <p className="text-xs text-red-600 mt-1">{existingDoc.rejectionReason}</p>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(existingDoc.id)}
                        className="text-red-600 hover:text-red-700"
                        disabled={isUploading}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png,.webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleFileUpload(docType.id, file)
                        }
                      }}
                      disabled={isUploading}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Accepted formats: PDF, JPG, PNG, WebP (Max 2MB)
                    </p>
                    {isUploading && (
                      <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {uploadedDocuments.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Uploaded Documents ({uploadedDocuments.length})</h3>
            <div className="space-y-2">
              {uploadedDocuments.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-gray-500" />
                    <div>
                      <p className="text-sm font-medium">{doc.originalName}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(doc.fileSize)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(doc.status)}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDocument(doc.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
