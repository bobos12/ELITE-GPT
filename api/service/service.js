const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { retrieveRelevant } = require('./retrieval');

const OUT_OF_SCOPE_REPLY =
  'أنا مساعد قانوني متخصص في القانون المصري فقط، ولا أستطيع الإجابة على أسئلة خارج النطاق القانوني. يُرجى طرح سؤالك المتعلق بالقانون المصري وسأكون سعيداً بمساعدتك.';

// Detects ANY single CJK or other non-Arabic foreign-script character
function hasForeignScript(text) {
  return /[　-鿿가-힯豈-﫿Ͱ-ϿЀ-ӿ؀-ۿ]/u.test(
    // Remove Arabic range from check — keep everything else
    String(text || '').replace(/[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/gu, '')
  );
}

function loadBasePrompt() {
  try {
    return fs.readFileSync(path.join(__dirname, '../prompts/elite-system.txt'), 'utf-8').trim();
  } catch {
    return '';
  }
}

function buildSystemPrompt(retrievedArticles, isRetry = false) {
  const base = loadBasePrompt();

  const retryWarning = isRetry
    ? '\n\n⚠️ تحذير فوري: ردك السابق احتوى على أحرف غير عربية (صينية أو غيرها). هذا مرفوض تماماً. الرد الآن يجب أن يكون باللغة العربية الفصحى حرفاً حرفاً بدون أي استثناء.\n'
    : '';

  const hardRules = `${retryWarning}أنت ELITE — مساعد قانوني متخصص حصراً في القانون المصري.

قواعد مطلقة لا استثناء فيها إطلاقاً:
١. الرد باللغة العربية الفصحى فقط — كل حرف، كل كلمة، كل علامة ترقيم.
٢. يُحظر تماماً أي حرف من: الصينية، اليابانية، الكورية، الإنجليزية، الفرنسية، الروسية، أو أي لغة غير عربية.
٣. مفاتيح JSON هي رموز تقنية بحتة وليست نصاً — جميع القيم النصية يجب أن تكون عربية ١٠٠٪.
٤. إذا كان السؤال خارج النطاق القانوني المصري بالكامل: ضع في answer النص الحرفي التالي بدون تعديل:
   "أنا مساعد قانوني متخصص في القانون المصري فقط، ولا أستطيع الإجابة على أسئلة خارج النطاق القانوني. يُرجى طرح سؤالك المتعلق بالقانون المصري وسأكون سعيداً بمساعدتك."
   مع: confidence="low"، is_out_of_scope=true، used_article_ids=[].
٥. لا تُجب على أسئلة طبية أو هندسية أو برمجية أو مالية أو عامة ليس لها صلة بالقانون.
٦. لا تخترع مواد قانونية — استشهد فقط بما هو موجود في قاعدة المعرفة أدناه.

${base}`.trim();

  const jsonFormat = `

=== تنسيق الإخراج الإلزامي ===
أخرج كائن JSON صالح فقط — لا نص قبله ولا بعده ولا markdown:
{
  "answer": "إجابتك الكاملة بالعربية الفصحى وفق تنسيق المساعد القانوني",
  "confidence": "high" أو "medium" أو "low",
  "confidence_reason": "جملة عربية قصيرة تشرح مستوى الثقة",
  "is_out_of_scope": false,
  "used_article_ids": ["معرّف1", "معرّف2"]
}

قواعد الثقة:
- "high": توجد مواد في قاعدة المعرفة ذات صلة بالسؤال — حتى لو كان السؤال عاماً.
- "medium": لا توجد مواد محددة ولكن الإجابة مستندة إلى مبادئ قانونية معروفة.
- "low": السؤال غامض أو خارج النطاق.

قواعد الاستشهاد (مهمة جداً):
- إذا وُجدت مواد قانونية في قاعدة المعرفة أدناه، يجب دائماً إدراج معرّفاتها في used_article_ids.
- حتى للأسئلة العامة: إذا كانت المواد المسترجعة ذات صلة بالموضوع، أدرج معرّفاتها.
- لا تدرج معرّفات مواد غير مذكورة في القائمة أدناه.`;

  const contextBlock = retrievedArticles.length
    ? `

=== قاعدة المعرفة القانونية (مواد مسترجعة ذات صلة) ===
هذه المواد يجب الاستشهاد بها في إجابتك وإدراج معرّفاتها في used_article_ids:

${retrievedArticles.map((a, i) => `--- [${i + 1}] معرّف: ${a.id}
القانون: ${a.law_name} رقم ${a.law_number} لسنة ${a.year}
${a.chapter ? `الفصل: ${a.chapter}` : ''}
المادة رقم: ${a.article_number}
النص: ${a.article_text}
`).join('\n')}`
    : `

=== قاعدة المعرفة ===
لا توجد مواد مستردة لهذا السؤال. إذا كان قانونياً، أجب من المبادئ العامة مع confidence="medium".`;

  return [hardRules, jsonFormat, contextBlock].join('\n');
}

async function callGroq(systemPrompt, userMessage, model, apiKey) {
  const response = await axios.post(
    'https://api.groq.com/openai/v1/chat/completions',
    {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: String(userMessage || '') },
      ],
      temperature: 0.1,
      max_tokens: 3000,
      response_format: { type: 'json_object' },
    },
    {
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      timeout: 30_000,
    }
  );
  return response?.data?.choices?.[0]?.message?.content || '{}';
}

async function getGroqReply(userMessage) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return { reply: 'مفتاح GROQ_API_KEY غير موجود.', citations: [], confidence: 'low', confidenceReason: '', isOutOfScope: false };
  }

  const model = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  const retrievedArticles = retrieveRelevant(userMessage);

  const parseRaw = (raw) => {
    try { return JSON.parse(raw); } catch { return null; }
  };

  try {
    // First attempt
    let raw = await callGroq(buildSystemPrompt(retrievedArticles, false), userMessage, model, apiKey);
    let parsed = parseRaw(raw);

    // Retry if CJK/foreign script detected in any text field
    if (!parsed || hasForeignScript(parsed.answer || '') || hasForeignScript(parsed.confidence_reason || '')) {
      console.warn('[service] Foreign script detected — retrying with stronger prompt');
      raw = await callGroq(buildSystemPrompt(retrievedArticles, true), userMessage, model, apiKey);
      parsed = parseRaw(raw);
    }

    // If still bad after retry, return a clean Arabic fallback
    if (!parsed || hasForeignScript(parsed.answer || '') || hasForeignScript(parsed.confidence_reason || '')) {
      return {
        reply: 'عذراً، حدث خطأ في معالجة اللغة. يُرجى إعادة صياغة سؤالك والمحاولة مرة أخرى.',
        citations: [],
        confidence: 'low',
        confidenceReason: 'خطأ في معالجة اللغة.',
        isOutOfScope: false,
      };
    }

    // Hard enforce out-of-scope
    if (parsed.is_out_of_scope) {
      return {
        reply: OUT_OF_SCOPE_REPLY,
        citations: [],
        confidence: 'low',
        confidenceReason: 'السؤال خارج نطاق القانون المصري.',
        isOutOfScope: true,
      };
    }

    const answerText = String(parsed.answer || '').trim() || 'لم يتم الحصول على إجابة.';
    const usedIds = Array.isArray(parsed.used_article_ids) ? parsed.used_article_ids : [];
    const citations = retrievedArticles.filter(a => usedIds.includes(a.id));

    // If the model didn't cite but articles were retrieved, include all retrieved as citations
    const finalCitations = citations.length > 0 ? citations : retrievedArticles;
    const confidence = ['high', 'medium', 'low'].includes(parsed.confidence) ? parsed.confidence : 'medium';

    return {
      reply: answerText,
      citations: finalCitations,
      confidence,
      confidenceReason: String(parsed.confidence_reason || '').trim(),
      isOutOfScope: false,
    };
  } catch (error) {
    console.error('Groq API error:', error.response?.data || error.message);
    const status = error?.response?.status;
    const detail =
      error?.response?.data?.error?.message ||
      error?.response?.data?.message ||
      error?.message ||
      'خطأ غير معروف.';
    return {
      reply: `فشل الاتصال بالخادم${status ? ` (HTTP ${status})` : ''}: ${detail}`,
      citations: [],
      confidence: 'low',
      confidenceReason: '',
      isOutOfScope: false,
    };
  }
}

exports.getBotReply = async (userMessage) => {
  const provider = String(process.env.CHAT_PROVIDER || '').trim().toLowerCase();
  if (provider === 'groq') return getGroqReply(userMessage);
  return {
    reply: `مزود الدردشة غير معروف: "${provider}". قم بتعيين CHAT_PROVIDER=groq في ملف .env.`,
    citations: [],
    confidence: 'low',
    confidenceReason: '',
    isOutOfScope: false,
  };
};
