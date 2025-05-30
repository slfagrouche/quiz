from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
from dotenv import load_dotenv
import json
import re
from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch

# Handle different OpenAI versions
try:
    from openai import OpenAI
    OPENAI_V1 = True
except ImportError:
    import openai
    OPENAI_V1 = False

load_dotenv()

app = Flask(__name__)

# Configure CORS for production
if os.getenv('RAILWAY_ENVIRONMENT'):
    allowed_origins = [
        os.getenv('VERCEL_URL', 'https://your-app-name.vercel.app'),
        'https://*.vercel.app'
    ]
    CORS(app, origins=allowed_origins)
else:
    CORS(app)

# Initialize OpenAI client based on version
if OPENAI_V1:
    client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
else:
    openai.api_key = os.getenv('OPENAI_API_KEY')

def make_openai_request(messages, max_tokens=2000, temperature=0.7):
    """Helper function to handle both OpenAI versions"""
    if OPENAI_V1:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature
        )
        return response.choices[0].message.content
    else:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages,
            max_tokens=max_tokens,
            temperature=temperature
        )
        return response.choices[0].message.content

def clean_json_response(text):
    """Clean and extract JSON from AI response"""
    # Remove markdown code blocks
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*', '', text)
    
    # Find JSON array in the text
    json_match = re.search(r'\[.*\]', text, re.DOTALL)
    if json_match:
        return json_match.group(0)
    
    return text.strip()

@app.route('/api/generate-content', methods=['POST'])
def generate_content():
    try:
        data = request.get_json()
        topic = data.get('topic', '')
        difficulty = data.get('difficulty', 'intermediate')
        learning_type = data.get('learning_type', 'general')
        
        if not topic:
            return jsonify({'error': 'Topic is required'}), 400
        
        content_prompt = f"""
        Create comprehensive educational content about "{topic}" for {difficulty} level learners ({learning_type}).
        
        The content should be:
        - Well-structured and informative
        - Appropriate for {difficulty} level
        - Suitable for {learning_type}
        - Include key concepts, definitions, and important details
        - Be around 1000-1500 words
        
        Format the response as educational text that can be used to create flashcards and quizzes.
        """
        
        messages = [
            {"role": "system", "content": "You are an expert educator who creates comprehensive learning materials."},
            {"role": "user", "content": content_prompt}
        ]
        
        generated_content = make_openai_request(messages, max_tokens=2000)
        
        return jsonify({
            'success': True,
            'content': generated_content,
            'topic': topic,
            'difficulty': difficulty,
            'learning_type': learning_type
        })
        
    except Exception as e:
        print(f"Error in generate_content: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-flashcards', methods=['POST'])
def generate_flashcards():
    try:
        data = request.get_json()
        content = data.get('content', '')
        
        if not content:
            return jsonify({'error': 'Content is required'}), 400
        
        # Truncate content if too long to avoid token limits
        if len(content) > 3000:
            content = content[:3000] + "..."
        
        flashcard_prompt = f"""
Create exactly 8 flashcards based on this educational content. Return ONLY a JSON array with no additional text.

Content: {content}

Format as a JSON array where each flashcard has:
- "question": A clear, specific question about a key concept
- "answer": A concise but complete answer (2-4 sentences)

Example format:
[
  {{"question": "What is photosynthesis?", "answer": "Photosynthesis is the process by which plants convert sunlight, carbon dioxide, and water into glucose and oxygen."}},
  {{"question": "What are the main parts of a plant cell?", "answer": "The main parts include the cell wall, chloroplasts, nucleus, and vacuole."}}
]

Create 8 flashcards covering the most important concepts:
"""
        
        messages = [
            {"role": "system", "content": "You are an expert educator. Return ONLY a valid JSON array of flashcards, nothing else."},
            {"role": "user", "content": flashcard_prompt}
        ]
        
        flashcards_text = make_openai_request(messages, max_tokens=1500, temperature=0.3)
        print(f"Raw flashcard response: {flashcards_text}")
        
        # Clean the response
        cleaned_text = clean_json_response(flashcards_text)
        print(f"Cleaned flashcard response: {cleaned_text}")
        
        # Try to parse the JSON response
        try:
            flashcards = json.loads(cleaned_text)
            
            # Validate the structure
            if not isinstance(flashcards, list) or len(flashcards) == 0:
                raise ValueError("Invalid flashcard format")
            
            # Ensure each flashcard has the required fields
            valid_flashcards = []
            for card in flashcards:
                if isinstance(card, dict) and 'question' in card and 'answer' in card:
                    valid_flashcards.append({
                        'question': str(card['question']).strip(),
                        'answer': str(card['answer']).strip()
                    })
            
            if len(valid_flashcards) == 0:
                raise ValueError("No valid flashcards found")
            
            flashcards = valid_flashcards
            
        except (json.JSONDecodeError, ValueError) as e:
            print(f"JSON parsing error: {e}")
            # Create meaningful fallback flashcards based on content
            lines = content.split('\n')
            key_points = [line.strip() for line in lines if line.strip() and len(line.strip()) > 20][:8]
            
            flashcards = []
            for i, point in enumerate(key_points):
                if ':' in point:
                    # Split on first colon
                    parts = point.split(':', 1)
                    question = f"What is {parts[0].strip()}?"
                    answer = parts[1].strip()
                else:
                    question = f"What can you tell me about point {i+1} from the lesson?"
                    answer = point
                
                flashcards.append({
                    "question": question,
                    "answer": answer
                })
            
            if len(flashcards) == 0:
                flashcards = [
                    {"question": "What is the main topic of this lesson?", "answer": "The main concepts covered in the educational content about the subject matter."}
                ]
        
        return jsonify({
            'success': True,
            'flashcards': flashcards
        })
        
    except Exception as e:
        print(f"Error in generate_flashcards: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-quiz', methods=['POST'])
def generate_quiz():
    try:
        data = request.get_json()
        content = data.get('content', '')
        
        if not content:
            return jsonify({'error': 'Content is required'}), 400
        
        # Truncate content if too long
        if len(content) > 3000:
            content = content[:3000] + "..."
        
        quiz_prompt = f"""
Create exactly 5 multiple choice questions based on this content. Return ONLY a JSON array.

Content: {content}

Format as a JSON array where each question has:
- "question": The question text
- "options": Array of exactly 4 answer choices
- "correct_answer": Index (0-3) of the correct answer
- "explanation": Brief explanation of the correct answer

Example format:
[
  {{
    "question": "What is the capital of France?",
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "correct_answer": 2,
    "explanation": "Paris is the capital and largest city of France."
  }}
]

Create 5 questions covering key concepts:
"""
        
        messages = [
            {"role": "system", "content": "You are an expert educator. Return ONLY a valid JSON array of quiz questions, nothing else."},
            {"role": "user", "content": quiz_prompt}
        ]
        
        quiz_text = make_openai_request(messages, max_tokens=1500, temperature=0.3)
        print(f"Raw quiz response: {quiz_text}")
        
        # Clean the response
        cleaned_text = clean_json_response(quiz_text)
        print(f"Cleaned quiz response: {cleaned_text}")
        
        # Try to parse the JSON response
        try:
            quiz = json.loads(cleaned_text)
            
            # Validate the structure
            if not isinstance(quiz, list):
                raise ValueError("Quiz must be a list")
            
            valid_quiz = []
            for q in quiz:
                if (isinstance(q, dict) and 'question' in q and 'options' in q 
                    and 'correct_answer' in q and 'explanation' in q):
                    if (isinstance(q['options'], list) and len(q['options']) == 4
                        and 0 <= q['correct_answer'] <= 3):
                        valid_quiz.append(q)
            
            if len(valid_quiz) == 0:
                raise ValueError("No valid quiz questions found")
            
            quiz = valid_quiz
            
        except (json.JSONDecodeError, ValueError) as e:
            print(f"Quiz JSON parsing error: {e}")
            quiz = [
                {
                    "question": "What is the main concept discussed in this lesson?",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correct_answer": 0,
                    "explanation": "This is a sample explanation."
                }
            ]
        
        return jsonify({
            'success': True,
            'quiz': quiz
        })
        
    except Exception as e:
        print(f"Error in generate_quiz: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/generate-pdf', methods=['POST'])
def generate_pdf():
    try:
        data = request.get_json()
        topic = data.get('topic', 'Study Materials')
        content = data.get('content', '')
        flashcards = data.get('flashcards', [])
        
        # Create PDF in memory
        buffer = BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=72, leftMargin=72,
                              topMargin=72, bottomMargin=18)
        
        # Get styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            textColor='blue'
        )
        
        story = []
        
        # Title
        story.append(Paragraph(f"Study Materials: {topic}", title_style))
        story.append(Spacer(1, 12))
        
        # Content section
        story.append(Paragraph("Educational Content", styles['Heading2']))
        story.append(Spacer(1, 12))
        
        # Split content into paragraphs
        content_paragraphs = content.split('\n\n')
        for para in content_paragraphs:
            if para.strip():
                story.append(Paragraph(para.strip(), styles['Normal']))
                story.append(Spacer(1, 12))
        
        # Page break before flashcards
        story.append(PageBreak())
        
        # Flashcards section
        story.append(Paragraph("Flashcards", styles['Heading2']))
        story.append(Spacer(1, 12))
        
        for i, card in enumerate(flashcards, 1):
            # Question
            story.append(Paragraph(f"Question {i}: {card.get('question', '')}", styles['Heading3']))
            story.append(Spacer(1, 6))
            
            # Answer
            story.append(Paragraph(f"Answer: {card.get('answer', '')}", styles['Normal']))
            story.append(Spacer(1, 18))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        
        return send_file(
            buffer,
            as_attachment=True,
            download_name=f"{topic.replace(' ', '_').lower()}_study_materials.pdf",
            mimetype='application/pdf'
        )
        
    except Exception as e:
        print(f"Error generating PDF: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False) 