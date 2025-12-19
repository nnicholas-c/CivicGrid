# Claude Analyzer

A Python application that fetches user uploads from an API endpoint, processes them through Claude AI (with vision support), and saves the JSON outputs.

## Features

- ✅ Fetches data from GET endpoint
- ✅ Processes both images (base64) and text transcripts
- ✅ Custom system prompts via configuration file
- ✅ Claude Vision API integration
- ✅ Saves individual JSON output per ID
- ✅ Error handling and logging

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure API Key

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Then edit `.env` and add your Anthropic API key and preferred model:

```
ANTHROPIC_API_KEY=your_api_key_here
CLAUDE_MODEL=claude-3-5-sonnet-20241022
```

The application will automatically load environment variables from this file.

**Available models:**
- `claude-3-5-sonnet-20241022` (recommended, balanced performance)
- `claude-3-5-haiku-20241022` (faster, cheaper)
- `claude-3-opus-20240229` (most capable)
- Or use model names like `claude-3-7-sonnet-latest` for newer versions

### 3. Customize System Prompt

Edit `system_prompt.txt` to design your custom prompt. This prompt tells Claude how to analyze the image and transcript data.

**Example system prompts:**

```text
Analyze the image and transcript to detect objects and sentiment. Return JSON with: 
{
  "objects_detected": [],
  "sentiment": "",
  "description": ""
}
```

Or for a different use case:

```text
You are a content moderator. Analyze the image and transcript for inappropriate content.
Return JSON with:
{
  "is_safe": true/false,
  "concerns": [],
  "confidence": 0.0-1.0
}
```

## Usage

### Basic Usage

```bash
python process_uploads.py
```

This will:
1. Fetch all uploads from `https://getuserupload-xglsok67aq-uc.a.run.app/`
2. Process each item through Claude with your system prompt
3. Save results to `outputs/{id}.json`

### Output Structure

Each output file will contain:

```json
{
  "id": "peJUYixAx6o4TmfCUknh",
  "original_data": {
    "id": "peJUYixAx6o4TmfCUknh",
    "transcript": "good boy",
    "picture": "base64_data...",
    "createdAt": {...},
    "status": "raw"
  },
  "claude_response": {
    // Your custom JSON response based on system prompt
  },
  "processed_at": "2024-10-26T04:06:00.123456"
}
```

## Customization

### Change Endpoint URL

Edit the `ENDPOINT_URL` variable in `process_uploads.py`:

```python
ENDPOINT_URL = "https://your-endpoint-url.com/"
```

### Change Output Directory

Edit the `OUTPUT_DIR` variable in `process_uploads.py`:

```python
OUTPUT_DIR = "my_results"
```

### Change Claude Model

Edit the `CLAUDE_MODEL` variable in your `.env` file:

```
CLAUDE_MODEL=claude-3-opus-20240229
```

No code changes needed! The model is loaded from the environment variable.

### Image Format

If your base64 images are not PNG, update the `media_type` in `process_uploads.py`:

```python
"media_type": "image/jpeg",  # or "image/png", "image/webp", etc.
```

## Project Structure

```
Claude-Anaylzer/
├── process_uploads.py    # Main application
├── requirements.txt      # Python dependencies
├── system_prompt.txt     # Your custom Claude prompt (EDIT THIS!)
├── .env.example         # Environment variable template
├── README.md            # This file
└── outputs/             # Output directory (created automatically)
    ├── {id1}.json
    ├── {id2}.json
    └── ...
```

## Troubleshooting

### API Key Error
```
ValueError: ANTHROPIC_API_KEY not found
```
**Solution:** Set your API key as an environment variable or pass it to the constructor.

### JSON Parse Error
```
Warning: Response for {id} is not valid JSON
```
**Solution:** Your system prompt may not be instructing Claude to return valid JSON. Update your prompt to explicitly request JSON output.

### Rate Limiting
If processing many items, you may hit API rate limits. Consider adding delays between requests:

```python
import time
time.sleep(1)  # Add after each API call
```

## License

MIT
