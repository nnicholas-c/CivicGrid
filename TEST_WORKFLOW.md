# CivicGrid Voice Agent Workflow Test

## Complete End-to-End Flow

### 1. Picture Upload
```bash
curl -X POST http://localhost:3000/upload_picture \
  -H "Content-Type: application/json" \
  -d '{"picture": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="}'
```

### 2. Voice Conversation
- Click phone button on http://localhost:5173/report
- Speak into **server's microphone**: "There's a pothole on Main Street"
- Listen to agent response from **server's speakers**
- End call

### 3. Verify Transcript Saved
Check backend logs for:
```
Transcript uploaded successfully: {"result":"Upload with ID: XXX added."}
✓ Claude-Analyzer started (PID: XXX)
```

### 4. Verify Claude Analysis
```bash
cd ML-backend/Claude-Anaylzer
python process_uploads.py
```

Watch for:
```
Processing item: XXX
✓ Update notification sent successfully (Work Item ID: YYY)
```

### 5. Verify Dashboard
Go to http://localhost:5173/dashboard and check:
- New work item appears with pothole description
- Picture is attached
- Location is extracted from transcript
- Priority is assigned

## Quick Test Commands

```bash
# Start all services
./start-all-services.sh

# In separate terminal, watch logs
tail -f voice-agent.log

# Test picture upload
curl -X POST http://localhost:3000/upload_picture \
  -H "Content-Type: application/json" \
  -d '{"picture": "data:image/png;base64,TEST_BASE64_HERE"}'

# After voice call ends, check transcript
curl http://localhost:3000/transcript
```

## Expected Data Flow

```
User Browser                Server                  Firebase
    |                          |                        |
    |--1. Upload Picture------>|                        |
    |                          |                        |
    |--2. Start Call---------->|                        |
    |                          |--Pyaudio Mic/Speaker-->|
    |<-3. View Transcript------|                        |
    |                          |                        |
    |--4. End Call------------>|                        |
    |                          |--Send to Cloud-------->|
    |                          |   Function             |
    |                          |                        |
    |                          |--Trigger Claude------->|
    |                          |   Analyzer             |
    |                          |                        |
    |                          |<-Claude Analysis-------|
    |                          |                        |
    |                          |--Post work_item------->|
    |                          |   updateProcessed      |
    |                          |   Upload               |
    |<-5. View Dashboard-------|<-Fetch work_items------|
```

## Troubleshooting

### Issue: No transcript uploaded
- Check: DEEPGRAM_API_KEY in ML-backend/voice-agent-backend/.env
- Check: Cloud Function URL is correct
- Look for: "Transcript uploaded successfully" in logs

### Issue: Grok not processing
- Check: XAI_API_KEY in ML-backend/Claude-Anaylzer/.env
- Manually run: `python ML-backend/Claude-Anaylzer/process_uploads.py`
- Check outputs folder for JSON results

### Issue: Work item not on dashboard
- Check Firebase console for work_items collection
- Verify updateProcessedUpload endpoint is working
- Check browser console for API errors
