import requests
import json
import re

def summarize_transcript(transcript: str) -> dict:
    """Use Ollama with Llama3 to summarize transcript"""
    try:
        prompt = f"""Analyze this meeting transcript and provide a structured summary in JSON format.

Transcript:
{transcript}

Please provide a JSON response with exactly these fields:
1. "overview": A brief 2-3 sentence summary of the meeting
2. "key_points": An array of the main discussion points (3-6 items)
3. "action_items": An array of tasks or actions mentioned (if any)
4. "decisions": An array of decisions made during the meeting (if any)

IMPORTANT: Return ONLY the raw JSON object. Do not include any markdown formatting, code blocks, or explanatory text before or after the JSON."""

        response = requests.post(
            'http://localhost:11434/api/generate',
            json={
                "model": "llama3",
                "prompt": prompt,
                "stream": False
            },
            timeout=120
        )
        
        result = response.json()['response']
        
        try:
            # Clean up markdown code blocks if present
            if '```json' in result:
                result = result.split('```json').split('```').strip()[1]
            elif '```' in result:
                result = result.split('```').split('```')[0].strip()
            
            summary = json.loads(result)
            
            # Validate required fields
            if not all(k in summary for k in ['overview', 'key_points', 'action_items', 'decisions']):
                raise ValueError("Missing required fields")
            
            return summary
            
        except (json.JSONDecodeError, ValueError) as e:
            print(f"JSON parse error: {e}")
            print(f"Raw response: {result}")
            
            # Try to extract JSON using regex
            try:
                json_match = re.search(r'\{[\s\S]*\}', result)
                if json_match:
                    summary = json.loads(json_match.group())
                    return summary
            except:
                pass

            # Fallback to basic structure
            return {
                'overview': 'See full transcript for details',
                'key_points': ['See full transcript'],
                'action_items': [],
                'decisions': []
            }
                
    except Exception as e:
        print(f"Summarization error: {str(e)}")
        return {
            'overview': f'Error generating summary: {str(e)}',
            'key_points': ['See full transcript'],
            'action_items': [],
            'decisions': []
        }
