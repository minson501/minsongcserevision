async function getRevisionNotes() {
    const subject = document.getElementById('subject').value;
    const topic = document.getElementById('topic').value;

    if (!topic) {
        alert('Please enter a topic!');
        return;
    }

    const prompt = `Give me a short GCSE-level revision note about ${topic} in ${subject}.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': 'Bearer YOUR_API_KEY', // <-- put your OpenAI API key here
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
}
