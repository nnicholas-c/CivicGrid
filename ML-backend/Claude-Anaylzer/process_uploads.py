#!/usr/bin/env python3
import os
import json
import base64
import re
import requests
from openai import OpenAI
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class GrokAnalyzer:
    def __init__(self, api_key=None, model=None, system_prompt_file="system_prompt.txt"):
        """
        Initialize the Grok Analyzer
        
        Args:
            api_key: xAI API key (defaults to XAI_API_KEY env var)
            model: Grok model to use (defaults to GROK_MODEL env var or grok-3-mini-fast)
            system_prompt_file: Path to file containing the system prompt
        """
        self.api_key = api_key or os.getenv("XAI_API_KEY")
        if not self.api_key:
            raise ValueError("XAI_API_KEY not found. Set it as an environment variable or pass it to the constructor.")
        
        self.model = model or os.getenv("GROK_MODEL", "grok-3-mini-fast")
        self.client = OpenAI(api_key=self.api_key, base_url="https://api.x.ai/v1")
        self.system_prompt = self._load_system_prompt(system_prompt_file)
    
    def _extract_json_from_markdown(self, text):
        """
        Extract JSON from markdown code blocks
        
        Args:
            text: Response text that may contain markdown code blocks
            
        Returns:
            Extracted JSON string or original text
        """
        # Try to find JSON in markdown code blocks (```json ... ``` or ``` ... ```)
        patterns = [
            r'```json\s*\n(.*?)\n```',  # ```json ... ```
            r'```\s*\n(.*?)\n```',       # ``` ... ```
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text, re.DOTALL)
            if match:
                return match.group(1).strip()
        
        # If no code block found, return original text
        return text.strip()
    
    def _detect_image_format(self, base64_data):
        """
        Detect image format from base64 data
        
        Args:
            base64_data: Base64 encoded image string
            
        Returns:
            Media type string (e.g., 'image/png', 'image/jpeg') or None if invalid
        """
        try:
            # Decode the base64 data to get the binary header
            img_data = base64.b64decode(base64_data[:100])  # Only decode first part for header check
            
            # Check magic numbers (file signatures)
            if img_data.startswith(b'\x89PNG\r\n\x1a\n'):
                return 'image/png'
            elif img_data.startswith(b'\xff\xd8\xff'):
                return 'image/jpeg'
            elif img_data.startswith(b'GIF87a') or img_data.startswith(b'GIF89a'):
                return 'image/gif'
            elif img_data.startswith(b'RIFF') and b'WEBP' in img_data[:20]:
                return 'image/webp'
            else:
                return None
        except Exception as e:
            print(f"Error detecting image format: {e}")
            return None
        
    def _load_system_prompt(self, prompt_file):
        """Load system prompt from file"""
        if os.path.exists(prompt_file):
            with open(prompt_file, 'r') as f:
                return f.read().strip()
        else:
            print(f"Warning: {prompt_file} not found. Using default prompt.")
            return "Analyze the provided image and transcript. Return your analysis as valid JSON."
    
    def fetch_uploads(self, endpoint_url):
        """
        Fetch upload data from the endpoint
        
        Args:
            endpoint_url: URL of the GET endpoint
            
        Returns:
            List of upload items
        """
        try:
            response = requests.get(endpoint_url)
            response.raise_for_status()
            data = response.json()
            
            # Handle new API structure with 'documents' array
            if isinstance(data, dict) and 'documents' in data:
                items = data['documents']
                count = data.get('count', len(items))
                print(f"API returned {count} document(s)")
                return items if isinstance(items, list) else [items]
            # Handle legacy formats: array or single object
            elif isinstance(data, list):
                return data
            else:
                return [data]
                
        except requests.HTTPError as e:
            if e.response is not None and e.response.status_code == 404:
                print("No uploads available at the moment (404).")
                return []
            print(f"Error fetching data from endpoint: {e}")
            raise
        except requests.RequestException as e:
            print(f"Network error fetching data from endpoint: {e}")
            raise
    
    def process_with_grok(self, item):
        """
        Process a single item through Grok API
        
        Args:
            item: Dictionary containing id, transcript, and optional picture
            
        Returns:
            Dictionary containing the result
        """
        item_id = item.get('id', 'unknown')
        transcript = item.get('transcript', '').strip("'\"")
        picture_base64 = item.get('picture', '').strip("'\"")
        
        print(f"📝 Transcript length: {len(transcript)} characters")
        print(f"🖼️  Picture: {'Yes (' + str(len(picture_base64)) + ' bytes)' if picture_base64 else 'No'}")
        
        print(f"Processing item {item_id}...")
        
        # Prepare the message content
        content = []
        
        # Add image if present and valid
        if picture_base64:
            media_type = self._detect_image_format(picture_base64)
            if media_type:
                print(f"  Detected image format: {media_type}")
                content.append({
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:{media_type};base64,{picture_base64}",
                        "detail": "high"
                    }
                })
            else:
                print(f"  Warning: Could not detect valid image format. Skipping image.")
        
        # Add transcript text
        if transcript:
            content.append({
                "type": "text",
                "text": f"Transcript: {transcript}"
            })
        
        try:
            # Call Grok API (OpenAI-compatible)
            response = self.client.chat.completions.create(
                model=self.model,
                max_tokens=4096,
                messages=[
                    {
                        "role": "system",
                        "content": self.system_prompt
                    },
                    {
                        "role": "user",
                        "content": content
                    }
                ]
            )
            
            # Extract response text
            response_text = response.choices[0].message.content
            
            # Extract JSON from markdown code blocks if present
            json_text = self._extract_json_from_markdown(response_text)
            
            # Try to parse as JSON
            try:
                response_json = json.loads(json_text)
                print(f"  Successfully parsed JSON response")
            except json.JSONDecodeError:
                print(f"  Warning: Response is not valid JSON. Storing as text.")
                response_json = {"raw_response": response_text}
            
            return {
                "id": item_id,
                "original_data": item,
                "grok_response": response_json,
                "processed_at": datetime.now(timezone.utc).isoformat()
            }
            
        except Exception as e:
            print(f"Error processing item {item_id}: {e}")
            return {
                "id": item_id,
                "error": str(e),
                "processed_at": datetime.now(timezone.utc).isoformat()
            }
    
    def save_result(self, result, output_dir="outputs"):
        """
        Save the processing result to a JSON file
        
        Args:
            result: Dictionary containing the processing result
            output_dir: Directory to save output files
        """
        # Create output directory if it doesn't exist
        Path(output_dir).mkdir(parents=True, exist_ok=True)
        
        # Generate filename based on id
        item_id = result.get('id', 'unknown')
        filename = f"{item_id}.json"
        filepath = os.path.join(output_dir, filename)
        
        # Save to file
        with open(filepath, 'w') as f:
            json.dump(result, f, indent=2)
        
        print(f"Saved result to {filepath}")
    
    def _normalize_api_values(self, obj, parent_key=''):
        """
        Recursively normalize values for API compatibility
        
        Args:
            obj: Object to process (dict, list, or primitive)
            parent_key: Key path for context-aware normalization
            
        Returns:
            Object with normalized values
        """
        if isinstance(obj, dict):
            return {k: self._normalize_api_values(v, k) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._normalize_api_values(item, parent_key) for item in obj]
        elif obj is None or obj == "":
            # Use contextual defaults based on field type
            if parent_key in ['free_text', 'zone_flags_notes', 'effort_notes', 'priority_reason']:
                return "N/A"
            elif parent_key == 'severity_label':
                return "low"  # Must be one of: low, medium, high, critical
            elif parent_key == 'category':
                return "other"
            elif parent_key in ['severity_score', 'priority_score']:
                return 0
            else:
                return "N/A"
        elif parent_key == 'severity_label':
            # Map Claude's severity labels to API's accepted values
            severity_mapping = {
                'minor': 'low',
                'low': 'low',
                'moderate': 'medium',
                'medium': 'medium',
                'major': 'high',
                'high': 'high',
                'severe': 'critical',
                'critical': 'critical',
                'unknown': 'low'
            }
            return severity_mapping.get(obj.lower(), 'low')
        else:
            return obj
    
    def send_update_notification(self, source_ref, grok_response, update_endpoint_url):
        """
        Send POST request to update endpoint after processing completes
        
        Args:
            source_ref: The ID from the original GET request (formatted with 'user_uploads/' prefix)
            grok_response: The processed response from Grok
            update_endpoint_url: URL of the POST endpoint to notify
            
        Returns:
            True if successful, False otherwise
        """
        try:
            # Normalize values for API compatibility
            cleaned_response = self._normalize_api_values(grok_response)
            
            # Build payload with sourceRef and all Grok response fields
            payload = {
                "sourceRef": source_ref,
                **cleaned_response  # Spread all Grok response fields including issue_summary
            }
            
            response = requests.post(update_endpoint_url, json=payload)
            response.raise_for_status()
            
            result_data = response.json()
            work_item_id = result_data.get('workItemId', 'N/A')
            print(f"  ✓ Update notification sent successfully (Work Item ID: {work_item_id})")
            return True
        except requests.RequestException as e:
            print(f"  ✗ Failed to send update notification: {e}")
            if hasattr(e, 'response') and e.response is not None:
                print(f"  Server response: {e.response.text}")
            return False
    
    def process_all(self, endpoint_url, output_dir="outputs", update_endpoint_url=None):
        """
        Fetch all uploads and process them through Grok
        
        Args:
            endpoint_url: URL of the GET endpoint
            output_dir: Directory to save output files
            update_endpoint_url: Optional URL to POST update notifications
        """
        print("\n" + "="*70)
        print("🤖 GROK ANALYZER - Starting Processing")
        print("="*70)
        print(f"📡 Fetching uploads from endpoint: {endpoint_url}")
        items = self.fetch_uploads(endpoint_url)
        if not items:
            print("✅ No new items to process. All caught up!")
            return []
        print(f"\n📋 Found {len(items)} new item(s) to process\n")
        
        results = []
        skipped = 0
        
        for idx, item in enumerate(items, 1):
            item_id = item.get('id', 'unknown')
            
            # Check if already processed
            output_file = os.path.join(output_dir, f"{item_id}.json")
            if os.path.exists(output_file):
                print(f"Skipping {idx}/{len(items)} (ID: {item_id}) - already processed")
                skipped += 1
                continue
            
            print(f"\n{'='*70}")
            print(f"🔄 Processing [{idx}/{len(items)}] - Upload ID: {item_id}")
            print(f"{'='*70}")
            
            result = self.process_with_grok(item)
            
            print(f"\n💾 Saving result to file...")
            self.save_result(result, output_dir)
            
            # Send update notification if endpoint is provided and no error occurred
            if update_endpoint_url and 'error' not in result:
                grok_response = result.get('grok_response')
                if item_id and grok_response:
                    print(f"📤 Sending processed data to Firebase...")
                    # Format sourceRef as required by the API (must start with 'user_uploads/')
                    source_ref = f"user_uploads/{item_id}"
                    success = self.send_update_notification(source_ref, grok_response, update_endpoint_url)
                    if success:
                        print(f"✅ Upload {item_id} fully processed and sent to Firebase!")
                    else:
                        print(f"⚠️ Upload {item_id} processed but failed to send to Firebase")
            elif 'error' in result:
                print(f"❌ Error processing upload {item_id}: {result.get('error')}")
            
            results.append(result)
        
        print(f"\n{'='*70}")
        print(f"✅ PROCESSING COMPLETE!")
        print(f"{'='*70}")
        print(f"📊 Summary:")
        print(f"   • Processed: {len(results)} new items")
        print(f"   • Skipped: {skipped} already processed")
        print(f"   • Output directory: {output_dir}/")
        print(f"{'='*70}\n")
        
        return results


def main():
    """Main entry point"""
    # Configuration from Firebase console
    ENDPOINT_URL = "https://getuserupload-xglsok67aq-uc.a.run.app"
    UPDATE_ENDPOINT_URL = "https://updateprocessedupload-xglsok67aq-uc.a.run.app"
    SYSTEM_PROMPT_FILE = "system_prompt.txt"
    OUTPUT_DIR = "outputs"
    
    print("\n" + "#"*70)
    print("#" + " "*68 + "#")
    print("#" + "  CIVICGRID - GROK ANALYZER".center(68) + "#")
    print("#" + "  AI-Powered Civic Issue Analysis".center(68) + "#")
    print("#" + " "*68 + "#")
    print("#"*70 + "\n")
    
    print(f"⚙️  Configuration:")
    print(f"   📡 Fetch from: {ENDPOINT_URL}")
    print(f"   📤 Update to: {UPDATE_ENDPOINT_URL}")
    print(f"   📁 Output dir: {OUTPUT_DIR}/")
    print(f"   📄 Prompt file: {SYSTEM_PROMPT_FILE}\n")
    
    # Initialize analyzer
    print("🚀 Initializing Grok Analyzer...")
    analyzer = GrokAnalyzer(system_prompt_file=SYSTEM_PROMPT_FILE)
    print("✅ Analyzer initialized\n")
    
    # Process all uploads
    analyzer.process_all(ENDPOINT_URL, OUTPUT_DIR, UPDATE_ENDPOINT_URL)
    
    print("\n🎉 Grok Analyzer finished! Ready for next run.\n")


if __name__ == "__main__":
    main()
