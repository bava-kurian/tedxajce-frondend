import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { getParticipantDetails, processParticipant } from '../services/participantService';
import { CheckCircle, AlertCircle, Info, Utensils, Gift, LogIn } from 'lucide-react';

const Scanner = () => {
  const [processing, setProcessing] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success' | 'error' | 'warning', message: string }
  const [scannedCode, setScannedCode] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [participantDetails, setParticipantDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const scannerRef = useRef(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!scannedCode) {
        setParticipantDetails(null);
        return;
      }
      setDetailsLoading(true);
      try {
        const details = await getParticipantDetails(scannedCode);
        setParticipantDetails(details);
      } catch (error) {
        setParticipantDetails(null);
        setAlert({ type: 'warning', message: error.message });
      } finally {
        setDetailsLoading(false);
      }
    };
    fetchDetails();
  }, [scannedCode]);

  useEffect(() => {
    if (scannedCode) return; // Don't initialize if already scanned

    // Initialize Scanner
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: { width: 250, height: 250 }, disableFlip: false },
      false
    );
    
    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        setScannedCode(decodedText);
        setAlert(null); // clear old alerts
      },
      (error) => {
        // ignore continuous scan errors
      }
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => console.error("Failed to clear html5QrcodeScanner. ", error));
      }
    };
  }, [scannedCode]);

  const handleAction = async (actionType) => {
    const codeToProcess = scannedCode || manualCode;
    if (!codeToProcess) {
      setAlert({ type: 'warning', message: 'Please scan or enter a QR code first.' });
      return;
    }

    setProcessing(true);
    setAlert(null);

    try {
      const result = await processParticipant(codeToProcess, actionType);
      setAlert({ type: 'success', message: result.message });
      
      // Update local details to reflect the new state immediately
      setParticipantDetails(prev => {
        if (!prev) return prev;
        if (actionType === 'entry') return { ...prev, entry: true };
        if (actionType === 'food') return { ...prev, foodTaken: true };
        if (actionType === 'goodies') return { ...prev, goodiesCollected: true };
        return prev;
      });
    } catch (error) {
      console.error(error);
      const isAlreadyProcessed = error.message.includes("Already");
      setAlert({ 
        type: isAlreadyProcessed ? 'warning' : 'error', 
        message: error.message 
      });
    } finally {
      setProcessing(false);
      // Optional: Clear code after successful process to prevent accidental double taps?
      // For now, keeping it allows user to do Entry -> then Food if they want.
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    setScannedCode(manualCode);
    setAlert({ type: 'info', message: `Code set to: ${manualCode}` });
  };

  return (
    <div className="card">
      <h2 className="text-heading text-tedx-red text-center mb-3">Participant Scanner</h2>
      
      {alert && (
        <div className={`alert alert-${alert.type === 'info' ? 'success' : alert.type}`}>
          {alert.type === 'success' && <CheckCircle size={20} />}
          {alert.type === 'error' && <AlertCircle size={20} />}
          {(alert.type === 'warning' || alert.type === 'info') && <Info size={20} />}
          <span>{alert.message}</span>
        </div>
      )}

      {!scannedCode && (
        <div className="scanner-container">
          <div id="reader"></div>
        </div>
      )}

      {!scannedCode && (
        <div className="input-group">
          <label className="input-label">Or Enter Code Manually</label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input 
              type="text" 
              className="input-field" 
              placeholder="Participant ID" 
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
            />
            <button className="btn btn-secondary" onClick={handleManualSubmit} style={{ width: 'auto' }}>
              Set
            </button>
          </div>
        </div>
      )}

      {scannedCode && (
        <div className="mb-3 text-center">
          <p className="text-muted">Current Target:</p>
          <h3 className="text-heading" style={{ fontSize: '1.5rem', letterSpacing: '2px' }}>{scannedCode}</h3>
          
          {detailsLoading && <div className="spinner" style={{ width: '30px', height: '30px', margin: '10px auto', borderWidth: '3px' }}></div>}
          
          {participantDetails && (
            <div className="card mt-2" style={{ textAlign: 'left', fontSize: '0.95rem', background: 'rgba(255,255,255,0.02)' }}>
              <div style={{ marginBottom: '8px' }}><strong>Name:</strong> {participantDetails.name}</div>
              <div style={{ marginBottom: '8px' }}><strong>Email:</strong> {participantDetails.email}</div>
              <div style={{ marginBottom: '8px' }}><strong>Food Preference:</strong> {participantDetails.foodPreference}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                <div><strong>Entry:</strong> <span style={{ color: participantDetails.entry ? 'var(--color-success)' : 'var(--color-warning)' }}>{participantDetails.entry ? "Yes" : "No"}</span></div>
                <div><strong>Food:</strong> <span style={{ color: participantDetails.foodTaken ? 'var(--color-success)' : 'var(--color-warning)' }}>{participantDetails.foodTaken ? "Taken" : "Not Taken"}</span></div>
                <div><strong>Goodies:</strong> <span style={{ color: participantDetails.goodiesCollected ? 'var(--color-success)' : 'var(--color-warning)' }}>{participantDetails.goodiesCollected ? "Collected" : "Not Collected"}</span></div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="action-buttons">
        <button 
          className="btn btn-entry" 
          onClick={() => handleAction('entry')}
          disabled={processing || (!scannedCode && !manualCode)}
        >
          <LogIn size={20} /> Mark Entry
        </button>
        <button 
          className="btn btn-food" 
          onClick={() => handleAction('food')}
          disabled={processing || (!scannedCode && !manualCode)}
        >
          <Utensils size={20} /> Mark Food
        </button>
        <button 
          className="btn btn-goodies" 
          onClick={() => handleAction('goodies')}
          disabled={processing || (!scannedCode && !manualCode)}
        >
          <Gift size={20} /> Mark Goodies
        </button>
      </div>

      {scannedCode && (
        <div className="mt-4 text-center">
          <button 
            className="btn btn-scan-next" 
            onClick={() => {
              setScannedCode('');
              setManualCode('');
              setParticipantDetails(null);
              setAlert(null);
            }}
          >
            Scan Next Participant
          </button>
        </div>
      )}

      {processing && (
        <div className="overlay">
          <div className="spinner"></div>
          <div className="pulse-text">PROCESSING SECURE TRANSACTION...</div>
        </div>
      )}
    </div>
  );
};

export default Scanner;
