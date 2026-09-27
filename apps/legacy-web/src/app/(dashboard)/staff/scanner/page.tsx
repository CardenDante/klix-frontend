'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import  apiClient  from '@/lib/api-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Camera, QrCode, CheckCircle, XCircle, AlertCircle,
  Calendar, User, Ticket, Hash, CameraOff
} from 'lucide-react';

interface Event {
  id: string;
  title: string;
  start_datetime: string;
}

interface TicketValidation {
  valid: boolean;
  ticket: any;
  message: string;
  checked_in_at: string | null;
}

export default function QRScannerPage() {
  const searchParams = useSearchParams();
  const eventIdParam = searchParams.get('event');

  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState(eventIdParam || '');
  const [manualCode, setManualCode] = useState('');
  const [validationResult, setValidationResult] = useState<TicketValidation | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [scanCount, setScanCount] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    fetchEvents();
    return () => {
      stopCamera();
    };
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await apiClient.get('/staff/my-staff-assignments', {
        params: { active_only: true }
      });
      const assignments = response.data.assignments || [];
      const eventList = assignments.map((a: any) => ({
        id: a.event_id,
        title: a.event.title,
        start_datetime: a.event.start_datetime
      }));
      setEvents(eventList);
      
      if (!selectedEventId && eventList.length > 0) {
        setSelectedEventId(eventList[0].id);
      }
    } catch (err) {
      console.error('Failed to load events:', err);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (err) {
      console.error('Failed to start camera:', err);
      alert('Unable to access camera. Please ensure camera permissions are granted.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  const handleValidate = async (qrData: string) => {
    if (!selectedEventId) {
      alert('Please select an event first');
      return;
    }

    setLoading(true);
    setValidationResult(null);

    try {
      const response = await apiClient.post('/tickets/validate-qr', null, {
        params: {
          qr_data: qrData,
          event_id: selectedEventId
        }
      });
      setValidationResult(response.data);
    } catch (err: any) {
      setValidationResult({
        valid: false,
        ticket: null,
        message: err.response?.data?.detail || 'Ticket validation failed',
        checked_in_at: null
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!validationResult || !validationResult.valid || !selectedEventId) return;

    setLoading(true);

    try {
      await apiClient.post('/tickets/checkin', null, {
        params: {
          qr_data: manualCode,
          event_id: selectedEventId,
          location: 'Main Entrance'
        }
      });
      
      setScanCount(prev => prev + 1);
      setValidationResult({
        ...validationResult,
        message: 'Check-in successful!',
        checked_in_at: new Date().toISOString()
      });
      setManualCode('');
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Check-in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleManualScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      await handleValidate(manualCode.trim());
    }
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: 'Comfortaa' }}>
          QR Code Scanner
        </h1>
        <p className="text-gray-600 mt-1">Scan tickets to check in attendees</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Scanned This Session</p>
                <p className="text-2xl font-bold">{scanCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Selected Event</p>
                <p className="text-sm font-semibold truncate">{selectedEvent?.title || 'None'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-full ${cameraActive ? 'bg-orange-100' : 'bg-gray-100'}`}>
                {cameraActive ? (
                  <Camera className="w-6 h-6 text-orange-600" />
                ) : (
                  <CameraOff className="w-6 h-6 text-gray-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600">Camera Status</p>
                <p className="text-sm font-semibold">{cameraActive ? 'Active' : 'Inactive'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Event</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            className="w-full px-4 py-2 border rounded-lg"
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
          >
            <option value="">Choose an event...</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title} - {new Date(event.start_datetime).toLocaleDateString()}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {/* Camera Scanner */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Camera Scanner
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center">
            {cameraActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center text-gray-400">
                <CameraOff className="w-16 h-16 mx-auto mb-4" />
                <p>Camera is off</p>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {!cameraActive ? (
              <Button onClick={startCamera} className="w-full" disabled={!selectedEventId}>
                <Camera className="w-4 h-4 mr-2" />
                Start Camera
              </Button>
            ) : (
              <Button onClick={stopCamera} variant="destructive" className="w-full">
                <CameraOff className="w-4 h-4 mr-2" />
                Stop Camera
              </Button>
            )}
          </div>

          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              Note: Automatic QR scanning requires additional libraries. Use manual input below for now.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Manual Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="w-5 h-5" />
            Manual Ticket Entry
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleManualScan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Ticket Code / QR Data</label>
              <Input
                type="text"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder="Enter ticket code or scan QR..."
                disabled={!selectedEventId}
              />
            </div>
            <Button type="submit" disabled={!manualCode.trim() || !selectedEventId || loading}>
              <QrCode className="w-4 h-4 mr-2" />
              {loading ? 'Validating...' : 'Validate Ticket'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Validation Result */}
      {validationResult && (
        <Card className={
          validationResult.valid 
            ? 'border-green-500 bg-green-50' 
            : 'border-red-500 bg-red-50'
        }>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {validationResult.valid ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-green-900">Valid Ticket</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="text-red-900">Invalid Ticket</span>
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant={validationResult.valid ? 'default' : 'destructive'}>
              <AlertDescription className="font-semibold">
                {validationResult.message}
              </AlertDescription>
            </Alert>

            {validationResult.valid && validationResult.ticket && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-sm text-gray-600">Attendee Name</p>
                    <p className="font-semibold">{validationResult.ticket.attendee_name}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-sm text-gray-600">Ticket Number</p>
                    <p className="font-semibold">{validationResult.ticket.ticket_number}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-sm">{validationResult.ticket.attendee_email}</p>
                  </div>
                  <div className="p-3 bg-white rounded-lg">
                    <p className="text-sm text-gray-600">Status</p>
                    <Badge className={validationResult.ticket.status === 'confirmed' ? 'bg-green-600' : ''}>
                      {validationResult.ticket.status}
                    </Badge>
                  </div>
                </div>

                {validationResult.checked_in_at ? (
                  <Alert>
                    <CheckCircle className="w-4 h-4" />
                    <AlertDescription>
                      Already checked in at {new Date(validationResult.checked_in_at).toLocaleString()}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Button 
                    onClick={handleCheckIn} 
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={loading}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {loading ? 'Processing...' : 'Check In Attendee'}
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <QrCode className="w-5 h-5 text-blue-600" />
            How to Use the Scanner
          </h4>
          <ol className="space-y-2 text-sm text-gray-700 list-decimal list-inside">
            <li>Select the event you're checking in for</li>
            <li>Start the camera or use manual entry</li>
            <li>Scan the attendee's QR code or enter ticket code</li>
            <li>Verify the ticket information is correct</li>
            <li>Click "Check In Attendee" to complete check-in</li>
            <li>Look for green confirmation before allowing entry</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}