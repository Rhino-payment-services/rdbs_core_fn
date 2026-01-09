"use client"

import React, { useRef, useState, useEffect } from 'react';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  QrCode, 
  Share2, 
  Printer, 
  Download, 
  Copy, 
  MoreVertical,
  Smartphone,
  MessageSquare
} from 'lucide-react';
import { API_CONFIG } from '@/lib/config';

// Get payment page URL from environment config
const getPaymentBaseUrl = () => {
  return `${API_CONFIG.PAYMENT_PAGE_URL}/receive_payment`;
};

interface MerchantQRCodeDialogProps {
  merchantCode: string;
  merchantName: string;
  trigger?: React.ReactNode;
}

export function MerchantQRCodeDialog({ 
  merchantCode, 
  merchantName,
  trigger 
}: MerchantQRCodeDialogProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const qrCodeRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate QR code with logo when dialog opens
  useEffect(() => {
    if (isOpen && merchantCode) {
      generateQRWithLogo();
    }
  }, [isOpen, merchantCode]);

  const generateQRWithLogo = async () => {
    try {
      // Use the same URL format as merchant dashboard (from env config)
      const qrData = `${getPaymentBaseUrl()}/${merchantCode}`;
      
      // Generate QR code to canvas first
      const qrCanvas = document.createElement('canvas');
      await QRCode.toCanvas(qrCanvas, qrData, {
        width: 250,
        margin: 2,
        color: {
          dark: '#0f172a', // Dark navy blue like the merchant dashboard
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H' // High error correction to allow for logo overlay
      });

      // Create a new canvas for the final QR with logo
      const finalCanvas = canvasRef.current || document.createElement('canvas');
      const ctx = finalCanvas.getContext('2d');
      if (!ctx) return;

      finalCanvas.width = qrCanvas.width;
      finalCanvas.height = qrCanvas.height;

      // Draw the QR code
      ctx.drawImage(qrCanvas, 0, 0);

      // Add rounded border
      ctx.strokeStyle = '#1e3a5f';
      ctx.lineWidth = 4;
      const borderRadius = 12;
      ctx.beginPath();
      ctx.roundRect(2, 2, finalCanvas.width - 4, finalCanvas.height - 4, borderRadius);
      ctx.stroke();

      // Load and draw the logo in the center
      const logo = new Image();
      logo.crossOrigin = 'anonymous';
      logo.onload = () => {
        const logoSize = 50;
        const logoX = (finalCanvas.width - logoSize) / 2;
        const logoY = (finalCanvas.height - logoSize) / 2;

        // Draw white circle background for logo
        ctx.beginPath();
        ctx.arc(finalCanvas.width / 2, finalCanvas.height / 2, logoSize / 2 + 5, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();

        // Draw logo
        ctx.drawImage(logo, logoX, logoY, logoSize, logoSize);

        // Convert to data URL
        setQrCodeUrl(finalCanvas.toDataURL('image/png'));
      };
      
      logo.onerror = () => {
        // If logo fails to load, just use QR without logo
        setQrCodeUrl(finalCanvas.toDataURL('image/png'));
      };
      
      // Use the Rukapay logo
      logo.src = '/images/logoRukapay2.png';
      
      // Fallback if logo doesn't exist - just show QR without logo after timeout
      setTimeout(() => {
        if (!qrCodeUrl) {
          setQrCodeUrl(finalCanvas.toDataURL('image/png'));
        }
      }, 1000);
      
    } catch (error) {
      console.error('Error generating QR code:', error);
      // Fallback to simple QR code without logo
      try {
        const qrData = `${getPaymentBaseUrl()}/${merchantCode}`;
        const qrUrl = await QRCode.toDataURL(qrData, {
          width: 250,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#FFFFFF'
          }
        });
        setQrCodeUrl(qrUrl);
      } catch (e) {
        console.error('Fallback QR generation failed:', e);
      }
    }
  };

  const handlePrint = async () => {
    if (!qrCodeRef.current) return;
    
    setIsLoading(true);
    try {
      const canvas = await html2canvas(qrCodeRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      });
      
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>${merchantName} - QR Code</title>
              <style>
                body { 
                  margin: 0; 
                  padding: 20px; 
                  font-family: Arial, sans-serif;
                  text-align: center;
                  background-color: #ffffff;
                }
                .qr-container {
                  display: inline-block;
                  padding: 30px;
                  border: 2px solid #e5e7eb;
                  border-radius: 16px;
                  background-color: #ffffff;
                }
                .logo-icon {
                  width: 40px;
                  height: 40px;
                  margin: 0 auto 16px;
                }
                .merchant-info {
                  margin-bottom: 20px;
                }
                .merchant-name {
                  font-size: 24px;
                  font-weight: bold;
                  margin-bottom: 8px;
                  color: #0f172a;
                }
                .merchant-code {
                  font-size: 16px;
                  color: #64748b;
                  margin-bottom: 20px;
                }
                .qr-code {
                  margin: 0 auto;
                  border-radius: 8px;
                }
                .scan-text {
                  margin-top: 20px;
                  font-size: 16px;
                  font-weight: 600;
                  color: #0f172a;
                }
                .scan-instruction {
                  font-size: 14px;
                  color: #64748b;
                  margin-top: 4px;
                }
              </style>
            </head>
            <body>
              <div class="qr-container">
                <div class="merchant-info">
                  <div class="merchant-name">${merchantName}</div>
                  <div class="merchant-code">Merchant Code: ${merchantCode}</div>
                </div>
                <img src="${canvas.toDataURL()}" alt="QR Code" class="qr-code" />
                <div class="scan-text">Scan to Pay</div>
                <div class="scan-instruction">Use RukaPay app or camera to scan</div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    } catch (error) {
      console.error('Error printing QR code:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAsImage = async () => {
    if (!qrCodeRef.current) return;
    
    setIsLoading(true);
    try {
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.backgroundColor = '#ffffff';
      tempDiv.style.padding = '32px';
      tempDiv.style.borderRadius = '16px';
      tempDiv.style.border = '2px solid #e5e7eb';
      tempDiv.style.fontFamily = 'Arial, sans-serif';
      tempDiv.style.textAlign = 'center';
      tempDiv.style.color = '#0f172a';
      
      tempDiv.innerHTML = `
        <div style="margin-bottom: 16px; font-size: 20px; font-weight: bold; color: #0f172a;">
          ${merchantName}
        </div>
        <div style="margin-bottom: 20px; font-size: 14px; color: #64748b;">
          Merchant Code: ${merchantCode}
        </div>
        <div style="display: flex; justify-content: center;">
          <img src="${qrCodeUrl}" alt="QR Code" style="width: 220px; height: 220px; border-radius: 8px;" />
        </div>
        <div style="margin-top: 16px; font-size: 14px; font-weight: 600; color: #0f172a;">
          Scan to Pay
        </div>
        <div style="font-size: 12px; color: #64748b; margin-top: 4px;">
          Use RukaPay app or camera to scan
        </div>
      `;
      
      document.body.appendChild(tempDiv);
      
      const canvas = await html2canvas(tempDiv, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      });
      
      document.body.removeChild(tempDiv);
      
      const link = document.createElement('a');
      link.download = `${merchantName.replace(/[^a-z0-9]/gi, '_')}-qr-code.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error saving QR code:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPaymentLink = () => `${getPaymentBaseUrl()}/${merchantCode}`;

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(getPaymentLink());
      alert('Payment link copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const handleShareViaWhatsApp = () => {
    const text = encodeURIComponent(`Scan this QR code to pay ${merchantName}: ${getPaymentLink()}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleShareViaSMS = () => {
    const text = encodeURIComponent(`Scan this QR code to pay ${merchantName}: ${getPaymentLink()}`);
    window.open(`sms:?body=${text}`, '_blank');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${merchantName} - QR Code`,
          text: `Scan this QR code to pay ${merchantName}`,
          url: getPaymentLink()
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopyToClipboard();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <QrCode className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-slate-900">Merchant QR Code</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4">
          {/* QR Code Display */}
          <Card ref={qrCodeRef} className="p-6 bg-white border-2 border-gray-100 rounded-2xl shadow-sm">
            <div className="text-center space-y-4">
              <div className="font-bold text-xl text-slate-900">{merchantName}</div>
              <div className="text-sm text-slate-500">Merchant Code: {merchantCode}</div>
              {qrCodeUrl ? (
                <div className="flex justify-center">
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code" 
                    className="w-52 h-52 rounded-lg"
                  />
                </div>
              ) : (
                <div className="flex justify-center items-center w-52 h-52 border-2 border-slate-200 rounded-lg mx-auto">
                  <div className="text-sm text-slate-400">Generating QR code...</div>
                </div>
              )}
              <div className="pt-2">
                <div className="font-semibold text-slate-900">Scan to Pay</div>
                <div className="text-xs text-slate-500">Use RukaPay app or camera to scan</div>
              </div>
            </div>
          </Card>

          {/* Payment Link Display */}
          <div className="w-full bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div className="text-xs text-slate-500 mb-1">Payment Link</div>
            <div className="text-sm text-slate-700 break-all font-mono">
              {getPaymentLink()}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 justify-center w-full">
            <Button 
              onClick={handleShare}
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              <Share2 className="h-4 w-4" />
              Share
            </Button>
            
            <Button 
              onClick={handlePrint}
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
              disabled={isLoading || !qrCodeUrl}
            >
              <Printer className="h-4 w-4" />
              Print
            </Button>
            
            <Button 
              onClick={handleSaveAsImage}
              variant="outline" 
              size="sm"
              className="flex items-center gap-2"
              disabled={isLoading || !qrCodeUrl}
            >
              <Download className="h-4 w-4" />
              Save
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <MoreVertical className="h-4 w-4" />
                  More
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleCopyToClipboard}>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareViaWhatsApp}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Share via WhatsApp
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleShareViaSMS}>
                  <Smartphone className="h-4 w-4 mr-2" />
                  Share via SMS
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {isLoading && (
            <div className="text-sm text-slate-500">
              Processing...
            </div>
          )}
        </div>
        
        {/* Hidden canvas for QR generation */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </DialogContent>
    </Dialog>
  );
}
