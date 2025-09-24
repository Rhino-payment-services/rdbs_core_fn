"use client"
import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, CheckCircle, AlertTriangle, X } from 'lucide-react'

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
  const [uploading, setUploading] = useState(false)

  const documentTypes = [
    { id: 'certificate_of_incorporation', name: 'Certificate of Incorporation', required: true },
    { id: 'tax_registration_certificate', name: 'Tax Registration Certificate', required: true },
    { id: 'business_permit', name: 'Business Permit', required: true },
    { id: 'bank_statement', name: 'Bank Statement', required: true },
    { id: 'national_id', name: 'National ID', required: false },
    { id: 'passport', name: 'Passport', required: false },
    { id: 'utility_bill', name: 'Utility Bill', required: false }
  ]

  const handleFileUpload = async (documentType: string, file: File) => {
    setUploading(true)
    
    try {
      // Simulate file upload
      const newDocument: DocumentUpload = {
        id: Math.random().toString(36).substr(2, 9),
        documentType,
        documentNumber: '',
        documentUrl: URL.createObjectURL(file),
        originalName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        status: 'uploaded',
        uploadedAt: new Date().toISOString()
      }

      onDocumentsChange([...uploadedDocuments, newDocument])
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setUploading(false)
    }
  }

  const removeDocument = (documentId: string) => {
    onDocumentsChange(uploadedDocuments.filter(doc => doc.id !== documentId))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Verified</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><AlertTriangle className="h-3 w-3 mr-1" />Rejected</Badge>
      case 'uploaded':
        return <Badge className="bg-blue-100 text-blue-800"><FileText className="h-3 w-3 mr-1" />Uploaded</Badge>
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Document Upload
        </CardTitle>
        <CardDescription>
          Upload required business documents for verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {documentTypes.map((docType) => {
            const existingDoc = uploadedDocuments.find(doc => doc.documentType === docType.id)
            
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
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <Input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleFileUpload(docType.id, file)
                        }
                      }}
                      disabled={uploading}
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Accepted formats: PDF, JPG, PNG (Max 10MB)
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {uploadedDocuments.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-lg font-medium">Uploaded Documents</h3>
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
