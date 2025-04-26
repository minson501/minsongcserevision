:root {
    --bg-color: #f0f8ff;
    --text-color: #333;
    --card-color: #fff;
}

body.dark {
    --bg-color: #121212;
    --text-color: #f0f0f0;
    --card-color: #1e1e1e;
}

body {
    font-family: 'Poppins', Arial, sans-serif;
    background-color: var(--bg-color);
    color: var(--text-color);
    text-align: center;
    padding: 20px;
    margin: 0;
}

h1 {
    margin-top: 20px;
    font-size: 2.5em;
}

.subject-select, .topic-input {
    margin: 20px;
}

input, select, button {
    padding: 10px;
    font-size: 16px;
    margin: 10px;
    border: 1px solid #ccc;
    border-radius: 8px;
}

button {
    background-color: #4CAF50;
    color: white;
    border: none;
    transition: background-color 0.3s ease;
}

button:hover {
    background-color: #45a049;
}

.output-box {
    margin: 30px auto;
    padding: 20px;
    width: 90%;
    max-width: 700px;
    border-radius: 12px;
    background-color: var(--card-color);
    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    min-height: 150px;
}

/* Dark Mode Toggle Button */
#darkModeBtn {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 8px 12px;
    font-size: 14px;
    border: none;
    border-radius: 6px;
    background-color: #555;
    color: #fff;
    cursor: pointer;
}

#darkModeBtn:hover {
    background-color: #333;
}
function toggleDarkMode() {
    document.body.classList.toggle('dark');
}
async function getRevisionNotes() {
    const subject = document.getElementById('subject').value;
    const topic = document.getElementById('topic').value;

    if (!topic) {
        alert('Please enter a topic!');
        return;
    }

    document.getElementById('loading').style.display = 'block'; // show loading
    document.getElementById('output').innerText = ''; // clear output

    const prompt = `Give me a short GCSE-level revision note about ${topic} in ${subject}.`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer YOUR_API_KEY',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await response.json();
        const outputText = data.choices[0].message.content;

        document.getElementById('output').innerText = outputText;
    } catch (error) {
        document.getElementById('output').innerText = 'Error: Something went wrong.';
    } finally {
        document.getElementById('loading').style.display = 'none'; // hide loading
    }
}
async function getRevisionNotes() {
    const subject = document.getElementById('subject').value;
    const topic = document.getElementById('topic').value;

    if (!topic) {
        alert('Please enter a topic!');
        return;
    }

    document.getElementById('loading').style.display = 'block';
    document.getElementById('flashcard-front').innerText = '';
    document.getElementById('flashcard-back').innerText = '';
    document.getElementById('flashcard').classList.remove('active');

    const prompt = `Give me a short GCSE-level revision note about ${topic} in ${subject}.`;

    try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer YOUR_API_KEY',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "gpt-4",
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await response.json();
        const outputText = data.choices[0].message.content;

        document.getElementById('flashcard-front').innerText = topic;
        document.getElementById('flashcard-back').innerText = outputText;
    } catch (error) {
        document.getElementById('flashcard-front').innerText = 'Error';
        document.getElementById('flashcard-back').innerText = 'Something went wrong.';
    } finally {
        document.getElementById('loading').style.display = 'none';
    }
}

// Flip flashcard on click
document.getElementById('flashcard').addEventListener('click', function() {
    this.classList.toggle('active');
});
