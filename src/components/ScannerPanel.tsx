import { useEffect, useRef, useState } from 'react';
import { Camera, FileImage, LoaderCircle, ScanLine, XCircle } from 'lucide-react';
import { recognizeTicket } from '../services/ocr';
import type { OcrResult, ScanStatus } from '../types/scan';

interface ScannerPanelProps {
  onResult: (result: OcrResult) => void;
}

export default function ScannerPanel({ onResult }: ScannerPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<ScanStatus>('ready');
  const [message, setMessage] = useState('Caméra non démarrée');

  useEffect(() => () => stopCamera(), []);

  async function startCamera() {
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus('ready');
      setMessage('Caméra prête — placez le ticket dans le cadre');
    } catch {
      setStatus('error');
      setMessage("Accès caméra refusé ou caméra indisponible");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  async function analyze(blob: Blob) {
    setStatus('scanning');
    setMessage('Lecture OCR en cours…');
    try {
      const result = await recognizeTicket(blob);
      onResult(result);
      setStatus(result.prestationNumber ? 'success' : 'error');
      setMessage(result.prestationNumber
        ? `Numéro détecté : ${result.prestationNumber}`
        : 'Aucun numéro fiable détecté — recommencez le scan');
    } catch {
      setStatus('error');
      setMessage("Échec de l'analyse OCR");
    }
  }

  async function captureFrame() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) {
      setStatus('error');
      setMessage('Démarrez la caméra avant de capturer');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.95));
    if (blob) await analyze(blob);
  }

  async function loadFile(file?: File) {
    if (file) await analyze(file);
  }

  return (
    <article className="scanner-panel">
      <div className="camera-stage">
        <video ref={videoRef} muted playsInline />
        <div className="scan-frame"><ScanLine size={38} /></div>
      </div>

      <div className={`scan-message ${status}`}>
        {status === 'scanning' ? <LoaderCircle className="spin" size={18} /> : status === 'error' ? <XCircle size={18} /> : <Camera size={18} />}
        {message}
      </div>

      <div className="scanner-actions">
        <button className="secondary" onClick={startCamera}><Camera size={18} />Démarrer la caméra</button>
        <button className="primary" onClick={captureFrame} disabled={status === 'scanning'}><ScanLine size={18} />Capturer et lire</button>
        <label className="secondary file-button"><FileImage size={18} />Importer une photo<input type="file" accept="image/*" onChange={(event) => loadFile(event.target.files?.[0])} /></label>
      </div>
    </article>
  );
}
