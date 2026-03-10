const axios = require('axios');

function extractOutputText(data) {
  if (!data) return null;
  if (typeof data.output_text === 'string' && data.output_text.trim()) return data.output_text;
  const maybeText = data.output?.[0]?.content?.map((c) => c.text).filter(Boolean).join('\n');
  if (maybeText && maybeText.trim()) return maybeText;
  return null;
}

exports.getBotReply = async (userMessage) => {
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) return { reply: 'Server misconfigured: missing OPENAI_API_KEY.' };

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/responses',
      {
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        input: userMessage,
        instructions:
          process.env.SYSTEM_PROMPT ||
          "You are ELITE, an Egyptian legal assistant. Provide helpful, clear answers about Egyptian law. If unsure, say you are not sure and suggest consulting a qualified lawyer. Don't invent citations."
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const reply = extractOutputText(response.data) || 'No reply from model.';

    return { reply };
  } catch (error) {
    console.error('OpenAI API error:', error.response?.data || error.message);
    return { reply: 'An error occurred while generating a response.' };
  }
};
