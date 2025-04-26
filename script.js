// In app.js for Guided Quizzes logic
const topics = ["Algebra", "Geometry", "Statistics"];  // Example topics
let currentTopicIndex = parseInt(localStorage.getItem('currentTopicIndex')) || 0;
let questionsQueue = [], wrongQueue = [], currentQuestionIndex = 0;

// Update topic header and progress
function updateTopicHeader() {
  document.getElementById('currentTopicName').textContent = topics[currentTopicIndex];
  document.getElementById('topicTracker').textContent = 
    `${currentTopicIndex+1} / ${topics.length}`;
  document.getElementById('quizProgress').max = topics.length;
  document.getElementById('quizProgress').value = currentTopicIndex;
}

// Load questions for a topic using OpenAI
async function loadTopicQuestions(topic) {
  // Prompt GPT to output questions in JSON format
  const prompt = `Generate 5 GCSE Mathematics questions on the topic "${topic}". ` +
                 `For each question, specify type ("mcq" or "written"), ` +
                 `question text, an array of options (for mcq), and the correct answer. ` +
                 `Output as JSON array without any extra text.`;
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY_HERE'
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful tutor that outputs valid JSON only." },
        { role: "user", content: prompt }
      ]
    })
  });
  const data = await response.json();
  const json = JSON.parse(data.choices[0].message.content);
  return json; // Expecting an array of question objects
}

// Display the current question
function showQuestion() {
  const container = document.getElementById('questionContainer');
  container.innerHTML = ''; // clear previous
  const q = questionsQueue[currentQuestionIndex];
  const qElem = document.createElement('div');
  qElem.innerHTML = `<p><strong>Q${currentQuestionIndex+1}:</strong> ${q.question}</p>`;
  
  if (q.type === 'mcq') {
    q.options.forEach((opt, i) => {
      const optionLabel = document.createElement('label');
      const radio = document.createElement('input');
      radio.type = 'radio'; radio.name = 'answer';
      radio.value = opt;
      optionLabel.appendChild(radio);
      optionLabel.appendChild(document.createTextNode(opt));
      qElem.appendChild(optionLabel);
      qElem.appendChild(document.createElement('br'));
    });
  } else { // written answer
    const input = document.createElement('input');
    input.type = 'text'; input.id = 'textAnswer';
    qElem.appendChild(input);
  }
  container.appendChild(qElem);
}

// Handle answer submission
function submitAnswer() {
  const feedback = document.getElementById('quizFeedback');
  const q = questionsQueue[currentQuestionIndex];
  let userAnswer;
  if (q.type === 'mcq') {
    const selected = document.querySelector('input[name="answer"]:checked');
    if (!selected) { feedback.textContent = 'Please select an option.'; return; }
    userAnswer = selected.value;
  } else {
    userAnswer = document.getElementById('textAnswer').value;
  }
  
  // Normalize answers for comparison
  if (userAnswer.trim().toLowerCase() === q.answer.trim().toLowerCase()) {
    feedback.textContent = '✅ Correct!';
  } else {
    feedback.textContent = `❌ Incorrect. We'll review this question later.`;
    wrongQueue.push(q);
  }
  // Move to next question or finish topic
  currentQuestionIndex++;
  if (currentQuestionIndex < questionsQueue.length) {
    setTimeout(() => { feedback.textContent = ''; showQuestion(); }, 1000);
  } else {
    // If any wrong answers, retry them
    if (wrongQueue.length > 0) {
      questionsQueue = [...wrongQueue];
      wrongQueue = [];
      currentQuestionIndex = 0;
      setTimeout(() => {
        feedback.textContent = 'Please answer the questions you missed again.';
        showQuestion();
      }, 1000);
    } else {
      // Topic completed
      feedback.textContent = '🎉 All questions correct! You can proceed to the next topic.';
      document.getElementById('nextTopicBtn').style.display = 'block';
      localStorage.setItem('currentTopicIndex', currentTopicIndex);
    }
  }
}

// Initialize first topic on page load
async function startTopic() {
  updateTopicHeader();
  const topic = topics[currentTopicIndex];
  questionsQueue = await loadTopicQuestions(topic);
  wrongQueue = [];
  currentQuestionIndex = 0;
  showQuestion();
  document.getElementById('nextTopicBtn').style.display = 'none';
}

document.getElementById('submitAnswerBtn').addEventListener('click', submitAnswer);
document.getElementById('nextTopicBtn').addEventListener('click', () => {
  currentTopicIndex++;
  if (currentTopicIndex < topics.length) {
    startTopic();
  } else {
    document.getElementById('guidedSection').innerHTML = '<p>✅ All topics completed!</p>';
    localStorage.setItem('currentTopicIndex', currentTopicIndex);
  }
});

// Start the first topic on load
startTopic();

// In app.js for Mock Exam logic
let examInterval, timeLeft;

async function startExam() {
  const numQ = parseInt(document.getElementById('numQuestions').value);
  const showAnswers = document.getElementById('showAnswersCheckbox').checked;
  document.getElementById('examSetup').style.display = 'none';
  document.getElementById('examContainer').style.display = 'block';
  
  // Generate exam questions via OpenAI
  const prompt = `Generate ${numQ} GCSE questions covering various topics. ` +
                 `For each, include type ("mcq" or "written"), question, options, and answer in JSON.`;
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY_HERE'
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        { role: "system", content: "Output JSON array." },
        { role: "user", content: prompt }
      ]
    })
  });
  const data = await response.json();
  const examQuestions = JSON.parse(data.choices[0].message.content);

  // Display questions
  const container = document.getElementById('examQuestions');
  container.innerHTML = '';
  examQuestions.forEach((q, idx) => {
    const qDiv = document.createElement('div');
    qDiv.innerHTML = `<p><strong>Q${idx+1}:</strong> ${q.question}</p>`;
    if (q.type === 'mcq') {
      q.options.forEach(opt => {
        const label = document.createElement('label');
        const radio = document.createElement('input');
        radio.type = 'radio'; radio.name = `examAnswer${idx}`;
        radio.value = opt;
        label.appendChild(radio);
        label.appendChild(document.createTextNode(opt));
        qDiv.appendChild(label);
        qDiv.appendChild(document.createElement('br'));
      });
    } else {
      const input = document.createElement('input');
      input.type = 'text'; input.name = `examAnswer${idx}`;
      qDiv.appendChild(input);
    }
    container.appendChild(qDiv);
  });

  // Start timer: 60 seconds per question
  timeLeft = numQ * 60;
  examInterval = setInterval(() => {
    const minutes = String(Math.floor(timeLeft/60)).padStart(2, '0');
    const seconds = String(timeLeft % 60).padStart(2, '0');
    document.getElementById('timerDisplay').textContent = `Time: ${minutes}:${seconds}`;
    if (--timeLeft < 0) {
      clearInterval(examInterval);
      submitExam(examQuestions, showAnswers);
    }
  }, 1000);
}

function submitExam(examQuestions, showAnswers) {
  clearInterval(examInterval);
  let score = 0;
  const resultsDiv = document.getElementById('examResults');
  resultsDiv.innerHTML = '<h3>Exam Results</h3>';
  
  examQuestions.forEach((q, idx) => {
    const userAnswerElem = document.querySelector(`input[name="examAnswer${idx}"]:checked`) ||
                           document.getElementsByName(`examAnswer${idx}`)[0];
    const userAnswer = userAnswerElem ? userAnswerElem.value : '';
    const correct = q.answer.trim().toLowerCase();
    const normalizedUser = (userAnswer || '').trim().toLowerCase();
    const isCorrect = (normalizedUser === correct);
    if (isCorrect) score++;

    // Display answer and correctness if needed
    const qResult = document.createElement('p');
    qResult.innerHTML = `<strong>Q${idx+1}:</strong> Your answer: ${userAnswer || '[none]'} ` +
                        (isCorrect ? '✅' : '❌') +
                        (showAnswers ? `<br><em>Correct:</em> ${q.answer}` : '');
    resultsDiv.appendChild(qResult);
  });
  resultsDiv.innerHTML += `<p>Your Score: ${score} / ${examQuestions.length}</p>`;
  document.getElementById('submitExamBtn').disabled = true;
}

document.getElementById('startExamBtn').addEventListener('click', startExam);
document.getElementById('submitExamBtn').addEventListener('click', () => {
  // Stop timer and grade
  clearInterval(examInterval);
  // We should pass stored questions and showAnswers flag; for simplicity, assume they are available
  submitExam(/* examQuestions and showAnswers variables from outer scope */);
});

// In app.js for Revision Notes logic
const topicsList = ["Algebra", "Geometry", "Statistics"];
let notesCache = {};

async function loadNotesForTopic(topic) {
  // If already fetched, do nothing
  if (notesCache[topic]) return;
  const prompt = `Provide concise revision notes for GCSE Mathematics topic "${topic}". ` +
                 `Organize with headings and short paragraphs. Output the notes as plain text.`;
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST', headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer YOUR_API_KEY_HERE'
    },
    body: JSON.stringify({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful assistant providing study notes." },
        { role: "user", content: prompt }
      ]
    })
  });
  const data = await response.json();
  const notesText = data.choices[0].message.content;
  notesCache[topic] = notesText;
  document.getElementById(`notes-${topic}`).innerHTML = notesText
    .split('\n').map(line => `<p>${line}</p>`).join('');  // convert newlines to paragraphs
}

// Attach toggle event to each <details> element
document.querySelectorAll('.topic-section').forEach(section => {
  section.addEventListener('toggle', function() {
    if (this.open) {
      const topic = this.querySelector('summary').textContent;
      const contentDiv = this.querySelector('.topic-notes');
      if (!notesCache[topic]) {
        loadNotesForTopic(topic);
      }
    }
  });
});

// In app.js for theme toggles and navigation
// Dark mode toggle
const htmlElem = document.documentElement;
const darkModeKey = 'darkMode';
const storedTheme = localStorage.getItem(darkModeKey);
if (storedTheme === 'true') htmlElem.setAttribute('data-theme', 'dark');

document.getElementById('toggle-dark-mode').addEventListener('click', () => {
  const isDark = htmlElem.getAttribute('data-theme') === 'dark';
  if (isDark) {
    htmlElem.removeAttribute('data-theme');
    localStorage.setItem(darkModeKey, 'false');
  } else {
    htmlElem.setAttribute('data-theme', 'dark');
    localStorage.setItem(darkModeKey, 'true');
  }
});

// Color picker for accent color
const colorPicker = document.getElementById('color-picker');
const savedColor = localStorage.getItem('primaryColor');
if (savedColor) {
  document.documentElement.style.setProperty('--primary-color', savedColor);
  colorPicker.value = savedColor;
}
colorPicker.addEventListener('input', () => {
  const color = colorPicker.value;
  document.documentElement.style.setProperty('--primary-color', color);
  localStorage.setItem('primaryColor', color);
});

// Section navigation
document.querySelectorAll('nav button').forEach(btn => {
  btn.addEventListener('click', () => {
    const targetId = btn.getAttribute('data-target');
    document.querySelectorAll('.section').forEach(sec => {
      sec.style.display = (sec.id === targetId) ? 'block' : 'none';
    });
  });
});
